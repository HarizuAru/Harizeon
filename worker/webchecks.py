"""Template-driven web checks for the worker's `test` phase.

A CHECKS registry (per-check id, request path, pure evaluator, metadata) is the
template system in miniature: adding a check is adding a row of declarative data
plus a pure evaluator — the seam §6.5 wants when wrapping a community template
engine later (ponytail: in-house evaluator now; swap in a template repo if/when
commercially justified).

Evaluators are pure functions over Content {status, body, headers} so they run
without a network. run_web_checks wires them over an injected fetch_fn.
"""

import math
import re
from typing import Callable
from urllib.parse import urljoin, urlsplit


Content = dict  # {"status": int, "body": str, "headers": dict}


# --- Leaked AI provider credentials (client-side JS) -----------------------
#
# The agentic-era exposure: an API key baked into a JS bundle is a working
# credential for anyone who reads the file. Patterns capture the VARIABLE part
# so an entropy check can separate a live key from a padded constant, because a
# wrong "critical" costs trust.

_AI_KEY_PATTERNS = [
    ("OpenAI", re.compile(r"\bsk-([A-Za-z0-9]{20,})\b")),
    ("OpenAI", re.compile(r"\bsk-proj-([A-Za-z0-9_-]{20,})\b")),
    ("Anthropic", re.compile(r"\bsk-ant-([A-Za-z0-9_-]{20,})\b")),
    ("Hugging Face", re.compile(r"\bhf_([A-Za-z0-9]{30,})\b")),
    ("Google", re.compile(r"\bAIza([0-9A-Za-z_-]{35})\b")),
    ("Groq", re.compile(r"\bgsk_([A-Za-z0-9]{40,})\b")),
]

_PLACEHOLDER_MARKERS = ("example", "your", "xxx", "placeholder", "changeme", "redacted", "dummy", "sample")

# Real provider keys are random; a constant pretending to be one is not.
MIN_KEY_ENTROPY = 3.0


def shannon_entropy(text):
    """Bits of information per character. 'aaaa…' -> ~0; random keys -> >4."""
    if not text:
        return 0.0
    counts = {}
    for ch in text:
        counts[ch] = counts.get(ch, 0) + 1
    n = len(text)
    return -sum((c / n) * math.log2(c / n) for c in counts.values())


def redact_secret(value: str) -> str:
    """Never echo a live credential into a finding or a log."""
    if len(value) <= 12:
        return "…"
    return "%s…%s" % (value[:7], value[-4:])


def find_leaked_ai_keys(text: str) -> list:
    """Return [(provider, redacted)] for AI credentials found in `text`."""
    if not text:
        return []
    found = {}
    lowered = text.lower()
    for provider, pattern in _AI_KEY_PATTERNS:
        for match in pattern.finditer(text):
            candidate = match.group(0)
            variable = match.group(1)
            if any(marker in candidate.lower() for marker in _PLACEHOLDER_MARKERS):
                continue
            # A real key's variable part is high-entropy; constants are not.
            if shannon_entropy(variable) < MIN_KEY_ENTROPY:
                continue
            # Cheap guard against long random blobs that merely share a prefix.
            if any(marker in lowered[max(0, match.start() - 20):match.start()] for marker in ("example", "your_")):
                continue
            found[redact_secret(candidate)] = provider
    return sorted(found.items(), key=lambda kv: kv[1])


def extract_script_srcs(html: str, base_url: str) -> list:
    """Same-origin <script src> URLs, absolute and de-duplicated, in order."""
    if not html:
        return []
    origin = urlsplit(base_url)
    out = []
    seen = set()
    for raw in re.findall(r"<script[^>]+src=[\"']([^\"']+)[\"']", html, re.IGNORECASE):
        src = raw.strip().replace("&amp;", "&")
        if not src or src.lower().startswith(("data:", "javascript:", "blob:")):
            continue
        absolute = urljoin(base_url, src)
        parts = urlsplit(absolute)
        if (parts.scheme, parts.netloc) != (origin.scheme, origin.netloc):
            continue  # third-party CDN: not our asset to scan
        if absolute in seen:
            continue
        seen.add(absolute)
        out.append(absolute)
    return out


