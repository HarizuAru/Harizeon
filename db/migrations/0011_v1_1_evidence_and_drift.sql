-- 0011: Harizeon v1.1 Evidence, Asset Snapshots & Attack Surface Drift (§07 / v1.1 Spec)
--
-- Adds:
-- 1. Detailed evidence and stack remediation snippets on findings
-- 2. EPSS scoring and CISA KEV exploit fields
-- 3. Immutable asset_snapshots for tracking infrastructure delta across scans
-- 4. Audit-grade drift_events table with tenant RLS isolation
-- 5. Opt-in public trust badge configuration on organizations

-- 1. Enrich findings table with redacted evidence, source tool, snippets, check_id, and location
ALTER TABLE findings
  ADD COLUMN IF NOT EXISTS check_id text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS source_tool text NOT NULL DEFAULT 'harizeon',
  ADD COLUMN IF NOT EXISTS evidence text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS remediation_snippets jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS epss_score numeric(5,4),
  ADD COLUMN IF NOT EXISTS epss_percentile numeric(5,4),
  ADD COLUMN IF NOT EXISTS is_kev boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;

-- 2. Immutable asset snapshots for continuous attack surface drift
CREATE TABLE IF NOT EXISTS asset_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  scan_id uuid NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  hosts jsonb NOT NULL DEFAULT '[]'::jsonb,
  live_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  open_ports jsonb NOT NULL DEFAULT '{}'::jsonb,
  tech_stack jsonb NOT NULL DEFAULT '{}'::jsonb,
  tls_expiry_iso jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_snapshots_asset_time
  ON asset_snapshots (org_id, asset_id, created_at DESC);

ALTER TABLE asset_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY asset_snapshots_org_isolation ON asset_snapshots
  FOR ALL
  USING (org_id = current_setting('harizeon.org_id', true)::uuid)
  WITH CHECK (org_id = current_setting('harizeon.org_id', true)::uuid);

-- 3. Attack Surface Drift Events table
CREATE TABLE IF NOT EXISTS drift_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  scan_id uuid NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'NEW_SUBDOMAIN_DETECTED',
    'NEW_PORT_EXPOSED',
    'TLS_CERT_EXPIRING_SOON',
    'FINDING_INTRODUCED',
    'FINDING_REGRESSED',
    'FINDING_RESOLVED'
  )),
  severity text NOT NULL DEFAULT 'info',
  summary text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drift_events_org_time
  ON drift_events (org_id, created_at DESC);

ALTER TABLE drift_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY drift_events_org_isolation ON drift_events
  FOR ALL
  USING (org_id = current_setting('harizeon.org_id', true)::uuid)
  WITH CHECK (org_id = current_setting('harizeon.org_id', true)::uuid);

-- 4. Opt-in Public Trust Badge toggle on orgs
ALTER TABLE orgs
  ADD COLUMN IF NOT EXISTS public_trust_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS posture_score integer NOT NULL DEFAULT 100;
