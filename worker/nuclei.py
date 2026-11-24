"""Nuclei template scanning for the test phase (standard + deep profiles).

Output is JSONL (-jsonl); every field is capped to the ingest limits the
control plane enforces (title 200, description/remediation 2000, location 300,
cve_ids 10, severity enum) so nothing is dropped at the queue boundary.
"""

import re

import tools

CVE_RE = re.compile(r"^CVE-\d{4}-\d{4,}$")
SEVERITIES = ("info", "low", "medium", "high", "critical")


def have():
    return tools.available("nuclei")


def _as_list(value):
    if value is None:
        return []
    if isinstance(value, (list, tuple)):
        return [str(v) for v in value]
    return [str(value)]


def parse_jsonl(text):
    findings = []
    seen = set()
    for row in tools.json_lines(text):
        sev = str(row.get("severity") or "info").strip().lower()
        if sev not in SEVERITIES:
            sev = "info"
        template = str(row.get("template-id") or row.get("templateID") or "unknown")
        matched = str(row.get("matched-at") or row.get("matched") or row.get("host") or "")[:300]
        key = (template, matched)
        if key in seen:
            continue
        seen.add(key)

        cves = []
        for candidate in _as_list(row.get("cve-id") or row.get("cve_id")):
            candidate = candidate.strip().upper()
            if CVE_RE.match(candidate) and candidate not in cves:
                cves.append(candidate)
        cwes = [c for c in _as_list(row.get("cwe-id") or row.get("cwe_id")) if c]

        finding = {
            "check_id": "nuclei.%s" % template,
            "location": matched,
            "severity": sev,
            "title": str(row.get("name") or template)[:200],
            "category": "web",
        }
        description = str(row.get("description") or "").strip()
        if description:
            finding["description"] = description[:2000]
        remediation = str(row.get("remediation") or "").strip()
        if remediation:
            finding["remediation"] = remediation[:2000]
        if cwes:
            finding["cwe_id"] = cwes[0][:20]
        if cves:
            finding["cve_ids"] = cves[:10]
        refs = [str(r) for r in _as_list(row.get("reference"))]
        extracted = [str(r) for r in _as_list(row.get("extracted-results"))]
        evidence = "; ".join((extracted + refs)[:5])
        if evidence:
            finding["evidence"] = evidence[:500]
        findings.append(finding)
    return findings


def scan_url(url, run_fn=tools.run, timeout=180):
    """Run nuclei against one URL. Bounded by timeout; ToolError on failure."""
    out = run_fn(
        [
            "nuclei",
            "-u", url,
            "-jsonl",
            "-silent",
            "-nc",
            "-duc",
            "-severity", "low,medium,high,critical",
            "-timeout", "10",
        ],
        timeout=timeout,
    )
    return parse_jsonl(out)
