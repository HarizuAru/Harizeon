import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Services Documentation & Specifications · Harizeon Docs",
  description:
    "Complete architectural blueprint, threat models, CLI/API triggers, verification protocols, scanning engines, and compliance mappings for all Harizeon services.",
};

interface ServiceDocItem {
  code: string;
  name: string;
  arnPattern: string;
  category: string;
  status: "available" | "roadmap";
  summary: string;
  engines: string[];
  guardrails: string[];
  verificationRequirement: string;
  apiTrigger: string;
  complianceMappings: { framework: string; controls: string }[];
}

const SERVICES_CATALOG: ServiceDocItem[] = [
  {
    code: "SCN",
    name: "Harizeon Scan",
    arnPattern: "arn:hz:scn:<org_id>:<scan_id>",
    category: "External Vulnerability & Attack Surface Scanning",
    status: "available",
    summary:
      "Automated, multi-phase external vulnerability scanner. Orchestrates port discovery, TLS verification, HTTP security posture, known-CVE matching, and Nuclei community template execution without sending destructive exploit payloads.",
    engines: [
      "Nuclei v3.11+ engine with 7,500+ curated community vulnerability templates",
      "Curated passive signature engine for web frameworks (Spring Actuator, Swagger, .env, .git)",
      "TLS handshake inspector (SSLv2/3, TLS 1.0, TLS 1.1, certificate expiry)",
      "Banner-to-CPE version correlation",
    ],
    guardrails: [
      "Strict ownership verification mandatory before execution (no exceptions)",
      "Non-destructive payloads only — safe for production infrastructure",
      "Target pinning to validated public IP addresses (drops private/loopback/RFC1918 IPs)",
      "Worker execution sandbox with zero database access",
    ],
    verificationRequirement:
      "DNS TXT record (_harizeon-verify.example.com) or HTTP well-known token (/.well-known/harizeon-challenge).",
    apiTrigger: `curl -X POST https://api.harizeon.com/v1/scans \\
  -H "Authorization: Bearer hrz_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "asset_id": "ast_01H89K2P00",
    "scan_profile": "standard",
    "schedule": "immediate"
  }'`,
    complianceMappings: [
      { framework: "ISO/IEC 27001:2022", controls: "A.8.8 (Management of technical vulnerabilities)" },
      { framework: "SOC 2 Type II", controls: "CC6.6, CC7.1 (Vulnerability management & system monitoring)" },
      { framework: "BNM RMiT", controls: "Clause 10.38 (External vulnerability assessments)" },
      { framework: "PDPA (Malaysia)", controls: "Section 9 (Security Principle - technical security safeguards)" },
    ],
  },
  {
    code: "ASM",
    name: "Harizeon Surface",
    arnPattern: "arn:hz:asm:<org_id>:<asset_id>",
    category: "Continuous Attack Surface Discovery & Asset Inventory",
    status: "available",
    summary:
      "Continuous external attack-surface mapping. Ingests Certificate Transparency (CT) logs and performs multi-threaded DNS enumeration to uncover exposed subdomains, new staging environments, and shadow IT.",
    engines: [
      "Subfinder v2.17+ with multi-source CT log ingestion (crt.sh, RapidDNS)",
      "Dnsx 1.3+ high-throughput DNS resolver",
      "Historical lineage tracker with first-seen and last-seen timestamps",
    ],
    guardrails: [
      "Strict domain boundary seam: only subdomains of verified roots are permitted",
      "Newly discovered assets default to 'unverified' and require manual or policy authorization before scanning",
      "No active brute-forcing without explicit customer rate configuration",
    ],
    verificationRequirement:
      "Inherits root domain ownership. If parent verification token is revoked, child assets are locked.",
    apiTrigger: `curl -X GET "https://api.harizeon.com/v1/assets?status=discovered" \\
  -H "Authorization: Bearer hrz_live_..."`,
    complianceMappings: [
      { framework: "ISO/IEC 27001:2022", controls: "A.8.9 (Configuration management), A.5.9 (Inventory of information and assets)" },
      { framework: "SOC 2 Type II", controls: "CC6.1 (Logical boundary and asset boundary maintenance)" },
      { framework: "BNM RMiT", controls: "Clause 10.42 (Perimeter and network infrastructure discovery)" },
    ],
  },
  {
    code: "PRO",
    name: "Harizeon Probe",
    arnPattern: "arn:hz:pro:<org_id>:<probe_id>",
    category: "Perimeter Reconnaissance & Port Probing",
    status: "available",
    summary:
      "Non-destructive TCP connect probing across common and extended port profiles. Identifies exposed service banners (SSH, Redis, Elasticsearch, RDP, MySQL) and flags services that must not face the public internet.",
    engines: [
      "Asynchronous TCP connect state machine",
      "Safe service banner grabber with protocol-specific handshakes",
      "RFC1918 / Bogon address filter prior to socket establishment",
    ],
    guardrails: [
      "Zero UDP flooding or SYN-flood mechanics (clean TCP connect only)",
      "Strict socket timeouts (3.0s max per target port) to prevent resource hogging",
      "Exposed administrative port alerts (Redis unauth, Elasticsearch, Telnet, VNC)",
    ],
    verificationRequirement:
      "Host must resolve to an IP associated with an active, verified asset in the tenant's inventory.",
    apiTrigger: `curl -X POST https://api.harizeon.com/v1/services/probe \\
  -H "Authorization: Bearer hrz_live_..." \\
  -d '{"asset_id": "ast_01H89K2P00", "port_profile": "common"}'`,
    complianceMappings: [
      { framework: "ISO/IEC 27001:2022", controls: "A.8.20 (Network security controls)" },
      { framework: "SOC 2 Type II", controls: "CC6.6 (Perimeter firewall and exposed service boundary)" },
      { framework: "BNM RMiT", controls: "Clause 10.40 (Restricting unauthenticated administrative ports)" },
    ],
  },
  {
    code: "INS",
    name: "Harizeon Inspect",
    arnPattern: "arn:hz:ins:<org_id>:<inspect_id>",
    category: "TLS Protocol & Security Header Auditing",
    status: "available",
    summary:
      "Audits cryptographic handshakes, TLS protocol support, and HTTP response headers across all web-facing assets. Verifies certificate chains and flags weak ciphers, expired certificates, and missing browser protections.",
    engines: [
      "TLS protocol validator (probes SSLv2, SSLv3, TLS 1.0, TLS 1.1, TLS 1.2, TLS 1.3)",
      "X.509 certificate chain analyzer and SAN matcher",
      "HTTP response security header evaluator (HSTS, CSP, XFO, XCTO, Permissions-Policy)",
    ],
    guardrails: [
      "Non-intrusive metadata evaluation only",
      "Host SNI verification against public target address",
      "Automated warning if certificate expires within 14 days",
    ],
    verificationRequirement:
      "Runs automatically as Phase 3 of Harizeon Scan on any verified web asset.",
    apiTrigger: `curl -X GET "https://api.harizeon.com/v1/assets/ast_01H89K2P00/inspect" \\
  -H "Authorization: Bearer hrz_live_..."`,
    complianceMappings: [
      { framework: "ISO/IEC 27001:2022", controls: "A.8.24 (Use of cryptography)" },
      { framework: "SOC 2 Type II", controls: "CC6.7 (Transmission encryption and transport security)" },
      { framework: "BNM RMiT", controls: "Clause 10.43 (Mandatory TLS 1.2+ encryption for external channels)" },
    ],
  },
  {
    code: "ADT",
    name: "Harizeon Audit",
    arnPattern: "arn:hz:adt:<org_id>:<report_id>",
    category: "Executive Governance & Compliance Reporting",
    status: "available",
    summary:
      "Aggregates vulnerability findings, asset posture, and historical scan evidence into boardroom-ready executive summaries, prioritized technical remediation roadmaps, and auditor-ready compliance mapping PDFs.",
    engines: [
      "Dynamic 0–100 security posture scoring algorithm",
      "Compliance cross-walk engine (maps CVEs and findings to ISO, SOC 2, RMiT, PDPA controls)",
      "Deterministic PDF report generator with tamper-evident metadata hashes",
    ],
    guardrails: [
      "Row-Level Security (RLS) query isolation: tenants can never read another organization's findings",
      "Clear disclaimers that automated control mappings are technical evidence, not an auditor's legal opinion",
    ],
    verificationRequirement:
      "All findings included in reports originate strictly from verified organization assets.",
    apiTrigger: `curl -X POST https://api.harizeon.com/v1/reports \\
  -H "Authorization: Bearer hrz_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "executive",
    "format": "pdf",
    "frameworks": ["iso27001", "soc2", "pdpa"]
  }'`,
    complianceMappings: [
      { framework: "ISO/IEC 27001:2022", controls: "A.5.36 (Compliance with policies and rules for information security)" },
      { framework: "SOC 2 Type II", controls: "CC2.1, CC3.2 (Management reporting and risk evaluation)" },
      { framework: "BNM RMiT", controls: "Clause 10.46 (Board & Senior Management security posture reporting)" },
    ],
  },
  {
    code: "GRD",
    name: "Harizeon Guard",
    arnPattern: "arn:hz:grd:<org_id>:<intel_id>",
    category: "Threat Intelligence & Exploit Prioritization",
    status: "available",
    summary:
      "Correlates external findings with real-world weaponization signals using the CISA Known Exploited Vulnerabilities (KEV) catalog and FIRST.org EPSS (Exploit Prediction Scoring System) to eliminate false-alarm fatigue.",
    engines: [
      "CISA KEV daily synchronization engine",
      "EPSS score percentile evaluator (0.000 to 1.000 probability)",
      "Graph-based attack path modeling and Knapsack ROI remediation optimization",
    ],
    guardrails: [
      "Defensive prioritization only; zero payload weaponization or offensive exploit triggering",
      "Evidence-backed exploit scoring rather than arbitrary severity inflation",
    ],
    verificationRequirement:
      "Enriches finding data across all verified assets within the tenant workspace.",
    apiTrigger: `curl -X GET "https://api.harizeon.com/v1/findings?has_kev=true&min_epss=0.5" \\
  -H "Authorization: Bearer hrz_live_..."`,
    complianceMappings: [
      { framework: "ISO/IEC 27001:2022", controls: "A.5.7 (Threat intelligence integration)" },
      { framework: "SOC 2 Type II", controls: "CC7.3 (Threat monitoring and rapid response prioritization)" },
    ],
  },
  {
    code: "IAM",
    name: "Harizeon IAM",
    arnPattern: "arn:hz:iam:<org_id>:<user_or_key_id>",
    category: "Identity, Access Management & Audit Logging",
    status: "available",
    summary:
      "Multi-tenant organization boundary enforcement, role-based access control (RBAC), scoped API key provisioning (scans:write, assets:read, reports:read), and append-only audit logging.",
    engines: [
      "PostgreSQL Row-Level Security (RLS) keyed on harizeon.org_id",
      "PBKDF2/Argon2id credential hashing with timing-safe comparisons",
      "Signed webhook delivery engine with HMAC-SHA256 verification",
    ],
    guardrails: [
      "Database owner connection separated from application user connection",
      "API keys stored hashed (only raw token shown once upon generation)",
      "Immutable, tamper-evident audit log ledger",
    ],
    verificationRequirement:
      "Available by default upon organization registration.",
    apiTrigger: `curl -X POST https://api.harizeon.com/v1/api-keys \\
  -H "Authorization: Bearer hrz_live_..." \\
  -d '{"name": "CI/CD Pipeline", "scopes": ["scans:write", "findings:read"]}'`,
    complianceMappings: [
      { framework: "ISO/IEC 27001:2022", controls: "A.5.15 (Access control), A.8.15 (Logging)" },
      { framework: "SOC 2 Type II", controls: "CC6.1, CC6.2, CC6.3 (Access management & segregation of duties)" },
      { framework: "BNM RMiT", controls: "Clause 10.15 (Privileged user access management & audit logging)" },
    ],
  },
  {
    code: "VLT",
    name: "Harizeon Vault",
    arnPattern: "arn:hz:vlt:<org_id>:<secret_id>",
    category: "Secrets & Credential Exposure Monitoring",
    status: "roadmap",
    summary:
      "Roadmap (v0.2+): Programmatic secrets storage, automated credential rotation reminders, and perimeter paste/public repository leak monitoring for tenant domains.",
    engines: ["Git leak detection heuristics (Planned)", "Encrypted envelope storage (Planned)"],
    guardrails: ["Zero unauthenticated secret retrieval", "Customer-managed encryption keys (Planned)"],
    verificationRequirement: "Requires verified parent domain.",
    apiTrigger: "# Planned for v0.2. Service not yet available in current release.",
    complianceMappings: [
      { framework: "ISO/IEC 27001:2022", controls: "A.8.24 (Cryptographic secret key management)" },
    ],
  },
  {
    code: "WCH",
    name: "Harizeon Watch",
    arnPattern: "arn:hz:wch:<org_id>:<stream_id>",
    category: "SIEM-Lite Log Ingestion & Real-Time Alerting",
    status: "roadmap",
    summary:
      "Roadmap (v0.2+): Log retention, rule-based stream processing, and multi-channel incident dispatching (Slack, PagerDuty, Webhooks, Email).",
    engines: ["Event stream processing (Planned)", "Rule-based anomaly trigger (Planned)"],
    guardrails: ["Strict tenant log isolation", "Encrypted log storage at rest"],
    verificationRequirement: "Requires configured tenant sink.",
    apiTrigger: "# Planned for v0.2. Service not yet available in current release.",
    complianceMappings: [
      { framework: "SOC 2 Type II", controls: "CC7.2 (Security event logging and incident alerting)" },
    ],
  },
  {
    code: "SHD",
    name: "Harizeon Shield",
    arnPattern: "arn:hz:shd:<org_id>:<proxy_id>",
    category: "Managed Reverse Proxy & WAF Mitigation",
    status: "roadmap",
    summary:
      "Roadmap (v0.3+): Managed Web Application Firewall (WAF) and layer-7 rate limiting delivered via edge reverse proxy or automated rule synchronization to Cloudflare.",
    engines: ["Edge WAF rule compiler (Planned)", "Dynamic IP rate limiter (Planned)"],
    guardrails: ["Fails open or bypasses with health checks to prevent site outages"],
    verificationRequirement: "Requires CNAME or NS delegation verification.",
    apiTrigger: "# Planned for v0.3. Service not yet available in current release.",
    complianceMappings: [
      { framework: "ISO/IEC 27001:2022", controls: "A.8.20 (Network controls and perimeter defense)" },
    ],
  },
];

