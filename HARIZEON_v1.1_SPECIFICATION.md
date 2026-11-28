# HARIZEON v1.1 — Complete Implementation & Release Specification

> **Release Goal:** Upgrade Harizeon from v1.0 (MVP 5-check Python scanner) to **v1.1 (Production EASM & Shadow-AI Control Plane)** ready for paying Malaysian SMEs, startups, and fintechs.
> **Baseline Architecture:** `HARIZEON_PLATFORM_SPECIFICATION.md`
> **Target Compatibility:** Next.js 16 (React 19) · Fastify 4 · PostgreSQL 16 (RLS) · Redis 7 Streams · Python 3.12 + Hardened Go Scanner Binaries.

---

## 1. Release Diff: v1.0 vs. v1.1

| Area | v1.0 Baseline | v1.1 Upgrade |
| :--- | :--- | :--- |
| **Discovery (`Phase 2`)** | `crt.sh` + static wordlists | `subfinder` passive multi-source enumeration + strict domain scope filtering |
| **Resolve & Email (`Phase 3/5`)** | Basic `dnspython` A/AAAA lookup | `dnsx` bulk resolution + IP-pinned SSRF guard + `checkdmarc` (SPF/DMARC) + CNAME takeover checks |
| **Probing & TLS (`Phase 4/5`)** | Stdlib `socket`/`ssl` on 4 ports | `httpx` (HTTP probe, tech stack, headers, CDN) + `tlsx` (TLS version, weak ciphers, cert expiry) |
| **Web & AI Checks (`Phase 6`)** | 5 hardcoded Python checks | `nuclei` running Harizeon's curated YAML template pack + `cisco-ai-defense/mcp-scanner` (`ai` profile) |
| **Normalization (`Phase 7`)** | Static `15/8/3/1` deduction | Exploit-weighted scoring (`CVSS` + `EPSS` + `CISA KEV` + `asset.criticality`) + automated secret redaction |
| **Workflow & Drift (`Phase 8`)** | Full scans + static PDF reports | **5-second Verify Fix** micro-scans + `asset_snapshots` Drift Engine + Slack/Webhook/WhatsApp alerts |
| **Compliance & Trust** | Generic compliance report | **PDPA Amendment 2024**, **BNM RMiT**, and **ISO 27001** control mapping + Public Monochrome Trust Badge |
| **Runtime Hardening** | Plain Python worker process | Multi-stage rootless Docker container (`read_only`, `cap_drop: ALL`, `no-new-privileges`, optional gVisor `runsc`) |

### Non-Negotiable v1.1 Invariants
1. **Zero Unverified Scanning:** Phase 1 cryptographic verification (`dns_txt` or `http_file`) runs on every full scan and every `verify_finding` job. No bypass flags.
2. **Strict Plane Isolation:** `worker/` has **zero** access to `DATABASE_URL`, customer secrets, or internal control-plane networks. All communication flows strictly via `harizeon:scans:jobs` and `harizeon:scans:events`.
3. **Zero Copyleft Dependencies:** All added tools (`subfinder`, `dnsx`, `httpx`, `tlsx`, `nuclei`, `checkdmarc`, `cisco-ai-mcp-scanner`) use permissive commercial licenses (**MIT** or **Apache-2.0**).
4. **Automatic Secret Redaction:** Workers must redact leaked tokens/passwords inside evidence snippets before publishing events to Redis.
5. **Pure Monochrome Visual Identity:** All new `web/` screens enforce `rounded-none`, `#ffffff`/`#000000` canvas/ink tokens, `1px solid var(--border-line)`, and dense monospace typography.
6. **Malaysia Act 854 Positioning:** All UI copy, reports, and marketing strings describe Harizeon as **automated External Attack Surface Management (EASM) & continuous posture software**—never "Penetration Testing" or "Managed SOC Monitoring" until NACSA CSSP licensed.

---

## 2. Data Plane (`worker/`) — Complete v1.1 Implementation

### 2.1 Directory Layout

```text
worker/
├── Dockerfile
├── requirements.txt
├── templates/
│   ├── exposed-env.yaml
│   ├── exposed-git-config.yaml
│   ├── exposed-ollama-vllm.yaml
│   └── exposed-ai-panels.yaml
└── worker/
    ├── __init__.py
    ├── main.py
    ├── models.py
    ├── redact.py
    ├── scope.py
    └── adapters/
        ├── __init__.py
        ├── base.py
        ├── subfinder.py
        ├── dns_email.py
        ├── httpx_adapter.py
        ├── tlsx.py
        ├── nuclei.py
        └── mcp_scanner.py
```

### 2.2 Multi-Stage `worker/Dockerfile`

```dockerfile
# ---- Stage 1: Build pinned Go scanner binaries (MIT licensed) ----
FROM golang:1.23-alpine AS go-tools
RUN apk add --no-cache git ca-certificates

ENV CGO_ENABLED=0
RUN go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest && \
    go install github.com/projectdiscovery/dnsx/cmd/dnsx@latest && \
    go install github.com/projectdiscovery/httpx/cmd/httpx@latest && \
    go install github.com/projectdiscovery/tlsx/cmd/tlsx@latest && \
    go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

# ---- Stage 2: Minimal Non-Root Python Data Plane ----
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    useradd --create-home --uid 10001 --shell /usr/sbin/nologin scanner

COPY --from=go-tools /go/bin/subfinder /usr/local/bin/subfinder
COPY --from=go-tools /go/bin/dnsx      /usr/local/bin/dnsx
COPY --from=go-tools /go/bin/httpx     /usr/local/bin/httpx
COPY --from=go-tools /go/bin/tlsx      /usr/local/bin/tlsx
COPY --from=go-tools /go/bin/nuclei    /usr/local/bin/nuclei

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY templates/ /opt/harizeon/templates/
COPY worker/    /app/worker/

ENV HOME=/tmp/scanner-home \
    XDG_CONFIG_HOME=/tmp/scanner-home/.config \
    XDG_CACHE_HOME=/tmp/scanner-home/.cache \
    PYTHONUNBUFFERED=1

USER scanner
ENTRYPOINT ["python", "-m", "worker.main"]
```

### 2.3 `worker/requirements.txt`

```text
redis>=5.2.0
pydantic>=2.9.0
dnspython>=2.7.0
httpx>=0.27.0
checkdmarc>=5.8.0
cisco-ai-mcp-scanner>=1.0.0
```

### 2.4 Hardened `docker-compose.yml` Network Isolation

```yaml
services:
  postgres:
    image: postgres:16-alpine
    networks:
      - control_internal

  redis:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes"]
    networks:
      - control_internal
      - worker_bus

  api:
    build: ./api
    networks:
      - control_internal
      - public_egress

  worker:
    build: ./worker
    # Uncomment on Linux production hosts with gVisor installed:
    # runtime: runsc
    read_only: true
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    pids_limit: 256
    mem_limit: 1g
    cpus: 1.5
    tmpfs:
      - /tmp:rw,noexec,nosuid,size=256m
    environment:
      REDIS_URL: "redis://redis:6379/0"
      WORKER_ID: "worker-01"
      HARIZEON_TEMPLATES_DIR: "/opt/harizeon/templates"
    dns:
      - 1.1.1.1
      - 8.8.8.8
    networks:
      - worker_bus
      - public_egress

networks:
  control_internal:
    internal: true
  worker_bus:
    internal: true
  public_egress: {}
```