def scan_client_scripts(base_url: str, fetch_fn: Callable[[str], Content | None], max_scripts: int = 5) -> list:
    """Fetch the page's own scripts (bounded) and report leaked AI keys.

    Kept free of direct I/O by taking `fetch_fn`, so it is unit-testable with a
    stub and cheap enough to run inside the existing `test` phase.
    """
    page = fetch_fn(base_url)
    if not page:
        return []
    findings = []
    seen_keys = set()
    for script_url in extract_script_srcs(page.get("body") or "", base_url)[:max_scripts]:
        content = fetch_fn(script_url)
        if not content:
            continue
        for redacted, provider in find_leaked_ai_keys(content.get("body") or ""):
            if redacted in seen_keys:
                continue
            seen_keys.add(redacted)
            findings.append({
                "check_id": "web.leaked_ai_credentials",
                "location": script_url,
                "severity": "critical",
                "title": "AI provider credential exposed in client-side JavaScript (%s)" % provider,
                "description": "A %s API key is shipped to the browser. Anyone who loads this script can extract and spend it; an automated agent finds it in seconds." % provider,
                "remediation": "Remove the key from client code, rotate it immediately, and move calls behind your own authenticated backend.",
                "cwe_id": "CWE-798",
                "category": "ai_exposure",
                "evidence": redacted,
            })
    return findings


def _git_head(content: Content) -> bool:
    return content.get("status") == 200 and (content.get("body") or "").lstrip().startswith("ref: refs/")


def _dotenv(content: Content) -> bool:
    body = content.get("body") or ""
    return bool(re.search(r"^[A-Z][A-Z0-9_]{2,}=", body, re.MULTILINE))


def _phpinfo(content: Content) -> bool:
    return content.get("status") == 200 and "phpinfo()" in (content.get("body") or "")


def _actuator(content: Content) -> bool:
    body = content.get("body") or ""
    return content.get("status") == 200 and any(k in body for k in ('"status":"UP"', '"diskSpace"', '"_links":{'))


def _swagger(content: Content) -> bool:
    body = content.get("body") or ""
    return content.get("status") == 200 and any(k in body for k in ("swagger-ui", "Swagger UI", '"openapi":', '"swagger":'))


def _backup_sql(content: Content) -> bool:
    body = content.get("body") or ""
    return content.get("status") == 200 and any(k in body for k in ("-- MySQL dump", "-- PostgreSQL database dump", "CREATE TABLE", "INSERT INTO"))


def _ollama_tags(content: Content) -> bool:
    """Ollama's /api/tags lists locally pulled models and, by default, has no
    authentication. The JSON shape is distinctive, so the fingerprint is tight."""
    body = content.get("body") or ""
    return (
        content.get("status") == 200
        and '"models"' in body
        and '"digest"' in body
        and '"modified_at"' in body
    )


def _not_https_redirect(content: Content) -> bool:
    """Fires when http:// serves content instead of redirecting to https://.
    Only cacheable 301/308 to https:// count as honest: a served 302/307 is
    fetched over plaintext every time."""
    if content.get("status") in (301, 308):
        location = (content.get("headers") or {}).get("location", "").lower()
        return not location.startswith("https://")
    return content.get("status") is not None


