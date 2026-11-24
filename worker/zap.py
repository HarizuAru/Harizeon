"""ZAP baseline (spider + passive scan) through the ZAP REST API, deep profile.

Enabled only when ZAP_URL points at a running ZAP daemon (the compose file
ships one). Passive only — active scanning would be intrusive beyond what the
brief authorises. Every call is bounded; anything unreachable is a warn line,
never a failed scan.
"""

import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request

SEVERITY_BY_RISK = {"3": "high", "2": "medium", "1": "low", "0": "info"}
MAX_FINDINGS = 25
POLL_DEADLINE_S = 120
_TAG_RE = re.compile(r"<[^>]+>")


def base_url():
    return os.environ.get("ZAP_URL", "").rstrip("/")


def enabled():
    return bool(base_url())


def _default_fetch(url, timeout):
    req = urllib.request.Request(url, headers={"User-Agent": "harizeon-worker"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read(4_000_000).decode("utf-8", "replace")


def _get(base, path, params, fetch_fn, timeout=15):
    query = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
    text = fetch_fn("%s%s?%s" % (base, path, query), timeout)
    return json.loads(text)


def _plain(text, cap):
    return _TAG_RE.sub(" ", str(text or "")).strip()[:cap]


def map_alerts(alerts, target_url=""):
    """ZAP alert JSON -> finding dicts, deduped per (plugin, url), capped."""
    findings = []
    seen = set()
    host = ""
    if "://" in target_url:
        host = target_url.split("://", 1)[1].split("/", 1)[0]
    for alert in alerts if isinstance(alerts, list) else []:
        if not isinstance(alert, dict):
            continue
        url = str(alert.get("url") or "")
        if host and host not in url:
            continue  # alert outside the target we asked to spider
        plugin = str(alert.get("pluginid") or alert.get("alertRef") or alert.get("name") or "unknown")
        key = (plugin, url)
        if key in seen:
            continue
        seen.add(key)

        risk = str(alert.get("riskcode") or "0")
        severity = SEVERITY_BY_RISK.get(risk, "info")
        cwe = str(alert.get("cweid") or "").strip()
        name = _plain(alert.get("name"), 200) or "ZAP alert"
        finding = {
            "check_id": "zap.%s" % plugin,
            "location": url[:300],
            "severity": severity,
            "title": name,
            "category": "web",
        }
        description = _plain(alert.get("description"), 2000)
        if description:
            finding["description"] = description
        solution = _plain(alert.get("solution"), 2000)
        if solution:
            finding["remediation"] = solution
        if cwe.isdigit() and cwe != "0":
            finding["cwe_id"] = "CWE-%s" % cwe[:15]
        evidence = _plain(alert.get("evidence"), 500)
        if evidence:
            finding["evidence"] = evidence
        findings.append(finding)
        if len(findings) >= MAX_FINDINGS:
            break
    return findings


def scan(
    target_url,
    base=None,
    fetch_fn=None,
    sleep_fn=time.sleep,
    deadline=POLL_DEADLINE_S,
    poll_seconds=2.0,
):
    """Spider target_url, wait for completion, return passive alerts as findings.

    Raises tools-style RuntimeError on timeout/unreachable so the caller logs it.
    """
    base = (base or base_url()).rstrip("/")
    if not base:
        return []
    fetch = fetch_fn or _default_fetch

    started = _get(
        base,
        "/JSON/spider/action/scan",
        {"url": target_url, "maxChildren": "10"},
        fetch,
    )
    scan_id = str(started.get("scan") or "0")

    waited = 0.0
    while waited < deadline:
        status = _get(base, "/JSON/spider/view/status", {"scanId": scan_id}, fetch)
        if str(status.get("status") or "0") == "100":
            break
        sleep_fn(poll_seconds)
        waited += poll_seconds
    else:
        raise RuntimeError("ZAP spider did not finish within %ss" % deadline)

    payload = _get(
        base,
        "/JSON/alert/view/alerts",
        {"start": "0", "count": "1000"},
        fetch,
    )
    return map_alerts(payload.get("alerts") or [], target_url)
