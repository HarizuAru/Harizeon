import type { Queryable } from "../db";
import { badRequest, notFound } from "../lib/errors";

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

export async function listSchedules(db: Queryable, orgId: string): Promise<ScheduleRow[]> {
  const res = await db.query<ScheduleRow>(
    `SELECT id, org_id, project_id, cron, profile, timezone, next_run_at, enabled, created_at, updated_at
     FROM schedules
     WHERE org_id = $1
     ORDER BY created_at DESC`,
    [orgId],
  );
  return res.rows;
}

export async function getSchedule(db: Queryable, orgId: string, id: string): Promise<ScheduleRow> {
  const res = await db.query<ScheduleRow>(
    `SELECT id, org_id, project_id, cron, profile, timezone, next_run_at, enabled, created_at, updated_at
     FROM schedules
     WHERE org_id = $1 AND id = $2`,
    [orgId, id],
  );
  const row = res.rows[0];
  if (!row) throw notFound("schedule_not_found", "Schedule not found");
  return row;
}

function computeNextRun(cron: string): Date {
  const now = new Date();
  const next = new Date(now);
  // Default next run: tomorrow at 02:00 UTC or +24 hours
  if (cron.includes("0 2 * * *") || cron.includes("daily")) {
    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(2, 0, 0, 0);
  } else if (cron.includes("weekly") || cron.includes("0 2 * * 0")) {
    next.setUTCDate(next.getUTCDate() + 7);
    next.setUTCHours(2, 0, 0, 0);
  } else {
    next.setHours(next.getHours() + 24);
  }
  return next;
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
  const cron = input.cron?.trim();
  if (!cron) throw badRequest("invalid_cron", "Cron expression is required");

  const profile = input.profile ?? "standard";
  const timezone = input.timezone?.trim() || "Asia/Kuala_Lumpur";
  const enabled = input.enabled !== false;
  const nextRunAt = enabled ? computeNextRun(cron) : null;

  const res = await db.query<ScheduleRow>(
    `INSERT INTO schedules (org_id, project_id, cron, profile, timezone, next_run_at, enabled)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, org_id, project_id, cron, profile, timezone, next_run_at, enabled, created_at, updated_at`,
    [orgId, input.project_id ?? null, cron, profile, timezone, nextRunAt, enabled],
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

  const cron = input.cron !== undefined ? input.cron.trim() : current.cron;
  if (!cron) throw badRequest("invalid_cron", "Cron expression cannot be empty");

  const profile = input.profile ?? current.profile;
  const timezone = input.timezone !== undefined ? input.timezone.trim() : current.timezone;
  const enabled = input.enabled !== undefined ? input.enabled : current.enabled;
  const nextRunAt = enabled ? computeNextRun(cron) : null;

  const res = await db.query<ScheduleRow>(
    `UPDATE schedules
     SET cron = $1, profile = $2, timezone = $3, enabled = $4, next_run_at = $5, updated_at = now()
     WHERE org_id = $6 AND id = $7
     RETURNING id, org_id, project_id, cron, profile, timezone, next_run_at, enabled, created_at, updated_at`,
    [cron, profile, timezone, enabled, nextRunAt, orgId, id],
  );
  return res.rows[0];
}

export async function deleteSchedule(db: Queryable, orgId: string, id: string): Promise<void> {
  const res = await db.query(`DELETE FROM schedules WHERE org_id = $1 AND id = $2`, [orgId, id]);
  if ((res.rowCount ?? 0) === 0) throw notFound("schedule_not_found", "Schedule not found");
}
