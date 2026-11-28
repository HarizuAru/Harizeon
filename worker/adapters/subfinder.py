from __future__ import annotations

try:
    from worker.adapters.base import run_jsonl_tool
    from worker.scope import is_in_domain_scope
except ImportError:
    from adapters.base import run_jsonl_tool
    from scope import is_in_domain_scope

def discover_subdomains(root_domain: str, timeout_sec: int = 60) -> list[str]:
    """Run subfinder passive multi-source enumeration with scope filtering."""
    try:
        res = run_jsonl_tool(
            ["subfinder", "-d", root_domain, "-silent", "-json", "-nc"],
            timeout_sec=timeout_sec,
        )
        found: set[str] = {root_domain.lower()}
        for rec in res.records:
            host = str(rec.get("host", "")).lower().strip()
            if host and is_in_domain_scope(host, root_domain):
                found.add(host)
        return sorted(found)
    except (FileNotFoundError, TimeoutError, Exception):
        return [root_domain.lower()]
