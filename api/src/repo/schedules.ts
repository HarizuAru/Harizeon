import type { Queryable } from "../db";
import { badRequest, notFound } from "../lib/errors";
import { normaliseCron, nextAfter, type Cron } from "../lib/cron";

export type ScheduleRow = {
  id: string;
  org_id: string;
  project_id: string | null;
  cron: string;
  profile: "quick" | "standard" | "deep";
  timezone: string;
  next_run_at: Date | string | null;
  enabled: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

const COLS = `id, org_id, project_id, cron, profile, timezone, next_run_at, enabled, created_at, updated_at`;

function requireCron(raw: string | undefined): Cron {
  const cron = normaliseCron(raw ?? "");
  if (!cron) {
    throw badRequest("unsupported_cron", "Supported cadences: daily, weekly, monthly");
  }
  return cron;
}

export async function listSchedules(db: Queryable, orgId: string): Promise<ScheduleRow[]> {
  const res = await db.query<ScheduleRow>(
    `SELECT ${COLS} FROM schedules WHERE org_id = $1 ORDER BY created_at DESC`,
    [orgId],
  );
  return res.rows;
}

export async function getSchedule(db: Queryable, orgId: string, id: string): Promise<ScheduleRow> {
  const res = await db.query<ScheduleRow>(
    `SELECT ${COLS} FROM schedules WHERE org_id = $1 AND id = $2`,
    [orgId, id],
  );
  const row = res.rows[0];
  if (!row) throw notFound("schedule_not_found", "Schedule not found");
  return row;
}

export async function createSchedule(
  db: Queryable,
  orgId: string,
  input: {
    cron: string;
    profile?: "quick" | "standard" | "deep";
    timezone?: string;
    enabled?: boolean;
    project_id?: string | null;
  },
): Promise<ScheduleRow> {
  const cron = requireCron(input.cron);
  const profile = input.profile ?? "standard";
  const timezone = input.timezone?.trim() || "Asia/Kuala_Lumpur";
  const enabled = input.enabled !== false;

  const res = await db.query<ScheduleRow>(
    `INSERT INTO schedules (org_id, project_id, cron, profile, timezone, next_run_at, enabled)
     VALUES ($1, $2, $3, $4::scan_profile, $5, $6, $7)
     RETURNING ${COLS}`,
    [
      orgId,
      input.project_id ?? null,
      cron,
      profile,
      timezone,
      enabled ? nextAfter(cron, new Date()) : null,
      enabled,
    ],
  );
  return res.rows[0];
}

export async function updateSchedule(
  db: Queryable,
  orgId: string,
  id: string,
  input: {
    cron?: string;
    profile?: "quick" | "standard" | "deep";
    timezone?: string;
    enabled?: boolean;
  },
): Promise<ScheduleRow> {
  const current = await getSchedule(db, orgId, id);
  const cron = input.cron !== undefined ? requireCron(input.cron) : (normaliseCron(current.cron) ?? "daily");
  const profile = input.profile ?? current.profile;
  const timezone = input.timezone !== undefined ? input.timezone.trim() : current.timezone;
  const enabled = input.enabled !== undefined ? input.enabled : current.enabled;

  const res = await db.query<ScheduleRow>(
    `UPDATE schedules
     SET cron = $1, profile = $2::scan_profile, timezone = $3, enabled = $4, next_run_at = $5, updated_at = now()
     WHERE org_id = $6 AND id = $7
     RETURNING ${COLS}`,
    [cron, profile, timezone, enabled, enabled ? nextAfter(cron, new Date()) : null, orgId, id],
  );
  return res.rows[0];
}

export async function deleteSchedule(db: Queryable, orgId: string, id: string): Promise<void> {
  const res = await db.query(`DELETE FROM schedules WHERE org_id = $1 AND id = $2`, [orgId, id]);
  if ((res.rowCount ?? 0) === 0) throw notFound("schedule_not_found", "Schedule not found");
}

export type DueSchedule = {
  schedule_id: string;
  org_id: string;
  project_id: string | null;
  cron: string;
  profile: string;
};

/** Due schedules across ALL orgs (SECURITY DEFINER; system scheduler task). */
export async function dueSchedules(db: Queryable, now: Date): Promise<DueSchedule[]> {
  const res = await db.query<DueSchedule>(
    `SELECT schedule_id, org_id, project_id, cron, profile FROM schedules_due($1)`,
    [now],
  );
  return res.rows;
}

/** Active assets to scan for a scheduled run (MVP: the org's single project). */
export async function projectAssetIds(db: Queryable, orgId: string): Promise<string[]> {
  const res = await db.query<{ id: string }>(
    `SELECT id FROM assets WHERE org_id = $1 AND is_active = true ORDER BY created_at LIMIT 50`,
    [orgId],
  );
  return res.rows.map((r) => r.id);
}

/**
 * Change-aware pacing input: the schedule's consecutive quiet runs, plus how
 * many NEW findings its most recent completed scheduled scan produced
 * (null = no completed run yet, so no verdict). Runs inside withTx(org).
 */
export async function schedulePace(
  db: Queryable,
  orgId: string,
  scheduleId: string,
): Promise<{ quiet_runs: number; new_findings: number | null }> {
  const res = await db.query<{ quiet_runs: number; last_scan_id: string | null }>(
    `SELECT sch.quiet_runs, last_scan.id AS last_scan_id
     FROM schedules sch
     LEFT JOIN LATERAL (
       SELECT id FROM scans
       WHERE schedule_id = sch.id AND status = 'completed'
       ORDER BY finished_at DESC NULLS LAST
       LIMIT 1
     ) last_scan ON true
     WHERE sch.org_id = $1 AND sch.id = $2`,
    [orgId, scheduleId],
  );
  const row = res.rows[0];
  if (!row) throw notFound("schedule_not_found", "Schedule not found");
  if (!row.last_scan_id) return { quiet_runs: Number(row.quiet_runs ?? 0), new_findings: null };
  const count = await db.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM findings WHERE org_id = $1 AND scan_id = $2`,
    [orgId, row.last_scan_id],
  );
  return { quiet_runs: Number(row.quiet_runs ?? 0), new_findings: Number(count.rows[0]?.count ?? "0") };
}

/** Store the pace decision. nextRunAt=null leaves the computed next run alone. */
export async function setSchedulePace(
  db: Queryable,
  orgId: string,
  scheduleId: string,
  quietRuns: number,
  nextRunAt: Date | null,
): Promise<void> {
  await db.query(
    `UPDATE schedules SET quiet_runs = $3, next_run_at = COALESCE($4, next_run_at), updated_at = now()
     WHERE org_id = $1 AND id = $2`,
    [orgId, scheduleId, quietRuns, nextRunAt],
  );
}
