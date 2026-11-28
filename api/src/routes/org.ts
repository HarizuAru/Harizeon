import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { withTx } from "../db";
import { getOrgById, updateOrg, getProjectByOrg } from "../repo/orgs";
import { getMembershipsByOrg } from "../repo/memberships";
import { writeAudit } from "../lib/audit";
import { badRequest, notFound } from "../lib/errors";
import { invalidateSession, requireRole, requireScope } from "../plugins/auth";

const UpdateOrgBody = z
  .object({
    name: z.string().min(1).max(100).optional(),
    enforce_mfa: z.boolean().optional(),
  })
  .refine((v) => v.name !== undefined || v.enforce_mfa !== undefined, {
    message: "At least one field must be provided",
  });
const DeleteOrgBody = z.object({ confirm_slug: z.string().min(1) });
const InviteMemberBody = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "readonly"]).default("member"),
});

export async function orgRoutes(app: FastifyInstance) {
  // GET /v1/org
  app.get("/org", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    return withTx(async (client) => {
      const org = await getOrgById(client, orgId);
      if (!org) throw notFound("org_not_found", "Organization not found");
      const project = await getProjectByOrg(client, orgId);
      const members = await getMembershipsByOrg(client, orgId);
      return { org, project, members };
    }, orgId);
  });

  // PATCH /v1/org
  app.patch("/org", {
    preHandler: [requireRole(["owner", "admin"]), requireScope("org:write")],
    handler: async (req: FastifyRequest, _reply: FastifyReply) => {
      const orgId = req.auth!.orgId;
      const body = UpdateOrgBody.parse(req.body);
      return withTx(async (client) => {
        const updated = await updateOrg(client, orgId, body);
        if (!updated) throw notFound("org_not_found", "Organization not found");
        await writeAudit(client, {
          orgId,
          actorType: req.auth!.actorType,
          actorId: req.auth!.userId ?? req.auth!.apiKeyId,
          action: "org.update",
          targetType: "org",
          targetId: orgId,
          metadata: {
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(body.enforce_mfa !== undefined ? { enforce_mfa: body.enforce_mfa } : {}),
          },
        });
        return { org: updated };
      }, orgId);
    },
  });

  // GET /v1/org/members
  app.get("/org/members", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    return withTx(async (client) => {
      const res = await client.query(
        `SELECT m.id, m.org_id, m.user_id, m.role, m.invited_by, m.accepted_at, m.created_at,
                u.email as user_email, u.name as user_name
         FROM memberships m
         LEFT JOIN users u ON u.id = m.user_id
         WHERE m.org_id = $1 ORDER BY m.created_at ASC`,
        [orgId],
      );
      return { members: res.rows };
    }, orgId);
  });

  // POST /v1/org/members/invite
  app.post("/org/members/invite", {
    preHandler: [requireRole(["owner", "admin"]), requireScope("org:write")],
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const orgId = req.auth!.orgId;
      const body = InviteMemberBody.parse(req.body);

      const invited = await withTx(async (client) => {
        // Find or create pending user
        const existing = await client.query(`SELECT id, email FROM users WHERE email = $1`, [body.email]);
        let userId: string;
        if (existing.rows.length > 0) {
          userId = existing.rows[0].id;
        } else {
          const uRes = await client.query(
            `INSERT INTO users (email, password_hash, name)
             VALUES ($1, 'invited_placeholder_hash', $2) RETURNING id`,
            [body.email, body.email.split("@")[0]],
          );
          userId = uRes.rows[0].id;
        }

        const memRes = await client.query(
          `INSERT INTO memberships (org_id, user_id, role, invited_by, accepted_at)
           VALUES ($1, $2, $3, $4, now())
           ON CONFLICT (org_id, user_id) DO UPDATE SET role = $3
           RETURNING *`,
          [orgId, userId, body.role, req.auth!.userId ?? null],
        );

        await writeAudit(client, {
          orgId,
          actorType: req.auth!.actorType,
          actorId: req.auth!.userId ?? req.auth!.apiKeyId,
          action: "member.invite",
          targetType: "user",
          targetId: userId,
          metadata: { email: body.email, role: body.role },
        });

        return {
          ...memRes.rows[0],
          user_email: body.email,
          user_name: body.email.split("@")[0],
        };
      }, orgId);

      return reply.status(201).send({ member: invited });
    },
  });

  // DELETE /v1/org/members/:id
  app.delete("/org/members/:id", {
    preHandler: [requireRole(["owner", "admin"]), requireScope("org:write")],
    handler: async (req: FastifyRequest, _reply: FastifyReply) => {
      const orgId = req.auth!.orgId;
      const { id } = req.params as { id: string };

      return withTx(async (client) => {
        await client.query(`DELETE FROM memberships WHERE id = $1 AND org_id = $2`, [id, orgId]);
        await writeAudit(client, {
          orgId,
          actorType: req.auth!.actorType,
          actorId: req.auth!.userId ?? req.auth!.apiKeyId,
          action: "member.remove",
          targetType: "membership",
          targetId: id,
        });
        return { success: true };
      }, orgId);
    },
  });

  // POST /v1/org/export — Data Portability JSON bundle (PDPA 2024 / LEG-04)
  app.post("/org/export", {
    preHandler: [requireRole(["owner", "admin"]), requireScope("org:read")],
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const orgId = req.auth!.orgId;
      const bundle = await withTx(async (client) => {
        const org = await getOrgById(client, orgId);
        if (!org) throw notFound("org_not_found", "Organization not found");

        await writeAudit(client, {
          orgId,
          actorType: req.auth!.actorType,
          actorId: req.auth!.userId ?? req.auth!.apiKeyId,
          action: "org.export",
          targetType: "org",
          targetId: orgId,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        });

        const [assetsRes, scansRes, findingsRes, reportsRes, auditRes] = await Promise.all([
          client.query(
            `SELECT id, org_id, type, value, parent_asset_id, discovered_by, first_seen_at, last_seen_at,
                    is_active, tags, criticality, created_at, updated_at
             FROM assets WHERE org_id = $1 ORDER BY created_at ASC`,
            [orgId],
          ),
          client.query(
            `SELECT id, org_id, project_id, trigger_source, profile, status, phase, progress_pct,
                    started_at, finished_at, error_code, requested_by, engine_versions, created_at, updated_at
             FROM scans WHERE org_id = $1 ORDER BY created_at DESC`,
            [orgId],
          ),
          client.query(
            `SELECT id, org_id, asset_id, scan_id, fingerprint, check_id, location, source_tool,
                    title, description, severity, cvss_score, cve_ids, cwe_id, category, evidence,
                    remediation, remediation_snippets, status, status_reason, first_seen_at, last_seen_at,
                    resolved_at, epss_score, epss_percentile, is_kev, created_at, updated_at
             FROM findings WHERE org_id = $1 ORDER BY first_seen_at DESC`,
            [orgId],
          ),
          client.query(
            `SELECT id, org_id, project_id, type, generated_at, period_start, period_end,
                    file_ref, generated_by, created_at, updated_at
             FROM reports WHERE org_id = $1 ORDER BY generated_at DESC`,
            [orgId],
          ),
          client.query(
            `SELECT id, org_id, actor_type, actor_id, action, target_type, target_id,
                    ip, user_agent, metadata, created_at
             FROM audit_log WHERE org_id = $1 ORDER BY created_at DESC`,
            [orgId],
          ),
        ]);

        return {
          exported_at: new Date().toISOString(),
          org,
          assets: assetsRes.rows,
          scans: scansRes.rows,
          findings: findingsRes.rows,
          reports: reportsRes.rows,
          audit_logs: auditRes.rows,
        };
      }, orgId);

      const safeSlug = bundle.org.slug.replace(/[^a-zA-Z0-9_-]/g, "_");
      return reply
        .header("Content-Type", "application/json; charset=utf-8")
        .header("Content-Disposition", `attachment; filename="harizeon-${safeSlug}-export.json"`)
        .send(bundle);
    },
  });

  // DELETE /v1/org — Permanent organization deletion (PDPA 2024 / LEG-04)
  app.delete("/org", {
    preHandler: [requireRole(["owner"]), requireScope("org:write")],
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const orgId = req.auth!.orgId;
      const body = DeleteOrgBody.parse(req.body);

      await withTx(async (client) => {
        const org = await getOrgById(client, orgId);
        if (!org) throw notFound("org_not_found", "Organization not found");
        if (body.confirm_slug !== org.slug) {
          throw badRequest("slug_mismatch", "Confirmation slug does not match organization slug");
        }

        await client.query(
          `UPDATE sessions SET revoked_at = now() WHERE org_id = $1 AND revoked_at IS NULL`,
          [orgId],
        );
        await client.query(
          `UPDATE api_keys SET revoked_at = now() WHERE org_id = $1 AND revoked_at IS NULL`,
          [orgId],
        );

        await writeAudit(client, {
          orgId,
          actorType: req.auth!.actorType,
          actorId: req.auth!.userId ?? req.auth!.apiKeyId,
          action: "org.delete",
          targetType: "org",
          targetId: orgId,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          metadata: { slug: org.slug },
        });

        await client.query(`DELETE FROM orgs WHERE id = $1`, [orgId]);
      }, orgId);

      const cookie = req.cookies?.hz_session;
      if (cookie) {
        invalidateSession(cookie);
      }
      reply.clearCookie("hz_session", { path: "/" });

      return { deleted: true, org_id: orgId };
    },
  });
}