CHECKS = [
    {
        "check_id": "web.exposed_git",
        "path": "/.git/HEAD",
        "evaluator": _git_head,
        "severity": "critical",
        "title": "Exposed .git directory",
        "description": "The .git directory is readable over the web; the full source history can be downloaded.",
        "remediation": "Block access to .git in the web server config and move the repo out of the webroot.",
        "cwe_id": "CWE-538",
        "category": "web",
    },
    {
        "check_id": "web.exposed_dotenv",
        "path": "/.env",
        "evaluator": _dotenv,
        "severity": "critical",
        "title": "Exposed .env file",
        "description": "A dotenv-style configuration file (what looks like credentials) is served publicly.",
        "remediation": "Move secrets out of the webroot, deny access to dotfiles, and rotate any exposed credentials.",
        "category": "web",
    },
    {
        "check_id": "web.phpinfo",
        "path": "/phpinfo.php",
        "evaluator": _phpinfo,
        "severity": "medium",
        "title": "Exposed phpinfo page",
        "description": "A phpinfo() output is publicly reachable, disclosing paths, modules and configuration.",
        "remediation": "Delete the phpinfo script from the webroot.",
        "cwe_id": "CWE-215",
        "category": "web",
    },
    {
        "check_id": "web.exposed_actuator",
        "path": "/actuator/health",
        "evaluator": _actuator,
        "severity": "high",
        "title": "Exposed Spring Boot Actuator endpoint",
        "description": "Spring Boot Actuator endpoints are publicly reachable, disclosing service health and internal topology.",
        "remediation": "Restrict management.endpoints.web.exposure.include or require authentication in Spring Security.",
        "cwe_id": "CWE-200",
        "category": "web",
    },
    {
        "check_id": "web.exposed_swagger",
        "path": "/swagger-ui.html",
        "evaluator": _swagger,
        "severity": "medium",
        "title": "Exposed Swagger UI documentation",
        "description": "Interactive API documentation is publicly accessible without authentication, exposing internal endpoints.",
        "remediation": "Disable Swagger UI in production environments or place behind authentication gateway.",
        "cwe_id": "CWE-200",
        "category": "web",
    },
    {
        "check_id": "web.exposed_backup",
        "path": "/backup.sql",
        "evaluator": _backup_sql,
        "severity": "critical",
        "title": "Exposed SQL database backup",
        "description": "A raw SQL database backup file is directly downloadable from the web root.",
        "remediation": "Immediately remove SQL dumps from public directories and store in an encrypted, off-site bucket.",
        "cwe_id": "CWE-530",
        "category": "web",
    },
    {
        "check_id": "web.exposed_ollama",
        "path": "/api/tags",
        "evaluator": _ollama_tags,
        "severity": "high",
        "title": "Unauthenticated Ollama model API exposed",
        "description": "An Ollama inference server is reachable without authentication. Anyone (or any agent) can enumerate and run the hosted models on your hardware.",
        "remediation": "Bind Ollama to localhost or a private network, or require authentication via a reverse proxy. Never expose port 11434 to the internet.",
        "cwe_id": "CWE-306",
        "category": "ai_exposure",
    },
    {
        "check_id": "web.no_https_redirect",
        "path": "/",
        "needs_http": True,  # exercised against the http:// variant
        "evaluator": _not_https_redirect,
        "severity": "medium",
        "title": "Plain HTTP does not redirect to HTTPS",
        "description": "http:// requests to the root are served, letting users and bots start on unencrypted traffic (SSL-strip risk).",
        "remediation": "Redirect all HTTP requests to HTTPS permanently, or send HSTS.",
        "category": "web",
    },
]


def run_web_checks(base_url: str, fetch_fn: Callable[[str], Content | None]) -> list:
    """Run every check against one base URL; returns finding dicts (§07 shape).

    fetch_fn(url) -> Content | None.
    The no_https_redirect check only runs when the base is an http:// origin —
    it is a property of the plaintext variant, not of the https one.
    """
    base = (base_url or "").rstrip("/")
    if not base:
        return []
    findings: list = []
    for check in CHECKS:
        if check.get("needs_http") and not base.startswith("http://"):
            continue
        url = base + check["path"]
        try:
            content = fetch_fn(url)
        except Exception:  # noqa: BLE001 - unreachable host: skip silently
            continue
        if not content:
            continue
        if check["evaluator"](content):
            findings.append({
                "check_id": check["check_id"],
                "location": url,
                "severity": check["severity"],
                "title": check["title"],
                "description": check["description"],
                "remediation": check["remediation"],
                "cwe_id": check.get("cwe_id"),
                "category": check["category"],
                "evidence": (content.get("body") or "")[:200],
            })
    return findings
