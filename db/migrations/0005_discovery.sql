-- 0005_discovery.sql — W05 passive discovery (auto-created subdomains).
-- Run after 0004_scan_queue.sql.

BEGIN;

-- A discovered subdomain is created out of scope (is_active = false) and shown in
-- the DISCOVERED tab for review: "add to scope" flips is_active, "ignore" sets
-- ignored_at so it drops off the review queue without being deleted (and without
-- conflating "ignored" with "pending").
ALTER TABLE assets ADD COLUMN ignored_at timestamptz;

-- Fast lookup of a domain's discovered children (the DISCOVERED tab).
CREATE INDEX assets_discovered_idx ON assets (org_id, parent_asset_id)
  WHERE discovered_by = 'discovery';

COMMIT;
