import unittest

import webchecks
from webchecks import run_web_checks

BASE = "https://example.com"


def content(status, body="", headers=None):
    return {"status": status, "body": body, "headers": headers or {}}


class EvaluatorTests(unittest.TestCase):
    def test_git_head_match(self):
        self.assertTrue(webchecks._git_head(content(200, "ref: refs/heads/main\n")))
        # a missing trailing newline is still a .git/HEAD
        self.assertTrue(webchecks._git_head(content(200, "ref: refs/heads/main")))
        self.assertFalse(webchecks._git_head(content(404, "Not Found")))

    def test_dotenv_match(self):
        self.assertTrue(webchecks._dotenv(content(200, "APP_KEY=abc123\nDB_HOST=x\n")))
        self.assertFalse(webchecks._dotenv(content(200, "just text")))
        self.assertFalse(webchecks._dotenv(content(403, "")))

    def test_phpinfo_match(self):
        self.assertTrue(webchecks._phpinfo(content(200, "<html>phpinfo()</html>")))
        self.assertFalse(webchecks._dotenv(webchecks._phpinfo and content(404, "phpinfo()")))


class RunChecksTests(unittest.TestCase):
    def test_exposures_fire(self):
        def fetch(url):
            if url == BASE + "/.git/HEAD":
                return content(200, "ref: refs/heads/main\n")
            if url == BASE + "/.env":
                return content(200, "DATABASE_URL=postgres://...\n")
            if url == BASE + "/phpinfo.php":
                return content(200, "phpinfo() output")
            return content(404)

        findings = run_web_checks(BASE, fetch)
        ids = sorted(f["check_id"] for f in findings)
        self.assertEqual(ids, ["web.exposed_dotenv", "web.exposed_git", "web.phpinfo"])
        git = next(f for f in findings if f["check_id"] == "web.exposed_git")
        self.assertEqual(git["severity"], "critical")
        self.assertEqual(git["location"], BASE + "/.git/HEAD")
        self.assertIn("ref: refs/heads/main", git["evidence"])

    def test_https_redirect_check_skipped_for_https_only_scans(self):
        def fetch(url):
            if url == "http://example.com/":
                return content(200, "hello")
            return content(200)

        findings_http = run_web_checks("http://example.com", fetch)
        self.assertEqual(
            [f["check_id"] for f in findings_http],
            ["web.no_https_redirect"],
        )
        findings_https = run_web_checks("https://example.com", fetch)
        self.assertEqual(findings_https, [])

    def test_https_redirect_fires_when_served(self):
        def fetch(url):
            return content(200, "plain")

        findings = run_web_checks("http://example.com", fetch)
        self.assertEqual(findings[0]["title"], "Plain HTTP does not redirect to HTTPS")

    def test_https_redirect_ok_when_permanent(self):
        def fetch(url):
            return content(301, "", headers={"location": "https://example.com/"})

        self.assertEqual(run_web_checks("http://example.com", fetch), [])

    def test_temporary_redirect_counts_as_served(self):
        def fetch(url):
            return content(302, "", headers={"location": "https://example.com/"})

        findings = run_web_checks("http://example.com", fetch)
        self.assertEqual(findings[0]["check_id"], "web.no_https_redirect")

    def test_findings_carry_the_full_schema(self):
        def fetch(url):
            return content(200, "ref: refs/heads/main\n") if url.endswith("/.git/HEAD") else content(404)

        for f in run_web_checks(BASE, fetch):
            for key in ("check_id", "location", "severity", "title", "description", "remediation", "category"):
                self.assertIn(key, f)

    def test_fetch_exception_tolerated(self):
        def fetch(_url):
            raise RuntimeError("down")

        self.assertEqual(run_web_checks(BASE, fetch), [])


if __name__ == "__main__":
    unittest.main()
