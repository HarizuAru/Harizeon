import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Services Matrix · Harizeon",
  description:
    "Harizeon external attack-surface, scanning, and compliance services · only shipped capabilities are listed here.",
};

// This catalog lists ONLY capabilities that exist in the code today. Planned
// capabilities are not advertised until they are implemented (§10.8: a security
// product does not advertise what it cannot do). Descriptions must match the
// shipped check set.
const AVAILABLE_SERVICES = [
  {
    code: "SCN",
    name: "Harizeon Scan",
    href: "/services/scan",
    description:
      "Non-destructive, multi-phase external scanner. Port and service probing, TLS inspection, security-header review and template-driven web checks.",
    features: [
      "TCP connect port probing with banner capture (no exploit payloads)",
      "TLS protocol acceptance (SSLv2/3, TLS 1.0/1.1) and certificate expiry",
      "Web checks: .git, .env, SQL dumps, phpinfo, Swagger UI, Actuator",
      "AI exposure: unauthenticated model endpoints and provider keys leaked in client-side JavaScript",
      "Known-CVE matching for software versions identified from service banners (curated set)",
      "Deduplicated findings with evidence, remediation and status workflow",
    ],
  },
  {
    code: "AIA",
    name: "Harizeon AI-Armor",
    href: "/services/aia",
    description:
      "Specialized attack surface scanning for LLM inference endpoints, vector databases, agentic MCP servers, and leaked AI provider keys.",
    features: [
      "Unauthenticated LLM inference detection (Ollama, vLLM, LocalAI, LM Studio)",
      "Vector DB & RAG storage discovery (ChromaDB, Qdrant, Milvus, Weaviate)",
      "Client-side AI API key leak detection (OpenAI, Anthropic, Gemini, DeepSeek, Groq, Mistral, Together AI)",
      "Agent tool execution & Model Context Protocol (MCP) endpoint exposure",
      "OWASP Top 10 for LLMs (LLM01, LLM02, LLM06) and ISO/IEC 42001 compliance control mapping",
      "Fast 30-second focused audit profile available across all plans",
    ],
  },
  {
    code: "ASM",
    name: "Harizeon Surface",
    href: "/services/asm",
    description:
      "External attack-surface discovery. New subdomains are found from Certificate Transparency logs and DNS, then held for your review before they are scanned.",
    features: [
      "Subdomain discovery from Certificate Transparency logs (crt.sh) and DNS",
      "Strict boundary enforcement: only strict subdomains of a verified asset are accepted",
      "Discovered hosts start out of scope and need explicit authorisation",
      "Alert when a new subdomain appears",
      "Ownership re-verified continuously; revoked on loss",
    ],
  },
  {
    code: "PRO",
    name: "Harizeon Probe",
    href: "/services/pro",
    description:
      "Non-destructive TCP port probing and service banner identification across a common and an extended port set.",
    features: [
      "TCP connect probing (common + extended port sets)",
      "Banner capture without exploit delivery",
      "Flags services that must not face the internet (unauth Redis, Elasticsearch, Telnet, RDP, VNC)",
      "Connects only to validated public addresses",
      "Isolated workers with no database access",
    ],
  },
  {
    code: "INS",
    name: "Harizeon Inspect",
    href: "/services/ins",
    description: "TLS protocol and certificate checks plus HTTP security-header compliance.",
    features: [
      "Legacy protocol detection (SSLv2/SSLv3, TLS 1.0, TLS 1.1)",
      "Certificate expiry (expired, or expiring within 14 days)",
      "Header audit: HSTS, Content-Security-Policy, X-Content-Type-Options, X-Frame-Options",
      "Server banner disclosure",
    ],
  },
  {
    code: "ADT",
    name: "Harizeon Audit",
    href: "/services/adt",
    description:
      "Executive and technical reports with a security score, prioritised remediation plan and compliance control mapping.",
    features: [
      "Executive posture score (0–100) and remediation plan",
      "Findings mapped to ISO/IEC 27001:2022, SOC 2, BNM RMiT and PDPA (MY) controls",
      "Print / save-as-PDF export",
      "Append-only audit log",
    ],
  },
];

