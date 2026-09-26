-- 0007: link scheduled scans to their schedule so the runner can pace itself.
-- A schedule whose scans keep coming back quiet backs off (2x per quiet run,
-- capped at 4x); one that keeps producing new findings stays on its cron.
BEGIN;

ALTER TABLE scans ADD COLUMN schedule_id uuid REFERENCES schedules(id) ON DELETE SET NULL;
CREATE INDEX scans_schedule_idx ON scans (schedule_id);

ALTER TABLE schedules ADD COLUMN quiet_runs smallint NOT NULL DEFAULT 0;

COMMIT;
