-- 0017: Add permissive tenant isolation policy for scan_outbox
--
-- Migration 0008 created scan_outbox without an RLS policy, and migration 0013
-- enabled FORCE ROW LEVEL SECURITY with only an AS RESTRICTIVE policy. In
-- PostgreSQL, RLS with zero PERMISSIVE policies denies all rows by default,
-- blocking scan creation. Add the matching PERMISSIVE org isolation policy.

BEGIN;

DROP POLICY IF EXISTS scan_outbox_org_isolation ON public.scan_outbox;
CREATE POLICY scan_outbox_org_isolation ON public.scan_outbox
  FOR ALL
  USING (org_id = NULLIF(current_setting('harizeon.org_id', true), '')::uuid)
  WITH CHECK (org_id = NULLIF(current_setting('harizeon.org_id', true), '')::uuid);

COMMIT;
