from __future__ import annotations
import json
from urllib.parse import urlparse

try:
    from worker.adapters.base import run_jsonl_tool
    from worker.models import NormalizedFinding, Severity
    from worker.scope import is_in_domain_scope, resolve_public_ips
except ImportError:
    from adapters.base import run_jsonl_tool
    from models import NormalizedFinding, Severity
    from scope import is_in_domain_scope, resolve_public_ips

SEV_MAP: dict[str, Severity] = {
    "CRITICAL": "critical",
    "HIGH": "high",
    "MEDIUM": "medium",
    "LOW": "low",
    "SAFE": "info",
}

def scan_remote_mcp_servers(
    endpoints: list[str], root_domain: str, asset_id: str
) -> list[NormalizedFinding]:
    """Scan remote Model Context Protocol (MCP) server endpoints for unauthorized tool exposure."""
    findings: list[NormalizedFinding] = []

    for url in endpoints:
        parsed = urlparse(url)
        host = parsed.hostname or ""
        if not host or not is_in_domain_scope(host, root_domain) or not resolve_public_ips(host):
            continue

        try:
            res = run_jsonl_tool(
                [
                    "mcp-scanner",
                    "--analyzers", "yara,readiness",
                    "--format", "raw",
                    "remote",
                    "--server-url", url,
                ],
                timeout_sec=90,
            )

            for entry in res.records:
                if entry.get("is_safe", True):
                    continue
                tool_name = entry.get("tool_name", "unknown-tool")
                raw_sev = str(entry.get("severity", "HIGH")).upper()
                findings.append(NormalizedFinding(
                    asset_id=asset_id,
                    check_id=f"mcp:{entry.get('rule_id', 'unsafe-tool')}:{tool_name}",
                    source_tool="cisco-mcp-scanner",
                    title=f"Exposed or unsafe MCP server tool: {tool_name}",
                    severity=SEV_MAP.get(raw_sev, "high"),
                    location=f"{url}#{tool_name}",
                    evidence=json.dumps(entry.get("findings", entry)),
                    cwe_id="CWE-284",
                    remediation="Enforce OAuth/Bearer authentication on remote MCP SSE/HTTP endpoints and audit tool definitions.",
                ))
        except (FileNotFoundError, Exception):
            pass

    return findings
