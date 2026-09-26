import os
import unittest

import probe
from probe import (
    EXTENDED_PORTS, COMMON_PORTS, normalise_host, ports_for, port_findings,
    probe_target,
)
import scope
from inspect_ import inspect_headers, inspect_target, inspect_tls


class ScopeTests(unittest.TestCase):
    def test_public_ips(self):
        for ip in ["8.8.8.8", "1.1.1.1", "2606:4700::1111"]:
            self.assertTrue(scope.is_public_ip(ip), ip)

    def test_non_public_ips(self):
        for ip in ["10.0.0.1", "192.168.1.1", "172.16.0.5", "127.0.0.1",
                   "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1",
                   "::1", "fe80::1", "fc00::1"]:
            self.assertFalse(scope.is_public_ip(ip), ip)

    def test_first_public_ip_skips_internal_answers(self):
        # A name resolving to a mix must yield the public one, not the private.
        self.assertEqual(
            scope.first_public_ip(["10.0.0.5", "93.184.216.34", "127.0.0.1"]),
            "93.184.216.34",
        )

    def test_first_public_ip_none_when_all_internal(self):
        self.assertIsNone(scope.first_public_ip(["10.0.0.5", "::1", "169.254.169.254"]))
        self.assertIsNone(scope.first_public_ip([]))
        self.assertIsNone(scope.first_public_ip(None))

    def test_names_allowed_ips_checked(self):
        self.assertTrue(scope.is_public_host("example.com"))
        self.assertFalse(scope.is_public_host("127.0.0.1"))
        self.assertFalse(scope.is_public_host("10.1.2.3"))


class PortPlanTests(unittest.TestCase):
    def test_profiles(self):
        self.assertEqual(ports_for("quick"), COMMON_PORTS)
        self.assertEqual(ports_for("standard"), COMMON_PORTS)
        self.assertEqual(ports_for("deep"), EXTENDED_PORTS)

    def test_extended_has_dangerous_services(self):
        services = {s for _p, s in EXTENDED_PORTS}
        for needed in ("telnet", "redis", "docker", "mongodb"):
            self.assertIn(needed, services)


class ProbeTests(unittest.TestCase):
    def test_normalise_host(self):
        self.assertEqual(normalise_host("HTTPS://Example.COM:8443/x"), "example.com")
        self.assertEqual(normalise_host("example.com."), "example.com")

    def test_skips_non_public_targets(self):
        out = probe_target("127.0.0.1", "standard", lambda h: ["127.0.0.1"], lambda *a: {"open": False})
        self.assertEqual(out["open"], [])
        self.assertEqual(out["skipped"], "not a public host")

    def test_skips_targets_with_no_public_ip(self):
        out = probe_target("internal.local", "standard", lambda h: ["192.168.0.9"], lambda *a: {"open": False})
        self.assertEqual(out["skipped"], "no public address")

    def test_never_connects_to_private_ip(self):
        connected = []

        def connect(ip, port, timeout):
            connected.append(ip)
            return {"open": False}

        probe_target("example.com", "standard", lambda h: ["10.0.0.1", "8.8.8.8"], connect)
        self.assertEqual(set(connected), {"8.8.8.8"}, "private IPs must never be connected to")

    def test_finds_open_ports_and_stops_per_service(self):
        def connect(ip, port, timeout):
            return {"open": port in (443, 8080, 5432), "banner": "nginx" if port == 443 else None}

        out = probe_target("example.com", "deep", lambda h: ["8.8.8.8"], connect)
        ports = {p["port"] for p in out["open"]}
        self.assertEqual(ports, {443, 8080, 5432})
        self.assertEqual(out["open"][0]["banner"], "nginx")
        self.assertEqual(len([p for p in out["open"] if p["port"] == 443]), 1)

    def test_connect_exception_is_not_open(self):
        def connect(ip, port, timeout):
            if port == 22:
                raise OSError("refused")
            return {"open": False}
        out = probe_target("example.com", "standard", lambda h: ["8.8.8.8"], connect)
        self.assertEqual(out["open"], [])

    def test_parallel_probe_keeps_profile_port_order(self):
        import time

        def connect(ip, port, timeout):
            if port == 21:
                time.sleep(0.12)  # the first profile port finishes last
            return {"open": port in (21, 443)}

        out = probe_target("example.com", "standard", lambda h: ["8.8.8.8"], connect, max_workers=8)
        self.assertEqual([p["port"] for p in out["open"]], [21, 443], "order follows the port list, not completion")

    def test_probe_concurrency_is_bounded(self):
        self.assertLessEqual(probe._probe_concurrency(), 64)


class PortFindingTests(unittest.TestCase):
    def test_sensitive_services_become_findings(self):
        findings = port_findings([
            {"port": 5432, "service": "postgres", "ip": "8.8.8.8", "banner": ""},
            {"port": 443, "service": "https", "ip": "8.8.8.8", "banner": ""},
        ])
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0]["check_id"], "probe.exposed_service")
        self.assertEqual(findings[0]["severity"], "high")
        self.assertIn("5432", findings[0]["location"])

    def test_critical_services(self):
        findings = port_findings([{"port": 6379, "service": "redis", "ip": "8.8.8.8", "banner": ""}])
        self.assertEqual(findings[0]["severity"], "critical")

    def test_deduped_per_service(self):
        findings = port_findings([
            {"port": 6379, "service": "redis", "ip": "8.8.8.8", "banner": ""},
            {"port": 6379, "service": "redis", "ip": "9.9.9.9", "banner": ""},
        ])
        self.assertEqual(len(findings), 1)


