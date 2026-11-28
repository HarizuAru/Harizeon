from __future__ import annotations

try:
    from worker.adapters.base import run_jsonl_tool
    from worker.models import NormalizedFinding
    from worker.scope import is_public_ip
except ImportError:
    from adapters.base import run_jsonl_tool
    from models import NormalizedFinding
    from scope import is_public_ip

try:
    import checkdmarc
except ImportError:
    checkdmarc = None

try:
    import dns.resolver
except ImportError:
    dns = None

TAKEOVER_CNAME_SIGNATURES = {
    "github.io": "GitHub Pages",
    "herokuapp.com": "Heroku",
    "s3.amazonaws.com": "AWS S3",
    "azurewebsites.net": "Azure App Service",
    "netlify.app": "Netlify",
    "vercel-dns.com": "Vercel",
    "pantheonsite.io": "Pantheon",
}

def resolve_and_audit_dns(
    hosts: list[str], root_domain: str, asset_id: str
) -> tuple[list[str], list[NormalizedFinding]]:
    """Bulk resolve hostnames with dnsx, detect dangling CNAMEs, and audit SPF/DMARC."""
    findings: list[NormalizedFinding] = []
    public_hosts: set[str] = set()

    try:
        res = run_jsonl_tool(
            ["dnsx", "-silent", "-json", "-nc", "-a", "-aaaa", "-cname", "-resp"],
            stdin_lines=hosts,
            timeout_sec=60,
        )
        for rec in res.records:
            host = str(rec.get("host", "")).lower()
            ips = (rec.get("a") or []) + (rec.get("aaaa") or [])
            cnames = rec.get("cname") or []

            if any(is_public_ip(ip) for ip in ips):
                public_hosts.add(host)

            if cnames and not ips:
                for cname in cnames:
                    for suffix, provider in TAKEOVER_CNAME_SIGNATURES.items():
                        if str(cname).lower().endswith(suffix):
                            findings.append(NormalizedFinding(
                                asset_id=asset_id,
                                check_id="dns-dangling-cname-takeover",
                                source_tool="dnsx",
                                title=f"Potential subdomain takeover ({provider})",
                                severity="high",
                                location=f"dns://{host}",
                                evidence=f"CNAME -> {cname} resolves with no active A/AAAA record",
                                cwe_id="CWE-284",
                                remediation=f"Remove the stale CNAME record for {host} or reclaim the target resource on {provider}.",
                            ))
    except (FileNotFoundError, Exception):
        # Fallback to standard DNS resolver if dnsx binary is not present in dev
        for h in hosts:
            if dns:
                try:
                    ans = dns.resolver.resolve(h, "A", lifetime=3.0)
                    for r in ans:
                        if is_public_ip(r.to_text()):
                            public_hosts.add(h)
                except Exception:
                    pass
            else:
                public_hosts.add(h)

    # Email Security Audit on Root Domain (SPF & DMARC)
    if checkdmarc:
        try:
            email_res = checkdmarc.check_domains([root_domain], skip_tls=True)
            dmarc = email_res.get("dmarc", {})
            spf = email_res.get("spf", {})

            if not dmarc.get("valid"):
                findings.append(NormalizedFinding(
                    asset_id=asset_id,
                    check_id="email-missing-dmarc",
                    source_tool="checkdmarc",
                    title="Missing or invalid DMARC record",
                    severity="medium",
                    location=f"dns://_dmarc.{root_domain}",
                    evidence=str(dmarc.get("error", "No DMARC TXT record found")),
                    cwe_id="CWE-290",
                    remediation=f'Publish TXT record at _dmarc.{root_domain} with "v=DMARC1; p=quarantine; rua=mailto:dmarc@{root_domain}" and progress to p=reject.',
                ))
            else:
                policy = (dmarc.get("tags") or {}).get("p", {}).get("value", "none")
                if policy == "none":
                    findings.append(NormalizedFinding(
                        asset_id=asset_id,
                        check_id="email-dmarc-not-enforced",
                        source_tool="checkdmarc",
                        title="DMARC policy set to monitoring only (p=none)",
                        severity="low",
                        location=f"dns://_dmarc.{root_domain}",
                        evidence=f"DMARC record: {dmarc.get('record', '')}",
                        cwe_id="CWE-290",
                        remediation="Upgrade DMARC policy from p=none to p=quarantine or p=reject to prevent domain spoofing.",
                    ))

            if not spf.get("valid"):
                findings.append(NormalizedFinding(
                    asset_id=asset_id,
                    check_id="email-missing-spf",
                    source_tool="checkdmarc",
                    title="Missing or invalid SPF record",
                    severity="medium",
                    location=f"dns://{root_domain}",
                    evidence=str(spf.get("error", "No valid SPF TXT record found")),
                    cwe_id="CWE-290",
                    remediation="Publish a valid SPF TXT record authorizing only your mail senders and ending with -all or ~all.",
                ))
        except Exception:
            pass
    elif dns:
        # Fallback pure-DNS SPF/DMARC check
        try:
            dmarc_answers = dns.resolver.resolve(f"_dmarc.{root_domain}", "TXT", lifetime=3.0)
            dmarc_txt = " ".join(r.to_text().strip('"') for r in dmarc_answers)
            if "p=none" in dmarc_txt:
                findings.append(NormalizedFinding(
                    asset_id=asset_id,
                    check_id="email-dmarc-not-enforced",
                    source_tool="checkdmarc",
                    title="DMARC policy set to monitoring only (p=none)",
                    severity="low",
                    location=f"dns://_dmarc.{root_domain}",
                    evidence=f"DMARC record: {dmarc_txt}",
                    cwe_id="CWE-290",
                    remediation="Upgrade DMARC policy from p=none to p=quarantine or p=reject to prevent domain spoofing.",
                ))
        except Exception:
            findings.append(NormalizedFinding(
                asset_id=asset_id,
                check_id="email-missing-dmarc",
                source_tool="checkdmarc",
                title="Missing or invalid DMARC record",
                severity="medium",
                location=f"dns://_dmarc.{root_domain}",
                evidence="No DMARC TXT record found",
                cwe_id="CWE-290",
                remediation=f'Publish TXT record at _dmarc.{root_domain} with "v=DMARC1; p=quarantine; rua=mailto:dmarc@{root_domain}" and progress to p=reject.',
            ))

    if not public_hosts and root_domain:
        public_hosts.add(root_domain.lower())

    return sorted(public_hosts), findings
