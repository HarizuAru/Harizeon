-- Executable Cross-Tenant RLS Assertion Test (Checklist §1.3)
-- Run in CI via: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/tests/assert_rls.sql
\set ON_ERROR_STOP on

BEGIN;

-- 1. Verify runtime role harizeon_app cannot bypass RLS (if provisioned)
DO $$
DECLARE
  can_bypass BOOLEAN;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'harizeon_app') THEN
    SELECT rolbypassrls OR rolsuper INTO can_bypass
    FROM pg_roles WHERE rolname = 'harizeon_app';
    IF can_bypass IS DISTINCT FROM FALSE THEN
      RAISE EXCEPTION 'SECURITY FAIL: harizeon_app has SUPERUSER or BYPASSRLS!';
    END IF;
  END IF;
END $$;

-- 2. Verify every table containing an org_id column has BOTH relrowsecurity and relforcerowsecurity
DO $$
DECLARE
  bad_table TEXT;
BEGIN
  SELECT c.relname INTO bad_table
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.oid
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND a.attname = 'org_id'
    AND a.attnum > 0
    AND NOT a.attisdropped
    AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity)
  LIMIT 1;

  IF bad_table IS NOT NULL THEN
    RAISE EXCEPTION 'SECURITY FAIL: Table % has org_id without ENABLE+FORCE RLS!', bad_table;
  END IF;
END $$;

-- 3. Seed two isolated test tenants (explicit tenant context respects FORCE RLS)
INSERT INTO orgs (id, name, slug) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Tenant A', 'tenant-a-rls-test'),
  ('22222222-2222-2222-2222-222222222222', 'Tenant B', 'tenant-b-rls-test')
ON CONFLICT DO NOTHING;

SELECT set_config('harizeon.org_id', '11111111-1111-1111-1111-111111111111', true);
INSERT INTO assets (id, org_id, type, value, criticality) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'domain', 'a.example.my', 'high')
ON CONFLICT DO NOTHING;

SELECT set_config('harizeon.org_id', '22222222-2222-2222-2222-222222222222', true);
INSERT INTO assets (id, org_id, type, value, criticality) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'domain', 'b.example.my', 'high')
ON CONFLICT DO NOTHING;

-- Switch to runtime application role if provisioned
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'harizeon_app') THEN
    EXECUTE 'SET LOCAL ROLE harizeon_app';
  END IF;
END $$;

-- Assertion 1: Unset harizeon.org_id MUST return 0 rows (fail closed, never throw on empty string)
DO $$
DECLARE cnt INT;
BEGIN
  PERFORM set_config('harizeon.org_id', '', true);
  SELECT COUNT(*) INTO cnt FROM assets;
  IF cnt <> 0 THEN
    RAISE EXCEPTION 'SECURITY FAIL: Unset harizeon.org_id returned % rows!', cnt;
  END IF;
END $$;

-- Assertion 2: Tenant A sees ONLY Tenant A assets
DO $$
DECLARE cnt INT;
BEGIN
  PERFORM set_config('harizeon.org_id', '11111111-1111-1111-1111-111111111111', true);
  SELECT COUNT(*) INTO cnt FROM assets WHERE org_id = '22222222-2222-2222-2222-222222222222';
  IF cnt <> 0 THEN
    RAISE EXCEPTION 'SECURITY FAIL: Cross-tenant read leaked % rows from Tenant B!', cnt;
  END IF;
END $$;

-- Assertion 3: Tenant A CANNOT insert a row tagged with Tenant B's org_id
DO $$
BEGIN
  PERFORM set_config('harizeon.org_id', '11111111-1111-1111-1111-111111111111', true);
  BEGIN
    INSERT INTO assets (org_id, type, value, criticality)
    VALUES ('22222222-2222-2222-2222-222222222222', 'domain', 'injected.example.my', 'low');
    RAISE EXCEPTION 'SECURITY FAIL: Cross-tenant INSERT succeeded!';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL; -- Expected RLS WITH CHECK rejection (SQLSTATE 42501)
  END;
END $$;

ROLLBACK; -- Leave database clean
