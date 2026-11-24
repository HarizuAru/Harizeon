"""ProjectDiscovery engines (subfinder / dnsx / httpx) as optional power.

subfinder  -> discover phase: passive subdomain sources on top of CT + wordlist
dnsx       -> resolve phase: batch A-record resolution feeding the probe cache
httpx      -> probe phase: live web endpoints our port list missed (8443, 8000, ...)

Every entry point takes an injectable run_fn so tests never spawn a process.
The caller gates on have() first; tools.ToolError is logged as a warn line.
"""

import ipaddress
import json

import tools

MAX_NAMES = 200
MAX_RESOLVE = 80


def have(name):
    return tools.available(name)


def parse_subfinder(text):
    """JSONL -> ordered unique fqdns (lowercased, trailing dot stripped)."""
    names = []
    for row in tools.json_lines(text):
        host = str(row.get("host") or row.get("domain") or "").strip().lower().rstrip(".")
        if host and host not in names:
            names.append(host)
    return names[:MAX_NAMES]


def run_subfinder(domain, run_fn=tools.run, timeout=90):
    out = run_fn(
        ["subfinder", "-silent", "-json", "-d", domain],
        timeout=timeout,
    )
    return parse_subfinder(out)


def parse_dnsx(text):
    """'host [1.2.3.4,1.2.3.5]' lines -> {host: [ips]}; junk lines ignored."""
    resolved = {}
    for line in (text or "").splitlines():
        line = line.strip()
        if not line:
            continue
        host, sep, bracket = line.partition(" [")
        if not sep:
            continue
        ips = []
        for candidate in bracket.rstrip("]").split(","):
            candidate = candidate.strip()
            try:
                ipaddress.ip_address(candidate)
            except ValueError:
                continue
            ips.append(candidate)
        if ips:
            resolved[host.strip()] = ips
    return resolved


def run_dnsx(hosts, run_fn=tools.run, timeout=60):
    hosts = [h for h in dict.fromkeys(hosts) if h][:MAX_RESOLVE]
    if not hosts:
        return {}
    out = run_fn(
        ["dnsx", "-silent", "-a", "-resp"],
        timeout=timeout,
        input_text="\n".join(hosts) + "\n",
    )
    return parse_dnsx(out)


def parse_httpx(text):
    """JSONL -> [{url, port, scheme, status, title, tech}]."""
    endpoints = []
    for row in tools.json_lines(text):
        url = str(row.get("url") or "").strip()
        if not url:
            continue
        try:
            port = int(row.get("port") or 0)
        except (TypeError, ValueError):
            port = 0
        try:
            status = int(row.get("status_code") or 0)
        except (TypeError, ValueError):
            status = 0
        scheme = str(row.get("scheme") or "")
        if not scheme and "://" in url:
            scheme = url.split("://", 1)[0]
        tech = row.get("tech") or []
        if isinstance(tech, dict):
            tech = list(tech.keys())
        endpoints.append(
            {
                "url": url,
                "port": port,
                "scheme": scheme,
                "status": status,
                "title": str(row.get("title") or "")[:200],
                "tech": [str(t) for t in tech][:20],
            }
        )
    return endpoints


def run_httpx(hosts, run_fn=tools.run, timeout=90):
    hosts = [h for h in hosts if h]
    if not hosts:
        return []
    out = run_fn(
        ["httpx", "-silent", "-json", "-title", "-td"],
        timeout=timeout,
        input_text="\n".join(hosts) + "\n",
    )
    return parse_httpx(out)
