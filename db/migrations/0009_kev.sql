-- 0009: CISA KEV flag on findings (worker enrichment, §06.3).
--
-- The worker marks a finding `known_exploited` when its CVE appears on CISA's
-- Known Exploited Vulnerabilities list. Rendered as a chip on the finding
-- detail page. The worker never touches this column; it rides the findings
-- queue event and the ingest layer persists it.

ALTER TABLE findings ADD COLUMN known_exploited boolean NOT NULL DEFAULT false;
