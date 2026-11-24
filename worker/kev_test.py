"""Tests for CISA KEV / OSV enrichment. No network: fetch_fn is always fake."""

import json
import os
import tempfile
import unittest

import kev


KEV_DOC = {
    "catalogVersion": "2026.1",
    "vulnerabilities": [
        {"cveID": "CVE-2014-0160", "dateAdded": "2021-11-03", "vendorProject": "OpenSSL"},
        {"cveID": "CVE-2021-41773", "dateAdded": "2021-11-03"},
    ],
}

OSV_HEARTBLEED = {
    "id": "CVE-2014-0160",
    "aliases": ["GHSA-xxxx"],
    "affected": [{"ranges": [{"type": "GIT", "events": [{"introduced": "0"}, {"fixed": "1.0.1f"}]}]}],
}


class LoadKevTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="hz-kev-test-")
        self.path = os.path.join(self.tmp, "kev.json")

    def test_fetches_when_no_cache_and_writes_file(self):
        def fetch(url, timeout):
            self.assertIn("cisa.gov", url)
            return json.dumps(KEV_DOC)

        vm = kev.load_kev(path=self.path, fetch_fn=fetch, now_fn=lambda: 1000.0)
        self.assertIn("CVE-2014-0160", vm)
        self.assertTrue(os.path.exists(self.path))

    def test_fresh_cache_skips_fetch(self):
        with open(self.path, "w", encoding="utf-8") as handle:
            json.dump(KEV_DOC, handle)
        os.utime(self.path, (990.0, 990.0))

        def fetch(url, timeout):
            raise AssertionError("must not fetch when cache is fresh")

        vm = kev.load_kev(path=self.path, fetch_fn=fetch, now_fn=lambda: 1000.0)
        self.assertIn("CVE-2021-41773", vm)

    def test_offline_falls_back_to_stale_cache(self):
        with open(self.path, "w", encoding="utf-8") as handle:
            json.dump(KEV_DOC, handle)
        os.utime(self.path, (0.0, 0.0))  # ancient -> stale

        def fetch(url, timeout):
            raise OSError("offline")

        vm = kev.load_kev(
            path=self.path, fetch_fn=fetch, now_fn=lambda: 10_000_000.0, max_age=1
        )
        self.assertIn("CVE-2014-0160", vm)

    def test_everything_down_and_no_cache_returns_empty(self):
        def fetch(url, timeout):
            raise OSError("offline")

        vm = kev.load_kev(path=os.path.join(self.tmp, "missing.json"), fetch_fn=fetch)
        self.assertEqual(vm, {})


class EnrichTests(unittest.TestCase):
    def setUp(self):
        kev._OSV_CACHE.clear()

    def test_kev_hit_sets_known_exploited_and_appends_note(self):
        def fetch(url, timeout):
            if "api.osv.dev" in url:
                return "{}"
            raise AssertionError("unexpected fetch: %s" % url)

        finding = {
            "cve_ids": ["CVE-2014-0160"],
            "description": "Heartbleed.",
        }
        result = kev.enrich(
            [finding],
            fetch_fn=fetch,
            kev_map={"CVE-2014-0160": KEV_DOC["vulnerabilities"][0]},
        )
        self.assertTrue(result[0]["known_exploited"])
        self.assertIn("known exploited in the wild", result[0]["description"])
        self.assertIn("2021-11-03", result[0]["description"])

    def test_non_kev_finding_untouched(self):
        def fetch(url, timeout):
            if "api.osv.dev" in url:
                return "{}"
            raise AssertionError("unexpected fetch: %s" % url)

        finding = {"cve_ids": ["CVE-9999-99999"], "description": "x"}
        result = kev.enrich(
            [finding],
            fetch_fn=fetch,
            kev_map={"CVE-2014-0160": KEV_DOC["vulnerabilities"][0]},
        )
        self.assertNotIn("known_exploited", result[0])
        self.assertEqual(result[0]["description"], "x")

    def test_findings_without_cves_skip_osv(self):
        def fetch(url, timeout):
            raise AssertionError("no CVEs -> no OSV call")

        finding = {"title": "no cve here"}
        self.assertEqual(kev.enrich([finding], fetch_fn=fetch), [finding])

    def test_osv_fixed_version_appended_to_remediation(self):
        def fetch(url, timeout):
            self.assertIn("api.osv.dev", url)
            return json.dumps(OSV_HEARTBLEED)

        finding = {"cve_ids": ["CVE-2014-0160"], "remediation": "Patch OpenSSL."}
        kev.enrich([finding], fetch_fn=fetch, kev_map={})
        self.assertIn("Upstream fix available: 1.0.1f (CVE-2014-0160)", finding["remediation"])
        self.assertIn("Patch OpenSSL.", finding["remediation"])

    def test_never_raises_when_intel_fails(self):
        def fetch(url, timeout):
            raise RuntimeError("everything is down")

        finding = {"cve_ids": ["CVE-2014-0160"], "description": "x"}
        result = kev.enrich([finding], fetch_fn=fetch)
        self.assertEqual(result, [finding])
        self.assertNotIn("known_exploited", result[0])

    def test_empty_input(self):
        self.assertEqual(kev.enrich([]), [])

    def test_cve_pattern_filter(self):
        finding = {"cve_ids": ["cve-2014-0160", "not-a-cve"]}
        self.assertEqual(kev.extract_cves(finding), ["CVE-2014-0160"])


if __name__ == "__main__":
    unittest.main()
