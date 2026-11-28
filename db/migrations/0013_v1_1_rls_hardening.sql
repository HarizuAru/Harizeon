-- 0013: PostgreSQL 16 Multi-Tenant RLS Hardening (Audit Checklist §1)
--
-- Hardens tenant isolation across all org_id-scoped and child event tables:
-- 1. Revokes default CREATE privilege on schema public from PUBLIC.
-- 2. Wraps session GUC lookups with NULLIF(..., '')::uuid so empty settings
--    fail closed (0 rows) rather than throwing uuid cast errors.
-- 3. Enables FORCE ROW LEVEL SECURITY and AS RESTRICTIVE tenant policies on
--    all org_id-scoped tables, plus EXISTS-scoped RLS on scan_events & finding_events.

BEGIN;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Update existing policies on org_id tables to fail closed with NULLIF + RESTRICTIVE
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT DISTINCT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND a.attname = 'org_id'
      AND a.attnum > 0
      AND NOT a.attisdropped
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', tbl);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_tenant_restrictive', tbl);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL
       USING (org_id = NULLIF(current_setting(''harizeon.org_id'', true), '''')::uuid)
       WITH CHECK (org_id = NULLIF(current_setting(''harizeon.org_id'', true), '''')::uuid)',
      tbl || '_tenant_restrictive',
      tbl
    );
  END LOOP;
END $$;

-- Harden child append-only event tables (scan_events, finding_events) via parent org_id
DO $$
BEGIN
  IF to_regclass('public.scan_events') IS NOT NULL THEN
    ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.scan_events FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS scan_events_tenant_isolation ON public.scan_events;
    CREATE POLICY scan_events_tenant_isolation ON public.scan_events
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.scans s
          WHERE s.id = scan_id
            AND s.org_id = NULLIF(current_setting('harizeon.org_id', true), '')::uuid
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.scans s
          WHERE s.id = scan_id
            AND s.org_id = NULLIF(current_setting('harizeon.org_id', true), '')::uuid
        )
      );
  END IF;

  IF to_regclass('public.finding_events') IS NOT NULL THEN
    ALTER TABLE public.finding_events ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.finding_events FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS finding_events_tenant_isolation ON public.finding_events;
    CREATE POLICY finding_events_tenant_isolation ON public.finding_events
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.findings f
          WHERE f.id = finding_id
            AND f.org_id = NULLIF(current_setting('harizeon.org_id', true), '')::uuid
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.findings f
          WHERE f.id = finding_id
            AND f.org_id = NULLIF(current_setting('harizeon.org_id', true), '')::uuid
        )
      );
  END IF;
END $$;

COMMIT;
