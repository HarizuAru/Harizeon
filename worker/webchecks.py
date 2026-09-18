"""Template-driven web checks for the worker's `test` phase.

A CHECKS registry (per-check id, request path, pure evaluator, metadata) is the
template system in miniature: adding a check is adding a row of declarative data
plus a pure evaluator — the seam §6.5 wants when wrapping a community template
engine later (ponytail: in-house evaluator now; swap in a template repo if/when
commercially justified).

Evaluators are pure functions over Content {status, body, headers} so they run
without a network. run_web_checks wires them over an injected fetch_fn.
"""

import re
from typing import Callable


Content = dict  # {"status": int, "body": str, "headers": dict}


def _git_head(content: Content) -> bool:
    return content.get("status") == 200 and (content.get("body") or "").lstrip().startswith("ref: refs/")


def _dotenv(content: Content) -> bool:
    body = content.get("body") or ""
    return bool(re.search(r"^[A-Z][A-Z0-9_]{2,}=", body, re.MULTILINE))


def _phpinfo(content: Content) -> bool:
    return content.get("status") == 200 and "phpinfo()" in (content.get("body") or "")


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
