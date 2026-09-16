-- 0001_init.sql — Harizeon control-plane schema v1 (master plan §07).
-- Standard PostgreSQL 16 features only. Apply with db/migrate.sh.
--
-- Reconciliation notes (deliberate decisions where the plan was ambiguous):
--   * §07 references project_id on scans/schedules/reports but defines no
--     projects table, while §05 mandates an "org + project (workspace)" model.
--     A minimal `projects` table is added here so those FKs are valid.
--   * §07 says id = uuid; §20.1 wants prefixed ULIDs (ast_/scn_/...). We keep
--     uuid PKs (no extra extension) and treat prefixed public IDs as an
--     app-layer presentation concern.
--     ponytail: uuid v4 PKs; swap to prefixed ULID at the API edge if support DX needs it.
--   * Append-only tables (audit_log, scan_events, finding_events, usage_records)
--     carry created_at but no updated_at; audit_log is guarded by a trigger.
--   * scans.trigger (§07) is renamed trigger_source: TRIGGER is a reserved word
--     in PostgreSQL and would need quoting in every query (a footgun the plan
--     explicitly warns against). The API layer still exposes it as "trigger".
--   * RLS is ENABLED (not FORCED) so the owner role used for migrations still
--     works. The application MUST connect as a non-owner role and set the
--     `harizeon.org_id` GUC per request. users/child tables are scoped in the
--     repository layer (users are global; children inherit via parent).

BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE billing_status       AS ENUM ('trialing','active','past_due','suspended','canceled');
CREATE TYPE membership_role      AS ENUM ('owner','admin','member','readonly');
CREATE TYPE actor_type           AS ENUM ('user','api_key','system');
CREATE TYPE asset_type           AS ENUM ('domain','subdomain','ip','url');
CREATE TYPE discovered_by        AS ENUM ('manual','discovery');
CREATE TYPE criticality          AS ENUM ('low','medium','high');
CREATE TYPE verification_method  AS ENUM ('dns_txt','http_file','meta_tag');
CREATE TYPE verification_status  AS ENUM ('pending','verified','failed','revoked');
CREATE TYPE scan_trigger         AS ENUM ('manual','scheduled','api','webhook');
CREATE TYPE scan_profile         AS ENUM ('quick','standard','deep');
CREATE TYPE scan_status          AS ENUM ('queued','claimed','running','completed','failed','timeout','cancelled');
CREATE TYPE scan_phase           AS ENUM ('verify','discover','resolve','probe','inspect','test','normalize','report');
CREATE TYPE event_level          AS ENUM ('info','warn','error');
CREATE TYPE severity             AS ENUM ('info','low','medium','high','critical');
CREATE TYPE finding_status       AS ENUM ('open','acknowledged','fixed','false_positive','accepted');
CREATE TYPE channel_type         AS ENUM ('email','slack','webhook','discord');
CREATE TYPE subscription_status  AS ENUM ('trialing','active','past_due','unpaid','canceled','incomplete');
CREATE TYPE invoice_status       AS ENUM ('draft','open','paid','void','uncollectible');
CREATE TYPE report_type          AS ENUM ('executive','technical','compliance');

