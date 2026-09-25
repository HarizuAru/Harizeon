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
