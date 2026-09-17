import type { Queryable } from "../db";
import { randomToken, sha256Hex } from "../lib/tokens";

export type UserTokenKind = "email_verify" | "password_reset";

export type UserTokenRow = {
  id: string;
  user_id: string;
  kind: UserTokenKind;
  token_hash: string;
  created_at: string;
  expires_at: string;
  consumed_at: string | null;
};

export async function createToken(
  db: Queryable,
  input: { userId: string; kind: UserTokenKind; ttlMinutes?: number },
): Promise<{ token: string; tokenRow: UserTokenRow }> {
  const token = randomToken(32);
  const tokenHash = sha256Hex(token);
  const ttl = input.ttlMinutes ?? 60;
  const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

  const res = await db.query<UserTokenRow>(
    `INSERT INTO user_tokens (user_id, kind, token_hash, expires_at)
     VALUES ($1,$2,$3,$4)
     RETURNING id, user_id, kind, token_hash, created_at, expires_at, consumed_at`,
    [input.userId, input.kind, tokenHash, expiresAt],
  );
  return { token, tokenRow: res.rows[0] };
}

export async function consumeToken(
  db: Queryable,
  input: { token: string; kind: UserTokenKind },
): Promise<{ userId: string; tokenRow: UserTokenRow } | null> {
  const tokenHash = sha256Hex(input.token);
  const res = await db.query<UserTokenRow>(
    `SELECT id, user_id, kind, token_hash, created_at, expires_at, consumed_at
     FROM user_tokens
     WHERE token_hash = $1 AND kind = $2 AND consumed_at IS NULL AND expires_at > now()`,
    [tokenHash, input.kind],
  );
  if (res.rows.length === 0) return null;

  const tokenRow = res.rows[0];
  await db.query(
    `UPDATE user_tokens SET consumed_at = now() WHERE id = $1`,
    [tokenRow.id],
  );
  return { userId: tokenRow.user_id, tokenRow };
}