const ROADMAP_SERVICES = [
  {
    code: "VLT",
    name: "Harizeon Vault",
    href: "/services/vlt",
    description:
      "Public commit and paste monitoring for exposed credentials and API secrets belonging to your organization.",
    features: [
      "GitHub & GitLab public commit scanning",
      "Paste site and credential dump ingestion",
      "Immediate alert before compromised keys are leveraged",
    ],
  },
  {
    code: "WCH",
    name: "Harizeon Watch",
    href: "/services/wch",
    description:
      "Continuous DNS drift detection, BGP route change monitoring, and external web defacement integrity verification.",
    features: [
      "Continuous DNS record diffing & passive route monitoring",
      "External HTML & integrity drift alerts",
      "Instant notification on unauthorized perimeter changes",
    ],
  },
  {
    code: "SHD",
    name: "Harizeon Shield",
    href: "/services/shd",
    description:
      "Edge proxy rules, origin IP hiding, and automated rate limiting to protect exposed services from direct exploitation.",
    features: [
      "Origin IP discovery prevention & reverse-proxy cloaking",
      "Automated edge firewall recommendations",
      "Pre-configured rate limiting rules for sensitive paths",
    ],
  },
  {
    code: "RSP",
    name: "Harizeon Respond",
    href: "/services/rsp",
    description:
      "Guided incident containment workflows and emergency remediation playbooks tailored for small engineering teams.",
    features: [
      "One-click triage playbooks for high-impact exposures",
      "Containment checklists mapped to BNM RMiT & ISO 27001",
      "Forensic audit artifacts for auditors & stakeholders",
    ],
  },
];

const SOLUTION_PILLARS = [
  {
    code: "SURFACE",
    badge: "PILLAR 01",
    name: "Attack Surface Reconnaissance",
    tagline: "Asset Inventory + Port Mapping + Crypto Audit",
    target: "DevOps & Cloud Engineers",
    description:
      "Eliminates shadow IT by continuously monitoring external perimeter boundaries, mapping accessible network ports, and auditing certificate validity and modern TLS configuration.",
    engines: [
      { code: "ASM", name: "Harizeon Surface", desc: "Subdomains via CT logs & DNS", href: "/services/asm", status: "available" },
      { code: "PRO", name: "Harizeon Probe", desc: "Safe TCP connect port recon", href: "/services/pro", status: "available" },
      { code: "INS", name: "Harizeon Inspect", desc: "TLS & security headers audit", href: "/services/ins", status: "available" },
    ],
  },
  {
    code: "THREAT",
    badge: "PILLAR 02",
    name: "Vulnerability & Threat Sweeps",
    tagline: "CVE Matching + Sensitive Leaks + Model Security",
    target: "Engineering Leads & AppSec",
    description:
      "Automates non-destructive vulnerability detection across all verified web endpoints. Flags known CVEs, unauthenticated AI model endpoints, leaked API keys, and perimeter drift.",
    engines: [
      { code: "SCN", name: "Harizeon Scan", desc: "Web checks & known-CVE matching", href: "/services/scan", status: "available" },
      { code: "VLT", name: "Harizeon Vault", desc: "Public commit & paste leak watch", href: "/services/vlt", status: "roadmap" },
      { code: "WCH", name: "Harizeon Watch", desc: "Continuous DNS drift & integrity", href: "/services/wch", status: "roadmap" },
    ],
  },
  {
    code: "GOVERNANCE",
    badge: "PILLAR 03",
    name: "Compliance, Audit & Response",
    tagline: "Executive Posture + ISO/SOC2 Mapping + Triage",
    target: "Founders, CTOs & Compliance Officers",
    description:
      "Transforms technical findings into auditor-ready reports. Computes transparent 0–100 posture scores and maps controls to ISO 27001, SOC 2, BNM RMiT, and Malaysian PDPA.",
    engines: [
      { code: "ADT", name: "Harizeon Audit", desc: "Posture score & PDF generation", href: "/services/adt", status: "available" },
      { code: "RSP", name: "Harizeon Respond", desc: "Guided incident playbooks", href: "/services/rsp", status: "roadmap" },
      { code: "SHD", name: "Harizeon Shield", desc: "Edge cloaking & rate limit rules", href: "/services/shd", status: "roadmap" },
    ],
  },
];

