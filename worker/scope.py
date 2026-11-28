"""Egress scope rules for active probing (§11 SSRF defence).

Active phases must never touch private, loopback, link-local, CGNAT or
cloud-metadata addresses. DNS names are permitted here — the resolved IPs are
checked (is_public_ip) before any connection is made.

The one deliberate exception is SANDBOX mode (see sandbox_hosts below): an
explicit hostname/address allowlist for demos and tests. It is ignored whenever
NODE_ENV=production, so the guard cannot be weakened by an env var on a live
deployment.
"""

import ipaddress
import os
import socket

try:
    import dns.resolver
except ImportError:
    dns = None

try:
    import httpx
except ImportError:
    httpx = None

_CGNAT = ipaddress.ip_network("100.64.0.0/10")


def sandbox_hosts():
    """Hosts/addresses the sandbox is allowed to reach (lower-cased).

    Read from HARIZEON_SANDBOX_HOSTS (comma-separated). Always empty in
    production — an env var must never punch a hole in the egress guard (§11).
    """
    if os.environ.get("NODE_ENV") == "production":
        return frozenset()
    raw = os.environ.get("HARIZEON_SANDBOX_HOSTS", "")
    return frozenset(h.strip().lower().rstrip(".") for h in raw.split(",") if h.strip())


def sandbox_enabled():
    return bool(sandbox_hosts())


def is_sandbox_host(name):
    host = (name or "").strip().lower().rstrip(".")
    return bool(host) and host in sandbox_hosts()


def is_public_ip(value):
    """True only for globally routable IP addresses (or an allowlisted sandbox address)."""
    try:
        ip = ipaddress.ip_address(value)
    except (ValueError, TypeError):
        return False
    if str(ip) in sandbox_hosts():
        return True
    if isinstance(ip, ipaddress.IPv4Address) and ip in _CGNAT:
        return False
    return not (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    )


def is_public_host(name_or_ip):
    """DNS names are allowed (validated at resolve time); IPs are checked now."""
    host = (name_or_ip or "").strip().lower().rstrip(".")
    if not host:
        return False
    if host in sandbox_hosts():
        return True
    try:
        ipaddress.ip_address(host)
    except ValueError:
        return True
    return is_public_ip(host)


def first_public_ip(addresses):
    """Return the first globally-routable address, or None.

    Used to pin a connection to a validated address instead of re-resolving the
    name at connect time (§11: DNS rebinding between check and connect).
    """
    for addr in addresses or []:
        if is_public_ip(addr):
            return addr
    return None


def resolve_public_ips(hostname: str) -> list[str]:
    """Resolve hostname and return only globally-routable public IP addresses."""
    ips: set[str] = set()
    try:
        for info in socket.getaddrinfo(hostname, None, type=socket.SOCK_STREAM):
            ip = info[4][0]
            if is_public_ip(ip):
                ips.add(ip)
    except socket.gaierror:
        return []
    return sorted(ips)


def is_in_domain_scope(candidate: str, root_domain: str) -> bool:
    """Ensure candidate hostname is equal to or a subdomain of the root target."""
    c = candidate.strip().lower().rstrip(".")
    r = root_domain.strip().lower().rstrip(".")
    return c == r or c.endswith(f".{r}")


def verify_ownership(domain: str, token: str, method: str) -> bool:
    """Phase 1 mandatory gate: cryptographic ownership check with zero bypasses."""
    if not token or len(token) < 16:
        return False

    if method == "dns_txt":
        if dns is None:
            return False
        try:
            answers = dns.resolver.resolve(f"_harizeon-verify.{domain}", "TXT", lifetime=5.0)
            return any(token in r.to_text().strip('"') for r in answers)
        except Exception:
            return False

    if method == "http_file":
        if httpx is None:
            return False
        public_ips = resolve_public_ips(domain)
        if not public_ips:
            return False
        url = f"https://{domain}/.well-known/harizeon-verification.txt"
        try:
            with httpx.Client(timeout=5.0, follow_redirects=False) as client:
                resp = client.get(url, headers={"User-Agent": "HarizeonVerifier/1.1"})
                return resp.status_code == 200 and resp.text.strip() == token
        except Exception:
            return False

    return False

