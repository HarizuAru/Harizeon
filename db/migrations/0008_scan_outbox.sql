-- 0008: transactional outbox for scan dispatch (§06.1).
-- The scan row and its dispatch intent commit in ONE transaction; a dispatcher
-- publishes the intent to Redis and marks it sent. A crash between commit and
-- publication is now recovered by the dispatcher (fast), not just the reaper.
BEGIN;

CREATE TABLE scan_outbox (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  scan_id       uuid NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  job           jsonb NOT NULL,
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX scan_outbox_pending_idx ON scan_outbox (created_at) WHERE published_at IS NULL;

-- System-level dispatcher lookup spanning orgs (SECURITY DEFINER).
CREATE FUNCTION outbox_pending(p_limit integer)
RETURNS TABLE(id uuid, org_id uuid, job jsonb)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT o.id, o.org_id, o.job
  FROM scan_outbox o
  WHERE o.published_at IS NULL
  ORDER BY o.created_at
  LIMIT p_limit
$$;
REVOKE ALL ON FUNCTION outbox_pending(integer) FROM PUBLIC;

-- Marking published also spans orgs, so it must be a definer too.
CREATE FUNCTION outbox_mark_published(p_ids uuid[])
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE scan_outbox SET published_at = now()
  WHERE id = ANY(p_ids) AND published_at IS NULL
$$;
REVOKE ALL ON FUNCTION outbox_mark_published(uuid[]) FROM PUBLIC;

COMMIT;
