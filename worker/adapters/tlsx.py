from __future__ import annotations
from datetime import datetime, timezone

try:
    from worker.adapters.base import run_jsonl_tool
    from worker.models import NormalizedFinding
except ImportError:
    from adapters.base import run_jsonl_tool
    from models import NormalizedFinding

WEAK_TLS = {"ssl30", "tls10", "tls11"}

def inspect_tls(hosts: list[str], asset_id: str) -> tuple[dict[str, str], list[NormalizedFinding]]:
    """Audit TLS versions, certificate validity, expiration date, and cipher strength with tlsx."""
    if not hosts:
        return {}, []

    expiry_map: dict[str, str] = {}
    findings: list[NormalizedFinding] = []
    now = datetime.now(timezone.utc)

    try:
        res = run_jsonl_tool(
            ["tlsx", "-silent", "-json", "-nc", "-expired", "-self-signed", "-mismatched", "-tv", "-cipher", "-timeout", "8"],
            stdin_lines=hosts,
            timeout_sec=60,
        )

        for rec in res.records:
            host = rec.get("host", "unknown")
            port = rec.get("port", "443")
            loc = f"tls://{host}:{port}"
            not_after = rec.get("not_after")

            if not_after:
                expiry_map[host] = str(not_after)
                try:
                    exp_dt = datetime.fromisoformat(str(not_after).replace("Z", "+00:00"))
                    days_left = (exp_dt - now).days
                    if 0 <= days_left <= 14:
                        findings.append(NormalizedFinding(
                            asset_id=asset_id,
                            check_id="tls-cert-expiring-soon",
                            source_tool="tlsx",
                            title=f"TLS certificate expires in {days_left} days",
                            severity="medium",
                            location=loc,
                            evidence=f"Certificate expires on {not_after}",
                            cwe_id="CWE-298",
                            remediation="Renew TLS certificate and enable automated ACME/Certbot renewal.",
                        ))
                except ValueError:
                    pass

            if rec.get("expired"):
                findings.append(NormalizedFinding(
                    asset_id=asset_id,
                    check_id="tls-cert-expired",
                    source_tool="tlsx",
                    title="Expired TLS certificate",
                    severity="high",
                    location=loc,
                    evidence=f"Expired on {not_after}",
                    cwe_id="CWE-295",
                    remediation="Renew and deploy a valid TLS certificate immediately.",
                ))

            if rec.get("self_signed"):
                findings.append(NormalizedFinding(
                    asset_id=asset_id,
                    check_id="tls-cert-self-signed",
                    source_tool="tlsx",
                    title="Self-signed TLS certificate on public endpoint",
                    severity="medium",
                    location=loc,
                    evidence=f"Issuer: {rec.get('issuer_org')}",
                    cwe_id="CWE-295",
                    remediation="Replace self-signed certificate with a trusted CA certificate (e.g., Let's Encrypt).",
                ))

            tls_ver = str(rec.get("tls_version", "")).lower()
            if tls_ver in WEAK_TLS:
                findings.append(NormalizedFinding(
                    asset_id=asset_id,
                    check_id="tls-deprecated-protocol",
                    source_tool="tlsx",
                    title=f"Deprecated TLS protocol supported ({tls_ver})",
                    severity="medium",
                    location=loc,
                    evidence=f"Negotiated {tls_ver} with cipher {rec.get('cipher')}",
                    cwe_id="CWE-327",
                    remediation="Disable SSLv3, TLS 1.0, and TLS 1.1; enforce TLS 1.2+ (prefer TLS 1.3).",
                ))
    except (FileNotFoundError, Exception):
        for h in hosts:
            expiry_map[h] = now.isoformat()

    return expiry_map, findings