class TlsTests(unittest.TestCase):
    def test_legacy_protocol(self):
        findings = inspect_tls({"version": "TLSv1", "not_after": None})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0]["check_id"], "tls.legacy_protocol")
        self.assertEqual(findings[0]["severity"], "medium")

    def test_sslv3_is_critical(self):
        findings = inspect_tls({"version": "SSLv3"})
        self.assertEqual(findings[0]["severity"], "critical")

    def test_expired_certificate(self):
        findings = inspect_tls({"version": "TLSv1.3", "not_after": "2000-01-01T00:00:00+00:00"})
        checks = [f["check_id"] for f in findings]
        self.assertIn("tls.cert_expired", checks)

    def test_expiring_soon(self):
        import datetime
        soon = datetime.datetime.utcnow() + datetime.timedelta(days=7)
        findings = inspect_tls({"version": "TLSv1.3", "not_after": soon})
        checks = [f["check_id"] for f in findings]
        self.assertIn("tls.cert_expiring_soon", checks)

    def test_good_tls_has_no_findings(self):
        import datetime
        far = datetime.datetime.utcnow() + datetime.timedelta(days=90)
        self.assertEqual(inspect_tls({"version": "TLSv1.3", "not_after": far}), [])


class HeaderTests(unittest.TestCase):
    def test_missing_security_headers(self):
        findings = inspect_headers({"server": "nginx/1.24", "content-type": "text/html"}, "example.com")
        checks = {f["check_id"] for f in findings}
        for needed in ("tls.hsts_missing", "headers.csp_missing", "headers.nosniff_missing",
                       "headers.frame_options_missing", "headers.server_disclosed"):
            self.assertIn(needed, checks)

    def test_hardened_headers_are_clean(self):
        headers = {
            "strict-transport-security": "max-age=31536000; includeSubDomains",
            "content-security-policy": "default-src 'self'",
            "x-content-type-options": "nosniff",
            "x-frame-options": "DENY",
        }
        self.assertEqual(inspect_headers(headers, "example.com"), [])

    def test_wrong_nosniff_value(self):
        findings = inspect_headers({"x-content-type-options": "sniff"}, "example.com")
        self.assertIn("headers.nosniff_missing", {f["check_id"] for f in findings})

    def test_hsts_not_assessed_on_plain_http(self):
        findings = inspect_headers({"server": "nginx"}, "http://example.com", is_https=False)
        checks = {f["check_id"] for f in findings}
        self.assertNotIn("tls.hsts_missing", checks)
        self.assertIn("headers.csp_missing", checks)

    def test_findings_carry_the_schema(self):
        for f in inspect_headers({}, "example.com"):
            for key in ("check_id", "location", "severity", "title", "description", "remediation", "category"):
                self.assertIn(key, f)


class CombinedTests(unittest.TestCase):
    def test_inspect_target_merges_tls_and_headers(self):
        findings = inspect_target("example.com", {"version": "TLSv1"}, {"server": "nginx"})
        checks = {f["check_id"] for f in findings}
        self.assertIn("tls.legacy_protocol", checks)
        self.assertIn("tls.hsts_missing", checks)


class SandboxScopeTests(unittest.TestCase):
    """The sandbox allowlist is an explicit exception to the §11 egress guard."""

    def setUp(self):
        self._env = dict(os.environ)

    def tearDown(self):
        os.environ.clear()
        os.environ.update(self._env)

    def _probe(self):
        return probe_target(
            "sandbox", "quick",
            lambda _h: ["172.20.0.9"],
            lambda _ip, _port, _timeout: {"open": False, "banner": None},
        )

    def test_disabled_by_default(self):
        os.environ.pop("HARIZEON_SANDBOX_HOSTS", None)
        os.environ.pop("NODE_ENV", None)
        self.assertFalse(scope.sandbox_enabled())
        self.assertFalse(scope.is_public_ip("172.20.0.9"))
        self.assertEqual(self._probe()["skipped"], "no public address")

    def test_allowlist_permits_only_listed_host_and_address(self):
        os.environ.pop("NODE_ENV", None)
        os.environ["HARIZEON_SANDBOX_HOSTS"] = "sandbox, 172.20.0.9 "
        self.assertTrue(scope.is_sandbox_host("SANDBOX"))
        self.assertTrue(scope.is_public_ip("172.20.0.9"))
        self.assertFalse(scope.is_public_ip("10.0.0.5"), "other private addresses stay blocked")

    def test_probe_accepts_a_sandbox_host_resolving_to_a_private_ip(self):
        os.environ.pop("NODE_ENV", None)
        os.environ["HARIZEON_SANDBOX_HOSTS"] = "sandbox"
        result = self._probe()
        self.assertIsNone(result["skipped"])
        self.assertEqual(result["ips"], ["172.20.0.9"])

    def test_production_ignores_the_allowlist(self):
        os.environ["HARIZEON_SANDBOX_HOSTS"] = "sandbox"
        os.environ["NODE_ENV"] = "production"
        self.assertFalse(scope.sandbox_enabled())
        self.assertFalse(scope.is_sandbox_host("sandbox"))
        self.assertEqual(self._probe()["skipped"], "no public address")


if __name__ == "__main__":
    unittest.main()
