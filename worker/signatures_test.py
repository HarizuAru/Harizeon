import unittest

import signatures


class VersionOrderingTests(unittest.TestCase):
    def test_plain_and_graded_versions_order_correctly(self):
        self.assertLess(signatures.parse_version("1.0.1f"), signatures.parse_version("1.0.1g"))
        self.assertLess(signatures.parse_version("1.0.1"), signatures.parse_version("1.0.1f"))
        self.assertLess(signatures.parse_version("2.4.49"), signatures.parse_version("2.4.50"))
        self.assertLess(signatures.parse_version("8.5p1"), signatures.parse_version("9.6p1"))
        self.assertLess(signatures.parse_version("9.6p1"), signatures.parse_version("9.7p1"))
        self.assertLess(signatures.parse_version("9.7p1"), signatures.parse_version("9.8p1"))
        self.assertEqual(signatures.parse_version(""), ())


class BannerClassificationTests(unittest.TestCase):
    def test_openssh_banner(self):
        got = signatures.identify_banner("SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13")
        self.assertEqual(got[0]["product"], "openssh")
        self.assertEqual(got[0]["version"], "9.6p1")

    def test_server_header_style_banners_identify_every_product(self):
        got = signatures.identify_banner("Apache/2.4.49 (Unix) OpenSSL/1.0.1f")
        products = {item["product"]: item["version"] for item in got}
        self.assertEqual(products.get("apache"), "2.4.49")
        self.assertEqual(products.get("openssl"), "1.0.1f")

    def test_vsftpd_banner(self):
        got = signatures.identify_banner("220 (vsFTPd 2.3.4)")
        self.assertEqual(got[0]["product"], "vsftpd")
        self.assertEqual(got[0]["version"], "2.3.4")

    def test_unknown_banner_classifies_to_nothing(self):
        self.assertEqual(signatures.identify_banner("220 mail.example.com ESMTP ready"), [])


class CveMatchingTests(unittest.TestCase):
    def test_vsftpd_backdoor_on_exact_version(self):
        findings = signatures.software_findings("220 (vsFTPd 2.3.4)", "1.2.3.4:21")
        self.assertEqual([f["cve_ids"] for f in findings], [["CVE-2011-2523"]])
        self.assertEqual(findings[0]["severity"], "critical")
        self.assertEqual(findings[0]["category"], "vulnerable_software")

    def test_heartbleed_range_inclusive_of_bare_release(self):
        findings = signatures.software_findings("Apache/2.2.22 OpenSSL/1.0.1", "h:443")
        cves = [c for f in findings for c in f["cve_ids"]]
        self.assertIn("CVE-2014-0160", cves)
        # 1.0.1g is the fixed release: must not fire.
        self.assertEqual(signatures.software_findings("OpenSSL/1.0.1g", "h:443"), [])

    def test_openssh_regreSSHion_range(self):
        self.assertTrue(signatures.software_findings("SSH-2.0-OpenSSH_9.7p1", "h:22"))
        self.assertFalse(signatures.software_findings("SSH-2.0-OpenSSH_9.8p1", "h:22"))
        self.assertFalse(signatures.software_findings("SSH-2.0-OpenSSH_8.2p1", "h:22"))

    def test_nginx_range(self):
        self.assertTrue(signatures.software_findings("nginx/1.20.0", "h:80"))
        self.assertFalse(signatures.software_findings("nginx/1.20.1", "h:80"))

    def test_apache_2021_regression(self):
        got = signatures.software_findings("Apache/2.4.49", "h:80")
        cves = {c for f in got for c in f["cve_ids"]}
        self.assertEqual(cves, {"CVE-2021-41773", "CVE-2021-42013"})
        self.assertFalse(signatures.software_findings("Apache/2.4.51", "h:80"))

    def test_patched_versions_stay_silent(self):
        for banner in ("nginx/1.25.3", "Apache/2.4.59", "SSH-2.0-OpenSSH_9.9p1"):
            self.assertFalse(signatures.software_findings(banner, "h:80"), banner)


if __name__ == "__main__":
    unittest.main()
