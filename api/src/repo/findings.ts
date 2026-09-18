import type { Queryable } from "../db";
import { encodeCursor, decodeCursor } from "./assets";
import { sha256Hex } from "../lib/tokens";

export type FindingRow = {
  id: string;
  org_id: string;
  asset_id: string | null;
  asset_value?: string | null;
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

const COLS = `f.id, f.org_id, f.asset_id, f.scan_id, f.fingerprint, f.title, f.description,
  f.severity, f.cvss_score, f.cve_ids, f.cwe_id, f.category, f.evidence_ref, f.remediation,
  f.status, f.status_reason, f.first_seen_at, f.last_seen_at, f.resolved_at, f.assigned_to,
  f.created_at, f.updated_at`;

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
    `SELECT ${COLS}, a.value AS asset_value FROM findings f
     LEFT JOIN assets a ON a.id = f.asset_id WHERE ${where}
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
    `SELECT ${COLS}, a.value AS asset_value FROM findings f
     LEFT JOIN assets a ON a.id = f.asset_id
     WHERE f.org_id = $1 AND f.id = $2`,
    [orgId, findingId],
  );
  return res.rows[0] ?? null;
}

export function findingFingerprint(assetId: string | null, checkId: string, location: string): string {
  return sha256Hex(`${assetId ?? ""}|${checkId}|${location}`);
}

/**
 * Status transition per §07: fixed resolves (resolved_at = now); moving back to
 * open from fixed clears it. Callers record the finding_events audit row when
 * the status actually changed.
 */
export async function setFindingStatus(
  db: Queryable,
  orgId: string,
  findingId: string,
  to: FindingStatus,
  reason: string | undefined,
): Promise<FindingRow | null> {
  const res = await db.query<FindingRow>(
    `UPDATE findings AS f SET
       status = $3::finding_status,
       status_reason = $4,
       resolved_at = CASE WHEN $3::finding_status = 'fixed' THEN now() ELSE NULL END,
       updated_at = now()
     WHERE f.org_id = $1 AND f.id = $2
     RETURNING ${COLS}`,
    [orgId, findingId, to, reason ?? null],
  );
  return res.rows[0] ?? null;
}

export type FindingStatus = "open" | "acknowledged" | "fixed" | "false_positive" | "accepted";

export async function recordFindingTransition(
  db: Queryable,
  input: { findingId: string; actorId?: string; from?: string; to: FindingStatus; note?: string },
): Promise<void> {
  await db.query(
    `INSERT INTO finding_events (finding_id, actor_id, from_status, to_status, note)
     VALUES ($1, $2, $3::finding_status, $4::finding_status, $5)`,
    [input.findingId, input.actorId ?? null, input.from ?? null, input.to, input.note ?? null],
  );
}

export async function listFindingEvents(
  db: Queryable,
  findingId: string,
): Promise<FindingEventRow[]> {
  const res = await db.query<FindingEventRow>(
    `SELECT id, actor_id, from_status, to_status, note, at FROM finding_events
     WHERE finding_id = $1 ORDER BY at DESC, id DESC LIMIT 50`,
    [findingId],
  );
  return res.rows;
}

export type FindingEventRow = {
  id: string;
  actor_id: string | null;
  from_status: string | null;
  to_status: string;
  note: string | null;
  at: Date | string;
};

/**
 * Scan diff for the live-view banner (§09.2): new/unchanged were recorded by
 * this scan; resolved = open findings for the scan's targets that this scan did
 * NOT touch (last_seen predates it).
 */
export async function severityCounts(db: Queryable, orgId: string): Promise<Record<string, number>> {
  const res = await db.query<{ severity: string; count: string }>(
    `SELECT severity::text AS severity, count(*) AS count FROM findings
     WHERE org_id = $1 AND status = 'open' GROUP BY severity`,
    [orgId],
  );
  const out: Record<string, number> = { info: 0, low: 0, medium: 0, high: 0, critical: 0 };
  for (const row of res.rows) out[row.severity] = Number(row.count);
  return out;
}