-- ---------------------------------------------------------------------------
-- Trigger helpers
-- ---------------------------------------------------------------------------
CREATE FUNCTION harizeon_set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION harizeon_reject_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'table % is append-only: % is not allowed', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- plans (reference data; parent of orgs/subscriptions)
-- ---------------------------------------------------------------------------
CREATE TABLE plans (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text NOT NULL UNIQUE,
  price_myr_month  numeric(12,2) NOT NULL DEFAULT 0,
  limits           jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER plans_set_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION harizeon_set_updated_at();

-- ---------------------------------------------------------------------------
-- orgs
-- ---------------------------------------------------------------------------
CREATE TABLE orgs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  slug            text NOT NULL UNIQUE,
  plan_id         uuid REFERENCES plans(id),
  billing_status  billing_status NOT NULL DEFAULT 'trialing',
  country         text,
  currency        text NOT NULL DEFAULT 'MYR',
  trial_ends_at   timestamptz,
  suspended_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER orgs_set_updated_at BEFORE UPDATE ON orgs
  FOR EACH ROW EXECUTE FUNCTION harizeon_set_updated_at();

-- ---------------------------------------------------------------------------
-- users (global; not org-scoped — membership is via memberships)
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              citext NOT NULL UNIQUE,
  password_hash      text NOT NULL,
  name               text,
  email_verified_at  timestamptz,
  mfa_secret         text,
  last_login_at      timestamptz,
  locale             text NOT NULL DEFAULT 'en' CHECK (locale IN ('en','ms')),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION harizeon_set_updated_at();

-- ---------------------------------------------------------------------------
-- memberships
-- ---------------------------------------------------------------------------
CREATE TABLE memberships (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        membership_role NOT NULL DEFAULT 'owner',
  invited_by  uuid REFERENCES users(id),
  accepted_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);
CREATE INDEX memberships_user_idx ON memberships (user_id);
CREATE TRIGGER memberships_set_updated_at BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION harizeon_set_updated_at();

-- ---------------------------------------------------------------------------
-- projects (workspace; reconciles §07 project_id references)
-- ---------------------------------------------------------------------------
CREATE TABLE projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name        text NOT NULL,
  slug        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, slug)
);
CREATE TRIGGER projects_set_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION harizeon_set_updated_at();

-- ---------------------------------------------------------------------------
-- api_keys (secret stored hashed only; prefix visible for identification)
-- ---------------------------------------------------------------------------
CREATE TABLE api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name          text NOT NULL,
  prefix        text NOT NULL,
  hash          text NOT NULL,
  scopes        jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_used_at  timestamptz,
  expires_at    timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX api_keys_org_idx ON api_keys (org_id);
CREATE INDEX api_keys_prefix_idx ON api_keys (prefix);
CREATE TRIGGER api_keys_set_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION harizeon_set_updated_at();

-- ---------------------------------------------------------------------------
-- audit_log (append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE audit_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  actor_type   actor_type NOT NULL,
  actor_id     uuid,
  action       text NOT NULL,
  target_type  text,
  target_id    uuid,
  ip           inet,
  user_agent   text,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_org_time_idx ON audit_log (org_id, created_at DESC);
CREATE TRIGGER audit_log_append_only BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION harizeon_reject_mutation();

-- ---------------------------------------------------------------------------
-- assets
-- ---------------------------------------------------------------------------
CREATE TABLE assets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  type             asset_type NOT NULL,
  value            text NOT NULL,
  parent_asset_id  uuid REFERENCES assets(id) ON DELETE CASCADE,
  discovered_by    discovered_by NOT NULL DEFAULT 'manual',
  first_seen_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at     timestamptz NOT NULL DEFAULT now(),
  is_active        boolean NOT NULL DEFAULT true,
  tags             jsonb NOT NULL DEFAULT '[]'::jsonb,
  criticality      criticality NOT NULL DEFAULT 'medium',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, type, value)
);
CREATE INDEX assets_org_active_idx ON assets (org_id, is_active);
CREATE INDEX assets_org_type_idx ON assets (org_id, type);
CREATE INDEX assets_parent_idx ON assets (parent_asset_id);
CREATE TRIGGER assets_set_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION harizeon_set_updated_at();

-- ---------------------------------------------------------------------------
-- asset_verifications
-- ---------------------------------------------------------------------------
CREATE TABLE asset_verifications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  asset_id         uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  method           verification_method NOT NULL,
  token            text NOT NULL,
  verified_at      timestamptz,
  last_checked_at  timestamptz,
  status           verification_status NOT NULL DEFAULT 'pending',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX asset_verifications_asset_idx ON asset_verifications (org_id, asset_id);
CREATE TRIGGER asset_verifications_set_updated_at BEFORE UPDATE ON asset_verifications
  FOR EACH ROW EXECUTE FUNCTION harizeon_set_updated_at();

