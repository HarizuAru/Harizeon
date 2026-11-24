"""testssl.sh deep TLS scan (deep profile only).

The JSON file is the source of truth: testssl exits non-zero on some findings,
so we run it lenient and parse the file. The parser walks arbitrary nesting
because testssl's JSON shape has changed between releases; only entries shaped
{id, severity, finding} are considered.
"""

import json
import os
import tempfile

import tools

# FAIL -> high, WARN -> medium, NOTE -> low, OK -> skipped (passed checks are
# not findings). Cap keeps one host from flooding the findings list.
SEVERITY_MAP = {
    "FAIL": "high",
    "WARN": "medium",
    "NOTE": "low",
    "INFO": "info",
}
MAX_FINDINGS = 20


def have():
    return tools.available("testssl.sh")


def _walk(obj):
    if isinstance(obj, dict):
        if "id" in obj and "severity" in obj:
            yield obj
        for value in obj.values():
            yield from _walk(value)
    elif isinstance(obj, list):
        for value in obj:
            yield from _walk(value)


def parse(text, location=""):
    try:
        data = json.loads(text)
    except ValueError:
        return []
    findings = []
    for entry in _walk(data):
        severity = SEVERITY_MAP.get(str(entry.get("severity") or "").strip().upper())
        if severity is None:
            continue
        entry_id = str(entry.get("id") or "tls.unknown")
        detail = str(entry.get("finding") or "").strip()
        title = "%s: %s" % (entry_id, detail[:120]) if detail else entry_id
        findings.append(
            {
                "check_id": "tls.%s" % entry_id,
                "location": location[:300],
                "severity": severity,
                "title": title[:200],
                "category": "tls",
                "evidence": detail[:500] if detail else entry_id,
            }
        )
        if len(findings) >= MAX_FINDINGS:
            break
    return findings


def scan(host, run_fn=None, timeout=240, location=None):
    """Scan host:443 with testssl.sh; returns findings (possibly empty)."""
    run_fn = run_fn or tools.run_allow_fail
    fd, path = tempfile.mkstemp(prefix="hz-testssl-", suffix=".json")
    os.close(fd)
    try:
        run_fn(
            ["testssl.sh", "--jsonfile", path, "--quiet", "--protocols", host],
            timeout=timeout,
        )
        with open(path, "r", encoding="utf-8", errors="replace") as handle:
            text = handle.read()
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass
    return parse(text, location=location or ("%s:443" % host))
