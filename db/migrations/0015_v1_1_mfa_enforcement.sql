-- 0015: Add TOTP MFA enablement flag on users and org-wide MFA enforcement policy (ENT-01).

BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS mfa_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.orgs
  ADD COLUMN IF NOT EXISTS enforce_mfa boolean NOT NULL DEFAULT false;

COMMIT;
