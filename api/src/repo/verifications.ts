import type { Queryable } from "../db";

export type VerificationMethod = "dns_txt" | "http_file" | "meta_tag";
export type VerificationStatus = "pending" | "verified" | "failed" | "revoked";

export type VerificationRow = {
  id: string;
  org_id: string;
  asset_id: string;
  method: VerificationMethod;
  token: string;
  verified_at: Date | string | null;
  last_checked_at: Date | string | null;
  status: VerificationStatus;
  created_at: Date | string;
  updated_at: Date | string;
};

const VERIFICATION_COLS = `id, org_id, asset_id, method, token, verified_at,
  last_checked_at, status, created_at, updated_at`;

export async function getLatestVerification(
  db: Queryable,
  orgId: string,
  assetId: string,
): Promise<VerificationRow | null> {
  const res = await db.query<VerificationRow>(
    `SELECT ${VERIFICATION_COLS} FROM asset_verifications
     WHERE org_id = $1 AND asset_id = $2 ORDER BY created_at DESC LIMIT 1`,
    [orgId, assetId],
  );
  return res.rows[0] ?? null;
}

/** Drop stale pending rows for (asset, method), then insert a fresh pending row. */
export async function initiateVerification(
  db: Queryable,
  input: { orgId: string; assetId: string; method: VerificationMethod; token: string },
): Promise<VerificationRow> {
  await db.query(
    `DELETE FROM asset_verifications
     WHERE org_id = $1 AND asset_id = $2 AND method = $3 AND status = 'pending'`,
    [input.orgId, input.assetId, input.method],
  );
  const res = await db.query<VerificationRow>(
    `INSERT INTO asset_verifications (org_id, asset_id, method, token, status)
     VALUES ($1,$2,$3,$4,'pending') RETURNING ${VERIFICATION_COLS}`,
    [input.orgId, input.assetId, input.method, input.token],
  );
  return res.rows[0];
}

export async function markVerification(
  db: Queryable,
  id: string,
  status: Extract<VerificationStatus, "verified" | "failed" | "revoked">,
): Promise<void> {
  await db.query(
    `UPDATE asset_verifications
     SET status = $2::verification_status, last_checked_at = now(), updated_at = now(),
         verified_at = CASE WHEN $2::verification_status = 'verified' THEN now() ELSE verified_at END
     WHERE id = $1`,
    [id, status],
  );
}

export async function touchVerificationCheck(db: Queryable, id: string): Promise<void> {
  await db.query(
    `UPDATE asset_verifications SET last_checked_at = now(), updated_at = now() WHERE id = $1`,
    [id],
  );
}
