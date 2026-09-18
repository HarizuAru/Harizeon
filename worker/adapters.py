"""Concrete network I/O adapters for the worker.

Kept out of the pure modules (discovery.py, probe.py, inspect_.py) so their tests
run with no third-party packages installed. Only worker.py imports this module.
"""

import socket
import ssl
from datetime import datetime, timezone

import httpx

from cryptography import x509

TIMEOUT = 10.0
USER_AGENT = "Harizeon-Worker/0.2"


def http_get(url):
    """Return (status_code, body). Raises on transport errors (callers tolerate)."""
    resp = httpx.get(url, timeout=TIMEOUT, follow_redirects=True, headers={"User-Agent": USER_AGENT})
    return resp.status_code, resp.text


def dns_lookup(name, rtype):
    """Return the record values of `rtype` for `name`, or [] if none."""
    import dns.resolver
    import dns.exception

    try:
        answers = dns.resolver.resolve(name, rtype, lifetime=TIMEOUT)
    except (
        dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.NoNameservers,
        dns.resolver.LifetimeTimeout, dns.exception.Timeout,
    ):
        return []
    out = []
    for record in answers:
        out.append(record.to_text().strip('"'))
    return out


def tcp_probe(ip, port, timeout=1.5):
    """TCP connect scan with a banner grab. Never raises."""
    try:
        with socket.create_connection((ip, port), timeout=timeout) as sock:
            sock.settimeout(timeout)
            banner = ""
            try:
                if port in (80, 8080):
                    sock.sendall(b"HEAD / HTTP/1.0\r\n\r\n")
                banner = sock.recv(256).decode("utf-8", "replace")
            except (socket.timeout, OSError):
                banner = ""
            return {"open": True, "banner": banner}
    except (socket.timeout, OSError):
        return {"open": False, "banner": None}


def tls_info(host, port=443, timeout=4.0):
    """Which TLS versions the endpoint accepts + certificate details."""
    from cryptography import x509

    info = {"host": host, "version": None}

    # Weakest protocol the server still accepts (legacy-protocol finding).
    for name, version in (("TLSv1", ssl.TLSVersion.TLSv1), ("TLSv1.1", ssl.TLSVersion.TLSv1_1)):
        try:
            ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
            ctx.minimum_version = version
            ctx.maximum_version = version
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            with socket.create_connection((host, port), timeout=timeout) as sock:
                with ctx.wrap_socket(sock, server_hostname=host):
                    info["version"] = name
                    break
        except Exception:  # noqa: BLE001 - the server rejects old TLS: good
            pass

    if info["version"] is None:
        info["version"] = "TLSv1.2+"

    try:
        pem = ssl.get_server_certificate((host, port))
        cert = x509.load_pem_x509_certificate(pem.encode())
        try:
            not_after = cert.not_valid_after_utc
        except AttributeError:  # cryptography < 42
            not_after = cert.not_valid_after.replace(tzinfo=timezone.utc)
        issuer = ""
        try:
            issuer = cert.issuer.rfc4514_string()
        except Exception:  # noqa: BLE001
            pass
        info["not_after"] = not_after
        info["issuer"] = issuer[:200]
        info["days_left"] = (not_after - datetime.now(timezone.utc)).days
    except Exception:  # noqa: BLE001 - no TLS on this port
        info["not_after"] = None
    return info


def fetch_headers(url):
    """Security-header check on the FIRST response — redirects are not followed
    (§11: a redirect could point the request at internal infrastructure)."""
    resp = httpx.get(url, timeout=TIMEOUT, follow_redirects=False, headers={"User-Agent": USER_AGENT})
    return {str(k).lower(): str(v) for k, v in resp.headers.items()}, resp.status_code


def http_get_full(url, body_cap=2000):
    """webcheck fetch: first response (no redirects), body capped."""
    resp = httpx.get(url, timeout=TIMEOUT, follow_redirects=False, headers={"User-Agent": USER_AGENT})
    return {
        "status": resp.status_code,
        "body": resp.text[:body_cap],
        "headers": {str(k).lower(): str(v) for k, v in resp.headers.items()},
    }

