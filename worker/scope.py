"""Egress scope rules for active probing (§11 SSRF defence).

Active phases must never touch private, loopback, link-local, CGNAT or
cloud-metadata addresses. DNS names are permitted here — the resolved IPs are
checked (is_public_ip) before any connection is made.
"""

import ipaddress

_CGNAT = ipaddress.ip_network("100.64.0.0/10")


def is_public_ip(value):
    """True only for globally routable IP addresses."""
    try:
        ip = ipaddress.ip_address(value)
    except (ValueError, TypeError):
        return False
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
    try:
        ipaddress.ip_address(host)
    except ValueError:
        return True
    return is_public_ip(host)
