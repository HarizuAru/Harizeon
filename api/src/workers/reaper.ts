import { pool, withTx } from "../db";
import { writeAudit } from "../lib/audit";
import { retryDecision } from "../lib/scan-state";
import type { ScanJob, ScanQueue } from "../lib/queue";
import { staleScans } from "../services/scanService";
import * as repo from "../repo/scans";
import * as assetsRepo from "../repo/assets";

/**
 * Reclaim scans whose worker stopped heartbeating: retry (max 2, §06.4) or mark
 * timeout. Never touches a scan whose worker is still alive.
 */
export async function runReaperOnce(
  queue: ScanQueue,
  staleMs = 60_000,
): Promise<{ requeued: number; timedOut: number }> {
  const cutoff = new Date(Date.now() - staleMs);
  const stale = await staleScans(pool, cutoff);
  let requeued = 0;
  let timedOut = 0;

  for (const s of stale) {
    try {
      if (await queue.isAlive(s.scan_id)) continue;

      const decision = retryDecision(s.attempt);
      const job = await withTx(async (client) => {
        const scan = await repo.getScan(client, s.org_id, s.scan_id);
        if (!scan) return null;

        if (decision.retry) {
          const res = await client.query(
            `UPDATE scans SET status='queued', attempt=$2, phase=NULL, started_at=NULL, updated_at=now()
             WHERE id=$1 AND status NOT IN ('completed','failed','timeout','cancelled')`,
            [s.scan_id, decision.nextAttempt],
          );
          if ((res.rowCount ?? 0) === 0) return null;
          await client.query(
            `INSERT INTO scan_events (scan_id, level, message) VALUES ($1,'warn',$2)`,
            [s.scan_id, `worker timed out; retrying (attempt ${decision.nextAttempt})`],
          );
        } else {
          const res = await client.query(
            `UPDATE scans SET status='timeout', finished_at=now(), error_code='worker_timeout', updated_at=now()
             WHERE id=$1 AND status NOT IN ('completed','failed','timeout','cancelled')`,
            [s.scan_id],
          );
          if ((res.rowCount ?? 0) === 0) return null;
          await client.query(
            `INSERT INTO scan_events (scan_id, level, message) VALUES ($1,'error','worker timed out; giving up')`,
            [s.scan_id],
          );
          await writeAudit(client, {
            orgId: s.org_id,
            actorType: "system",
            action: "scan.timeout",
            targetType: "scan",
            targetId: s.scan_id,
          });
        }

        const targets = await repo.listScanTargets(client, s.scan_id);
        if (targets.length === 0) return null;

        // §12: authorization is re-checked at execution time. A verification
        // revoked since the scan started must stop the retry, not just block
        // new scans — a stale scan of a lapsed asset is unauthorized work.
        const targetIds = targets.map((t) => t.asset_id);
        const resolved = await repo.resolveScanAssets(client, s.org_id, targetIds);
        const authorized =
          resolved.length === targetIds.length &&
          (
            await (async () => {
              for (const a of resolved) {
                if (!a.is_active) return false;
                if (a.verification_status === "verified") continue;
                if (await assetsRepo.isVerifiedOrInherited(client, s.org_id, a.id)) continue;
                return false;
              }
              return true;
            })()
          );
        if (!authorized) {
          const res = await client.query(
            `UPDATE scans SET status='cancelled', finished_at=now(), error_code='asset_not_verified', updated_at=now()
             WHERE id=$1 AND status NOT IN ('completed','failed','timeout','cancelled')`,
            [s.scan_id],
          );
          if ((res.rowCount ?? 0) > 0) {
            await client.query(
              `INSERT INTO scan_events (scan_id, level, message) VALUES ($1,'error',$2)`,
              [s.scan_id, "target ownership no longer verified; scan not retried"],
            );
            await writeAudit(client, {
              orgId: s.org_id,
              actorType: "system",
              action: "scan.cancel",
              targetType: "scan",
              targetId: s.scan_id,
              metadata: { reason: "asset_not_verified" },
            });
          }
          return null;
        }

        return {
          profile: scan.profile as ScanJob["profile"],
          targets,
        } satisfies Pick<ScanJob, "profile" | "targets">;
      }, s.org_id);

      if (job && decision.retry) {
        await queue.enqueue({
          scan_id: s.scan_id,
          org_id: s.org_id,
          profile: job.profile,
          attempt: decision.nextAttempt,
          targets: job.targets,
        });
        requeued += 1;
      } else if (!decision.retry) {
        timedOut += 1;
      }
    } catch (e) {
      console.error("[reaper]", e instanceof Error ? e.message : e);
    }
  }
  return { requeued, timedOut };
}

export function startReaper(queue: ScanQueue, intervalMs = 15_000, staleMs = 60_000): () => void {
  const timer = setInterval(() => {
    runReaperOnce(queue, staleMs).catch((e: unknown) => console.error("[reaper]", e));
  }, intervalMs);
  if (typeof timer.unref === "function") timer.unref();
  return () => clearInterval(timer);
}
