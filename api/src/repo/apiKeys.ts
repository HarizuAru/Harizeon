import type { Queryable } from "../db";
import { generateApiKey } from "../lib/tokens";

export type ApiKeyRow = {
  id: string;
  org_id: string;
  name: string;
  prefix: string;
  hash: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiKeyCreateInput = {
  orgId: string;
  name: string;
  scopes: string[];
};

export async function createApiKey(
  db: Queryable,
  input: ApiKeyCreateInput,
): Promise<{ key: string; prefix: string; row: ApiKeyRow }> {
  const { key, prefix, hash } = generateApiKey("live");
  const scopes = JSON.stringify(input.scopes);

  const res = await db.query<ApiKeyRow>(
    `INSERT INTO api_keys (org_id, name, prefix, hash, scopes)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, org_id, name, prefix, hash, scopes, last_used_at, expires_at, revoked_at, created_at, updated_at`,
    [input.orgId, input.name, prefix, hash, scopes],
  );
  return { key, prefix, row: res.rows[0] };
}

export async function listApiKeys(db: Queryable, orgId: string): Promise<ApiKeyRow[]> {
  const res = await db.query<ApiKeyRow>(
    `SELECT id, org_id, name, prefix, hash, scopes, last_used_at, expires_at, revoked_at, created_at, updated_at
     FROM api_keys WHERE org_id = $1 ORDER BY created_at DESC`,
    [orgId],
  );
  return res.rows;
}

export async function revokeApiKey(db: Queryable, orgId: string, keyId: string): Promise<void> {
  await db.query(
    `UPDATE api_keys SET revoked_at = now() WHERE id = $1 AND org_id = $2`,
    [keyId, orgId],
  );
}

export async function findApiKeyByHash(db: Queryable, keyHash: string): Promise<ApiKeyRow | null> {
  // Uses the api_key_by_hash() SECURITY DEFINER function (0002_auth.sql) so the
  // pre-auth lookup bypasses api_keys org-RLS. Filtering (revoked/expired) is in
  // the function.
  const res = await db.query<ApiKeyRow>(
    `SELECT id, org_id, name, prefix, hash, scopes, last_used_at, expires_at, revoked_at, created_at, updated_at
     FROM api_key_by_hash($1)`,
    [keyHash],
  );
  return res.rows[0] ?? null;
}

export async function updateApiKeyLastUsed(db: Queryable, keyId: string): Promise<void> {
  await db.query(
    `UPDATE api_keys SET last_used_at = now() WHERE id = $1`,
    [keyId],
  );
}