-- ---------------------------------------------------------------------------
-- scans
-- ---------------------------------------------------------------------------
CREATE TABLE scans (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  project_id       uuid REFERENCES projects(id) ON DELETE CASCADE,
  trigger_source   scan_trigger NOT NULL,
  profile          scan_profile NOT NULL DEFAULT 'standard',
  status           scan_status NOT NULL DEFAULT 'queued',
  phase            scan_phase,
  progress_pct     smallint NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  started_at       timestamptz,
  finished_at      timestamptz,
  error_code       text,
  requested_by     uuid,
  engine_versions  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX scans_org_status_idx ON scans (org_id, status);
CREATE INDEX scans_org_time_idx ON scans (org_id, created_at DESC);
CREATE TRIGGER scans_set_updated_at BEFORE UPDATE ON scans
  FOR EACH ROW EXECUTE FUNCTION harizeon_set_updated_at();

-- ---------------------------------------------------------------------------
-- scan_targets (child of scans)
-- ---------------------------------------------------------------------------
CREATE TABLE scan_targets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id         uuid NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  asset_id        uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  status          scan_status NOT NULL DEFAULT 'queued',
  result_summary  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX scan_targets_scan_idx ON scan_targets (scan_id);
CREATE TRIGGER scan_targets_set_updated_at BEFORE UPDATE ON scan_targets
  FOR EACH ROW EXECUTE FUNCTION harizeon_set_updated_at();

-- ---------------------------------------------------------------------------
-- scan_events (the timeline / progress source of truth; append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE scan_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id     uuid NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  phase       scan_phase,
  level       event_level NOT NULL DEFAULT 'info',
  message     text NOT NULL,
  at          timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX scan_events_scan_time_idx ON scan_events (scan_id, at);

-- ---------------------------------------------------------------------------
-- findings
-- ---------------------------------------------------------------------------
CREATE TABLE findings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  asset_id       uuid REFERENCES assets(id) ON DELETE CASCADE,
  scan_id        uuid REFERENCES scans(id) ON DELETE SET NULL,
  fingerprint    text NOT NULL,
  title          text NOT NULL,
  description    text,
  severity       severity NOT NULL,
  cvss_score     numeric(3,1) CHECK (cvss_score IS NULL OR (cvss_score >= 0 AND cvss_score <= 10)),
  cve_ids        text[] NOT NULL DEFAULT '{}',
  cwe_id         text,
  category       text,
  evidence_ref   text,
  remediation    text,
  status         finding_status NOT NULL DEFAULT 'open',
  status_reason  text,
  first_seen_at  timestamptz NOT NULL DEFAULT now(),
  last_seen_at   timestamptz NOT NULL DEFAULT now(),
  resolved_at    timestamptz,
  assigned_to    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, fingerprint)
);
CREATE INDEX findings_org_status_sev_idx ON findings (org_id, status, severity);
CREATE INDEX findings_org_asset_idx ON findings (org_id, asset_id);
CREATE TRIGGER findings_set_updated_at BEFORE UPDATE ON findings
  FOR EACH ROW EXECUTE FUNCTION harizeon_set_updated_at();

-- ---------------------------------------------------------------------------
-- finding_events (append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE finding_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id   uuid NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  actor_id     uuid,
  from_status  finding_status,
  to_status    finding_status NOT NULL,
  note         text,
  at           timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX finding_events_finding_time_idx ON finding_events (finding_id, at);

-- ---------------------------------------------------------------------------
-- notification_channels (config secrets encrypted at rest by the app layer)
-- ---------------------------------------------------------------------------
CREATE TABLE notification_channels (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  type         channel_type NOT NULL,
  config       jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled      boolean NOT NULL DEFAULT true,
  min_severity severity NOT NULL DEFAULT 'high',
  verified_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notification_channels_org_idx ON notification_channels (org_id);
CREATE TRIGGER notification_channels_set_updated_at BEFORE UPDATE ON notification_channels
  FOR EACH ROW EXECUTE FUNCTION harizeon_set_updated_at();

-- ---------------------------------------------------------------------------
-- schedules
-- ---------------------------------------------------------------------------
CREATE TABLE schedules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  project_id   uuid REFERENCES projects(id) ON DELETE CASCADE,
  cron         text NOT NULL,
  profile      scan_profile NOT NULL DEFAULT 'standard',
  timezone     text NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
  next_run_at  timestamptz,
  enabled      boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX schedules_org_idx ON schedules (org_id);
CREATE INDEX schedules_due_idx ON schedules (next_run_at) WHERE enabled;
CREATE TRIGGER schedules_set_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION harizeon_set_updated_at();

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
CREATE TABLE subscriptions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  plan_id              uuid REFERENCES plans(id),
  provider             text NOT NULL,
  provider_ref         text,
  status               subscription_status NOT NULL,
  current_period_end   timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_org_idx ON subscriptions (org_id);
CREATE TRIGGER subscriptions_set_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION harizeon_set_updated_at();

-- ---------------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------------
CREATE TABLE invoices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  number        text NOT NULL,
  period_start  timestamptz,
  period_end    timestamptz,
  subtotal      numeric(12,2) NOT NULL DEFAULT 0,
  tax           numeric(12,2) NOT NULL DEFAULT 0,
  total         numeric(12,2) NOT NULL DEFAULT 0,
  currency      text NOT NULL DEFAULT 'MYR',
  status        invoice_status NOT NULL,
  pdf_ref       text,
  paid_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, number)
);
CREATE TRIGGER invoices_set_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION harizeon_set_updated_at();

