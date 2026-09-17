import type { Queryable } from "../db";
import { randomToken, sha256Hex } from "../lib/tokens";

export type SessionRow = {
  id: string;
  user_id: string;
  org_id: string | null;
  token_hash: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  user_agent: string | null;
  ip: string | null;
  rotated_from: string | null;
};

export async function createSession(
  db: Queryable,
  input: { userId: string; orgId: string | null; userAgent?: string; ip?: string },
): Promise<{ token: string; session: SessionRow }> {
  const token = randomToken(32);
  const tokenHash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const res = await db.query<SessionRow>(
    `INSERT INTO sessions (user_id, org_id, token_hash, expires_at, user_agent, ip)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, user_id, org_id, token_hash, created_at, expires_at, revoked_at, user_agent, ip, rotated_from`,
    [input.userId, input.orgId ?? null, tokenHash, expiresAt, input.userAgent ?? null, input.ip ?? null],
  );
  return { token, session: res.rows[0] };
}

export async function findSessionByToken(db: Queryable, token: string): Promise<SessionRow | null> {
  const tokenHash = sha256Hex(token);
  const res = await db.query<SessionRow>(
    `SELECT id, user_id, org_id, token_hash, created_at, expires_at, revoked_at, user_agent, ip, rotated_from
     FROM sessions WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [tokenHash],
  );
  return res.rows[0] ?? null;
}

export async function revokeSession(db: Queryable, token: string): Promise<void> {
  const tokenHash = sha256Hex(token);
  await db.query(
    `UPDATE sessions SET revoked_at = now() WHERE token_hash = $1`,
    [tokenHash],
  );
}

export async function revokeAllUserSessions(db: Queryable, userId: string, exceptTokenHash?: string): Promise<void> {
  if (exceptTokenHash) {
    await db.query(
      `UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND token_hash <> $2 AND revoked_at IS NULL`,
      [userId, exceptTokenHash],
    );
  } else {
    await db.query(
      `UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId],
    );
  }
}