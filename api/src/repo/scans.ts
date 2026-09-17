import type { Queryable } from "../db";
import { encodeCursor, decodeCursor } from "./assets";

export type ScanRow = {
  id: string;
  org_id: string;
  project_id: string | null;
  trigger_source: string;
  profile: string;
  status: string;
  phase: string | null;
  progress_pct: number;
  started_at: Date | string | null;
  finished_at: Date | string | null;
  error_code: string | null;
  requested_by: string | null;
  engine_versions: unknown;
  attempt: number;
  created_at: Date | string;
  updated_at: Date | string;
};

export type ScanTargetRef = { asset_id: string; type: string; value: string };

export type ResolvedAsset = {
  id: string;
  type: string;
  value: string;
  is_active: boolean;
  verification_status: string | null;
};

export const SCAN_COLS = `id, org_id, project_id, trigger_source, profile, status,
  phase, progress_pct, started_at, finished_at, error_code, requested_by,
  engine_versions, attempt, created_at, updated_at`;

export async function createScanRow(
  db: Queryable,
  input: {
    orgId: string;
    projectId: string | null;
    triggerSource: string;
    profile: string;
    requestedBy: string | null;
  },
): Promise<ScanRow> {
  const res = await db.query<ScanRow>(
    `INSERT INTO scans (org_id, project_id, trigger_source, profile, status, progress_pct, requested_by)
     VALUES ($1,$2,$3::scan_trigger,$4::scan_profile,'queued',0,$5)
     RETURNING ${SCAN_COLS}`,
    [input.orgId, input.projectId, input.triggerSource, input.profile, input.requestedBy],
  );
  return res.rows[0];
}

export async function insertScanTargets(
  db: Queryable,
  scanId: string,
  assetIds: string[],
): Promise<void> {
  await db.query(
    `INSERT INTO scan_targets (scan_id, asset_id, status)
     SELECT $1, unnest($2::uuid[]), 'queued'`,
    [scanId, assetIds],
  );
}

export async function getScan(db: Queryable, orgId: string, scanId: string): Promise<ScanRow | null> {
  const res = await db.query<ScanRow>(
    `SELECT ${SCAN_COLS} FROM scans WHERE org_id = $1 AND id = $2`,
    [orgId, scanId],
  );
  return res.rows[0] ?? null;
}

export async function listScans(
  db: Queryable,
  orgId: string,
  opts: { status?: string; assetId?: string; limit?: number; cursor?: string },
): Promise<{ data: ScanRow[]; next_cursor: string | null; has_more: boolean }> {
  const lim = Math.min(Math.max(opts.limit ?? 50, 1), 100);
  const params: unknown[] = [orgId];
  let where = `s.org_id = $1`;
  if (opts.status) {
    params.push(opts.status);
    where += ` AND s.status = $${params.length}::scan_status`;
  }
  if (opts.assetId) {
    params.push(opts.assetId);
    where += ` AND EXISTS (SELECT 1 FROM scan_targets t WHERE t.scan_id = s.id AND t.asset_id = $${params.length}::uuid)`;
  }
  if (opts.cursor) {
    const c = decodeCursor(opts.cursor);
    if (!c) throw new Error("Invalid cursor");
    params.push(c.created_at, c.id);
    where += ` AND (s.created_at, s.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`;
  }
  params.push(lim + 1);
  const res = await db.query<ScanRow>(
    `SELECT ${SCAN_COLS} FROM scans s WHERE ${where}
     ORDER BY s.created_at DESC, s.id DESC LIMIT $${params.length}`,
    params,
  );
  const has_more = res.rows.length > lim;
  const data = has_more ? res.rows.slice(0, lim) : res.rows;
  const last = data[data.length - 1];
  return { data, next_cursor: has_more && last ? encodeCursor(last.created_at, last.id) : null, has_more };
}

export async function listScanTargets(db: Queryable, scanId: string): Promise<ScanTargetRef[]> {
  const res = await db.query<ScanTargetRef>(
    `SELECT t.asset_id, a.type, a.value
     FROM scan_targets t JOIN assets a ON a.id = t.asset_id
     WHERE t.scan_id = $1 ORDER BY a.value`,
    [scanId],
  );
  return res.rows;
}

/** Assets to scan, with their latest verification status (for the §12 gate). */
export async function resolveScanAssets(
  db: Queryable,
  orgId: string,
  assetIds: string[],
): Promise<ResolvedAsset[]> {
  const res = await db.query<ResolvedAsset>(
    `SELECT a.id, a.type, a.value, a.is_active,
       (SELECT v.status::text FROM asset_verifications v
         WHERE v.asset_id = a.id ORDER BY v.created_at DESC LIMIT 1) AS verification_status
     FROM assets a
     WHERE a.org_id = $1 AND a.id = ANY($2::uuid[])`,
    [orgId, assetIds],
  );
  return res.rows;
}

export type ScanEventRow = {
  seq: number;
  id: string;
  phase: string | null;
  level: string;
  message: string;
  at: Date | string;
};

export async function getScanEvents(
  db: Queryable,
  scanId: string,
  sinceSeq: number,
  limit = 200,
): Promise<ScanEventRow[]> {
  const res = await db.query<ScanEventRow>(
    `SELECT seq, id, phase, level, message, at
     FROM scan_events WHERE scan_id = $1 AND seq > $2
     ORDER BY seq ASC LIMIT $3`,
    [scanId, sinceSeq, limit],
  );
  return res.rows;
}
