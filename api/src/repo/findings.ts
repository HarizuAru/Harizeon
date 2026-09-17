import type { Queryable } from "../db";
import { encodeCursor, decodeCursor } from "./assets";

export type FindingRow = {
  id: string;
  org_id: string;
  asset_id: string | null;
  scan_id: string | null;
  fingerprint: string;
  title: string;
  description: string | null;
  severity: string;
  cvss_score: number | null;
  cve_ids: string[];
  cwe_id: string | null;
  category: string | null;
  evidence_ref: string | null;
  remediation: string | null;
  status: string;
  status_reason: string | null;
  first_seen_at: Date | string;
  last_seen_at: Date | string;
  resolved_at: Date | string | null;
  assigned_to: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

const COLS = `id, org_id, asset_id, scan_id, fingerprint, title, description,
  severity, cvss_score, cve_ids, cwe_id, category, evidence_ref, remediation,
  status, status_reason, first_seen_at, last_seen_at, resolved_at, assigned_to,
  created_at, updated_at`;

export async function listFindings(
  db: Queryable,
  orgId: string,
  opts: {
    severity?: string;
    status?: string;
    assetId?: string;
    limit?: number;
    cursor?: string;
  },
): Promise<{ data: FindingRow[]; next_cursor: string | null; has_more: boolean }> {
  const lim = Math.min(Math.max(opts.limit ?? 50, 1), 100);
  const params: unknown[] = [orgId];
  let where = `f.org_id = $1`;
  if (opts.severity) {
    params.push(opts.severity);
    where += ` AND f.severity = $${params.length}::severity`;
  }
  if (opts.status) {
    params.push(opts.status);
    where += ` AND f.status = $${params.length}::finding_status`;
  }
  if (opts.assetId) {
    params.push(opts.assetId);
    where += ` AND f.asset_id = $${params.length}::uuid`;
  }
  if (opts.cursor) {
    const c = decodeCursor(opts.cursor);
    if (!c) throw new Error("Invalid cursor");
    params.push(c.created_at, c.id);
    where += ` AND (f.created_at, f.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`;
  }
  params.push(lim + 1);
  const res = await db.query<FindingRow>(
    `SELECT ${COLS} FROM findings f WHERE ${where}
     ORDER BY f.created_at DESC, f.id DESC LIMIT $${params.length}`,
    params,
  );
  const has_more = res.rows.length > lim;
  const data = has_more ? res.rows.slice(0, lim) : res.rows;
  const last = data[data.length - 1];
  return { data, next_cursor: has_more && last ? encodeCursor(last.created_at, last.id) : null, has_more };
}

export async function getFinding(db: Queryable, orgId: string, findingId: string): Promise<FindingRow | null> {
  const res = await db.query<FindingRow>(
    `SELECT ${COLS} FROM findings f WHERE f.org_id = $1 AND f.id = $2`,
    [orgId, findingId],
  );
  return res.rows[0] ?? null;
}
