"""TLS / security-header inspection (worker's inspect phase).

Pure logic with injected `tls_fn` and `http_fn`; the ssl/httpx implementations
live in adapters.py. Every check maps to the §07 finding schema and is
deterministic so it can be tested without a network.
"""

import datetime


def _date(value):
    if isinstance(value, datetime.datetime):
        return value.replace(tzinfo=None) if value.tzinfo else value
    try:
        return datetime.datetime.fromisoformat(str(value).replace("Z", "+00:00")).replace(tzinfo=None)
    except (ValueError, TypeError):
        return None


# --- TLS -------------------------------------------------------------------

def inspect_tls(info):
    """info: {"version": str|None, "not_after": str|datetime|None} -> findings."""
    findings = []
    if not info:
        return findings

    version = (info.get("version") or "").lower()
    if version in ("sslv2", "sslv3", "tlsv1", "tlsv1.0", "tlsv1.1"):
        findings.append({
            "check_id": "tls.legacy_protocol",
            "location": info.get("host", ""),
            "severity": "critical" if version in ("sslv2", "sslv3") else "medium",
            "title": "Legacy TLS protocol enabled (%s)" % info.get("version"),
            "description": "The server negotiates %s, which is deprecated and vulnerable to known attacks." % info.get("version"),
            "remediation": "Disable legacy TLS and allow only TLS 1.2 and 1.3.",
            "category": "tls",
        })

    expiry = _date(info.get("not_after"))
    if expiry:
        days = (expiry - datetime.datetime.utcnow()).days
        if days < 0:
            findings.append({
                "check_id": "tls.cert_expired",
                "location": info.get("host", ""),
                "severity": "critical",
                "title": "TLS certificate has expired",
                "description": "The certificate expired %d day(s) ago; browsers will refuse the connection." % abs(days),
                "remediation": "Renew the certificate and enable automated renewal.",
                "category": "tls",
            })
        elif days <= 14:
            findings.append({
                "check_id": "tls.cert_expiring_soon",
                "location": info.get("host", ""),
                "severity": "medium",
                "title": "TLS certificate expires in %d day(s)" % days,
                "description": "The certificate expires soon; an expiry causes an outage and lost trust.",
                "remediation": "Renew the certificate and enable automated renewal.",
                "category": "tls",
            })
    return findings


# --- Security headers ------------------------------------------------------

# (header, present?, expected value prefix, severity when missing)
HEADER_CHECKS = [
    ("strict-transport-security", True, None, "medium", "tls.hsts_missing",
     "HSTS is not enabled",
     "Browsers can be tricked into using plain HTTP (downgrade/SSL-stripping).",
     "Send Strict-Transport-Security: max-age=31536000; includeSubDomains."),
    ("content-security-policy", True, None, "medium", "headers.csp_missing",
     "No Content-Security-Policy",
     "Without CSP, injected scripts run unchecked (XSS impact is much higher).",
     "Add a Content-Security-Policy header, starting with default-src 'self'."),
    ("x-content-type-options", True, "nosniff", "low", "headers.nosniff_missing",
     "X-Content-Type-Options is missing",
     "Browsers may MIME-sniff responses and execute content as a different type.",
     "Send X-Content-Type-Options: nosniff."),
    ("x-frame-options", True, None, "low", "headers.frame_options_missing",
     "No clickjacking protection",
     "The page can be framed, enabling clickjacking against your users.",
     "Send X-Frame-Options: DENY (or a frame-ancestors CSP directive)."),
    ("server", False, None, "low", "headers.server_disclosed",
     "Server version disclosed",
     "The Server header advertises the software version, helping attackers.",
     "Remove or genericise the Server header."),
]


def inspect_headers(headers, host, is_https=True):
    """headers: dict[str, str] -> findings. HSTS only applies to https."""
    findings = []
    lowered = {str(k).lower(): str(v) for k, v in (headers or {}).items()}
    for name, must_be_absent, expected, severity, check_id, title, description, remediation in HEADER_CHECKS:
        if name == "strict-transport-security" and not is_https:
            continue  # HSTS only means anything on https responses
        present = name in lowered
        if must_be_absent and not present:
            findings.append({
                "check_id": check_id,
                "location": host,
                "severity": severity,
                "title": title,
                "description": description,
                "remediation": remediation,
                "category": "headers",
            })
        elif not must_be_absent and present:
            findings.append({
                "check_id": check_id,
                "location": host,
                "severity": severity,
                "title": title,
                "description": description,
                "remediation": remediation,
                "category": "headers",
            })
        elif expected and present and not lowered[name].lower().startswith(expected):
            findings.append({
                "check_id": check_id,
                "location": host,
                "severity": severity,
                "title": title,
                "description": description,
                "remediation": remediation,
                "category": "headers",
            })
    return findings


def inspect_target(host, tls_info, headers, is_https=True):
    return inspect_tls({**(tls_info or {}), "host": host}) + inspect_headers(headers, host, is_https)