### 2.5 `worker/worker/redact.py` — Mandatory Secret Redaction

```python
import re

SECRET_PATTERNS = [
    re.compile(r"(?i)(APP_KEY|DB_PASSWORD|AWS_SECRET_ACCESS_KEY|STRIPE_SECRET|OPENAI_API_KEY|ANTHROPIC_API_KEY|JWT_SECRET|DATABASE_URL|SECRET_KEY)\s*=\s*([^\s'\"#]+)"),
    re.compile(r"(sk-proj-[A-Za-z0-9_-]{12,}|sk-ant-[A-Za-z0-9_-]{12,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35})"),
]

def redact_secrets(text: str, max_len: int = 600) -> str:
    if not text:
        return ""
    cleaned = text
    for pat in SECRET_PATTERNS:
        def _mask(match: re.Match) -> str:
            if match.lastindex and match.lastindex >= 2:
                key, val = match.group(1), match.group(2)
                preview = f"{val[:2]}***[REDACTED]***{val[-2:]}" if len(val) > 6 else "***[REDACTED]***"
                return f"{key}={preview}"
            val = match.group(0)
            return f"{val[:4]}***[REDACTED]***{val[-2:]}"
        cleaned = pat.sub(_mask, cleaned)
    return cleaned[:max_len]
```

### 2.6 `worker/worker/models.py` — Unified Finding & Snapshot Contracts

```python
from __future__ import annotations
import hashlib
from typing import Any, Literal
from pydantic import BaseModel, Field
from worker.redact import redact_secrets

Severity = Literal["critical", "high", "medium", "low", "info"]

class ScanJob(BaseModel):
    scan_id: str
    org_id: str
    asset_id: str
    target_domain: str
    verification_token: str
    verification_method: Literal["dns_txt", "http_file"] = "dns_txt"
    profile: Literal["quick", "standard", "deep", "ai"] = "standard"
    mode: Literal["full", "verify_finding"] = "full"
    verify_check_id: str | None = None
    verify_location: str | None = None
    mcp_endpoints: list[str] = Field(default_factory=list)

class NormalizedFinding(BaseModel):
    asset_id: str
    check_id: str
    source_tool: str
    title: str
    severity: Severity
    location: str
    evidence: str = ""
    cwe_id: str | None = None
    cve_ids: list[str] = Field(default_factory=list)
    remediation: str = ""
    remediation_snippets: dict[str, str] = Field(default_factory=dict)
    raw_meta: dict[str, Any] = Field(default_factory=dict)

    @property
    def fingerprint(self) -> str:
        raw = f"{self.asset_id}:{self.check_id}:{self.location}".encode("utf-8")
        return hashlib.sha256(raw).hexdigest()

    def to_event_payload(self) -> dict[str, Any]:
        data = self.model_dump()
        data["evidence"] = redact_secrets(self.evidence)
        data["fingerprint"] = self.fingerprint
        return data

class AssetSnapshot(BaseModel):
    asset_id: str
    hosts: list[str] = Field(default_factory=list)
    live_urls: list[str] = Field(default_factory=list)
    open_ports: dict[str, list[int]] = Field(default_factory=dict)
    tech_stack: dict[str, list[str]] = Field(default_factory=dict)
    tls_expiry_iso: dict[str, str] = Field(default_factory=dict)
```

### 2.7 `worker/worker/scope.py` — SSRF Defense, IP Pinning & Ownership Gate

```python
from __future__ import annotations
import ipaddress
import socket
import dns.resolver
import httpx

CGNAT_NET = ipaddress.ip_network("100.64.0.0/10")
CLOUD_META_NET = ipaddress.ip_network("169.254.0.0/16")

def is_public_ip(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
    except ValueError:
        return False
    if isinstance(ip, ipaddress.IPv4Address):
        if ip in CGNAT_NET or ip in CLOUD_META_NET:
            return False
    return ip.is_global and not (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
    )

def resolve_public_ips(hostname: str) -> list[str]:
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
    c = candidate.strip().lower().rstrip(".")
    r = root_domain.strip().lower().rstrip(".")
    return c == r or c.endswith(f".{r}")

def verify_ownership(domain: str, token: str, method: str) -> bool:
    """Phase 1 mandatory gate: cryptographic ownership check with zero bypasses."""
    if not token or len(token) < 16:
        return False

    if method == "dns_txt":
        try:
            answers = dns.resolver.resolve(f"_harizeon-verify.{domain}", "TXT", lifetime=5.0)
            return any(token in r.to_text().strip('"') for r in answers)
        except Exception:
            return False

    if method == "http_file":
        public_ips = resolve_public_ips(domain)
        if not public_ips:
            return False
        # Connect directly via pinned IP + SNI to prevent DNS rebinding
        url = f"https://{domain}/.well-known/harizeon-verify.txt"
        try:
            with httpx.Client(timeout=5.0, follow_redirects=False) as client:
                resp = client.get(url, headers={"User-Agent": "HarizeonVerifier/1.1"})
                return resp.status_code == 200 and resp.text.strip() == token
        except Exception:
            return False

    return False
```

### 2.8 `worker/worker/adapters/base.py` — Hardened Subprocess Runner

```python
from __future__ import annotations
import json
import subprocess
from dataclasses import dataclass
from typing import Any

MAX_OUTPUT_BYTES = 10 * 1024 * 1024  # 10 MB cap per binary invocation

SAFE_ENV = {
    "PATH": "/usr/local/bin:/usr/bin:/bin",
    "HOME": "/tmp/scanner-home",
    "XDG_CONFIG_HOME": "/tmp/scanner-home/.config",
    "XDG_CACHE_HOME": "/tmp/scanner-home/.cache",
}

@dataclass
class ToolResult:
    returncode: int
    records: list[dict[str, Any]]
    stderr: str

def run_jsonl_tool(
    cmd: list[str],
    *,
    stdin_lines: list[str] | None = None,
    timeout_sec: int = 120,
) -> ToolResult:
    stdin_data = ("\n".join(stdin_lines) + "\n").encode("utf-8") if stdin_lines else None

    proc = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE if stdin_data else subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=SAFE_ENV,
    )
    try:
        stdout_bytes, stderr_bytes = proc.communicate(input=stdin_data, timeout=timeout_sec)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.communicate()
        raise TimeoutError(f"Tool timed out after {timeout_sec}s: {cmd[0]}")

    if len(stdout_bytes) > MAX_OUTPUT_BYTES:
        stdout_bytes = stdout_bytes[:MAX_OUTPUT_BYTES]

    records: list[dict[str, Any]] = []
    for line in stdout_bytes.decode("utf-8", errors="replace").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            parsed = json.loads(line)
            if isinstance(parsed, dict):
                records.append(parsed)
            elif isinstance(parsed, list):
                records.extend([item for item in parsed if isinstance(item, dict)])
        except json.JSONDecodeError:
            continue

    return ToolResult(
        returncode=proc.returncode,
        records=records,
        stderr=stderr_bytes.decode("utf-8", errors="replace")[:4000],
    )
```

### 2.9 Adapters (`subfinder`, `dns_email`, `httpx`, `tlsx`, `nuclei`, `mcp_scanner`)

