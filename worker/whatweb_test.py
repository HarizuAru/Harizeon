"""Tests for WhatWeb log-json parsing."""

import json
import unittest

import whatweb


ARRAY = json.dumps(
    [
        {
            "target": "http://example.com",
            "plugins": {
                "HTTPServer": {"string": ["Apache/2.4.57 (Debian)"], "version": ["2.4.57"]},
                "PHP": {"version": ["7.4.33"]},
                "Country": {"string": ["UNITED STATES"]},
                "IP": {"string": ["93.184.216.34"]},
                "X-Powered-By": {"string": ["PHP/7.4.33"]},
            },
        }
    ]
)


class ParseTests(unittest.TestCase):
    def test_products_with_versions_and_noise_removed(self):
        findings = whatweb.parse(ARRAY, "http://example.com")
        self.assertEqual(len(findings), 1)
        finding = findings[0]
        self.assertEqual(finding["check_id"], "web.fingerprint")
        self.assertEqual(finding["severity"], "info")
        self.assertEqual(finding["location"], "http://example.com")
        self.assertIn("HTTPServer 2.4.57", finding["title"])
        self.assertIn("PHP 7.4.33", finding["title"])
        self.assertNotIn("Country", finding["title"])
        self.assertNotIn("93.184.216.34", finding["title"])
        self.assertEqual(finding["category"], "fingerprint")

    def test_json_lines_fallback(self):
        line = json.dumps({"target": "http://x", "plugins": {"nginx": {"version": ["1.25"]}}})
        findings = whatweb.parse(line + "\n", "http://x")
        self.assertEqual(len(findings), 1)
        self.assertIn("nginx 1.25", findings[0]["title"])

    def test_no_plugins_returns_empty(self):
        self.assertEqual(whatweb.parse(json.dumps([{"target": "http://x"}]), "http://x"), [])
        self.assertEqual(whatweb.parse("", "http://x"), [])

    def test_title_cap_when_many_plugins(self):
        plugins = {"P%d" % i: {"version": ["1.0"]} for i in range(30)}
        findings = whatweb.parse(json.dumps([{"target": "u", "plugins": plugins}]), "u")
        self.assertLessEqual(len(findings[0]["title"]), 200)
        self.assertIn("more)", findings[0]["title"])


class RunTests(unittest.TestCase):
    def test_scan_command(self):
        seen = {}

        def fake_run(cmd, timeout=None, input_text=None):
            seen["cmd"] = cmd
            return ARRAY if isinstance(ARRAY, str) else json.dumps(ARRAY)

        findings = whatweb.scan("http://example.com", run_fn=fake_run)
        self.assertEqual(len(findings), 1)
        self.assertIn("--log-json", seen["cmd"])
        self.assertEqual(seen["cmd"][-1], "http://example.com")


if __name__ == "__main__":
    unittest.main()
