"""Active TCP probe (connect scan + banner grab) for the worker's probe phase.

Pure logic with injected `resolve_fn` and `connect_fn`; the socket implementation
lives in adapters.py. Scope rules (scope.py) are enforced: only public IPs are
ever connected to.
"""

import scope

# (port, service) — the ports a small team actually runs (§09.2 "common ports").
COMMON_PORTS = [
    (21, "ftp"), (22, "ssh"), (25, "smtp"), (53, "dns"), (80, "http"),
    (110, "pop3"), (143, "imap"), (443, "https"), (465, "smtps"), (587, "smtp"),
    (993, "imaps"), (995, "pop3s"), (3306, "mysql"), (3389, "rdp"),
    (5432, "postgres"), (6379, "redis"), (8080, "http-alt"), (8443, "https-alt"),
]

# deep profile adds the services that should never face the internet.
EXTENDED_PORTS = COMMON_PORTS + [
    (23, "telnet"), (445, "smb"), (1433, "mssql"), (2049, "nfs"),
    (2375, "docker"), (5900, "vnc"), (6443, "k8s-api"),
    (9200, "elasticsearch"), (11211, "memcached"), (27017, "mongodb"),
]

# Open ports on these services are findings, not inventory.
SENSITIVE_SERVICES = {
    "ftp": "high", "telnet": "critical", "mysql": "high", "postgres": "high",
    "redis": "critical", "mssql": "high", "mongodb": "high", "smb": "high",
    "elasticsearch": "high", "memcached": "high", "docker": "critical",
    "vnc": "critical", "rdp": "medium", "k8s-api": "high", "nfs": "high",
}


def ports_for(profile):
    return list(EXTENDED_PORTS if profile == "deep" else COMMON_PORTS)


def port_service(port):
    for number, service in COMMON_PORTS:
        if number == port:
            return service
    for number, service in EXTENDED_PORTS:
        if number == port:
            return service
    return str(port)


def normalise_host(value):
    host = (value or "").strip().lower().rstrip(".")
    if host.startswith("http://") or host.startswith("https://"):
        host = host.split("://", 1)[1]
    return host.split("/")[0].split(":")[0]


def probe_target(target_value, profile, resolve_fn, connect_fn, timeout=1.0):
    """Scan one target. Returns {"host", "ips", "open", "skipped"}.

    resolve_fn(host) -> list[str]
    connect_fn(ip, port, timeout) -> {"open": bool, "banner": str | None}
    """
    host = normalise_host(target_value)
    if not host:
        return {"host": "", "ips": [], "open": [], "skipped": "empty target"}
    if not scope.is_public_host(host):
        return {"host": host, "ips": [], "open": [], "skipped": "not a public host"}

    resolved = resolve_fn(host) or []
    # A sandbox host may legitimately resolve to a private address.
    ips = [ip for ip in resolved if scope.is_public_ip(ip) or scope.is_sandbox_host(host)]
    if not ips:
        return {"host": host, "ips": [], "open": [], "skipped": "no public address"}

    open_ports = []
    for port, service in ports_for(profile):
        for ip in ips[:2]:
            try:
                result = connect_fn(ip, port, timeout)
            except Exception:  # noqa: BLE001 - a refused/timeout port is normal
                result = {"open": False, "banner": None}
            if result and result.get("open"):
                open_ports.append({
                    "port": port,
                    "service": service,
                    "ip": ip,
                    "banner": (result.get("banner") or "")[:200],
                })
                break
    return {"host": host, "ips": ips, "open": open_ports, "skipped": None}


def port_findings(open_ports):
    """Findings for services that must not face the internet."""
    findings = []
    seen = set()
    for entry in open_ports:
        service = entry.get("service", "")
        if service in SENSITIVE_SERVICES and service not in seen:
            seen.add(service)
            findings.append({
                "check_id": "probe.exposed_service",
                "location": "%s:%s" % (entry.get("ip", ""), entry.get("port", "")),
                "severity": SENSITIVE_SERVICES[service],
                "title": "Exposed %s service (port %s)" % (service, entry.get("port")),
                "description": "A %s service is reachable from the internet on port %s." % (service, entry.get("port")),
                "remediation": "Bind the service to a private interface or firewall port %s." % entry.get("port"),
                "category": "exposed_service",
            })
    return findings
