-- 0004_scan_queue.sql — W04 job-pipeline skeleton (queue, state machine, live view).
-- Run after 0003_recheck.sql.

BEGIN;

-- Retry counter for the QUEUED->CLAIMED->RUNNING->terminal state machine (§06.4):
-- a timed-out/failed job retries at most 2 times.
ALTER TABLE scans ADD COLUMN attempt smallint NOT NULL DEFAULT 0;

-- Monotonic per-row sequence so the SSE live view can resume from a cursor
-- without relying on transaction-time timestamps (now() is txn-scoped).
ALTER TABLE scan_events ADD COLUMN seq bigserial;
CREATE INDEX scan_events_scan_seq_idx ON scan_events (scan_id, seq);

-- Fast lookup of in-flight scans (the reaper's working set).
CREATE INDEX scans_active_idx ON scans (status) WHERE status IN ('queued','claimed','running');

-- Reaper lookup: scans with no progress past the cutoff, across ALL orgs.
-- Runs as a system task with no single org GUC, so it is SECURITY DEFINER; the
-- reaper still performs every write inside withTx(org_id) with RLS enforced.
CREATE FUNCTION scans_stale(p_cutoff timestamptz)
RETURNS TABLE(scan_id uuid, org_id uuid, attempt smallint, status scan_status)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT s.id, s.org_id, s.attempt, s.status
  FROM scans s
  WHERE s.status IN ('queued','claimed','running')
    AND COALESCE(s.started_at, s.created_at) < p_cutoff;
$$;

REVOKE ALL ON FUNCTION scans_stale(timestamptz) FROM PUBLIC;

COMMIT;
