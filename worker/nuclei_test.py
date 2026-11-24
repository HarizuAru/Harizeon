"""Tests for the Nuclei JSONL mapping (no process, no network)."""

import unittest

import nuclei


JSONL = "\n".join(
    [
        '{"template-id": "cve-2014-0160-heartbleed", "name": "Heartbleed", '
        '"severity": "critical", "matched-at": "https://example.com:443", '
        '"cve-id": ["CVE-2014-0160"], "cwe-id": ["CWE-119"], '
        '"description": "TLS heartbeat overread.", "remediation": "Upgrade OpenSSL.", '
        '"reference": ["https://example.org/advisory"]}',
        '{"template-id": "tech-detect", "name": "Wappalyzer", "severity": "info", '
        '"matched-at": "https://example.com"}',
        '{"template-id": "cve-2014-0160-heartbleed", "name": "Heartbleed", '
        '"severity": "critical", "matched-at": "https://example.com:443"}',
        '{"template-id": "weird", "name": "Weird", "severity": "banana", '
        '"matched-at": "https://example.com"}',
    ]
)


class ParseTests(unittest.TestCase):
    def test_maps_fields_and_dedupes(self):
        findings = nuclei.parse_jsonl(JSONL)
        self.assertEqual(len(findings), 3)  # duplicate (template, matched-at) dropped

        heartbleed = findings[0]
        self.assertEqual(heartbleed["check_id"], "nuclei.cve-2014-0160-heartbleed")
        self.assertEqual(heartbleed["severity"], "critical")
        self.assertEqual(heartbleed["location"], "https://example.com:443")
        self.assertEqual(heartbleed["cve_ids"], ["CVE-2014-0160"])
        self.assertEqual(heartbleed["cwe_id"], "CWE-119")
        self.assertEqual(heartbleed["remediation"], "Upgrade OpenSSL.")
        self.assertIn("example.org/advisory", heartbleed["evidence"])

    def test_unknown_severity_becomes_info(self):
        findings = nuclei.parse_jsonl(JSONL)
        weird = [f for f in findings if f["check_id"] == "nuclei.weird"][0]
        self.assertEqual(weird["severity"], "info")

    def test_cve_pattern_filter_and_cap(self):
        row = (
            '{"template-id": "t", "name": "N", "severity": "high", '
            '"matched-at": "https://x", "cve-id": ["CVE-2014-0160", "not-a-cve", '
            '"CVE-2021-41773"]}'
        )
        findings = nuclei.parse_jsonl(row)
        self.assertEqual(findings[0]["cve_ids"], ["CVE-2014-0160", "CVE-2021-41773"])

    def test_ingest_caps_are_respected(self):
        row = (
            '{"template-id": "t", "name": "%s", "severity": "high", '
            '"matched-at": "%s", "description": "%s"}'
            % ("T" * 400, "L" * 500, "D" * 3000)
        )
        finding = nuclei.parse_jsonl(row)[0]
        self.assertLessEqual(len(finding["title"]), 200)
        self.assertLessEqual(len(finding["location"]), 300)
        self.assertLessEqual(len(finding["description"]), 2000)

    def test_empty_input(self):
        self.assertEqual(nuclei.parse_jsonl(""), [])


class RunTests(unittest.TestCase):
    def test_scan_url_builds_bounded_command(self):
        seen = {}

        def fake_run(cmd, timeout=None, input_text=None):
            seen["cmd"] = cmd
            seen["timeout"] = timeout
            return JSONL

        findings = nuclei.scan_url("https://example.com", run_fn=fake_run, timeout=99)
        self.assertEqual(len(findings), 3)
        self.assertEqual(seen["cmd"][0], "nuclei")
        self.assertIn("https://example.com", seen["cmd"])
        self.assertIn("-severity", seen["cmd"])
        self.assertEqual(seen["timeout"], 99)


if __name__ == "__main__":
    unittest.main()
