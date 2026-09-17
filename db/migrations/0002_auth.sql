-- 0002_auth.sql — Auth tables (sessions, user_tokens) + pre-auth credential
-- lookup, for W02 IAM. Run after 0001_init.sql. Idempotent within a migration
-- run (tracked by schema_migrations).
--
-- RLS decision (important): `sessions` and `user_tokens` are CREDENTIAL tables
-- looked up by an unguessable token hash BEFORE any org context exists (login,
-- email verify, password reset all run unauthenticated). Org-scoped RLS on them
-- would make those lookups return zero rows and break auth. They are therefore
-- NOT org-scoped; access is capability-gated by the secret hash. `api_keys`
-- stays org-scoped for management (list/create/revoke), but the pre-auth
-- authentication lookup goes through a SECURITY DEFINER function below.

BEGIN;

-- ---------------------------------------------------------------------------
-- sessions (opaque token stored as sha256 hash; token shown only at creation)
-- ---------------------------------------------------------------------------
CREATE TABLE sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id        uuid REFERENCES orgs(id) ON DELETE SET NULL,
  token_hash    text NOT NULL UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL,
  revoked_at    timestamptz,
  user_agent    text,
  ip            inet,
  rotated_from  uuid REFERENCES sessions(id)
);
CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_active_idx ON sessions (expires_at) WHERE revoked_at IS NULL;

-- ---------------------------------------------------------------------------
-- user_tokens (email_verify / password_reset); consumed once
-- ---------------------------------------------------------------------------
CREATE TYPE user_token_kind AS ENUM ('email_verify','password_reset');

CREATE TABLE user_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind         user_token_kind NOT NULL,
  token_hash   text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  consumed_at  timestamptz
);
CREATE INDEX user_tokens_lookup_idx ON user_tokens (token_hash, kind) WHERE consumed_at IS NULL;
CREATE INDEX user_tokens_user_idx ON user_tokens (user_id);

-- ---------------------------------------------------------------------------
-- Pre-auth API-key lookup: bypasses api_keys org-RLS for the auth hook only.
-- SECURITY DEFINER runs as the (owner) role that created it; search_path is
-- pinned to avoid hijacking. EXECUTE is revoked from PUBLIC — granted to the
-- app role by infra/db/create-app-role.sh.
-- ---------------------------------------------------------------------------
CREATE FUNCTION api_key_by_hash(p_hash text)
RETURNS SETOF api_keys
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT * FROM api_keys
  WHERE hash = p_hash
    AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > now());
$$;

REVOKE ALL ON FUNCTION api_key_by_hash(text) FROM PUBLIC;

-- Pre-auth org resolution: login must find a user's org(s) before any org
-- context exists, but `memberships` is org-scoped (RLS). This SECURITY DEFINER
-- function is the only sanctioned pre-auth read of memberships.
CREATE FUNCTION org_ids_for_user(p_user uuid)
RETURNS TABLE(org_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT m.org_id FROM memberships m WHERE m.user_id = p_user;
$$;

REVOKE ALL ON FUNCTION org_ids_for_user(uuid) FROM PUBLIC;

COMMIT;
