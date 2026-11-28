-- 0016: Restore capability-gated (non-RLS) access on sessions
--
-- Migration 0013 accidentally applied tenant RLS + AS RESTRICTIVE policy to
-- `sessions` because it has a nullable `org_id` column. Per 0002_auth.sql,
-- `sessions` is a pre-auth credential table looked up by opaque token_hash
-- before any org context exists, and had no PERMISSIVE policy, causing all
-- session inserts/lookups to fail closed.

BEGIN;

DROP POLICY IF EXISTS sessions_tenant_restrictive ON public.sessions;
ALTER TABLE public.sessions NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;

COMMIT;
