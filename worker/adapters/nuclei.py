from __future__ import annotations
import os

try:
    from worker.adapters.base import run_jsonl_tool
    from worker.models import NormalizedFinding, Severity
except ImportError:
    from adapters.base import run_jsonl_tool
    from models import NormalizedFinding, Severity

TEMPLATES_DIR = os.environ.get("HARIZEON_TEMPLATES_DIR", "worker/templates")

def run_nuclei_checks(
    urls: list[str],
    asset_id: str,
    profile: str,
    template_id_filter: str | None = None,
) -> list[NormalizedFinding]:
    """Execute curated Nuclei YAML template checks against web endpoints."""
    if not urls:
        return []

    cmd = [
        "nuclei", "-silent", "-jsonl", "-nc",
        "-t", TEMPLATES_DIR,
        "-rl", "25",
        "-c", "10",
        "-timeout", "8",
        "-duc",
        "-ni",
        "-H", "User-Agent: HarizeonScanner/1.1 (+https://harizeon.com/scanner)",
    ]

    if template_id_filter:
        cmd.extend(["-id", template_id_filter])
    else:
        severities = "critical,high" if profile == "quick" else "critical,high,medium,low"
        cmd.extend(["-severity", severities])

    findings: list[NormalizedFinding] = []
    try:
        res = run_jsonl_tool(cmd, stdin_lines=urls, timeout_sec=180)
        for rec in res.records:
            info = rec.get("info", {})
            sev: Severity = info.get("severity", "info").lower()
            classification = info.get("classification") or {}
            cwe_list = classification.get("cwe-id") or []
            cve_list = classification.get("cve-id") or []
            tpl_id = rec.get("template-id", "unknown")

            findings.append(NormalizedFinding(
                asset_id=asset_id,
                check_id=f"nuclei:{tpl_id}",
                source_tool="nuclei",
                title=info.get("name", tpl_id),
                severity=sev if sev in ("critical", "high", "medium", "low", "info") else "info",
                location=rec.get("matched-at", rec.get("host", "")),
                evidence=str(rec.get("extracted-results") or rec.get("matcher-name") or "Matched template"),
                cwe_id=cwe_list[0] if cwe_list else None,
                cve_ids=cve_list if isinstance(cve_list, list) else [cve_list],
                remediation=info.get("remediation", "Restrict public access and rotate affected credentials."),
            ))
    except (FileNotFoundError, Exception):
        pass

    return findings