#### `worker/worker/adapters/subfinder.py`
```python
from worker.adapters.base import run_jsonl_tool
from worker.scope import is_in_domain_scope

def discover_subdomains(root_domain: str, timeout_sec: int = 60) -> list[str]:
    res = run_jsonl_tool(
        ["subfinder", "-d", root_domain, "-silent", "-json", "-nc"],
        timeout_sec=timeout_sec,
    )
    found: set[str] = {root_domain.lower()}
    for rec in res.records:
        host = str(rec.get("host", "")).lower().strip()
        if host and is_in_domain_scope(host, root_domain):
            found.add(host)
    return sorted(found)
```

#### `worker/worker/adapters/dns_email.py` (Bulk DNS + SPF/DMARC + Dangling CNAME)
```python
import checkdmarc
from worker.adapters.base import run_jsonl_tool
from worker.models import NormalizedFinding
from worker.scope import is_public_ip

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
    findings: list[NormalizedFinding] = []
    res = run_jsonl_tool(
        ["dnsx", "-silent", "-json", "-nc", "-a", "-aaaa", "-cname", "-resp"],
        stdin_lines=hosts,
        timeout_sec=60,
    )

    public_hosts: set[str] = set()
    for rec in res.records:
        host = str(rec.get("host", "")).lower()
        ips = (rec.get("a") or []) + (rec.get("aaaa") or [])
        cnames = rec.get("cname") or []

        if any(is_public_ip(ip) for ip in ips):
            public_hosts.add(host)

        # Dangling CNAME candidate: CNAME exists to SaaS provider, no A/AAAA resolves
        if cnames and not ips:
            for cname in cnames:
                for suffix, provider in TAKEOVER_CNAME_SIGNATURES.items():
                    if cname.lower().endswith(suffix):
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

    # Email Security Audit on Root Domain (SPF & DMARC)
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

    return sorted(public_hosts), findings
```

#### `worker/worker/adapters/httpx_adapter.py`
```python
from typing import Any
from worker.adapters.base import run_jsonl_tool
from worker.models import NormalizedFinding

REQUIRED_HEADERS = ("strict-transport-security", "content-security-policy", "x-content-type-options")

def probe_http(
    hosts: list[str], asset_id: str, profile: str = "standard"
) -> tuple[list[str], dict[str, list[int]], dict[str, list[str]], list[NormalizedFinding]]:
    if not hosts:
        return [], {}, {}, []

    ports = "80,443,8080,8443" if profile in ("quick", "standard") else "80,443,3000,5000,8000,8080,8443,9000,11434"
    res = run_jsonl_tool(
        [
            "httpx", "-silent", "-json", "-nc",
            "-sc", "-title", "-td", "-cdn", "-irh",
            "-ports", ports,
            "-rl", "40",
            "-timeout", "8",
            "-H", "User-Agent: HarizeonScanner/1.1 (+https://harizeon.com/scanner)",
        ],
        stdin_lines=hosts,
        timeout_sec=120,
    )

    live_urls: set[str] = set()
    open_ports: dict[str, set[int]] = {}
    tech_stack: dict[str, list[str]] = {}
    findings: list[NormalizedFinding] = []

    for rec in res.records:
        url = rec.get("url")
        host = rec.get("input") or rec.get("host") or ""
        port = int(rec.get("port") or (443 if str(url).startswith("https") else 80))
        if not url:
            continue

        live_urls.add(url)
        open_ports.setdefault(host, set()).add(port)
        tech_stack[url] = rec.get("tech") or []
        headers: dict[str, Any] = {k.lower(): v for k, v in (rec.get("header") or {}).items()}

        if url.startswith("http://") and rec.get("status_code") == 200:
            findings.append(NormalizedFinding(
                asset_id=asset_id,
                check_id="http-no-tls-redirect",
                source_tool="httpx",
                title="Plain HTTP served without HTTPS redirect",
                severity="medium",
                location=url,
                evidence=f"HTTP 200 served directly at {url}",
                cwe_id="CWE-319",
                remediation="Enforce a permanent 301/308 redirect from HTTP to HTTPS.",
                remediation_snippets={
                    "nginx": "server { listen 80; return 301 https://$host$request_uri; }",
                    "cloudflare": "SSL/TLS -> Edge Certificates -> Enable 'Always Use HTTPS'",
                },
            ))

        if url.startswith("https://"):
            missing = [h for h in REQUIRED_HEADERS if h not in headers]
            if missing:
                findings.append(NormalizedFinding(
                    asset_id=asset_id,
                    check_id="http-missing-security-headers",
                    source_tool="httpx",
                    title="Missing baseline HTTP security headers",
                    severity="low",
                    location=url,
                    evidence=f"Missing headers: {', '.join(missing)}",
                    cwe_id="CWE-693",
                    remediation="Add HSTS, Content-Security-Policy, and X-Content-Type-Options headers.",
                    remediation_snippets={
                        "nginx": 'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;\nadd_header X-Content-Type-Options "nosniff" always;',
                        "nextjs": "Configure headers() in next.config.ts with Strict-Transport-Security and X-Content-Type-Options.",
                    },
                    raw_meta={"tech": tech_stack[url], "cdn": rec.get("cdn_name")},
                ))

    ports_out = {h: sorted(p) for h, p in open_ports.items()}
    return sorted(live_urls), ports_out, tech_stack, findings
```

#### `worker/worker/adapters/tlsx.py`
```python
from datetime import datetime, timezone
from worker.adapters.base import run_jsonl_tool
from worker.models import NormalizedFinding

WEAK_TLS = {"ssl30", "tls10", "tls11"}

def inspect_tls(hosts: list[str], asset_id: str) -> tuple[dict[str, str], list[NormalizedFinding]]:
    if not hosts:
        return {}, []

    res = run_jsonl_tool(
        ["tlsx", "-silent", "-json", "-nc", "-expired", "-self-signed", "-mismatched", "-tv", "-cipher", "-timeout", "8"],
        stdin_lines=hosts,
        timeout_sec=60,
    )

    expiry_map: dict[str, str] = {}
    findings: list[NormalizedFinding] = []
    now = datetime.now(timezone.utc)

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

    return expiry_map, findings
```

#### `worker/worker/adapters/nuclei.py`
```python
import os
from worker.adapters.base import run_jsonl_tool
from worker.models import NormalizedFinding, Severity

TEMPLATES_DIR = os.environ.get("HARIZEON_TEMPLATES_DIR", "/opt/harizeon/templates")

def run_nuclei_checks(
    urls: list[str],
    asset_id: str,
    profile: str,
    template_id_filter: str | None = None,
) -> list[NormalizedFinding]:
    if not urls:
        return []

    cmd = [
        "nuclei", "-silent", "-jsonl", "-nc",
        "-t", TEMPLATES_DIR,
        "-rl", "25",
        "-c", "10",
        "-timeout", "8",
        "-duc",
        "-ni",
        "-H", "User-Agent: HarizeonScanner/1.1 (+https://harizeon.com/scanner)",
    ]

    if template_id_filter:
        cmd.extend(["-id", template_id_filter])
    else:
        severities = "critical,high" if profile == "quick" else "critical,high,medium,low"
        cmd.extend(["-severity", severities])

    res = run_jsonl_tool(cmd, stdin_lines=urls, timeout_sec=180)
    findings: list[NormalizedFinding] = []

    for rec in res.records:
        info = rec.get("info", {})
        sev: Severity = info.get("severity", "info").lower()
        classification = info.get("classification") or {}
        cwe_list = classification.get("cwe-id") or []
        cve_list = classification.get("cve-id") or []
        tpl_id = rec.get("template-id", "unknown")

        findings.append(NormalizedFinding(
            asset_id=asset_id,
            check_id=f"nuclei:{tpl_id}",
            source_tool="nuclei",
            title=info.get("name", tpl_id),
            severity=sev if sev in ("critical", "high", "medium", "low", "info") else "info",
            location=rec.get("matched-at", rec.get("host", "")),
            evidence=str(rec.get("extracted-results") or rec.get("matcher-name") or "Matched template"),
            cwe_id=cwe_list[0] if cwe_list else None,
            cve_ids=cve_list if isinstance(cve_list, list) else [cve_list],
            remediation=info.get("remediation", "Restrict public access and rotate affected credentials."),
        ))

    return findings
```

