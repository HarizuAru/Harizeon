import { pool, withTx } from "../db";
import { createScan } from "../services/scanService";
import { scanQueue } from "../services/scanQueue";
import { dueSchedules, projectAssetIds, updateSchedule } from "../repo/schedules";
import { writeAudit } from "../lib/audit";

/**
 * Raise scans for every due schedule (§16 W09: "it works while you sleep").
 * Runs across orgs; every write happens inside withTx(org_id) with RLS enforced.
 * next_run_at is ALWAYS advanced, even on failure, so one broken schedule cannot
 * hot-loop the runner.
 */
export async function runSchedulerOnce(
  now = new Date(),
): Promise<{ created: number; skipped: number; advanced: number }> {
  const due = await dueSchedules(pool, now);
  let created = 0;
  let skipped = 0;
  let advanced = 0;

  for (const schedule of due) {
    try {
      const assetIds = await withTx((c) => projectAssetIds(c, schedule.org_id), schedule.org_id);
      if (assetIds.length === 0) {
        skipped += 1;
      } else {
        const scan = await createScan(scanQueue, {
          orgId: schedule.org_id,
          projectId: schedule.project_id,
          profile: schedule.profile,
          triggerSource: "scheduled",
          requestedBy: null,
          assetIds,
        });
        created += 1;
        await withTx(
          (c) =>
            writeAudit(c, {
              orgId: schedule.org_id,
              actorType: "system",
              action: "scan.scheduled",
              targetType: "scan",
              targetId: scan.id,
              metadata: { scheduleId: schedule.schedule_id },
            }),
          schedule.org_id,
        );
      }
    } catch (e) {
      // Typically asset_not_verified: skip this cycle, keep the schedule alive.
      skipped += 1;
      console.error("[scheduler]", e instanceof Error ? e.message : e);
      } finally {
      try {
        // updateSchedule recomputes next_run_at from the cron, advancing the run.
        await withTx(
          (c) => updateSchedule(c, schedule.org_id, schedule.schedule_id, {}),
          schedule.org_id,
        );
        advanced += 1;
      } catch (e) {
        console.error("[scheduler] advance failed:", e instanceof Error ? e.message : e);
      }
    }
  }

  return { created, skipped, advanced };
}

export function startScheduler(intervalMs = 30_000): () => void {
  const timer = setInterval(() => {
    runSchedulerOnce().catch((e: unknown) => console.error("[scheduler]", e));
  }, intervalMs);
  if (typeof timer.unref === "function") timer.unref();
  return () => clearInterval(timer);
}
