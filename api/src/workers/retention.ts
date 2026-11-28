import { pool, withTx, type Queryable } from "../db";

export const DEFAULT_RETENTION_DAYS = 90;
export const DAILY_RETENTION_INTERVAL_MS = 24 * 60 * 60 * 1000;

export interface OrgRetentionRow {
  org_id: string;
  limits?: { retention_days?: unknown } | null;
  retention_days?: unknown;
}

export interface RetentionPurgeSummary {
  orgsEvaluated: number;
  orgsUnlimited: number;
  deletedScanEvents: number;
  deletedAssetSnapshots: number;
  deletedReports: number;
}

/**
 * Resolve effective retention days from plan limits JSONB.
 * Returns `null` when retention is unlimited (`-1`), otherwise a positive integer
 * defaulting safely to DEFAULT_RETENTION_DAYS (90) when unset or invalid.
 */
export function resolveRetentionDays(row: OrgRetentionRow): number | null {
  const raw = row.limits?.retention_days ?? row.retention_days;
  if (raw === undefined || raw === null || raw === "") {
    return DEFAULT_RETENTION_DAYS;
  }
  const parsed = Number(raw);
  if (parsed === -1) return null;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_RETENTION_DAYS;
  }
  return Math.floor(parsed);
}

async function purgeOrgExpiredData(
  client: Queryable,
  orgId: string,
  retentionDays: number,
): Promise<{ scanEvents: number; assetSnapshots: number; reports: number }> {
  const daysParam = String(retentionDays);

  const scanEventsRes = await client.query(
    `DELETE FROM scan_events se
     USING scans s
     WHERE se.scan_id = s.id
       AND s.org_id = $1
       AND se.created_at < NOW() - ($2::text || ' days')::interval`,
    [orgId, daysParam],
  );

  const snapshotsRes = await client.query(
    `DELETE FROM asset_snapshots
     WHERE org_id = $1
       AND created_at < NOW() - ($2::text || ' days')::interval`,
    [orgId, daysParam],
  );

  const reportsRes = await client.query(
    `DELETE FROM reports
     WHERE org_id = $1
       AND created_at < NOW() - ($2::text || ' days')::interval`,
    [orgId, daysParam],
  );

  return {
    scanEvents: scanEventsRes.rowCount ?? 0,
    assetSnapshots: snapshotsRes.rowCount ?? 0,
    reports: reportsRes.rowCount ?? 0,
  };
}

/**
 * Purge expired scan_events, asset_snapshots, and reports per org according to
 * plans.limits.retention_days (LEG-05 / PDPA 2024 data minimization).
 */
export async function runRetentionPurge(db: Queryable = pool): Promise<RetentionPurgeSummary> {
  const useWithTx = db === pool;
  let rows: OrgRetentionRow[] = [];

  if (useWithTx) {
    try {
      const res = await db.query<OrgRetentionRow>(
        `SELECT org_id, limits FROM org_retention_policies()`,
      );
      rows = res.rows;
    } catch {
      const res = await db.query<OrgRetentionRow>(
        `SELECT o.id AS org_id, p.limits
         FROM orgs o
         LEFT JOIN plans p ON p.id = o.plan_id`,
      );
      rows = res.rows;
    }
  } else {
    const res = await db.query<OrgRetentionRow>(
      `SELECT o.id AS org_id, p.limits
       FROM orgs o
       LEFT JOIN plans p ON p.id = o.plan_id`,
    );
    rows = res.rows;
  }

  let orgsUnlimited = 0;
  let deletedScanEvents = 0;
  let deletedAssetSnapshots = 0;
  let deletedReports = 0;

  for (const row of rows) {
    const retentionDays = resolveRetentionDays(row);
    if (retentionDays === null) {
      orgsUnlimited += 1;
      continue;
    }

    try {
      const deleted = useWithTx
        ? await withTx((client) => purgeOrgExpiredData(client, row.org_id, retentionDays), row.org_id)
        : await purgeOrgExpiredData(db, row.org_id, retentionDays);

      deletedScanEvents += deleted.scanEvents;
      deletedAssetSnapshots += deleted.assetSnapshots;
      deletedReports += deleted.reports;
    } catch (e) {
      console.error("[retention] org purge failed:", row.org_id, e instanceof Error ? e.message : e);
    }
  }

  return {
    orgsEvaluated: rows.length,
    orgsUnlimited,
    deletedScanEvents,
    deletedAssetSnapshots,
    deletedReports,
  };
}

export function startRetentionPurge(
  db: Queryable = pool,
  intervalMs = DAILY_RETENTION_INTERVAL_MS,
): () => void {
  const timer = setInterval(() => {
    runRetentionPurge(db).catch((e: unknown) => {
      console.error("[retention]", e instanceof Error ? e.message : e);
    });
  }, intervalMs);
  if (typeof timer.unref === "function") timer.unref();
  return () => clearInterval(timer);
}