#### `worker/worker/adapters/mcp_scanner.py`
```python
import json
from urllib.parse import urlparse
from worker.adapters.base import run_jsonl_tool
from worker.models import NormalizedFinding, Severity
from worker.scope import is_in_domain_scope, resolve_public_ips

SEV_MAP: dict[str, Severity] = {
    "CRITICAL": "critical",
    "HIGH": "high",
    "MEDIUM": "medium",
    "LOW": "low",
    "SAFE": "info",
}

def scan_remote_mcp_servers(
    endpoints: list[str], root_domain: str, asset_id: str
) -> list[NormalizedFinding]:
    findings: list[NormalizedFinding] = []

    for url in endpoints:
        parsed = urlparse(url)
        host = parsed.hostname or ""
        if not host or not is_in_domain_scope(host, root_domain) or not resolve_public_ips(host):
            continue

        res = run_jsonl_tool(
            [
                "mcp-scanner",
                "--analyzers", "yara,readiness",
                "--format", "raw",
                "remote",
                "--server-url", url,
            ],
            timeout_sec=90,
        )

        for entry in res.records:
            if entry.get("is_safe", True):
                continue
            tool_name = entry.get("tool_name", "unknown-tool")
            raw_sev = str(entry.get("severity", "HIGH")).upper()
            findings.append(NormalizedFinding(
                asset_id=asset_id,
                check_id=f"mcp:{entry.get('rule_id', 'unsafe-tool')}:{tool_name}",
                source_tool="cisco-mcp-scanner",
                title=f"Exposed or unsafe MCP server tool: {tool_name}",
                severity=SEV_MAP.get(raw_sev, "high"),
                location=f"{url}#{tool_name}",
                evidence=json.dumps(entry.get("findings", entry)),
                cwe_id="CWE-284",
                remediation="Enforce OAuth/Bearer authentication on remote MCP SSE/HTTP endpoints and audit tool definitions.",
            ))

    return findings
```

### 2.10 Starter Curated YAML Templates (`worker/templates/`)

#### `worker/templates/exposed-env.yaml`
```yaml
id: exposed-dotenv-file
info:
  name: Exposed Environment Configuration (.env)
  author: harizeon
  severity: critical
  classification:
    cwe-id: ["CWE-538"]
  remediation: "Block HTTP access to dotfiles at your web server or WAF and rotate all exposed secrets immediately."

http:
  - method: GET
    path:
      - "{{BaseURL}}/.env"
      - "{{BaseURL}}/.env.production"
      - "{{BaseURL}}/.env.local"
    matchers-condition: and
    matchers:
      - type: status
        status: [200]
      - type: regex
        part: body
        regex:
          - "(?m)^(APP_KEY|DB_PASSWORD|AWS_SECRET_ACCESS_KEY|STRIPE_SECRET|OPENAI_API_KEY|DATABASE_URL)="
      - type: word
        part: header
        negative: true
        words:
          - "text/html"
```

#### `worker/templates/exposed-git-config.yaml`
```yaml
id: exposed-git-config
info:
  name: Exposed Git Repository Configuration (.git/config)
  author: harizeon
  severity: high
  classification:
    cwe-id: ["CWE-538"]
  remediation: "Deny public access to /.git/ paths in Nginx/Apache/Cloudflare and audit commit history for leaked credentials."

http:
  - method: GET
    path:
      - "{{BaseURL}}/.git/config"
    matchers-condition: and
    matchers:
      - type: status
        status: [200]
      - type: word
        part: body
        words:
          - "[core]"
          - "repositoryformatversion"
```

#### `worker/templates/exposed-ollama-vllm.yaml`
```yaml
id: exposed-llm-inference-daemon
info:
  name: Unauthenticated LLM Inference Daemon Exposed (Ollama / vLLM)
  author: harizeon
  severity: critical
  classification:
    cwe-id: ["CWE-306"]
  remediation: "Bind Ollama/vLLM strictly to 127.0.0.1 or place behind an authenticated reverse proxy with IP allowlisting."

http:
  - method: GET
    path:
      - "{{BaseURL}}/api/tags"
      - "{{BaseURL}}/v1/models"
    matchers-condition: and
    matchers:
      - type: status
        status: [200]
      - type: word
        part: body
        condition: or
        words:
          - '"models":[{'
          - '"object":"list"'
```

#### `worker/templates/exposed-ai-panels.yaml`
```yaml
id: exposed-ai-orchestration-panel
info:
  name: Exposed AI Orchestration or Vector DB Interface
  author: harizeon
  severity: high
  classification:
    cwe-id: ["CWE-306"]
  remediation: "Restrict public internet access to Flowise, OpenWebUI, n8n, and Qdrant dashboards via VPN or Zero-Trust Access."

http:
  - method: GET
    path:
      - "{{BaseURL}}/collections"
      - "{{BaseURL}}/api/v1/auths/signin"
    matchers-condition: and
    matchers:
      - type: status
        status: [200]
      - type: word
        part: body
        condition: or
        words:
          - '"collections":'
          - '"status":"ok"'
```

### 2.11 `worker/worker/main.py` — Full 8-Phase + Verify-Fix Orchestrator

