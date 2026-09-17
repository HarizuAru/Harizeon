-- 0003_recheck.sql — system-level re-verification lookup (W03).
-- Run after 0002_auth.sql. The recheck scheduler is a background system task
-- spanning tenants, so it cannot use a single org GUC. This SECURITY DEFINER
-- function lists stale verified rows across orgs; per-row updates still run
-- inside withTx(org_id) with RLS enforced. EXECUTE is granted to the app role
-- by infra/db/create-app-role.sh (re-run it after applying this migration).

BEGIN;

CREATE FUNCTION verifications_due_for_recheck(p_cutoff timestamptz)
RETURNS TABLE(
  verification_id uuid,
  org_id uuid,
  asset_id uuid,
  method verification_method,
  token text,
  asset_type asset_type,
  asset_value text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT v.id, v.org_id, v.asset_id, v.method, v.token, a.type, a.value
  FROM asset_verifications v
  JOIN assets a ON a.id = v.asset_id
  WHERE v.status = 'verified'
    AND (v.last_checked_at IS NULL OR v.last_checked_at < p_cutoff)
    AND a.is_active = true;
$$;

REVOKE ALL ON FUNCTION verifications_due_for_recheck(timestamptz) FROM PUBLIC;

COMMIT;
