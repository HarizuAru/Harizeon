#!/bin/sh
# Creates the non-owner role `harizeon_app` with least-privilege grants.
# RLS is ENABLED in the migrations; because harizeon_app is NOT the table owner,
# it is subject to RLS automatically. The owner role used for migrations/seeds
# bypasses RLS. Run ONCE after migrations are applied, during infra provisioning.
# The password comes from the environment — NEVER commit it.
#
# Usage:
#   DATABASE_URL=postgresql://owner:...@host/db \
#   HARIZEON_APP_PASSWORD='<strong secret>' \
#   sh infra/db/create-app-role.sh
#
# Note: the password is passed to psql via -v and appears in the process list
# briefly; on a hardened host, prefer reading it from a secret store.
set -eu

: "${DATABASE_URL:?DATABASE_URL must be set}"
: "${HARIZEON_APP_PASSWORD:?HARIZEON_APP_PASSWORD must be set}"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -v pw="$HARIZEON_APP_PASSWORD" <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'harizeon_app') THEN
    CREATE ROLE harizeon_app LOGIN;
  END IF;
END $$;

ALTER ROLE harizeon_app PASSWORD :'pw';

GRANT USAGE ON SCHEMA public TO harizeon_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO harizeon_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO harizeon_app;

-- Pre-auth credential lookups (SECURITY DEFINER; bypass org-RLS for the auth
-- hook only, which runs before any org context exists).
GRANT EXECUTE ON FUNCTION api_key_by_hash(text) TO harizeon_app;
-- Pre-auth org resolution at login (bypasses memberships org-RLS).
GRANT EXECUTE ON FUNCTION org_ids_for_user(uuid) TO harizeon_app;
-- System-level re-verification lookup for the background recheck pass.
GRANT EXECUTE ON FUNCTION verifications_due_for_recheck(timestamptz) TO harizeon_app;
-- System-level stale-scan lookup for the job-pipeline reaper.
GRANT EXECUTE ON FUNCTION scans_stale(timestamptz) TO harizeon_app;
-- System-level due-schedule lookup for the W09 scheduler.
GRANT EXECUTE ON FUNCTION schedules_due(timestamptz) TO harizeon_app;

-- Future tables/sequences created by the owner also grant to the app role.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO harizeon_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO harizeon_app;

-- NOTE: RLS is ENABLED but deliberately NOT FORCED. A non-owner role such as
-- harizeon_app is subject to RLS automatically; FORCE would also subject the
-- owner role and break migrations/seeds in production (where owner != superuser).
SQL

echo "harizeon_app role ready (non-owner; RLS applies automatically)"
