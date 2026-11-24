"""Tests for the testssl.sh JSON walker and severity mapping."""

import json
import unittest

import testssl


# Shape drifts between testssl releases; the walker must find entries at any depth.
NESTED = json.dumps(
    {
        "scanversion": "3.2",
        "target": "example.com",
        "session": [
            [
                {"id": "sslv3", "severity": "FAIL", "finding": "not offered"},
                {"id": "tls1", "severity": "OK", "finding": "offered"},
                {"id": "robot", "severity": "WARN", "finding": "VULNERABLE"},
                {"id": "cert_validity", "severity": "NOTE", "finding": "expires in 10 days"},
                {"id": "hdr_hsts", "severity": "INFO", "finding": "no HSTS header"},
            ]
        ],
    }
)

FLAT_ARRAY = json.dumps(
    [
        {"id": "heartbleed", "severity": "FAIL", "finding": "VULNERABLE"},
        {"id": "chain", "severity": "OK", "finding": "provided"},
    ]
)


class ParseTests(unittest.TestCase):
    def test_nested_entries_mapped_and_ok_skipped(self):
        findings = testssl.parse(NESTED, location="example.com:443")
        by_id = {f["check_id"]: f for f in findings}
        self.assertNotIn("tls.tls1", by_id)  # OK = passed check, not a finding
        self.assertEqual(by_id["tls.sslv3"]["severity"], "high")
        self.assertEqual(by_id["tls.robot"]["severity"], "medium")
        self.assertEqual(by_id["tls.cert_validity"]["severity"], "low")
        self.assertEqual(by_id["tls.hdr_hsts"]["severity"], "info")
        self.assertEqual(by_id["tls.sslv3"]["location"], "example.com:443")

    def test_flat_array_shape(self):
        findings = testssl.parse(FLAT_ARRAY, location="x:443")
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0]["check_id"], "tls.heartbleed")

    def test_garbage_returns_empty(self):
        self.assertEqual(testssl.parse("", location="x"), [])
        self.assertEqual(testssl.parse("not json at all", location="x"), [])

    def test_cap_limits_flood(self):
        entries = [
            {"id": "e%d" % i, "severity": "WARN", "finding": "x"} for i in range(50)
        ]
        findings = testssl.parse(json.dumps(entries), location="x")
        self.assertEqual(len(findings), testssl.MAX_FINDINGS)


class ScanTests(unittest.TestCase):
    def test_scan_reads_json_file_even_on_nonzero_exit(self):
        def fake_run(cmd, timeout=None, input_text=None):
            self.assertEqual(cmd[0], "testssl.sh")
            self.assertIn("--jsonfile", cmd)
            path = cmd[cmd.index("--jsonfile") + 1]
            # FLAT_ARRAY is already a JSON string; write it verbatim.
            with open(path, "w", encoding="utf-8") as handle:
                handle.write(FLAT_ARRAY)
            return (1, "", "some warnings")  # testssl exits non-zero on findings

        findings = testssl.scan("example.com", run_fn=fake_run, timeout=10)
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0]["location"], "example.com:443")

    def test_missing_file_yields_no_findings(self):
        def fake_run(cmd, timeout=None, input_text=None):
            return (0, "", "")  # wrote nothing

        self.assertEqual(testssl.scan("example.com", run_fn=fake_run), [])


if __name__ == "__main__":
    unittest.main()
