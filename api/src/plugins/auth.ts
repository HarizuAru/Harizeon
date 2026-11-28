import type { FastifyRequest, FastifyReply } from "fastify";
import type { OrgRole } from "../types";
import { withTx, type Queryable } from "../db";
import { sha256Hex } from "../lib/tokens";
import { findSessionByToken, type SessionRow } from "../repo/sessions";
import { findApiKeyByHash, updateApiKeyLastUsed } from "../repo/apiKeys";
import { getMembershipRole } from "../repo/memberships";
import { forbidden, unauthorized } from "../lib/errors";

/**
 * Every authenticated request otherwise pays a sessions lookup before the
 * handler starts. A short in-process cache removes that query on repeat
 * requests; the TTL bounds how long a revoked session can linger, and logout
 * clears the entry immediately. ponytail: per-process, so a burst across N
 * replicas still warms N times — move to Redis if that ever matters.
 */
const SESSION_CACHE_TTL_MS = 5_000;
const sessionCache = new Map<string, { session: SessionRow; at: number }>();

export function invalidateSession(token: string): void {
  sessionCache.delete(token);
}

async function sessionFor(db: Queryable, token: string): Promise<SessionRow | null> {
  const now = Date.now();
  const hit = sessionCache.get(token);
  if (hit && now - hit.at < SESSION_CACHE_TTL_MS) return hit.session;

  const session = await findSessionByToken(db, token);
  if (!session) {
    sessionCache.delete(token);
    return null;
  }
  if (sessionCache.size > 10_000) sessionCache.clear();
  sessionCache.set(token, { session, at: now });
  return session;
}

/**
 * Authenticate-if-present. Populates `req.auth` (including `role` for session
 * users and `scopes` for API keys) when a valid credential is present; otherwise
 * leaves it undefined. NEVER throws, so public routes work unauthenticated.
 */
export async function authenticate(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const db: Queryable = req.server.pg;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const apiKey = await findApiKeyByHash(db, sha256Hex(authHeader.slice(7)));
    if (apiKey) {
      // api_keys is org-scoped; touch last_used within the key's org context.
      await withTx((client) => updateApiKeyLastUsed(client, apiKey.id), apiKey.org_id);
      req.auth = {
        orgId: apiKey.org_id,
        apiKeyId: apiKey.id,
        actorType: "api_key",
        scopes: Array.isArray(apiKey.scopes) ? apiKey.scopes : [],
      };
    }
    return;
  }

  const cookie = req.cookies?.hz_session;
  if (!cookie) return;

  const session = await sessionFor(db, cookie);
  if (!session) return;

  const orgId = session.org_id ?? (await primaryOrgId(db, session.user_id));
  if (!orgId) return;

  const role = await withTx((client) => getMembershipRole(client, orgId, session.user_id), orgId);
  if (!role) return;

  req.auth = { orgId, userId: session.user_id, actorType: "user", role };
}

/** Enforce authentication. Use as a preHandler on protected routes only. */
export async function requireAuth(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  if (!req.auth) throw unauthorized("unauthorized", "Authentication required");
}

/** Enforce organization role for authenticated human session users (SEC-04). */
export function requireRole(allowed: readonly OrgRole[]) {
  return async function roleGuard(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
    if (!req.auth) throw unauthorized("unauthorized", "Authentication required");
    if (req.auth.actorType !== "user") return;
    if (!req.auth.role || !allowed.includes(req.auth.role)) {
      throw forbidden("insufficient_role", "Your organization role is not permitted to perform this action");
    }
  };
}

/** Enforce capability scope for authenticated Bearer API keys (SEC-04). */
export function requireScope(requiredScope: string) {
  return async function scopeGuard(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
    if (!req.auth) throw unauthorized("unauthorized", "Authentication required");
    if (req.auth.actorType !== "api_key") return;
    const scopes = req.auth.scopes ?? [];
    const [resource] = requiredScope.split(":");
    const granted =
      scopes.includes(requiredScope) ||
      scopes.includes("*") ||
      scopes.includes("admin") ||
      (resource ? scopes.includes(`${resource}:*`) : false);
    if (!granted) {
      throw forbidden("insufficient_scope", `API key lacks required scope: ${requiredScope}`);
    }
  };
}

/** Pre-auth org resolution via SECURITY DEFINER fn (bypasses memberships RLS). */
async function primaryOrgId(db: Queryable, userId: string): Promise<string | null> {
  const res = await db.query<{ org_id: string }>(
    "SELECT org_id FROM org_ids_for_user($1) LIMIT 1",
    [userId],
  );
  return res.rows[0]?.org_id ?? null;
}
