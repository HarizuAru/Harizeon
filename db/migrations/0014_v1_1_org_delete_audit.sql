-- 0014: Preserve immutable audit_log entries when an organization is deleted (LEG-04)
-- and expose cross-org retention policies for the daily retention purge worker (LEG-05).

BEGIN;

ALTER TABLE IF EXISTS public.audit_log
  DROP CONSTRAINT IF EXISTS audit_log_org_id_fkey;

CREATE OR REPLACE FUNCTION org_retention_policies()
RETURNS TABLE(
  org_id uuid,
  limits jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT o.id AS org_id, COALESCE(p.limits, '{}'::jsonb) AS limits
  FROM public.orgs o
  LEFT JOIN public.plans p ON p.id = o.plan_id;
$$;

REVOKE ALL ON FUNCTION org_retention_policies() FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'harizeon_app') THEN
    GRANT EXECUTE ON FUNCTION org_retention_policies() TO harizeon_app;
  END IF;
END $$;

COMMIT;
