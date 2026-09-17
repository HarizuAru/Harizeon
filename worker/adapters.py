"""Concrete network I/O adapters for the worker.

Kept out of discovery.py so the pure discovery tests run with no third-party
packages installed (CI runs them on a bare Python). Only worker.py imports this.
"""

import dns.resolver
import httpx

TIMEOUT = 10.0
USER_AGENT = "Harizeon-Discovery/0.1"


def http_get(url):
    """Return (status_code, body). Raises on transport errors (callers tolerate)."""
    resp = httpx.get(url, timeout=TIMEOUT, follow_redirects=True, headers={"User-Agent": USER_AGENT})
    return resp.status_code, resp.text


def dns_lookup(name, rtype):
    """Return the record values of `rtype` for `name`, or [] if none."""
    try:
        answers = dns.resolver.resolve(name, rtype, lifetime=TIMEOUT)
    except (
        dns.resolver.NXDOMAIN,
        dns.resolver.NoAnswer,
        dns.resolver.NoNameservers,
        dns.resolver.LifetimeTimeout,
    ):
        return []
    out = []
    for record in answers:
        out.append(record.to_text().strip('"'))
    return out
