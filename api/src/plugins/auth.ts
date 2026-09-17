import type { FastifyRequest, FastifyReply } from "fastify";
import { withTx, type Queryable } from "../db";
import { sha256Hex } from "../lib/tokens";
import { findSessionByToken } from "../repo/sessions";
import { findApiKeyByHash, updateApiKeyLastUsed } from "../repo/apiKeys";
import { unauthorized } from "../lib/errors";

/**
 * Authenticate-if-present. Populates `req.auth` from a Bearer API key or the
 * `hz_session` cookie when valid; otherwise leaves it undefined. NEVER throws,
 * so public routes (signup/login/verify/reset) work unauthenticated.
 * Register globally as a preHandler hook.
 */
export async function authenticate(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const db: Queryable = req.server.pg;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const apiKey = await findApiKeyByHash(db, sha256Hex(authHeader.slice(7)));
    if (apiKey) {
      // api_keys is org-scoped; touch last_used within the key's org context.
      await withTx((client) => updateApiKeyLastUsed(client, apiKey.id), apiKey.org_id);
      req.auth = { orgId: apiKey.org_id, apiKeyId: apiKey.id, actorType: "api_key" };
    }
    return;
  }

  const cookie = req.cookies?.hz_session;
  if (!cookie) return;

  const session = await findSessionByToken(db, cookie);
  if (!session) return;

  const orgId = session.org_id ?? (await primaryOrgId(db, session.user_id));
  if (!orgId) return;

  req.auth = { orgId, userId: session.user_id, actorType: "user" };
}

/** Enforce authentication. Use as a preHandler on protected routes only. */
export async function requireAuth(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  if (!req.auth) throw unauthorized("unauthorized", "Authentication required");
}

/** Pre-auth org resolution via SECURITY DEFINER fn (bypasses memberships RLS). */
async function primaryOrgId(db: Queryable, userId: string): Promise<string | null> {
  const res = await db.query<{ org_id: string }>(
    "SELECT org_id FROM org_ids_for_user($1) LIMIT 1",
    [userId],
  );
  return res.rows[0]?.org_id ?? null;
}
