"""Tests for the ProjectDiscovery engine wrappers (no processes, no network)."""

import unittest

import pdtools


class SubfinderParseTests(unittest.TestCase):
    def test_parses_jsonl_and_dedupes(self):
        text = (
            '{"host": "api.example.com"}\n'
            'noise banner line\n'
            '{"host": "API.example.com."}\n'
            '{"host": "mail.example.com"}\n'
        )
        self.assertEqual(
            pdtools.parse_subfinder(text),
            ["api.example.com", "mail.example.com"],
        )

    def test_empty_and_junk_input(self):
        self.assertEqual(pdtools.parse_subfinder(""), [])
        self.assertEqual(pdtools.parse_subfinder("not json\n{not json}"), [])

    def test_run_passes_binary_and_domain(self):
        seen = {}

        def fake_run(cmd, timeout=None, input_text=None):
            seen["cmd"] = cmd
            seen["timeout"] = timeout
            return '{"host": "a.example.com"}\n'

        names = pdtools.run_subfinder("example.com", run_fn=fake_run)
        self.assertEqual(names, ["a.example.com"])
        self.assertEqual(seen["cmd"][0], "subfinder")
        self.assertIn("example.com", seen["cmd"])


class DnsxParseTests(unittest.TestCase):
    def test_parses_host_with_bracketed_ips(self):
        text = "example.com [93.184.216.34]\nexample.org [1.2.3.4,5.6.7.8]\n"
        self.assertEqual(
            pdtools.parse_dnsx(text),
            {"example.com": ["93.184.216.34"], "example.org": ["1.2.3.4", "5.6.7.8"]},
        )

    def test_drops_invalid_ips_and_unbracketed_lines(self):
        text = "example.com [not-an-ip]\njust text\nexample.net [8.8.8.8]\n"
        self.assertEqual(pdtools.parse_dnsx(text), {"example.net": ["8.8.8.8"]})

    def test_run_feeds_hosts_via_stdin_and_caps(self):
        seen = {}

        def fake_run(cmd, timeout=None, input_text=None):
            seen["cmd"] = cmd
            seen["input"] = input_text
            return "a.test [1.1.1.1]\n"

        hosts = ["a.test", "a.test", ""] + ["h%d.test" % i for i in range(200)]
        result = pdtools.run_dnsx(hosts, run_fn=fake_run)
        self.assertEqual(result, {"a.test": ["1.1.1.1"]})
        fed = seen["input"].strip().splitlines()
        self.assertLessEqual(len(fed), pdtools.MAX_RESOLVE)
        self.assertNotIn("", fed)
        self.assertEqual(seen["cmd"][0], "dnsx")

    def test_no_hosts_never_runs(self):
        def fake_run(cmd, timeout=None, input_text=None):
            raise AssertionError("must not run")

        self.assertEqual(pdtools.run_dnsx([], run_fn=fake_run), {})


class HttpxParseTests(unittest.TestCase):
    def test_parses_endpoints_with_defaults(self):
        text = (
            '{"url": "https://example.com", "status_code": 200, "port": 443, '
            '"scheme": "https", "title": "Home", "tech": ["Nginx", "React"]}\n'
            '{"url": "http://example.com:8443", "status_code": null}\n'
        )
        endpoints = pdtools.parse_httpx(text)
        self.assertEqual(len(endpoints), 2)
        self.assertEqual(endpoints[0]["status"], 200)
        self.assertEqual(endpoints[0]["tech"], ["Nginx", "React"])
        self.assertEqual(endpoints[1]["port"], 0)
        self.assertEqual(endpoints[1]["scheme"], "http")

    def test_tech_dict_is_accepted(self):
        text = '{"url": "http://x.test", "tech": {"Nginx": "1.25"}}\n'
        self.assertEqual(pdtools.parse_httpx(text)[0]["tech"], ["Nginx"])

    def test_run_uses_stdin_input(self):
        seen = {}

        def fake_run(cmd, timeout=None, input_text=None):
            seen["input"] = input_text
            return '{"url": "https://x.test", "port": 443, "status_code": 200}\n'

        result = pdtools.run_httpx(["x.test"], run_fn=fake_run)
        self.assertEqual(len(result), 1)
        self.assertEqual(seen["input"], "x.test\n")

    def test_empty_hosts_never_runs(self):
        def fake_run(cmd, timeout=None, input_text=None):
            raise AssertionError("must not run")

        self.assertEqual(pdtools.run_httpx([], run_fn=fake_run), [])


if __name__ == "__main__":
    unittest.main()
