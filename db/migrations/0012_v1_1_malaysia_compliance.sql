-- 0012: Harizeon v1.1 Malaysia Compliance Frameworks (§07 / v1.1 Spec)
--
-- Adds:
-- 1. compliance_controls registry (PDPA Amendment 2024, BNM RMiT, ISO 27001:2022)
-- 2. check_control_mappings linking automated check IDs to regulatory controls
-- 3. Initial baseline seed data for Malaysian regulatory frameworks

CREATE TABLE IF NOT EXISTS compliance_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework text NOT NULL CHECK (framework IN ('pdpa_2024', 'bnm_rmit', 'iso_27001')),
  control_code text NOT NULL,
  control_title text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (framework, control_code)
);

CREATE TABLE IF NOT EXISTS check_control_mappings (
  check_id text NOT NULL,
  control_id uuid NOT NULL REFERENCES compliance_controls(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (check_id, control_id)
);

-- Seed Malaysia-Native Regulatory Controls
INSERT INTO compliance_controls (framework, control_code, control_title, description) VALUES
  ('pdpa_2024', 'PDPA-S9', 'Security Principle (Section 9)', 'Take practical steps to protect personal data from loss, misuse, modification, or unauthorized disclosure.'),
  ('pdpa_2024', 'PDPA-BREACH', 'Mandatory Data Breach Prevention', 'Prevent exposed credentials, databases, and unencrypted transmission that trigger mandatory breach reporting.'),
  ('bnm_rmit', 'RMiT-10.39', 'System & Perimeter Hardening', 'Enforce secure configurations, strong TLS protocols, and disable unnecessary public services/ports.'),
  ('bnm_rmit', 'RMiT-10.56', 'Continuous Vulnerability & Attack Surface Monitoring', 'Perform regular discovery and automated external vulnerability checks with timely remediation tracking.'),
  ('iso_27001', 'A.8.9', 'Configuration Management', 'Establish, document, implement, monitor, and review security configurations across web and cloud endpoints.'),
  ('iso_27001', 'A.8.24', 'Use of Cryptography', 'Enforce valid, non-expired certificates and modern TLS 1.2/1.3 cipher suites for data in transit.')
ON CONFLICT (framework, control_code) DO NOTHING;

-- Map v1.1 Automated Checks to Regulatory Controls
INSERT INTO check_control_mappings (check_id, control_id)
SELECT m.check_id, c.id
FROM (VALUES
  ('nuclei:exposed-dotenv-file', 'pdpa_2024', 'PDPA-S9'),
  ('nuclei:exposed-dotenv-file', 'pdpa_2024', 'PDPA-BREACH'),
  ('nuclei:exposed-dotenv-file', 'bnm_rmit', 'RMiT-10.39'),
  ('nuclei:exposed-dotenv-file', 'iso_27001', 'A.8.9'),
  ('nuclei:exposed-git-config', 'pdpa_2024', 'PDPA-S9'),
  ('nuclei:exposed-git-config', 'bnm_rmit', 'RMiT-10.39'),
  ('nuclei:exposed-llm-inference-daemon', 'pdpa_2024', 'PDPA-BREACH'),
  ('nuclei:exposed-llm-inference-daemon', 'bnm_rmit', 'RMiT-10.39'),
  ('http-no-tls-redirect', 'pdpa_2024', 'PDPA-S9'),
  ('http-no-tls-redirect', 'iso_27001', 'A.8.24'),
  ('tls-cert-expired', 'bnm_rmit', 'RMiT-10.39'),
  ('tls-cert-expired', 'iso_27001', 'A.8.24'),
  ('tls-deprecated-protocol', 'bnm_rmit', 'RMiT-10.39'),
  ('tls-deprecated-protocol', 'iso_27001', 'A.8.24'),
  ('dns-dangling-cname-takeover', 'bnm_rmit', 'RMiT-10.56'),
  ('email-missing-dmarc', 'pdpa_2024', 'PDPA-S9')
) AS m(check_id, framework, control_code)
JOIN compliance_controls c
  ON c.framework = m.framework AND c.control_code = m.control_code
ON CONFLICT DO NOTHING;
