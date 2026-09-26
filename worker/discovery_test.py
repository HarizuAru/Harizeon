import json
import unittest

from discovery import (
    MAX_SUBDOMAINS,
    candidate_subdomains,
    discover,
    is_subdomain,
    normalise_domain,
    parse_ct_names,
    parse_rdap,
    permutation_candidates,
)

CT = json.dumps([
    {"name_value": "www.example.com\n*.api.example.com"},
    {"name_value": "example.com"},
    {"name_value": "shop.example.com"},
    {"name_value": "not-example.com"},
])
RDAP = json.dumps({
    "events": [{"eventAction": "registration", "eventDate": "2019-05-02T00:00:00Z"}],
    "entities": [{
        "roles": ["registrar"],
        "vcardArray": ["vcard", [["fn", {}, "text", "Example Registrar"]]],
    }],
})


class NormaliseTests(unittest.TestCase):
    def test_normalise(self):
        self.assertEqual(normalise_domain("HTTPS://Example.COM./path"), "example.com")
        self.assertEqual(normalise_domain(" example.com:443 "), "example.com")
        self.assertEqual(normalise_domain(""), "")

    def test_is_subdomain_strict(self):
        self.assertTrue(is_subdomain("api.example.com", "example.com"))
        self.assertFalse(is_subdomain("example.com", "example.com"))
        self.assertFalse(is_subdomain("notexample.com", "example.com"))
        self.assertFalse(is_subdomain("evil-example.com", "example.com"))


class CtParseTests(unittest.TestCase):
    def test_strips_wildcards_and_excludes_root(self):
        names = parse_ct_names(CT, "example.com")
        self.assertIn("www.example.com", names)
        self.assertIn("api.example.com", names)
        self.assertIn("shop.example.com", names)
        self.assertNotIn("example.com", names)
        self.assertNotIn("not-example.com", names)

    def test_tolerates_garbage(self):
        self.assertEqual(parse_ct_names("not json", "example.com"), set())
        self.assertEqual(parse_ct_names(json.dumps({"a": 1}), "example.com"), set())


class RdapTests(unittest.TestCase):
    def test_parse(self):
        whois = parse_rdap(RDAP)
        self.assertEqual(whois["registered"], "2019-05-02T00:00:00Z")
        self.assertEqual(whois["registrar"], "Example Registrar")


class DiscoverTests(unittest.TestCase):
    def setUp(self):
        self.known = {
            "example.com": {"A": ["93.184.216.34"], "MX": ["10 mail.example.com"]},
            "www.example.com": {"A": ["1.2.3.4"]},
            "api.example.com": {"A": ["5.6.7.8"]},
        }
        self.http = lambda url: (200, CT if "crt.sh" in url else RDAP)
        self.dns = lambda name, rtype: self.known.get(name, {}).get(rtype, [])

    def test_discovers_only_resolvable_subdomains(self):
        out = discover("example.com", self.http, self.dns)
        by_name = {s["fqdn"]: s for s in out["subdomains"]}
        self.assertIn("www.example.com", by_name)
        self.assertIn("api.example.com", by_name)
        self.assertNotIn("example.com", by_name)
        self.assertTrue(all(s["ips"] for s in out["subdomains"]))
        self.assertLessEqual(len(out["subdomains"]), MAX_SUBDOMAINS)

    def test_sources_and_records_and_whois(self):
        out = discover("example.com", self.http, self.dns)
        by_name = {s["fqdn"]: s for s in out["subdomains"]}
        self.assertEqual(by_name["api.example.com"]["source"], "ct")
        self.assertEqual(by_name["www.example.com"]["ips"], ["1.2.3.4"])
        self.assertEqual(out["records"]["A"], ["93.184.216.34"])
        self.assertEqual(out["whois"]["registrar"], "Example Registrar")

    def test_http_failure_is_tolerated(self):
        def boom(_url):
            raise RuntimeError("network down")

        out = discover("example.com", boom, self.dns)
        # CT + RDAP failed, but wordlist + DNS still produce an inventory.
        self.assertIn("www.example.com", {s["fqdn"] for s in out["subdomains"]})
        self.assertEqual(out["whois"], {})

    def test_candidate_cap(self):
        many = {"s%d.example.com" % i for i in range(500)}
        capped = candidate_subdomains("example.com", many)
        self.assertLessEqual(len(capped), MAX_SUBDOMAINS)

    def test_resolution_budget_caps_lookups(self):
        a_calls = {"n": 0}

        def dns(name, rtype):
            if rtype == "A":
                a_calls["n"] += 1
                return ["1.2.3.4"]
            return []

        out = discover("example.com", lambda _url: (200, "[]"), dns, max_resolutions=3)
        # 1 root A lookup + at most 3 candidate A lookups
        self.assertLessEqual(a_calls["n"], 4)
        self.assertLessEqual(len(out["subdomains"]), 3)


class PermutationTests(unittest.TestCase):
    def test_mutations_are_strict_subdomains_of_the_root(self):
        perms = permutation_candidates("example.com", ["api.example.com", "www.example.com"])
        self.assertTrue(perms)
        for name in perms:
            self.assertTrue(is_subdomain(name, "example.com"), name)

    def test_known_naming_patterns_are_generated(self):
        perms = permutation_candidates("example.com", ["api.example.com"])
        self.assertIn("dev.api.example.com", perms)
        self.assertIn("api-dev.example.com", perms)
        self.assertIn("dev-api.example.com", perms)

    def test_bounded_and_deduplicated(self):
        many = ["%s.example.com" % label for label in ("a", "b", "c", "d")]
        perms = permutation_candidates("example.com", many)
        self.assertLessEqual(len(perms), 400)
        self.assertEqual(len(perms), len(set(perms)))

    def test_ct_names_stay_ahead_of_mutations(self):
        ct = ["real.example.com"]
        candidates = candidate_subdomains("example.com", ct)
        self.assertEqual(candidates[0], "real.example.com", "certificate data has priority")
        self.assertLessEqual(len(candidates), MAX_SUBDOMAINS)

    def test_no_known_subdomains_means_no_mutations(self):
        self.assertEqual(permutation_candidates("example.com", []), [])


if __name__ == "__main__":
    unittest.main()
