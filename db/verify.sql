-- verify.sql — security invariants self-check (§11 "cross-tenant assertion on
-- day one"). Run as the OWNER role AFTER create-app-role.sh. Exits non-zero on
-- the first failure (\set ON_ERROR_STOP). Safe to re-run.
--
--   docker compose exec -T db psql -U harizeon -d harizeon -v ON_ERROR_STOP=1 < db/verify.sql
\set ON_ERROR_STOP on

-- Fixtures (owner bypasses RLS) ------------------------------------------------
INSERT INTO orgs (id, name, slug) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Verify Org A', 'verify-a'),
  ('22222222-2222-2222-2222-222222222222', 'Verify Org B', 'verify-b')
ON CONFLICT (id) DO NOTHING;

INSERT INTO assets (org_id, type, value) VALUES
  ('11111111-1111-1111-1111-111111111111', 'domain', 'a.verify.local'),
  ('22222222-2222-2222-2222-222222222222', 'domain', 'b.verify.local')
ON CONFLICT (org_id, type, value) DO NOTHING;

-- 1) audit_log is append-only --------------------------------------------------
DO $$
DECLARE blocked boolean := false;
BEGIN
  INSERT INTO audit_log (org_id, actor_type, action)
  VALUES ('11111111-1111-1111-1111-111111111111', 'system', 'verify.append');
  BEGIN
    UPDATE audit_log SET action = 'tampered' WHERE action = 'verify.append';
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'FAIL: audit_log allowed UPDATE (append-only guard broken)';
  END IF;
  RAISE NOTICE 'OK: audit_log append-only guard fires on UPDATE';
END $$;

-- 2) RLS isolates tenants for the non-owner app role ---------------------------
SET ROLE harizeon_app;
SELECT set_config('harizeon.org_id', '11111111-1111-1111-1111-111111111111', false);
DO $$
DECLARE total int; leaked int;
BEGIN
  SELECT count(*) INTO total  FROM assets;
  SELECT count(*) INTO leaked FROM assets WHERE value = 'b.verify.local';
  IF leaked <> 0 THEN
    RAISE EXCEPTION 'FAIL: cross-tenant leak — Org A saw Org B asset';
  END IF;
  IF total < 1 THEN
    RAISE EXCEPTION 'FAIL: Org A cannot see its own asset (GUC/RLS misconfigured)';
  END IF;
  RAISE NOTICE 'OK: RLS isolates tenants (Org A sees % asset(s), 0 from Org B)', total;
END $$;
RESET ROLE;

-- 3) pre-auth SECURITY DEFINER functions exist --------------------------------
DO $$
BEGIN
  IF to_regprocedure('public.api_key_by_hash(text)') IS NULL THEN
    RAISE EXCEPTION 'FAIL: api_key_by_hash(text) missing';
  END IF;
  IF to_regprocedure('public.org_ids_for_user(uuid)') IS NULL THEN
    RAISE EXCEPTION 'FAIL: org_ids_for_user(uuid) missing';
  END IF;
  RAISE NOTICE 'OK: pre-auth SECURITY DEFINER functions present';
END $$;

\echo 'verify.sql: all security invariants passed'