-- ---------------------------------------------------------------------------
-- usage_records (metering; invoice_id set when billed)
-- ---------------------------------------------------------------------------
CREATE TABLE usage_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  metric      text NOT NULL,
  quantity    numeric(14,3) NOT NULL DEFAULT 0,
  unit_cost   numeric(14,4) NOT NULL DEFAULT 0,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  invoice_id  uuid REFERENCES invoices(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX usage_records_org_time_idx ON usage_records (org_id, occurred_at);
CREATE INDEX usage_records_invoice_idx ON usage_records (invoice_id);
CREATE TRIGGER usage_records_set_updated_at BEFORE UPDATE ON usage_records
  FOR EACH ROW EXECUTE FUNCTION harizeon_set_updated_at();

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
CREATE TABLE reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  project_id    uuid REFERENCES projects(id) ON DELETE CASCADE,
  type          report_type NOT NULL,
  generated_at  timestamptz NOT NULL DEFAULT now(),
  period_start  timestamptz,
  period_end    timestamptz,
  file_ref      text,
  generated_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reports_org_idx ON reports (org_id);
CREATE TRIGGER reports_set_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION harizeon_set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security (second net; owner role bypasses — see header note)
-- ---------------------------------------------------------------------------
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON orgs
  USING (id = current_setting('harizeon.org_id', true)::uuid)
  WITH CHECK (id = current_setting('harizeon.org_id', true)::uuid);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'memberships','projects','api_keys','audit_log','assets','asset_verifications',
    'scans','findings','notification_channels','schedules','subscriptions',
    'invoices','usage_records','reports'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (org_id = current_setting(''harizeon.org_id'', true)::uuid) '
      'WITH CHECK (org_id = current_setting(''harizeon.org_id'', true)::uuid)', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Reference data: plans (§13.2). -1 = unlimited.
-- ---------------------------------------------------------------------------
INSERT INTO plans (code, price_myr_month, limits) VALUES
  ('free',       0,   '{"max_assets":1,"scans_per_month":1,"profiles":["quick"],"retention_days":14,"seats":1,"pdf_reports":false,"api":false,"schedule":"monthly"}'::jsonb),
  ('starter',    79,  '{"max_assets":5,"scans_per_month":50,"profiles":["quick","standard"],"retention_days":90,"seats":1,"pdf_reports":true,"api":false,"schedule":"weekly"}'::jsonb),
  ('growth',     249, '{"max_assets":25,"scans_per_month":500,"profiles":["quick","standard","deep"],"retention_days":365,"seats":3,"pdf_reports":true,"api":true,"schedule":"daily"}'::jsonb),
  ('scale',      799, '{"max_assets":100,"scans_per_month":-1,"profiles":["quick","standard","deep"],"retention_days":730,"seats":10,"pdf_reports":true,"api":true,"schedule":"daily"}'::jsonb),
  ('enterprise', 0,   '{"max_assets":-1,"scans_per_month":-1,"profiles":["quick","standard","deep"],"retention_days":-1,"seats":-1,"pdf_reports":true,"api":true,"schedule":"daily"}'::jsonb);

COMMIT;