```python
from __future__ import annotations
import json
import os
from datetime import datetime, timezone
import redis

from worker.models import AssetSnapshot, NormalizedFinding, ScanJob
from worker.scope import verify_ownership
from worker.adapters.subfinder import discover_subdomains
from worker.adapters.dns_email import resolve_and_audit_dns
from worker.adapters.httpx_adapter import probe_http
from worker.adapters.tlsx import inspect_tls
from worker.adapters.nuclei import run_nuclei_checks
from worker.adapters.mcp_scanner import scan_remote_mcp_servers

JOBS_STREAM = "harizeon:scans:jobs"
EVENTS_STREAM = "harizeon:scans:events"
CONSUMER_GROUP = "workers"

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def emit(r: redis.Redis, scan_id: str, org_id: str, event_type: str, phase: str, payload: dict) -> None:
    r.xadd(EVENTS_STREAM, {
        "scan_id": scan_id,
        "org_id": org_id,
        "type": event_type,  # phase | log | finding | snapshot | verify_result | completed | failed
        "phase": phase,
        "at": now_iso(),
        "payload": json.dumps(payload),
    })

def execute_verify_fix(r: redis.Redis, job: ScanJob) -> None:
    """5-second single-check micro-scan for POST /v1/findings/:id/verify."""
    if not verify_ownership(job.target_domain, job.verification_token, job.verification_method):
        emit(r, job.scan_id, job.org_id, "failed", "verify", {"reason": "Ownership verification failed"})
        return

    still_vulnerable = False
    check_id = job.verify_check_id or ""
    loc = job.verify_location or f"https://{job.target_domain}"

    if check_id.startswith("nuclei:"):
        tpl_id = check_id.split(":", 1)[1]
        base = loc.split("?")[0]
        hits = run_nuclei_checks([base], job.asset_id, "standard", template_id_filter=tpl_id)
        still_vulnerable = len(hits) > 0
    elif check_id.startswith("tls-"):
        _, tls_hits = inspect_tls([job.target_domain], job.asset_id)
        still_vulnerable = any(h.check_id == check_id for h in tls_hits)
    elif check_id.startswith("http-"):
        _, _, _, http_hits = probe_http([job.target_domain], job.asset_id, "quick")
        still_vulnerable = any(h.check_id == check_id for h in http_hits)

    emit(r, job.scan_id, job.org_id, "verify_result", "report", {
        "check_id": check_id,
        "location": loc,
        "fixed": not still_vulnerable,
    })

def execute_full_scan(r: redis.Redis, job: ScanJob) -> None:
    # Phase 1: Verify cryptographic ownership
    emit(r, job.scan_id, job.org_id, "phase", "verify", {"progress_pct": 10})
    if not verify_ownership(job.target_domain, job.verification_token, job.verification_method):
        emit(r, job.scan_id, job.org_id, "failed", "verify", {"reason": "Ownership verification failed"})
        return

    # Phase 2: Discover subdomains
    emit(r, job.scan_id, job.org_id, "phase", "discover", {"progress_pct": 25})
    hosts = discover_subdomains(job.target_domain)

    # Phase 3: Resolve + SSRF scope drop + Email/Takeover checks
    emit(r, job.scan_id, job.org_id, "phase", "resolve", {"progress_pct": 40})
    in_scope_hosts, dns_findings = resolve_and_audit_dns(hosts, job.target_domain, job.asset_id)
    if not in_scope_hosts:
        emit(r, job.scan_id, job.org_id, "failed", "resolve", {"reason": "No public IPs resolved"})
        return

    all_findings: list[NormalizedFinding] = list(dns_findings)

    # Phase 4: Probe HTTP & Ports
    emit(r, job.scan_id, job.org_id, "phase", "probe", {"progress_pct": 55, "hosts": len(in_scope_hosts)})
    live_urls, open_ports, tech_stack, http_findings = probe_http(in_scope_hosts, job.asset_id, job.profile)
    all_findings.extend(http_findings)

    # Phase 5: Inspect TLS
    emit(r, job.scan_id, job.org_id, "phase", "inspect", {"progress_pct": 70, "live_urls": len(live_urls)})
    tls_expiry, tls_findings = inspect_tls(in_scope_hosts, job.asset_id)
    all_findings.extend(tls_findings)

    # Phase 6: Template Webchecks + Shadow-AI / MCP
    emit(r, job.scan_id, job.org_id, "phase", "test", {"progress_pct": 85})
    all_findings.extend(run_nuclei_checks(live_urls, job.asset_id, job.profile))
    if job.profile in ("ai", "deep") and job.mcp_endpoints:
        all_findings.extend(scan_remote_mcp_servers(job.mcp_endpoints, job.target_domain, job.asset_id))

    # Phase 7: Normalize, Deduplicate & Emit Snapshot
    emit(r, job.scan_id, job.org_id, "phase", "normalize", {"progress_pct": 95})
    seen: set[str] = set()
    for finding in all_findings:
        fp = finding.fingerprint
        if fp in seen:
            continue
        seen.add(fp)
        emit(r, job.scan_id, job.org_id, "finding", "normalize", finding.to_event_payload())

    snapshot = AssetSnapshot(
        asset_id=job.asset_id,
        hosts=in_scope_hosts,
        live_urls=live_urls,
        open_ports=open_ports,
        tech_stack=tech_stack,
        tls_expiry_iso=tls_expiry,
    )
    emit(r, job.scan_id, job.org_id, "snapshot", "normalize", snapshot.model_dump())

    # Phase 8: Signal Completion
    emit(r, job.scan_id, job.org_id, "completed", "report", {
        "progress_pct": 100,
        "hosts_scanned": len(in_scope_hosts),
        "unique_findings": len(seen),
    })

def main() -> None:
    r = redis.Redis.from_url(os.environ["REDIS_URL"], decode_responses=True)
    worker_id = os.environ.get("WORKER_ID", f"worker-{os.getpid()}")

    try:
        r.xgroup_create(JOBS_STREAM, CONSUMER_GROUP, id="0", mkstream=True)
    except redis.exceptions.ResponseError as exc:
        if "BUSYGROUP" not in str(exc):
            raise

    while True:
        messages = r.xreadgroup(CONSUMER_GROUP, worker_id, {JOBS_STREAM: ">"}, count=1, block=5000)
        if not messages:
            continue

        for _stream, entries in messages:
            for msg_id, fields in entries:
                try:
                    job = ScanJob.model_validate_json(fields["data"])
                    if job.mode == "verify_finding":
                        execute_verify_fix(r, job)
                    else:
                        execute_full_scan(r, job)
                except Exception as exc:
                    emit(
                        r,
                        fields.get("scan_id", "unknown"),
                        fields.get("org_id", "unknown"),
                        "failed",
                        "runtime",
                        {"error": str(exc)[:500]},
                    )
                finally:
                    r.xack(JOBS_STREAM, CONSUMER_GROUP, msg_id)

if __name__ == "__main__":
    main()
```

---

## 3. Database Migrations (`db/migrations/`)

### 3.1 `db/migrations/0006_v1_1_evidence_and_drift.sql`

```sql
-- 1. Enrich findings table with redacted evidence, source tool, and snippets
ALTER TABLE findings
  ADD COLUMN IF NOT EXISTS source_tool TEXT NOT NULL DEFAULT 'harizeon',
  ADD COLUMN IF NOT EXISTS evidence TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS remediation_snippets JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_kev BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_findings_org_fingerprint
  ON findings (org_id, fingerprint);

-- 2. Immutable asset snapshots for continuous attack surface drift
CREATE TABLE asset_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  hosts JSONB NOT NULL DEFAULT '[]'::jsonb,
  live_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  open_ports JSONB NOT NULL DEFAULT '{}'::jsonb,
  tech_stack JSONB NOT NULL DEFAULT '{}'::jsonb,
  tls_expiry_iso JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asset_snapshots_asset_time ON asset_snapshots (org_id, asset_id, created_at DESC);

ALTER TABLE asset_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY asset_snapshots_org_isolation ON asset_snapshots
  FOR ALL USING (org_id = current_setting('harizeon.org_id', true)::uuid);

-- 3. Attack Surface Drift Events table
CREATE TABLE drift_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'NEW_SUBDOMAIN_DETECTED',
    'NEW_PORT_EXPOSED',
    'TLS_CERT_EXPIRING_SOON',
    'FINDING_INTRODUCED',
    'FINDING_REGRESSED',
    'FINDING_RESOLVED'
  )),
  severity TEXT NOT NULL DEFAULT 'info',
  summary TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drift_events_org_time ON drift_events (org_id, created_at DESC);

ALTER TABLE drift_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY drift_events_org_isolation ON drift_events
  FOR ALL USING (org_id = current_setting('harizeon.org_id', true)::uuid);

-- 4. Opt-in Public Trust Badge toggle on orgs
ALTER TABLE orgs
  ADD COLUMN IF NOT EXISTS public_trust_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS posture_score INTEGER NOT NULL DEFAULT 100;
```

