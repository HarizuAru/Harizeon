"""CISA KEV + OSV enrichment for published findings.

Runs centrally in publish_findings(), so every engine's output gets it. Rules:
  * never raises — a scan must not fail because an intel source is down;
  * KEV list is cached on disk for 24h and stale cache is used when offline;
  * OSV lookups are capped and time-boxed (findings rarely carry CVEs);
  * `known_exploited` is the boolean the control plane persists (migration 0009).

Stdlib only (urllib), injectable fetch_fn for tests.
"""

import json
import os
import re
import time
import urllib.request

KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
CACHE_PATH = os.environ.get("HARIZEON_KEV_CACHE", "/tmp/harizeon-kev.json")
KEV_MAX_AGE = 86400
OSV_BASE = "https://api.osv.dev/v1/vulns/"
OSV_LIMIT = 5
OSV_TIMEOUT = 2.5

CVE_RE = re.compile(r"^CVE-\d{4}-\d{4,}$")

# In-process memo so repeated enrich calls in one worker life do not refetch.
_OSV_CACHE = {}


def _default_fetch(url, timeout):
    req = urllib.request.Request(url, headers={"User-Agent": "harizeon-worker"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read(8_000_000).decode("utf-8", "replace")


def _read_cache(path):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def load_kev(path=None, fetch_fn=None, now_fn=time.time, max_age=KEV_MAX_AGE):
    """Return {cve_id: entry}. Fresh disk cache wins; else fetch (offline falls
    back to stale cache, then {}); never raises."""
    path = path or CACHE_PATH
    fetch = fetch_fn or _default_fetch
    data = None
    try:
        if os.path.getmtime(path) + max_age > now_fn():
            data = _read_cache(path)
    except OSError:
        pass

    if data is None:
        try:
            data = json.loads(fetch(KEV_URL, 15))
            if not isinstance(data, dict):
                raise ValueError("unexpected KEV payload")
            try:
                os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
                tmp = path + ".tmp"
                with open(tmp, "w", encoding="utf-8") as handle:
                    json.dump(data, handle)
                os.replace(tmp, path)
            except OSError:
                pass  # read-only fs: the fetched data is still usable today
        except Exception:
            try:
                data = _read_cache(path)
            except OSError:
                return {}

    entries = data.get("vulnerabilities") or []
    return {
        str(v.get("cveID") or "").upper(): v
        for v in entries
        if isinstance(v, dict) and v.get("cveID")
    }


def extract_cves(finding):
    ids = finding.get("cve_ids")
    out = []
    if isinstance(ids, (list, tuple)):
        for value in ids:
            value = str(value).strip().upper()
            if CVE_RE.match(value) and value not in out:
                out.append(value)
    return out[:10]


def _osv_info(cve, fetch_fn):
    """One OSV GET -> {"fixed": "..."} | {} ; memoized, never raises."""
    if cve in _OSV_CACHE:
        return _OSV_CACHE[cve]
    info = {}
    try:
        raw = fetch_fn(OSV_BASE + cve, OSV_TIMEOUT)
        data = json.loads(raw)
        for affected in data.get("affected") or []:
            for rng in affected.get("ranges") or []:
                for event in rng.get("events") or []:
                    if event.get("fixed"):
                        info["fixed"] = str(event["fixed"])[:80]
                        break
                if info.get("fixed"):
                    break
            if info.get("fixed"):
                break
    except Exception:
        info = {}
    _OSV_CACHE[cve] = info
    return info


def enrich(findings, fetch_fn=None, kev_map=None, limit_osv=OSV_LIMIT):
    """Mutate findings in place: mark KEV-listed CVEs known_exploited and append
    an OSV fixed-version hint to remediation where one exists. Returns the input,
    always — this hook can never fail a scan."""
    if not findings:
        return findings
    try:
        vm = kev_map if kev_map is not None else load_kev(fetch_fn=fetch_fn)
        fetch = fetch_fn or _default_fetch

        cves_seen = []
        for finding in findings:
            cves = extract_cves(finding)
            if not cves:
                continue
            listed = [c for c in cves if c in vm]
            if listed:
                finding["known_exploited"] = True
                entry = vm[listed[0]]
                added = str(entry.get("dateAdded") or "")
                note = "CISA KEV: known exploited in the wild" + (
                    " (added %s)" % added if added else ""
                )
                desc = finding.get("description") or ""
                if note not in desc:
                    finding["description"] = (desc + (" " if desc else "") + note)[:2000]
            for cve in cves:
                if cve not in cves_seen:
                    cves_seen.append(cve)

        for cve in cves_seen[:limit_osv]:
            info = _osv_info(cve, fetch)
            fixed = info.get("fixed")
            if not fixed:
                continue
            hint = "Upstream fix available: %s (%s)" % (fixed, cve)
            for finding in findings:
                if cve in extract_cves(finding) and hint not in (finding.get("remediation") or ""):
                    finding["remediation"] = (
                        (finding.get("remediation") or "") + " " + hint
                    ).strip()[:2000]
    except Exception:
        return findings
    return findings