export default function ServicesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col gap-20">
          {/* Header */}
          <div>
            <div className="border-b border-line pb-8 mb-10">
              <span className="font-mono text-xs uppercase tracking-wider text-muted block mb-2">
                Unified Architecture &amp; Engines
              </span>
              <h1 className="text-4xl font-bold tracking-tight text-ink font-sans">
                Services &amp; Infrastructure
              </h1>
              <p className="mt-2 text-sm text-muted max-w-3xl font-sans leading-relaxed">
                Harizeon packages nine specialized security engines into three consolidated solution pillars.
                Every check runs strictly against verified perimeter assets with proven domain ownership.
              </p>
            </div>

            {/* SECTION 1: The 3 Consolidated Solution Pillars */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-3">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                  Consolidated Solutions (How Teams Buy &amp; Use Harizeon)
                </span>
                <span className="font-mono text-[11px] text-muted">
                  3 Cohesive Pillars · 9 Specialized Engines
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {SOLUTION_PILLARS.map((p) => (
                  <div
                    key={p.code}
                    className="border border-line bg-canvas p-6 flex flex-col justify-between card-interactive"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-line pb-2.5 mb-3.5">
                        <span className="font-mono text-[10px] uppercase font-bold text-muted">
                          {p.badge}
                        </span>
                        <span className="border border-ink bg-ink text-canvas font-mono text-[9px] uppercase px-1.5 py-0.5 font-bold">
                          {p.target}
                        </span>
                      </div>

                      <h2 className="font-mono text-lg font-bold text-ink">
                        {p.name}
                      </h2>
                      <span className="font-mono text-[11px] text-muted block mt-0.5 mb-3">
                        {p.tagline}
                      </span>
                      <p className="text-xs text-muted font-sans leading-relaxed">
                        {p.description}
                      </p>

                      <div className="mt-5 pt-4 border-t border-line">
                        <span className="font-mono text-[10px] uppercase font-bold text-muted block mb-2">
                          Integrated Engines:
                        </span>
                        <div className="flex flex-col gap-1.5 font-mono text-xs">
                          {p.engines.map((eng) => (
                            <Link
                              key={eng.code}
                              href={eng.href}
                              className="flex items-center justify-between border border-line bg-subtle/30 px-2.5 py-1.5 hover:bg-canvas hover:border-ink transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-ink">{eng.code}</span>
                                <span className="text-[11px] text-muted">· {eng.desc}</span>
                              </div>
                              <span
                                className={`text-[9px] uppercase px-1 font-bold border ${
                                  eng.status === "available"
                                    ? "border-ink bg-ink text-canvas"
                                    : "border-line text-muted"
                                }`}
                              >
                                {eng.status}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: Architecture Pipeline Data Flow */}
          <div className="border border-line bg-canvas p-6 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <span className="font-bold text-ink uppercase tracking-wider">
                Execution Pipeline (§06 Master Plan Architecture)
              </span>
              <span className="text-muted text-[11px]">Strict Control / Data Plane Isolation</span>
            </div>
            <pre className="overflow-x-auto text-[11px] leading-relaxed text-muted bg-subtle p-4 border border-line">
{`[01. VERIFY]  DNS TXT / HTTP File Proof  -->  [Strict Boundary Check: No Ownership, No Scan]
       ↓
[02. ASM]     Certificate Logs & DNS      -->  Discovers unmapped subdomains (held for review)
       ↓
[03. PRO]     TCP Connect Port Recon      -->  Pins validated public IP, maps open services & banners
       ↓
[04. INS]     TLS Handshake & Headers     -->  Checks SSLv2/3, TLS 1.0/1.1, certificate expiry, HSTS/CSP
       ↓
[05. SCN]     Web Checks & Known CVEs     -->  Probes for exposed .git/.env, AI key leaks, CVE matching
       ↓
[06. ADT]     Executive Score & Reports   -->  Calculates 0-100 score, maps to ISO 27001, SOC 2, RMiT, PDPA`}
            </pre>
          </div>

          {/* SECTION 3: Shipped & Available Engines (v0.1) */}
          <div>
            <div className="border-b border-line pb-6 mb-8">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-ink font-sans">
                  Active Shipped Engines (v0.1)
                </h2>
                <span className="border border-ink bg-ink text-canvas px-2 py-0.5 font-mono text-[10px] uppercase font-bold">
                  Live &amp; Production Ready
                </span>
              </div>
              <p className="mt-2 text-xs text-muted max-w-2xl font-sans leading-relaxed">
                These five engines form the core MVP. Everything listed here is deployed and operational in production today.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {AVAILABLE_SERVICES.map((s) => (
                <div
                  key={s.code}
                  className="border border-line bg-canvas p-6 flex flex-col justify-between card-interactive"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="border border-ink px-2.5 py-0.5 font-mono text-xs font-bold text-ink">
                        {s.code}
                      </span>
                      <span className="border border-ink bg-ink px-2 py-0.5 font-mono text-[10px] uppercase text-canvas font-bold">
                        available
                      </span>
                    </div>

                    <h3 className="mt-4 font-mono text-lg font-bold text-ink">
                      {s.name}
                    </h3>
                    <p className="mt-2 text-xs text-muted font-sans leading-relaxed">
                      {s.description}
                    </p>

                    <ul className="mt-4 pt-4 border-t border-line flex flex-col gap-1.5 font-mono text-[11px] text-muted">
                      {s.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <span className="text-ink">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-line">
                    <Link
                      href={s.href}
                      className="inline-block border border-ink bg-canvas px-4 py-2 font-mono text-xs uppercase text-ink hover:bg-ink hover:text-canvas transition-colors button-tactile"
                    >
                      View Specifications →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: Roadmap Engines (v0.2+) */}
          <div>
            <div className="border-b border-line pb-6 mb-8">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-ink font-sans">
                  Roadmap Engines (v0.2+)
                </h2>
                <span className="border border-line bg-subtle px-2 py-0.5 font-mono text-[10px] uppercase text-muted font-bold">
                  Architectural Spec
                </span>
              </div>
              <p className="mt-2 text-xs text-muted max-w-2xl font-sans leading-relaxed">
                Planned capabilities designed to extend Harizeon into secret protection, drift monitoring,
                edge protection, and incident containment (§05 Master Plan).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {ROADMAP_SERVICES.map((s) => (
                <div
                  key={s.code}
                  className="border border-line bg-subtle/20 p-5 flex flex-col justify-between card-interactive"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="border border-line px-2 py-0.5 font-mono text-xs font-bold text-muted">
                        {s.code}
                      </span>
                      <span className="border border-line text-muted px-2 py-0.5 font-mono text-[10px] uppercase">
                        roadmap
                      </span>
                    </div>

                    <h3 className="mt-3 font-mono text-base font-bold text-ink">
                      {s.name}
                    </h3>
                    <p className="mt-2 text-xs text-muted font-sans leading-relaxed">
                      {s.description}
                    </p>

                    <ul className="mt-3 pt-3 border-t border-line flex flex-col gap-1 font-mono text-[10px] text-faint">
                      {s.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5">
                          <span>-</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 pt-3 border-t border-line">
                    <Link
                      href={s.href}
                      className="inline-block border border-line bg-canvas px-3 py-1.5 font-mono text-[11px] uppercase text-muted hover:border-ink hover:text-ink transition-colors button-tactile"
                    >
                      Planned Spec →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