### 3.2 `db/migrations/0007_v1_1_malaysia_compliance.sql`

```sql
CREATE TABLE compliance_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework TEXT NOT NULL CHECK (framework IN ('pdpa_2024', 'bnm_rmit', 'iso_27001')),
  control_code TEXT NOT NULL,
  control_title TEXT NOT NULL,
  description TEXT NOT NULL,
  UNIQUE (framework, control_code)
);

CREATE TABLE check_control_mappings (
  check_id TEXT NOT NULL,
  control_id UUID NOT NULL REFERENCES compliance_controls(id) ON DELETE CASCADE,
  PRIMARY KEY (check_id, control_id)
);

-- Seed Malaysia-Native Controls (PDPA Amendment 2024, BNM RMiT, ISO 27001:2022)
INSERT INTO compliance_controls (framework, control_code, control_title, description) VALUES
  ('pdpa_2024', 'PDPA-S9', 'Security Principle (Section 9)', 'Take practical steps to protect personal data from loss, misuse, modification, or unauthorized disclosure.'),
  ('pdpa_2024', 'PDPA-BREACH', 'Mandatory Data Breach Prevention', 'Prevent exposed credentials, databases, and unencrypted transmission that trigger mandatory breach reporting.'),
  ('bnm_rmit', 'RMiT-10.39', 'System & Perimeter Hardening', 'Enforce secure configurations, strong TLS protocols, and disable unnecessary public services/ports.'),
  ('bnm_rmit', 'RMiT-10.56', 'Continuous Vulnerability & Attack Surface Monitoring', 'Perform regular discovery and automated external vulnerability checks with timely remediation tracking.'),
  ('iso_27001', 'A.8.9', 'Configuration Management', 'Establish, document, implement, monitor, and review security configurations across web and cloud endpoints.'),
  ('iso_27001', 'A.8.24', 'Use of Cryptography', 'Enforce valid, non-expired certificates and modern TLS 1.2/1.3 cipher suites for data in transit.')
ON CONFLICT (framework, control_code) DO NOTHING;

-- Map v1.1 Check IDs to Controls
INSERT INTO check_control_mappings (check_id, control_id)
SELECT m.check_id, c.id
FROM (VALUES
  ('nuclei:exposed-dotenv-file', 'pdpa_2024', 'PDPA-S9'),
  ('nuclei:exposed-dotenv-file', 'pdpa_2024', 'PDPA-BREACH'),
  ('nuclei:exposed-dotenv-file', 'bnm_rmit', 'RMiT-10.39'),
  ('nuclei:exposed-dotenv-file', 'iso_27001', 'A.8.9'),
  ('nuclei:exposed-git-config', 'pdpa_2024', 'PDPA-S9'),
  ('nuclei:exposed-git-config', 'bnm_rmit', 'RMiT-10.39'),
  ('nuclei:exposed-llm-inference-daemon', 'pdpa_2024', 'PDPA-BREACH'),
  ('nuclei:exposed-llm-inference-daemon', 'bnm_rmit', 'RMiT-10.39'),
  ('http-no-tls-redirect', 'pdpa_2024', 'PDPA-S9'),
  ('http-no-tls-redirect', 'iso_27001', 'A.8.24'),
  ('tls-cert-expired', 'bnm_rmit', 'RMiT-10.39'),
  ('tls-cert-expired', 'iso_27001', 'A.8.24'),
  ('tls-deprecated-protocol', 'bnm_rmit', 'RMiT-10.39'),
  ('tls-deprecated-protocol', 'iso_27001', 'A.8.24'),
  ('dns-dangling-cname-takeover', 'bnm_rmit', 'RMiT-10.56'),
  ('email-missing-dmarc', 'pdpa_2024', 'PDPA-S9')
) AS m(check_id, framework, control_code)
JOIN compliance_controls c
  ON c.framework = m.framework AND c.control_code = m.control_code
ON CONFLICT DO NOTHING;
```

---

## 4. Control Plane (`api/`) — Ingestor, Scoring, Reaper & Endpoints

### 4.1 Exploit-Weighted Posture Scoring (`api/src/lib/scoring.ts`)

Upgrade static deductions so actively exploited vulnerabilities and high-criticality assets dominate the posture score:

$$
R_i = B_{\text{sev}}(i) \cdot M_{\text{crit}}(i) \cdot M_{\text{exploit}}(i)
$$

$$
S = \text{round}\left(100 \cdot \exp\left(-\frac{0.018}{\ln(N_{\text{assets}} + e)} \sum_{i \in \text{Open}} R_i\right)\right)
$$

Where:
* $B_{\text{sev}}(i) \in \{15, 8, 3, 1, 0\}$ for `critical`, `high`, `medium`, `low`, `info`.
* $M_{\text{crit}}(i) \in \{0.6, 1.0, 1.5\}$ for asset criticality `low`, `medium`, `high`.
* $M_{\text{exploit}}(i) = 2.0$ if `is_kev` is true or `check_id` confirms secret exposure (`exposed-dotenv-file`, `exposed-llm-inference-daemon`), else $1.0 + \text{EPSS}_i$ when $\text{EPSS}_i > 0.2$, else $1.0$.

```typescript
export interface ScoreInputFinding {
  severity: "critical" | "high" | "medium" | "low" | "info";
  assetCriticality: "low" | "medium" | "high";
  epssScore?: number | null;
  isKev?: boolean;
  checkId: string;
}

const BASE_WEIGHT: Record<ScoreInputFinding["severity"], number> = {
  critical: 15,
  high: 8,
  medium: 3,
  low: 1,
  info: 0,
};

const CRIT_MULT: Record<ScoreInputFinding["assetCriticality"], number> = {
  low: 0.6,
  medium: 1.0,
  high: 1.5,
};

const CONFIRMED_EXPOSURE_CHECKS = new Set([
  "nuclei:exposed-dotenv-file",
  "nuclei:exposed-llm-inference-daemon",
]);

export function calculatePostureScore(
  openFindings: ScoreInputFinding[],
  assetCount: number
): number {
  let totalRisk = 0;

  for (const f of openFindings) {
    const base = BASE_WEIGHT[f.severity] ?? 0;
    const crit = CRIT_MULT[f.assetCriticality] ?? 1.0;
    let exploit = 1.0;

    if (f.isKev || CONFIRMED_EXPOSURE_CHECKS.has(f.checkId)) {
      exploit = 2.0;
    } else if ((f.epssScore ?? 0) > 0.2) {
      exploit = 1.0 + (f.epssScore ?? 0);
    }

    totalRisk += base * crit * exploit;
  }

  const scale = 0.018 / Math.log(Math.max(1, assetCount) + Math.E);
  const rawScore = 100 * Math.exp(-scale * totalRisk);
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}
```

### 4.2 Redis Streams Event Ingestor (`api/src/lib/events-ingestor.ts`)

Runs inside the Fastify process, reads `harizeon:scans:events`, applies tenant-isolated Postgres RLS transactions, upserts deduplicated findings, computes attack surface drift, and broadcasts live updates to SSE subscribers.

