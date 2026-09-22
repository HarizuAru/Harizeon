import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { withTx } from "../db";
import { findUserByEmail, createUser, setEmailVerified, updateLastLogin } from "../repo/users";
import { createSession, revokeAllUserSessions, revokeSession } from "../repo/sessions";
import { createToken, consumeToken } from "../repo/userTokens";
import { createMembership, orgIdsForUser } from "../repo/memberships";
import { verifyPassword, hashPassword } from "../lib/password";
import { writeAudit } from "../lib/audit";
import { sendEmail, buildAuthUrl } from "../lib/email";
import { unauthorized, badRequest, conflict } from "../lib/errors";
import { invalidateSession } from "../plugins/auth";
import { randomUUID } from "node:crypto";

const SignupBody = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  name: z.string().optional(),
  orgName: z.string().min(1).max(100),
  orgSlug: z.string().regex(/^[a-z0-9-]+$/).min(2).max(63),
});
const LoginBody = z.object({ email: z.string().email(), password: z.string().min(1) });
const VerifyEmailBody = z.object({ token: z.string().min(1) });
const ResetRequestBody = z.object({ email: z.string().email() });
const ResetConfirmBody = z.object({ token: z.string().min(1), password: z.string().min(12) });

const SESSION_COOKIE = "hz_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function authRoutes(app: FastifyInstance) {
  // POST /v1/auth/signup — create user + org + owner membership + default project
  app.post("/auth/signup", {
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const { email, password, name, orgName, orgSlug } = SignupBody.parse(req.body);
      const orgId = randomUUID(); // pre-generated so the orgs RLS WITH CHECK passes

      const created = await withTx(async (client) => {
        if (await findUserByEmail(client, email)) {
          throw conflict("email_taken", "Email already registered");
        }
        const user = await createUser(client, { email, password, name, locale: "en" });

        await client.query(
          `INSERT INTO orgs (id, name, slug, billing_status, currency, plan_id, trial_ends_at)
           VALUES ($1,$2,$3,'trialing','MYR',(SELECT id FROM plans WHERE code = 'starter'), now() + interval '14 days')`,
          [orgId, orgName, orgSlug],
        );
        await createMembership(client, { orgId, userId: user.id, role: "owner" });
        await client.query(
          `INSERT INTO projects (id, org_id, name, slug) VALUES ($1,$2,$3,$4)`,
          [randomUUID(), orgId, "Main", "main"],
        );

        const { token: verifyToken } = await createToken(client, {
          userId: user.id,
          kind: "email_verify",
          ttlMinutes: 60 * 24,
        });

        await writeAudit(client, {
          orgId,
          actorType: "user",
          actorId: user.id,
          action: "user.signup",
          targetType: "org",
          targetId: orgId,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        });

        return {
          verifyToken,
          user: { id: user.id, email: user.email, name: user.name, emailVerified: false },
          org: { id: orgId, name: orgName, slug: orgSlug },
        };
      }, orgId);

      // The account is committed; a broken mail provider must not turn a
      // successful signup into a 500 (the user would exist but be told it
      // failed, and a retry would hit "email_taken").
      try {
        await sendEmail({
          to: email,
          subject: "Verify your Harizeon account",
          text: `Verify your email: ${buildAuthUrl("/verify-email", created.verifyToken)}`,
        });
      } catch (err) {
        req.log.error({ err, email }, "signup verification email could not be sent");
      }

      return reply.status(201).send({
        user: created.user,
        org: created.org,
        message: "Account created. Check your email to verify your account.",
      });
    },
  });

  // POST /v1/auth/login
  app.post("/auth/login", {
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const { email, password } = LoginBody.parse(req.body);
      const db = req.server.pg;

      const user = await findUserByEmail(db, email);
      if (!user || !(await verifyPassword(user.password_hash, password))) {
        throw unauthorized("invalid_credentials", "Invalid email or password");
      }

      const orgId = (await orgIdsForUser(db, user.id))[0];
      if (!orgId) throw unauthorized("no_org", "User has no organization");

      const { token } = await createSession(db, {
        userId: user.id,
        orgId,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
      });
      await updateLastLogin(db, user.id);

      await withTx(async (client) => {
        await writeAudit(client, {
          orgId,
          actorType: "user",
          actorId: user.id,
          action: "user.login",
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        });
      }, orgId);

      reply.setCookie(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: false, // set true behind TLS in production
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE,
      });

      return {
        user: { id: user.id, email: user.email, name: user.name, emailVerified: !!user.email_verified_at },
        org: { id: orgId },
      };
    },
  });

  // POST /v1/auth/logout
  app.post("/auth/logout", async (req: FastifyRequest, reply: FastifyReply) => {
    const cookie = req.cookies?.[SESSION_COOKIE];
    if (cookie && req.auth?.userId) {
      const { userId, orgId } = req.auth;
      // Revoke THIS session: revokeAllUserSessions only touches the others, so
      // logging out would otherwise leave the token in the cookie still valid.
      await revokeSession(req.server.pg, cookie);
      invalidateSession(cookie);
      await withTx(async (client) => {
        await writeAudit(client, { orgId, actorType: "user", actorId: userId, action: "user.logout" });
      }, orgId);
    }
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return { ok: true };
  });

  // POST /v1/auth/verify-email
  app.post("/auth/verify-email", {
    handler: async (req: FastifyRequest, _reply: FastifyReply) => {
      const { token } = VerifyEmailBody.parse(req.body);
      const db = req.server.pg;

      const result = await consumeToken(db, { token, kind: "email_verify" });
      if (!result) throw badRequest("invalid_token", "Verification token invalid or expired");

      await setEmailVerified(db, result.userId);

      const orgId = (await orgIdsForUser(db, result.userId))[0];
      if (orgId) {
        await withTx(async (client) => {
          await writeAudit(client, {
            orgId,
            actorType: "user",
            actorId: result.userId,
            action: "user.verify_email",
          });
        }, orgId);
      }
      return { ok: true, message: "Email verified successfully" };
    },
  });

  // POST /v1/auth/password/reset — always 200 (no user enumeration)
  app.post("/auth/password/reset", {
    handler: async (req: FastifyRequest, _reply: FastifyReply) => {
      const { email } = ResetRequestBody.parse(req.body);
      const db = req.server.pg;

      const user = await findUserByEmail(db, email);
      if (user) {
        const { token } = await createToken(db, { userId: user.id, kind: "password_reset", ttlMinutes: 60 });
        try {
          await sendEmail({
            to: email,
            subject: "Harizeon password reset",
            text: `Reset your password: ${buildAuthUrl("/reset-password", token)}`,
          });
        } catch (err) {
          req.log.error({ err, email }, "password reset email could not be sent");
        }
        const orgId = (await orgIdsForUser(db, user.id))[0];
        if (orgId) {
          await withTx(async (client) => {
            await writeAudit(client, {
              orgId,
              actorType: "user",
              actorId: user.id,
              action: "user.password_reset_request",
              ip: req.ip,
            });
          }, orgId);
        }
      }
      return { ok: true, message: "If that email exists, a reset link has been sent" };
    },
  });

  // POST /v1/auth/password/reset/confirm
  app.post("/auth/password/reset/confirm", {
    handler: async (req: FastifyRequest, _reply: FastifyReply) => {
      const { token, password } = ResetConfirmBody.parse(req.body);
      const db = req.server.pg;

      const result = await consumeToken(db, { token, kind: "password_reset" });
      if (!result) throw badRequest("invalid_token", "Reset token invalid or expired");

      const newHash = await hashPassword(password);
      const orgId = (await orgIdsForUser(db, result.userId))[0] ?? null;

      await withTx(async (client) => {
        await client.query(
          `UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`,
          [result.userId, newHash],
        );
        await revokeAllUserSessions(client, result.userId);
        if (orgId) {
          await writeAudit(client, {
            orgId,
            actorType: "user",
            actorId: result.userId,
            action: "user.password_reset",
          });
        }
      }, orgId);

      return { ok: true, message: "Password updated. Please log in again." };
    },
  });
}
