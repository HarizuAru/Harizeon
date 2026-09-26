import { pool, withTx } from "../db";
import { createScan } from "../services/scanService";
import { scanQueue } from "../services/scanQueue";
import {
  dueSchedules,
  projectAssetIds,
  schedulePace,
  setSchedulePace,
  updateSchedule,
} from "../repo/schedules";
import { writeAudit } from "../lib/audit";

/**
 * Raise scans for every due schedule (§16 W09: "it works while you sleep").
 * Runs across orgs; every write happens inside withTx(org_id) with RLS enforced.
 * next_run_at is ALWAYS advanced, even on failure, so one broken schedule cannot
 * hot-loop the runner.
 *
 * Change-aware pacing: a schedule whose last scheduled scan found nothing new
 * backs off (2x the cron interval per consecutive quiet run, capped at 4x);
 * new findings reset it. The cadence is only ever stretched, never shortened.
 */
export async function runSchedulerOnce(
  now = new Date(),
): Promise<{ created: number; skipped: number; advanced: number }> {
  const due = await dueSchedules(pool, now);
  let created = 0;
  let skipped = 0;
  let advanced = 0;

  for (const schedule of due) {
    let next: { next_run_at: Date | string | null } | null = null;
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
          scheduleId: schedule.schedule_id,
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
        next = await withTx(
          (c) => updateSchedule(c, schedule.org_id, schedule.schedule_id, {}),
          schedule.org_id,
        );
        advanced += 1;
      } catch (e) {
        console.error("[scheduler] advance failed:", e instanceof Error ? e.message : e);
      }
    }

    // Change-aware pacing, only meaningful once a scheduled scan completed.
    if (!next) continue;
    try {
      const pace = await withTx(
        (c) => schedulePace(c, schedule.org_id, schedule.schedule_id),
        schedule.org_id,
      );
      if (pace.new_findings === null) continue; // nothing to judge yet
      const quietRuns = pace.new_findings > 0 ? 0 : Math.min(pace.quiet_runs + 1, 2);
      if (quietRuns === 0) {
        await withTx(
          (c) => setSchedulePace(c, schedule.org_id, schedule.schedule_id, 0, null),
          schedule.org_id,
        );
      } else if (next.next_run_at) {
        const base = new Date(next.next_run_at);
        const interval = Math.max(0, base.getTime() - now.getTime());
        const stretch = Math.min(4, 2 ** quietRuns);
        const stretched = new Date(base.getTime() + (stretch - 1) * interval);
        await withTx(
          (c) => setSchedulePace(c, schedule.org_id, schedule.schedule_id, quietRuns, stretched),
          schedule.org_id,
        );
      }
    } catch (e) {
      console.error("[scheduler] pace failed:", e instanceof Error ? e.message : e);
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