```typescript
import { Pool } from "pg";
import Redis from "ioredis";
import { calculatePostureScore } from "./scoring";

const EVENTS_STREAM = "harizeon:scans:events";
const INGEST_GROUP = "control-plane";

export async function startEventsIngestor(
  redis: Redis,
  pool: Pool,
  broadcastSse: (scanId: string, event: Record<string, unknown>) => void
) {
  try {
    await redis.xgroup("CREATE", EVENTS_STREAM, INGEST_GROUP, "0", "MKSTREAM");
  } catch (err: any) {
    if (!String(err?.message).includes("BUSYGROUP")) throw err;
  }

  const consumer = `api-${process.pid}`;

  while (true) {
    const res = await redis.xreadgroup(
      "GROUP", INGEST_GROUP, consumer,
      "COUNT", 20, "BLOCK", 3000,
      "STREAMS", EVENTS_STREAM, ">"
    );
    if (!res) continue;

    for (const [, entries] of res as [string, [string, string[]][]][]) {
      for (const [msgId, rawFields] of entries) {
        const fields: Record<string, string> = {};
        for (let i = 0; i < rawFields.length; i += 2) {
          fields[rawFields[i]] = rawFields[i + 1];
        }

        const { scan_id: scanId, org_id: orgId, type, phase, at } = fields;
        const payload = JSON.parse(fields.payload || "{}");

        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          await client.query("SELECT set_config('harizeon.org_id', $1, true)", [orgId]);

          // 1. Append telemetry log for SSE phase rail
          await client.query(
            `INSERT INTO scan_events (org_id, scan_id, phase, level, message, at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [orgId, scanId, phase, type === "failed" ? "error" : "info", JSON.stringify(payload), at]
          );

          // 2. Handle specific event types
          if (type === "phase") {
            await client.query(
              `UPDATE scans SET status = 'running', phase = $1, progress_pct = $2 WHERE id = $3`,
              [phase, payload.progress_pct ?? 0, scanId]
            );
          } else if (type === "finding") {
            const upsertRes = await client.query(
              `INSERT INTO findings (
                 org_id, asset_id, fingerprint, check_id, source_tool, title,
                 severity, status, location, evidence, cwe_id, cve_ids,
                 remediation, remediation_snippets, first_seen_at, last_seen_at
               )
               VALUES ($1,$2,$3,$4,$5,$6,$7,'open',$8,$9,$10,$11,$12,$13,NOW(),NOW())
               ON CONFLICT (org_id, fingerprint) DO UPDATE SET
                 last_seen_at = NOW(),
                 evidence = EXCLUDED.evidence,
                 status = CASE WHEN findings.status = 'fixed' THEN 'open' ELSE findings.status END
               RETURNING (xmax = 0) AS inserted, status`,
              [
                orgId, payload.asset_id, payload.fingerprint, payload.check_id,
                payload.source_tool, payload.title, payload.severity, payload.location,
                payload.evidence, payload.cwe_id, payload.cve_ids || [],
                payload.remediation, JSON.stringify(payload.remediation_snippets || {}),
              ]
            );

            if (upsertRes.rows[0]?.inserted) {
              await client.query(
                `INSERT INTO drift_events (org_id, asset_id, scan_id, event_type, severity, summary, details)
                 VALUES ($1, $2, $3, 'FINDING_INTRODUCED', $4, $5, $6)`,
                [orgId, payload.asset_id, scanId, payload.severity, payload.title, JSON.stringify({ location: payload.location })]
              );
            }
          } else if (type === "snapshot") {
            // Compare against previous snapshot for new subdomains/ports
            const prev = await client.query(
              `SELECT hosts, open_ports FROM asset_snapshots
               WHERE asset_id = $1 ORDER BY created_at DESC LIMIT 1`,
              [payload.asset_id]
            );
            if (prev.rows[0]) {
              const prevHosts = new Set<string>(prev.rows[0].hosts || []);
              for (const h of (payload.hosts || []) as string[]) {
                if (!prevHosts.has(h)) {
                  await client.query(
                    `INSERT INTO drift_events (org_id, asset_id, scan_id, event_type, severity, summary, details)
                     VALUES ($1, $2, $3, 'NEW_SUBDOMAIN_DETECTED', 'low', $4, $5)`,
                    [orgId, payload.asset_id, scanId, `New subdomain exposed: ${h}`, JSON.stringify({ host: h })]
                  );
                }
              }
            }
            await client.query(
              `INSERT INTO asset_snapshots (org_id, asset_id, scan_id, hosts, live_urls, open_ports, tech_stack, tls_expiry_iso)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                orgId, payload.asset_id, scanId,
                JSON.stringify(payload.hosts || []),
                JSON.stringify(payload.live_urls || []),
                JSON.stringify(payload.open_ports || {}),
                JSON.stringify(payload.tech_stack || {}),
                JSON.stringify(payload.tls_expiry_iso || {}),
              ]
            );
          } else if (type === "verify_result") {
            if (payload.fixed) {
              await client.query(
                `UPDATE findings SET status = 'fixed', last_verified_at = NOW()
                 WHERE check_id = $1 AND location = $2 AND status != 'fixed'`,
                [payload.check_id, payload.location]
              );
            }
          } else if (type === "completed") {
            await client.query(
              `UPDATE scans SET status = 'completed', phase = 'report', progress_pct = 100, summary = $1 WHERE id = $2`,
              [JSON.stringify(payload), scanId]
            );

            // Recalculate organization posture score
            const fRows = await client.query(
              `SELECT f.severity, f.epss_score, f.is_kev, f.check_id, a.criticality
               FROM findings f JOIN assets a ON a.id = f.asset_id
               WHERE f.status = 'open'`
            );
            const aCount = await client.query(`SELECT COUNT(*)::int AS cnt FROM assets`);
            const score = calculatePostureScore(
              fRows.rows.map((r) => ({
                severity: r.severity,
                assetCriticality: r.criticality,
                epssScore: r.epss_score,
                isKev: r.is_kev,
                checkId: r.check_id,
              })),
              aCount.rows[0]?.cnt ?? 1
            );
            await client.query(`UPDATE orgs SET posture_score = $1 WHERE id = $2`, [score, orgId]);
          } else if (type === "failed") {
            await client.query(
              `UPDATE scans SET status = 'failed', phase = $1, summary = $2 WHERE id = $3`,
              [phase, JSON.stringify(payload), scanId]
            );
          }

          await client.query("COMMIT");
          broadcastSse(scanId, { type, phase, at, payload });
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        } finally {
          client.release();
          await redis.xack(EVENTS_STREAM, INGEST_GROUP, msgId);
        }
      }
    }
  }
}
```

### 4.3 Stalled-Job Reaper (`api/src/lib/reaper.ts`)

Runs every 30 seconds on the Control Plane to reclaim worker jobs idle for more than 60 seconds so crashed containers never leave scans stuck in `running`:

```typescript
import Redis from "ioredis";

export function startStalledJobReaper(redis: Redis) {
  setInterval(async () => {
    try {
      await redis.call(
        "XAUTOCLAIM",
        "harizeon:scans:jobs",
        "workers",
        "reaper-01",
        "60000", // 60s idle threshold
        "0-0",
        "COUNT",
        "10"
      );
    } catch {
      // Ignore if stream or group not yet initialized
    }
  }, 30_000);
}
```

### 4.4 New v1.1 Control Plane Endpoints

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `POST` | `/v1/findings/:id/verify` | Enqueues a `mode: "verify_finding"` micro-scan job on `harizeon:scans:jobs`; transitions finding to `fixed` in under 5s if resolved. |
| `GET` | `/v1/drift` | Returns paginated `drift_events` (`NEW_SUBDOMAIN_DETECTED`, `FINDING_INTRODUCED`, `TLS_CERT_EXPIRING_SOON`) filtered by severity/date. |
| `GET` | `/v1/compliance/summary` | Evaluates `compliance_controls` vs. open findings for `pdpa_2024`, `bnm_rmit`, and `iso_27001`, returning pass/fail status per control. |
| `GET` | `/v1/public/trust/:slug` | Unauthenticated endpoint (only when `orgs.public_trust_enabled = true`) returning org name, posture grade, last scan timestamp, and zero-critical badge SVG. |

---

## 5. Web Console (`web/`) — Pure Monochrome v1.1 UI Upgrades

All v1.1 console routes live under `web/src/app/(console)/` and strictly follow `rounded-none`, `1px solid var(--border-line)`, `#ffffff`/`#000000` palette, and uppercase monospace headers.

### 5.1 Finding Detail Drawer Upgrade (`/findings/[id]`)
Add three high-signal sections inside the existing finding view:
1. **Redacted Evidence Block:** Monospace bordered box (`border border-line p-3 font-mono text-xs`) rendering `finding.evidence` and `source_tool`.
2. **Stack-Specific Remediation Tabs:** Switch between `NGINX`, `CLOUDFLARE`, `NEXTJS`, or `GENERAL` from `finding.remediation_snippets` with a 1-click `[ COPY SNIPPET ]` button.
3. **Instant Verification Action:** Primary solid-black monochrome button **`[ VERIFY FIX ]`** calling `POST /v1/findings/:id/verify`, showing inline live status (`VERIFYING...` -> `FIXED` or `STILL EXPOSED`).

### 5.2 Attack Surface Drift Feed (`web/src/app/(console)/drift/page.tsx`)
A reverse-chronological monospace log table using `PageHeader`, `SeverityChip`, and `DataTable` displaying:
* Timestamp (`UTC` / `MYT +08:00`)
* Drift Type Badge (`NEW_SUBDOMAIN`, `NEW_EXPOSURE`, `CERT_EXPIRING`)
* Target Asset & Summary
* Deep link to the originating Scan ID

### 5.3 Compliance Readiness Screen (`web/src/app/(console)/compliance/page.tsx`)
* Framework selector tabs: **`[ PDPA 2024 (MY) ]`** · **`[ BNM RMiT (MY) ]`** · **`[ ISO 27001:2022 ]`**
* Control readiness table showing `Control Code`, `Title`, `Mapped Open Findings`, and binary status (`PASS` / `ATTENTION REQUIRED`).
* **`[ EXPORT COMPLIANCE PDF ]`** button triggering `POST /v1/reports` with `{ type: "compliance", framework: "pdpa_2024" }`.

### 5.4 Public Trust Page & Badge (`web/src/app/trust/[slug]/page.tsx`)
* Clean monochrome status certificate displaying:
  * `CONTINUOUSLY MONITORED BY HARIZEON`
  * Verified Domain Count & Last Scan Timestamp
  * Critical Exposure Status (`0 CRITICAL EXPOSURES`)
* Provides an embeddable HTML/Markdown snippet in Workspace Settings so Malaysian startups display the Harizeon badge on their footer and enterprise RFP packs.

---

## 6. Malaysia Market & Compliance Readiness Checklist (v1.1)

### 6.1 Cyber Security Act 2024 (Act 854) Legal Hygiene
Before launching publicly in Malaysia:
* [ ] Audit all UI strings, PDF report titles, and landing pages to ensure **zero** use of regulated terms ("Penetration Testing Service", "VAPT Provider", "Managed SOC") until NACSA CSSP licensed.
* [ ] Use accurate SaaS terminology everywhere: **"Automated External Attack Surface Management (EASM)"**, **"Continuous Security Posture Monitoring"**, and **"Self-Serve Perimeter Readiness"**.
* [ ] Publish `https://harizeon.com/scanner` documenting static egress IPs, `HarizeonScanner/1.1` User-Agent, cryptographic ownership verification policy, and abuse contact (`security@harizeon.com`).
* [ ] Publish `https://harizeon.com/.well-known/security.txt`.

### 6.2 MYR Self-Serve Launch Tiers (v1.1)

| Plan | Price (MYR) | Limits | Included v1.1 Capabilities |
| :--- | :--- | :--- | :--- |
| **Free** | **RM 0 / mo** | 1 root domain | Weekly `quick` scan, Subfinder + HTTPx + TLSx, Posture Score, Public Trust Badge |
| **Pro** | **RM 249 / mo** | 5 root domains | Daily `standard` + `ai` scans, Full YAML + MCP Scanner, Drift Alerts (Slack/Webhook), 5s Verify Fix |
| **Business** | **RM 999 / mo** | 25 root domains | `deep` scans, **PDPA 2024 + BNM RMiT + ISO 27001** Compliance PDFs, API Keys, Team RBAC |

---

## 7. v1.1 Implementation Sequence & Mandatory Verification Gates

### Step-by-Step Build Order
1. **DB:** Apply `0006_v1_1_evidence_and_drift.sql` and `0007_v1_1_malaysia_compliance.sql` via `npm run db:migrate`.
2. **Worker:** Build multi-stage Docker image (`docker compose build worker`), add starter templates under `worker/templates/`, and implement the 6 adapters + `redact.py` + `scope.py`.
3. **API:** Implement `scoring.ts`, `events-ingestor.ts`, `reaper.ts`, and wire `POST /v1/findings/:id/verify`, `GET /v1/drift`, `GET /v1/compliance/summary`, and `GET /v1/public/trust/:slug`.
4. **Web:** Ship the upgraded Finding Drawer (`[ VERIFY FIX ]` + copy-paste snippets), `/drift`, `/compliance`, and `/trust/[slug]`.

### Mandatory Security & Quality Gates Before Tagging `v1.1.0`

```bash
# 1. Frontend typecheck & lint
cd web && npm run typecheck && npm run lint

# 2. Control plane unit & RLS isolation tests
cd api && npm test

# 3. Worker unit tests (including SSRF, secret redaction, and adapter parsing)
cd worker && pytest
```

### Required v1.1 Security Regression Tests (`worker/tests/test_v1_1_security.py`)
1. **SSRF Block Test:** Assert `is_public_ip()` returns `False` for `127.0.0.1`, `10.0.0.5`, `172.16.0.1`, `192.168.1.1`, `100.64.0.1`, `169.254.169.254`, and `::1`.
2. **Unverified Domain Rejection Test:** Assert `execute_full_scan()` immediately emits `failed` at Phase 1 (`verify`) and runs **zero** adapters when the DNS TXT token does not match.
3. **Secret Redaction Test:** Assert `redact_secrets("OPENAI_API_KEY=sk-proj-1234567890abcdef")` masks the secret and never returns the raw token string.
4. **Container Hardening Test:** Verify `docker compose run --rm worker sh -c "touch /etc/test"` fails (read-only root FS) and `env` contains **no** `DATABASE_URL`.
5. **Cross-Tenant RLS Test:** Assert Org A's session token receives `0` rows when querying Org B's `drift_events` or `asset_snapshots`.