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

    def test_actuator_match(self):
        self.assertTrue(webchecks._actuator(content(200, '{"status":"UP","diskSpace":{"status":"UP"}}')))
        self.assertFalse(webchecks._actuator(content(200, '{"message":"hello world"}')))
        self.assertFalse(webchecks._actuator(content(403, 'Forbidden')))

    def test_swagger_match(self):
        self.assertTrue(webchecks._swagger(content(200, '<title>Swagger UI</title>')))
        self.assertTrue(webchecks._swagger(content(200, '{"openapi":"3.0.0","info":{}}')))
        self.assertFalse(webchecks._swagger(content(404, 'Not Found')))

    def test_backup_sql_match(self):
        self.assertTrue(webchecks._backup_sql(content(200, '-- MySQL dump 10.13\nCREATE TABLE users;')))
        self.assertFalse(webchecks._backup_sql(content(200, 'SELECT * FROM test')))
        self.assertFalse(webchecks._backup_sql(content(404, 'Not Found')))


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


class AiExposureTests(unittest.TestCase):
    def test_ollama_fingerprint_is_tight(self):
        real = content(200, '{"models":[{"name":"llama3","modified_at":"2024-05-01T10:00:00Z","digest":"sha256:abc"}]}')
        self.assertTrue(webchecks._ollama_tags(real))
        self.assertFalse(webchecks._ollama_tags(content(200, '{"models":[]}')))
        self.assertFalse(webchecks._ollama_tags(content(200, '{"models":[{"name":"x"}]}')))
        self.assertFalse(webchecks._ollama_tags(content(404, "Not Found")))

    def test_finds_and_redacts_provider_keys(self):
        text = 'const a="sk-proj-abcdefghijklmnopqrstuvwx";const b="hf_%s";' % ("a1B2c3D4e5F6g7H8i9J0kKl2M3n4o5P6")
        hits = webchecks.find_leaked_ai_keys(text)  # [(redacted, provider)]
        providers = {provider for _, provider in hits}
        self.assertIn("OpenAI", providers)
        self.assertIn("Hugging Face", providers)
        for redacted, _ in hits:
            self.assertNotIn("abcdefghijklmnopqrstuvwx", redacted)
        openai = [r for r, p in hits if p == "OpenAI"][0]
        self.assertEqual(openai, "sk-proj…uvwx")

    def test_low_entropy_constants_are_not_reported(self):
        # Correct prefix and length, but the variable part is a repeated char:
        # a configuration constant, not a live credential.
        self.assertEqual(webchecks.find_leaked_ai_keys('const k="sk-proj-%s";' % ("a" * 32)), [])
        self.assertEqual(webchecks.find_leaked_ai_keys('const k="hf_%s";' % ("a" * 32)), [])

    def test_entropy_helper(self):
        self.assertEqual(webchecks.shannon_entropy(""), 0.0)
        self.assertEqual(webchecks.shannon_entropy("aaaa"), 0.0)
        self.assertGreater(webchecks.shannon_entropy("a1B2c3D4e5F6g7H8"), webchecks.MIN_KEY_ENTROPY)

    def test_placeholder_keys_are_not_findings(self):
        for text in [
            "sk-your-api-key-placeholder-12345678",
            "AIzaSyEXAMPLEEXAMPLEEXAMPLEEXAMPLEEXAMPLE12",
            'OPENAI_API_KEY=changeme-changeme-changeme',
        ]:
            self.assertEqual(webchecks.find_leaked_ai_keys(text), [], text)

    def test_extract_script_srcs_same_origin_only(self):
        html = (
            '<script src="/app.js"></script>'
            '<script src="https://cdn.other.example/x.js"></script>'
            '<script src="chunk-2.js"></script>'
            '<script src="data:text/javascript,1"></script>'
            '<script src="/app.js"></script>'
        )
        self.assertEqual(
            webchecks.extract_script_srcs(html, "https://example.com/page"),
            ["https://example.com/app.js", "https://example.com/chunk-2.js"],
        )

    def test_scan_client_scripts_reports_a_leaked_key_once(self):
        def fetch(url):
            if url.endswith("/app.js"):
                return content(200, 'window.__ENV__={k:"sk-ant-abcdefghijklmnopqrstuvwx"};')
            return content(200, '<script src="/app.js"></script><script src="/app.js"></script>')

        findings = webchecks.scan_client_scripts("https://example.com", fetch)
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0]["check_id"], "web.leaked_ai_credentials")
        self.assertEqual(findings[0]["category"], "ai_exposure")
        self.assertNotIn("abcdefghijklmnopqrstuvwx", findings[0]["evidence"])

    def test_scan_client_scripts_clean_page_is_silent(self):
        def fetch(url):
            if url.endswith("/app.js"):
                return content(200, "console.log('hello')")
            return content(200, '<script src="/app.js"></script>')

        self.assertEqual(webchecks.scan_client_scripts("https://example.com", fetch), [])

    def test_ai_checks_are_wired_into_run_web_checks(self):
        fired = run_web_checks("https://example.com", lambda _u: content(200, '{"models":[{"digest":"d","modified_at":"m"}]}'))
        ids = [f["check_id"] for f in fired]
        self.assertIn("web.exposed_ollama", ids)


if __name__ == "__main__":
    unittest.main()
