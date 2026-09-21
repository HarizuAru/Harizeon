-- 0006_scheduling.sql — W09 scheduled scans (cross-org runner). Run after 0005.

BEGIN;

-- The scheduler is a system task that must see due schedules across ALL orgs
-- (no single org GUC applies), so this is SECURITY DEFINER; every write the
-- scheduler performs still runs inside withTx(org_id) with RLS enforced.
CREATE FUNCTION schedules_due(p_now timestamptz)
RETURNS TABLE(
  schedule_id uuid,
  org_id uuid,
  project_id uuid,
  cron text,
  profile scan_profile
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT s.id, s.org_id, s.project_id, s.cron, s.profile
  FROM schedules s
  WHERE s.enabled = true
    AND s.next_run_at IS NOT NULL
    AND s.next_run_at <= p_now;
$$;

REVOKE ALL ON FUNCTION schedules_due(timestamptz) FROM PUBLIC;

COMMIT;
