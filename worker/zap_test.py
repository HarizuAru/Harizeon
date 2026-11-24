"""Tests for the ZAP REST flow (fake fetch, no sockets)."""

import json
import unittest

import zap


ALERTS = {
    "alerts": [
        {
            "pluginid": "40012",
            "name": "Cross Site Scripting (Reflected)",
            "riskcode": "3",
            "cweid": "79",
            "url": "http://victim.test/search",
            "description": "<p>XSS possible.</p>",
            "solution": "<p>Encode output.</p>",
            "evidence": "<script>alert(1)</script>",
        },
        {
            "pluginid": "10036",
            "name": "Server Leaks Version",
            "riskcode": "1",
            "cweid": "200",
            "url": "http://victim.test/",
            "description": "Server header leaks.",
            "solution": "Hide headers.",
            "evidence": "",
        },
        {
            "pluginid": "10036",
            "name": "Server Leaks Version",
            "riskcode": "1",
            "cweid": "200",
            "url": "http://victim.test/",
            "description": "duplicate alert",
            "solution": "",
            "evidence": "",
        },
        {
            "pluginid": "99999",
            "name": "Other site alert",
            "riskcode": "2",
            "url": "http://elsewhere.test/",
            "description": "must be filtered out",
            "solution": "",
            "evidence": "",
        },
    ]
}


class MapAlertsTests(unittest.TestCase):
    def test_severity_cwe_html_stripping_dedup_and_host_filter(self):
        findings = zap.map_alerts(ALERTS["alerts"], "http://victim.test/")
        # 4 raw alerts -> 1 filtered (other host) + 1 duplicate removed = 2
        self.assertEqual(len(findings), 2)

        xss = findings[0]
        self.assertEqual(xss["severity"], "high")
        self.assertEqual(xss["check_id"], "zap.40012")
        self.assertEqual(xss["cwe_id"], "CWE-79")
        self.assertEqual(xss["location"], "http://victim.test/search")
        self.assertNotIn("<", xss["description"])
        self.assertEqual(xss["remediation"], "Encode output.")
        self.assertIn("alert(1)", xss["evidence"])

        leak = findings[1]
        self.assertEqual(leak["severity"], "low")
        self.assertEqual(leak["cwe_id"], "CWE-200")

    def test_unknown_risk_maps_to_info_and_zero_cwe_omitted(self):
        alert = {
            "pluginid": "1",
            "name": "Odd",
            "riskcode": "99",
            "cweid": "0",
            "url": "http://victim.test/",
            "description": "",
            "solution": "",
            "evidence": "",
        }
        finding = zap.map_alerts([alert], "http://victim.test/")[0]
        self.assertEqual(finding["severity"], "info")
        self.assertNotIn("cwe_id", finding)
        self.assertNotIn("description", finding)


class ScanFlowTests(unittest.TestCase):
    def _fetch(self, script):
        def fetch(url, timeout):
            for needle, payload in script:
                if needle in url:
                    if callable(payload):
                        return payload(url)
                    return payload
            raise AssertionError("unexpected url: %s" % url)

        return fetch

    def test_happy_path_spider_then_alerts(self):
        fetch = self._fetch(
            [
                ("/JSON/spider/action/scan", '{"scan": "7"}'),
                ("/JSON/spider/view/status", '{"status": "100"}'),
                ("/JSON/alert/view/alerts", json.dumps(ALERTS)),
            ]
        )
        findings = zap.scan(
            "http://victim.test/",
            base="http://zap:8080",
            fetch_fn=fetch,
            sleep_fn=lambda s: None,
        )
        self.assertEqual(len(findings), 2)

    def test_polls_until_done(self):
        calls = {"status": 0}

        def status_payload(url):
            calls["status"] += 1
            return json.dumps({"status": "50" if calls["status"] < 3 else "100"})

        fetch = self._fetch(
            [
                ("/JSON/spider/action/scan", '{"scan": "1"}'),
                ("/JSON/spider/view/status", status_payload),
                ("/JSON/alert/view/alerts", json.dumps({"alerts": []})),
            ]
        )
        findings = zap.scan(
            "http://victim.test/",
            base="http://zap:8080",
            fetch_fn=fetch,
            sleep_fn=lambda s: None,
        )
        self.assertEqual(findings, [])
        self.assertEqual(calls["status"], 3)

    def test_deadline_raises(self):
        fetch = self._fetch(
            [
                ("/JSON/spider/action/scan", '{"scan": "1"}'),
                ("/JSON/spider/view/status", '{"status": "50"}'),
            ]
        )
        with self.assertRaises(RuntimeError):
            zap.scan(
                "http://victim.test/",
                base="http://zap:8080",
                fetch_fn=fetch,
                sleep_fn=lambda s: None,
                deadline=0,
            )

    def test_disabled_without_env(self):
        import os

        old = os.environ.pop("ZAP_URL", None)
        try:
            self.assertFalse(zap.enabled())
            self.assertEqual(
                zap.scan("http://x/", fetch_fn=lambda u, t: (_ for _ in ()).throw(AssertionError)),
                [],
            )
        finally:
            if old is not None:
                os.environ["ZAP_URL"] = old


if __name__ == "__main__":
    unittest.main()