export default function ServicesDocsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl flex flex-col gap-12">
          {/* Header & Breadcrumb */}
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-muted mb-4">
              <Link href="/docs" className="hover:text-ink">
                Docs
              </Link>
              <span>/</span>
              <span className="text-ink font-bold">Services Reference</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-line pb-8">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-muted block mb-2">
                  System Architecture · §04 Service Catalog
                </span>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-sans">
                  Services Documentation &amp; Technical Specifications
                </h1>
                <p className="mt-2 text-sm text-muted max-w-3xl font-sans leading-relaxed">
                  Every Harizeon capability is architected as an API-first, metered cloud service with deterministic ARN
                  resource identifiers, strict ownership verification guardrails, and automated compliance control
                  mappings.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/services"
                  className="h-9 px-4 border border-line bg-canvas text-ink font-mono text-xs uppercase tracking-wider hover:bg-subtle transition-colors flex items-center justify-center"
                >
                  [Matrix View]
                </Link>
                <Link
                  href="/docs/api"
                  className="h-9 px-4 border border-ink bg-ink text-canvas font-mono text-xs uppercase tracking-wider hover:bg-muted transition-colors flex items-center justify-center font-bold"
                >
                  REST API Docs →
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Nav Anchors */}
          <div className="border border-line bg-subtle p-4">
            <span className="font-mono text-xs uppercase tracking-wider text-muted block mb-3 font-bold">
              Service Directory &amp; Navigation
            </span>
            <div className="flex flex-wrap gap-2">
              {SERVICES_CATALOG.map((svc) => (
                <a
                  key={svc.code}
                  href={`#service-${svc.code.toLowerCase()}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono border border-line bg-canvas text-ink hover:border-ink transition-colors"
                >
                  <span className="font-bold">[{svc.code}]</span>
                  <span>{svc.name.replace("Harizeon ", "")}</span>
                  {svc.status === "roadmap" && (
                    <span className="text-[10px] text-muted border border-line px-1">ROADMAP</span>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Architectural Guardrails & Data Flow */}
          <div className="border border-line bg-canvas p-6 sm:p-8">
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink mb-4 flex items-center justify-between">
              <span>Platform Seam: Control Plane vs. Data Plane</span>
              <span className="text-xs text-muted font-normal font-mono">[ISO/IEC 27001 §A.8.8 Compliant]</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
              <div className="border border-line p-4 bg-canvas flex flex-col gap-2">
                <span className="font-bold text-ink text-sm">01 · Control Plane</span>
                <p className="text-muted text-[11px] font-sans leading-relaxed">
                  The API and web console (Fastify + Next.js) hold the PostgreSQL connection with strict tenant Row-Level
                  Security (<code className="text-ink">harizeon.org_id</code>). It manages identities, asset verification,
                  and job dispatching.
                </p>
                <span className="text-[10px] text-muted border-t border-line pt-2 mt-auto">
                  Auth: Bearer API Keys / Argon2id
                </span>
              </div>

              <div className="border border-line p-4 bg-canvas flex flex-col gap-2">
                <span className="font-bold text-ink text-sm">02 · Secure Seam</span>
                <p className="text-muted text-[11px] font-sans leading-relaxed">
                  Jobs cross between planes via encrypted Redis Streams. Workers parse untrusted, hostile external network
                  data and possess <strong>zero database credentials</strong>. Compromising a worker grants zero access to
                  the database.
                </p>
                <span className="text-[10px] text-muted border-t border-line pt-2 mt-auto">
                  Transport: Redis Streams (`ScanQueue`)
                </span>
              </div>

              <div className="border border-line p-4 bg-canvas flex flex-col gap-2">
                <span className="font-bold text-ink text-sm">03 · Data Plane (Workers)</span>
                <p className="text-muted text-[11px] font-sans leading-relaxed">
                  Isolated Python worker containers execute Subfinder, Dnsx, Nuclei, and socket handshakes. Output results
                  cross back strictly through validated result events verified by the control plane.
                </p>
                <span className="text-[10px] text-muted border-t border-line pt-2 mt-auto">
                  Engines: Nuclei v3 · Subfinder · Dnsx
                </span>
              </div>
            </div>
          </div>

          {/* Service Specifications Section */}
          <div className="flex flex-col gap-16">
            {SERVICES_CATALOG.map((svc) => (
              <section
                key={svc.code}
                id={`service-${svc.code.toLowerCase()}`}
                className="border border-line bg-canvas p-6 sm:p-8 flex flex-col gap-6 scroll-mt-20"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-bold text-ink bg-subtle px-2 py-0.5 border border-line">
                        {svc.code}
                      </span>
                      <h3 className="text-2xl font-bold font-sans text-ink">{svc.name}</h3>
                      {svc.status === "available" ? (
                        <span className="font-mono text-[11px] px-2 py-0.5 border border-line bg-canvas text-ink font-bold">
                          [✓ AVAILABLE]
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] px-2 py-0.5 border border-line bg-subtle text-muted">
                          [○ ROADMAP v0.2+]
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-muted block mt-1">{svc.category}</span>
                  </div>

                  <div className="font-mono text-xs text-muted">
                    <span className="text-ink font-bold">ARN: </span>
                    <code className="bg-subtle px-1.5 py-0.5 border border-line text-ink">{svc.arnPattern}</code>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-sm font-sans text-muted leading-relaxed">{svc.summary}</p>

                {/* Specs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                  {/* Engines */}
                  <div className="border border-line p-4 flex flex-col gap-2">
                    <span className="font-bold text-ink uppercase tracking-wider text-[11px]">
                      Engines &amp; Tooling
                    </span>
                    <ul className="list-disc list-inside text-muted text-[11px] space-y-1 font-sans">
                      {svc.engines.map((eng, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {eng}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Guardrails */}
                  <div className="border border-line p-4 flex flex-col gap-2">
                    <span className="font-bold text-ink uppercase tracking-wider text-[11px]">
                      Security Guardrails &amp; Constraints
                    </span>
                    <ul className="list-disc list-inside text-muted text-[11px] space-y-1 font-sans">
                      {svc.guardrails.map((g, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Verification Requirements */}
                <div className="border border-line bg-subtle p-4 font-mono text-xs">
                  <span className="font-bold text-ink uppercase tracking-wider text-[11px] block mb-1">
                    Ownership Verification Requirement
                  </span>
                  <p className="text-muted text-[11px] font-sans leading-relaxed">{svc.verificationRequirement}</p>
                </div>

                {/* API Execution Example */}
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink block mb-2">
                    cURL API Trigger / Invocations
                  </span>
                  <pre className="border border-line bg-subtle p-4 font-mono text-xs text-ink overflow-x-auto">
                    {svc.apiTrigger}
                  </pre>
                </div>

                {/* Compliance Frameworks Mapped */}
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink block mb-2">
                    Compliance &amp; Governance Mapping
                  </span>
                  <div className="border border-line overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="border-b border-line bg-subtle text-muted text-[11px] uppercase">
                        <tr>
                          <th className="p-2.5">Standard / Regulation</th>
                          <th className="p-2.5">Mapped Control Requirement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line text-[11px]">
                        {svc.complianceMappings.map((cm, idx) => (
                          <tr key={idx} className="hover:bg-subtle/50">
                            <td className="p-2.5 font-bold text-ink">{cm.framework}</td>
                            <td className="p-2.5 text-muted">{cm.controls}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            ))}
          </div>

          {/* Bottom Call to Action */}
          <div className="border border-line bg-subtle p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold font-sans text-ink">Ready to integrate Harizeon services?</h3>
              <p className="text-xs font-sans text-muted mt-1">
                Generate an API key in your console and start scanning verified infrastructure in minutes.
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/docs/quickstart"
                className="h-9 px-4 border border-line bg-canvas text-ink font-mono text-xs uppercase tracking-wider hover:bg-subtle transition-colors flex items-center justify-center"
              >
                Follow Quickstart
              </Link>
              <Link
                href="/dashboard"
                className="h-9 px-4 border border-ink bg-ink text-canvas font-mono text-xs uppercase tracking-wider hover:bg-muted transition-colors flex items-center justify-center font-bold"
              >
                Launch Console →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
