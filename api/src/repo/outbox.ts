import type { Queryable } from "../db";
import type { ScanJob } from "../lib/queue";

/**
 * Transactional outbox (§06.1): the scan row and its dispatch intent commit in
 * one transaction; the dispatcher later publishes the intent to Redis and marks
 * it sent. Publishing is at-least-once: consumers (fingerprint dedup) tolerate
 * a duplicate delivery caused by a crash between publish and mark.
 */
export async function stageScanJob(db: Queryable, orgId: string, scanId: string, job: ScanJob): Promise<void> {
  await db.query(`INSERT INTO scan_outbox (org_id, scan_id, job) VALUES ($1,$2,$3)`, [
    orgId,
    scanId,
    JSON.stringify(job),
  ]);
}

export type PendingOutboxRow = { id: string; org_id: string; job: ScanJob };

/** System-level pending list across all orgs (definer fn, 0008). */
export async function pending(db: Queryable, limit = 50): Promise<PendingOutboxRow[]> {
  const res = await db.query<PendingOutboxRow>(`SELECT id, org_id, job FROM outbox_pending($1)`, [limit]);
  return res.rows;
}

export async function markPublished(db: Queryable, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db.query(`SELECT outbox_mark_published($1::uuid[])`, [ids]);
}
