import type { Queryable } from "../db";
import { encodeCursor, decodeCursor } from "./assets";

export type DriftEventRow = {
  id: string;
  org_id: string;
  asset_id: string;
  asset_value?: string | null;
  scan_id: string;
  event_type: string;
  severity: string;
  summary: string;
  details: Record<string, unknown>;
  created_at: Date | string;
};

export async function listDriftEvents(
  db: Queryable,
  orgId: string,
  opts: {
    severity?: string;
    event_type?: string;
    asset_id?: string;
    limit?: number;
    cursor?: string;
  },
): Promise<{ data: DriftEventRow[]; next_cursor: string | null; has_more: boolean }> {
  const lim = Math.min(Math.max(opts.limit ?? 50, 1), 100);
  const params: unknown[] = [orgId];
  let where = `d.org_id = $1`;

  if (opts.severity) {
    params.push(opts.severity);
    where += ` AND d.severity = $${params.length}`;
  }
  if (opts.event_type) {
    params.push(opts.event_type);
    where += ` AND d.event_type = $${params.length}`;
  }
  if (opts.asset_id) {
    params.push(opts.asset_id);
    where += ` AND d.asset_id = $${params.length}::uuid`;
  }
  if (opts.cursor) {
    const c = decodeCursor(opts.cursor);
    if (!c) throw new Error("Invalid cursor");
    params.push(c.created_at, c.id);
    where += ` AND (d.created_at, d.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`;
  }

  params.push(lim + 1);
  const res = await db.query<DriftEventRow>(
    `SELECT d.id, d.org_id, d.asset_id, a.value AS asset_value, d.scan_id,
            d.event_type, d.severity, d.summary, d.details, d.created_at
     FROM drift_events d
     LEFT JOIN assets a ON a.id = d.asset_id
     WHERE ${where}
     ORDER BY d.created_at DESC, d.id DESC
     LIMIT $${params.length}`,
    params,
  );

  const has_more = res.rows.length > lim;
  const data = has_more ? res.rows.slice(0, lim) : res.rows;
  const last = data[data.length - 1];
  return {
    data,
    next_cursor: has_more && last ? encodeCursor(last.created_at, last.id) : null,
    has_more,
  };
}
