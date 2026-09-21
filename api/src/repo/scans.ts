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

export type ScanDiff = {
  new: number;
  resolved: number;
  unchanged: number;
};

/** Severities of findings FIRST seen by this scan (drives notifications, §18). */
export async function newFindingSeverities(
  db: Queryable,
  orgId: string,
  scanId: string,
): Promise<string[]> {
  const res = await db.query<{ severity: string }>(
    `SELECT severity::text AS severity FROM findings
     WHERE org_id = $1 AND scan_id = $2 AND status = 'open'`,
    [orgId, scanId],
  );
  return res.rows.map((r) => r.severity);
}

/**
 * Scan diff banner data (§09.2): findings first recorded by this scan are NEW;
 * open/acknowledged findings for this scan's targets whose last_seen predates
 * the scan were RESOLVED (the check no longer fires).
 */
export async function scanDiff(
  db: Queryable,
  orgId: string,
  scanId: string,
): Promise<ScanDiff | null> {
  const scan = await db.query<{ started_at: Date | string | null; created_at: Date | string }>(
    `SELECT started_at, created_at FROM scans WHERE org_id = $1 AND id = $2`,
    [orgId, scanId],
  );
  if ((scan.rowCount ?? 0) === 0) return null;
  // A scan whose job was never claimed has no started_at; its findings can
  // still be attributed, so fall back to creation time.
  const boundary = scan.rows[0].started_at ?? scan.rows[0].created_at;
  if (!boundary) return null;

  const res = await db.query<{ kind: string; count: string }>(
    `WITH tgt AS (SELECT asset_id FROM scan_targets WHERE scan_id = $2)
     SELECT CASE
              WHEN f.status IN ('fixed','false_positive','accepted') THEN 'unchanged'
              WHEN f.last_seen_at >= $3 AND f.scan_id = $2 THEN 'new'
              WHEN f.last_seen_at < $3 THEN 'resolved'
              ELSE 'unchanged'
            END AS kind,
            count(*) AS count
     FROM findings f
     JOIN tgt ON tgt.asset_id = f.asset_id
     WHERE f.org_id = $1
     GROUP BY kind`,
    [orgId, scanId, boundary],
  );
  const diff: ScanDiff = { new: 0, resolved: 0, unchanged: 0 };
  for (const row of res.rows) {
    if (row.kind === "new") diff.new = Number(row.count);
    else if (row.kind === "resolved") diff.resolved = Number(row.count);
    else diff.unchanged = Number(row.count);
  }
  return diff;
}
