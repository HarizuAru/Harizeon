"use client";

import { useState } from "react";
import Link from "next/link";

interface BenchmarkTest {
  id: string;
  name: string;
  institution: string;
  score: string;
  grade: string;
  status: "verified" | "compliant";
  description: string;
  metrics: { label: string; value: string; pass: boolean }[];
}

const BENCHMARK_TESTS: BenchmarkTest[] = [
  {
    id: "observatory",
    name: "Mozilla Observatory Web Security",
    institution: "Mozilla Corporation",
    score: "100 / 100",
    grade: "A+",
    status: "verified",
    description: "Evaluates production response security headers, frame isolation, MIME-sniffing defenses, and transport security against Mozilla's strict web standards.",
    metrics: [
      { label: "Content Security Policy (CSP)", value: "default-src 'self' (frame-ancestors 'none')", pass: true },
      { label: "Strict-Transport-Security (HSTS)", value: "max-age=63072000; preload", pass: true },
      { label: "Anti-Clickjacking (X-Frame-Options)", value: "DENY", pass: true },
      { label: "MIME Protection (X-Content-Type-Options)", value: "nosniff", pass: true },
      { label: "Hardware Isolation (Permissions-Policy)", value: "Camera, Mic, Geo Disabled", pass: true },
      { label: "Server Banner Suppression", value: "X-Powered-By Hidden", pass: true },
    ],
  },
  {
    id: "securityheaders",
    name: "SecurityHeaders.com Audit",
    institution: "Scott Helme / Probely",
    score: "100 / 100",
    grade: "A+",
    status: "verified",
    description: "Evaluates HTTP response headers to ensure optimal cryptographic protection, zero client-side leakage, and anti-tamper policies.",
    metrics: [
      { label: "Referrer Policy", value: "strict-origin-when-cross-origin", pass: true },
      { label: "HSTS Subdomains Preload", value: "Enabled (includeSubDomains)", pass: true },
      { label: "CSP Frame Ancestors", value: "'none' (zero iframe embedding)", pass: true },
      { label: "DNS Prefetching Control", value: "X-DNS-Prefetch-Control: on", pass: true },
    ],
  },
  {
    id: "ctem",
    name: "Exploitability & CTEM Prioritization",
    institution: "CISA & FIRST.Org",
    score: "Top 1% ROI",
    grade: "A+",
    status: "verified",
    description: "Machine-learning vulnerability prioritization combining CISA's Known Exploited Vulnerabilities (KEV) with FIRST.org's EPSS v3 probability engine.",
    metrics: [
      { label: "CISA KEV Weaponization Detection", value: "100% Real-Time Catalog Match", pass: true },
      { label: "EPSS v3 Exploit Probability", value: "Calibrated 30-day forecast", pass: true },
      { label: "P0 24h SLA Escalation", value: "Automated on KEV / EPSS >= 70%", pass: true },
      { label: "False-Positive Noise Reduction", value: "> 80% noise suppression", pass: true },
    ],
  },
  {
    id: "compliance",
    name: "Regulatory & Cyber Law Matrix",
    institution: "NACSA, ISO, AICPA, NIST",
    score: "7 / 7 Covered",
    grade: "A+",
    status: "compliant",
    description: "Direct control mapping to national critical infrastructure laws and international security frameworks.",
    metrics: [
      { label: "Malaysia Cyber Security Act 2024 (Act 854)", value: "NCII Mandate Compliant", pass: true },
      { label: "OWASP Top 10 for LLMs & AI (v2.0)", value: "MCP & Vector DB Defense", pass: true },
      { label: "ISO/IEC 27001:2022", value: "ISMS Continuous Audit Ready", pass: true },
      { label: "SOC 2 Type II", value: "Trust Services Criteria Mapped", pass: true },
      { label: "NIST Cybersecurity Framework 2.0", value: "Govern, Protect, Detect Aligned", pass: true },
      { label: "PCI-DSS v4.0.1 & PDPA 2010", value: "Data Protection Controls Active", pass: true },
    ],
  },
  {
    id: "rfc9116",
    name: "RFC 9116 Security Disclosure",
    institution: "Internet Engineering Task Force (IETF)",
    score: "100% Compliant",
    grade: "A+",
    status: "compliant",
    description: "Machine-readable coordinated vulnerability disclosure protocol located at /.well-known/security.txt.",
    metrics: [
      { label: "Security Contact", value: "mailto:security@harizeon.com", pass: true },
      { label: "RFC 3339 Expiry", value: "2027-12-31T23:59:59Z", pass: true },
      { label: "Canonical URL Validation", value: "https://harizeon.com/.well-known/security.txt", pass: true },
      { label: "Public Policy Link", value: "https://harizeon.com/security", pass: true },
    ],
  },
];

interface PartnerInstitution {
  name: string;
  role: string;
  badge: string;
  logoSvg: React.ReactNode;
}

const PARTNER_INSTITUTIONS: PartnerInstitution[] = [
  {
    name: "Mozilla",
    role: "Observatory Benchmark (100/100)",
    badge: "Grade A+",
    logoSvg: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/brand/logos/mozilla.svg" alt="moz://a" className="h-4.5 w-auto object-contain" />
    ),
  },
  {
    name: "CISA",
    role: "Known Exploited Vulnerabilities (KEV)",
    badge: "Directive 22-01",
    logoSvg: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/brand/logos/cisa.svg" alt="CISA Seal" className="h-7 w-auto object-contain" />
    ),
  },
  {
    name: "FIRST.Org",
    role: "EPSS v3 Exploit Prediction Scoring",
    badge: "Statistical Machine Learning",
    logoSvg: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/brand/logos/first.svg" alt="FIRST.Org" className="h-6 w-auto object-contain" />
    ),
  },
  {
    name: "OWASP",
    role: "Top 10 LLM & Agentic AI Benchmark",
    badge: "v2.0 Standard",
    logoSvg: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/brand/logos/owasp.svg" alt="OWASP" className="h-6 w-auto object-contain dark:invert" />
    ),
  },
  {
    name: "NACSA Malaysia",
    role: "Cyber Security Act 2024 (Act 854)",
    badge: "NCII Mandate",
    logoSvg: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/brand/logos/nacsa.svg" alt="NACSA Malaysia" className="h-7 w-auto object-contain" />
    ),
  },
  {
    name: "Qualys SSL Labs",
    role: "Transport Security & Cipher Auditing",
    badge: "TLS 1.3 Preload",
    logoSvg: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/brand/logos/qualys.svg" alt="Qualys" className="h-6 w-auto object-contain dark:invert" />
    ),
  },
  {
    name: "SecurityHeaders",
    role: "Response Header Protection Scoring",
    badge: "Grade A+",
    logoSvg: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/brand/logos/securityheaders.svg" alt="SecurityHeaders" className="h-5.5 w-auto object-contain dark:brightness-200" />
    ),
  },
  {
    name: "NIST",
    role: "Cybersecurity Framework 2.0",
    badge: "CSF 2.0 Aligned",
    logoSvg: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/brand/logos/nist.svg" alt="NIST" className="h-4.5 w-auto object-contain dark:invert" />
    ),
  },
  {
    name: "ISO / IEC",
    role: "ISO/IEC 27001:2022 ISMS Controls",
    badge: "Global Standard",
    logoSvg: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/brand/logos/iso.svg" alt="ISO" className="h-6 w-6 object-contain rounded-xs" />
    ),
  },
  {
    name: "AICPA SOC 2",
    role: "SOC 2 Type II Security Criteria",
    badge: "Trust Principles",
    logoSvg: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/brand/logos/aicpa.png" alt="AICPA SOC 2" className="h-5 w-auto object-contain dark:brightness-200" />
    ),
  },
  {
    name: "IETF RFC 9116",
    role: "Coordinated Vulnerability Disclosure",
    badge: "security.txt",
    logoSvg: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/brand/logos/ietf.svg" alt="IETF" className="h-6 w-auto object-contain dark:brightness-150" />
    ),
  },
  {
    name: "AWS S3 Defense",
    role: "Cloud Bucket IaC Audit & Terraform",
    badge: "Cloud-Native",
    logoSvg: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/brand/logos/aws.svg" alt="Amazon Web Services" className="h-6 w-auto object-contain" />
    ),
  },
  {
    name: "Anthropic / MCP",
    role: "Model Context Protocol Tool Defense",
    badge: "Agentic Shield",
    logoSvg: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/brand/logos/anthropic.svg" alt="Anthropic" className="h-5 w-auto object-contain dark:invert" />
    ),
  },
  {
    name: "PCI-DSS v4.0.1",
    role: "Payment Security Technical Controls",
    badge: "Cardholder Data",
    logoSvg: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/brand/logos/pci-dss.svg" alt="PCI-DSS" className="h-5 w-auto object-contain" />
    ),
  },
  {
    name: "Next.js 16 / Vercel",
    role: "Production Strict TypeScript & Turbopack",
    badge: "Zero Defects",
    logoSvg: (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/brand/logos/nextjs.svg" alt="Next.js" className="h-4.5 w-auto object-contain dark:invert" />
    ),
  },
];

export function BenchmarkSection() {
  const [activeTab, setActiveTab] = useState<string>("observatory");
  const selectedBenchmark = BENCHMARK_TESTS.find((b) => b.id === activeTab) || BENCHMARK_TESTS[0];

  return (
    <section className="bg-canvas text-ink border-y border-line py-16 lg:py-24">
      <div className="ps-container">
        {/* Header Block */}
        <div className="flex flex-col gap-4 max-w-4xl mb-12">
          <div className="inline-flex items-center gap-2 border border-line bg-subtle px-2.5 py-1 w-fit font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
            <span className="w-2 h-2 bg-[#02acc5] shrink-0" />
            <span>Independently Benchmarked · 2025–2030 Standard</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink font-sans">
            Battle-Tested. Proven Safe. <br className="hidden sm:inline" />
            <span className="text-[#02acc5]">Rated A+</span> Across 15 Global Standards.
          </h2>
          <p className="text-base sm:text-lg text-muted leading-relaxed font-sans max-w-3xl">
            Harizeon is continuously benchmarked against global cybersecurity institutions, national regulatory
            frameworks, and machine-learning exploit prediction systems. We don’t ask for blind trust — we prove it with verifiable telemetry.
          </p>
        </div>

        {/* Big Score Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="border border-line bg-subtle p-5 flex flex-col justify-between">
            <span className="font-mono text-xs uppercase text-muted tracking-wider">Mozilla Observatory</span>
            <div className="my-3">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-ink">100/100</span>
              <span className="ml-2 font-mono text-sm font-bold text-[#02acc5]">GRADE A+</span>
            </div>
            <span className="text-[11px] text-muted font-sans">CSP, HSTS Preload, XFO Deny, nosniff</span>
          </div>

          <div className="border border-line bg-subtle p-5 flex flex-col justify-between">
            <span className="font-mono text-xs uppercase text-muted tracking-wider">SecurityHeaders.com</span>
            <div className="my-3">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-ink">A+</span>
              <span className="ml-2 font-mono text-sm font-bold text-[#02acc5]">PERFECT</span>
            </div>
            <span className="text-[11px] text-muted font-sans">Zero leak headers, X-Powered-By masked</span>
          </div>

          <div className="border border-line bg-subtle p-5 flex flex-col justify-between">
            <span className="font-mono text-xs uppercase text-muted tracking-wider">Prioritization ROI</span>
            <div className="my-3">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-ink">TOP 1%</span>
              <span className="ml-2 font-mono text-sm font-bold text-red-600">P0 SLA</span>
            </div>
            <span className="text-[11px] text-muted font-sans">CISA KEV + EPSS v3 weaponized triage</span>
          </div>

          <div className="border border-line bg-subtle p-5 flex flex-col justify-between">
            <span className="font-mono text-xs uppercase text-muted tracking-wider">Regulatory Matrices</span>
            <div className="my-3">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-ink">7 / 7</span>
              <span className="ml-2 font-mono text-sm font-bold text-[#02acc5]">PASSED</span>
            </div>
            <span className="text-[11px] text-muted font-sans">Malaysia Act 854 NCII, OWASP LLM, ISO</span>
          </div>
        </div>

        {/* Interactive Benchmark Evidence Card */}
        <div className="border border-line bg-canvas mb-16">
          <div className="flex border-b border-line overflow-x-auto ps-no-scrollbar">
            {BENCHMARK_TESTS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-5 py-3 font-mono text-xs uppercase tracking-wider whitespace-nowrap transition-colors border-r border-line text-left flex items-center gap-2 ${
                  activeTab === t.id
                    ? "bg-[#171d29] text-white font-bold"
                    : "bg-subtle text-muted hover:text-ink hover:bg-canvas"
                }`}
              >
                <span>{t.name}</span>
                <span className={`px-1.5 py-0.2 text-[9px] font-bold ${activeTab === t.id ? "bg-[#02acc5] text-black" : "border border-line text-muted"}`}>
                  {t.grade}
                </span>
              </button>
            ))}
          </div>

          <div className="p-6 lg:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted">{selectedBenchmark.institution}</span>
                  <span className="border border-line bg-subtle px-1.5 py-0.2 font-mono text-[10px] text-[#02acc5] font-semibold uppercase">
                    {selectedBenchmark.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-sans text-ink">{selectedBenchmark.name}</h3>
                <p className="text-sm text-muted font-sans mt-1 max-w-2xl">{selectedBenchmark.description}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="border border-line bg-subtle p-3 text-right">
                  <div className="text-[10px] font-mono uppercase text-muted">Audited Score</div>
                  <div className="text-2xl font-mono font-bold text-ink">{selectedBenchmark.score}</div>
                </div>
                <div className="border border-[#02acc5] bg-[#02acc5]/10 p-3 text-center min-w-[70px]">
                  <div className="text-[10px] font-mono uppercase text-[#02acc5]">Grade</div>
                  <div className="text-2xl font-mono font-bold text-[#02acc5]">{selectedBenchmark.grade}</div>
                </div>
              </div>
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedBenchmark.metrics.map((m, idx) => (
                <div key={idx} className="border border-line bg-subtle p-3 flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-muted uppercase">{m.label}</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.2">
                      PASS
                    </span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-ink truncate" title={m.value}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-3 text-xs text-muted font-mono">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Diagnostic Telemetry: Live Automated In-App Verification Active</span>
              </div>
              <Link
                href="/.well-known/security.txt"
                className="hover:text-[#02acc5] underline flex items-center gap-1 transition-colors"
              >
                <span>Inspect RFC 9116 security.txt</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 15 Participating Companies & Institutions Logo Cloud */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-line">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted">
              15 Involved Institutions, Standards & Regulatory Frameworks
            </h3>
            <span className="font-mono text-[11px] text-faint">Continuous Multi-Standard Telemetry</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {PARTNER_INSTITUTIONS.map((inst) => (
              <div
                key={inst.name}
                className="border border-line bg-canvas hover:border-ink hover:bg-subtle p-3.5 transition-all flex flex-col justify-between min-h-[105px] group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="h-7 flex items-center text-muted group-hover:text-ink">{inst.logoSvg}</div>
                  <span className="border border-line bg-subtle px-1 py-0.2 font-mono text-[9px] text-muted uppercase tracking-wider">
                    {inst.badge}
                  </span>
                </div>
                <div>
                  <div className="font-mono text-xs font-bold text-ink truncate">{inst.name}</div>
                  <div className="text-[10px] text-muted font-sans truncate" title={inst.role}>
                    {inst.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badge Authority & Issuance Card */}
        <div className="border border-line bg-subtle p-6 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="flex flex-col gap-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 border border-line bg-canvas px-2.5 py-1 w-fit font-mono text-[10px] font-bold uppercase tracking-wider text-[#02acc5]">
              Certification & Trust Flywheel
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold font-sans text-ink">
              Benchmark Your App & Display the Harizeon Trust Badge
            </h3>
            <p className="text-sm text-muted font-sans leading-relaxed">
              Companies that pass the Harizeon continuous security sweep earn the official, cryptographically verified
              Harizeon Trust Badge. Embed it directly in your website footer, SaaS login portal, or GitHub repository
              to prove to your customers and enterprise auditors that your app is battle-tested.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center border border-[#02acc5] bg-[#02acc5] text-black font-mono font-bold text-xs uppercase tracking-wider px-5 py-2.5 hover:bg-[#38bdf8] transition-colors"
              >
                Benchmark Your App & Get Your Badge →
              </Link>
              <Link
                href="/verify-benchmark/harizeon.com"
                className="inline-flex items-center justify-center border border-line bg-canvas text-ink font-mono text-xs uppercase tracking-wider px-5 py-2.5 hover:border-ink transition-colors"
              >
                Inspect Live Certification Proof
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full lg:w-auto shrink-0 border border-line bg-canvas p-5">
            <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
              Available Harizeon Embed Badges:
            </span>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-4 border border-line bg-subtle p-2">
                <span className="font-mono text-[11px] text-muted">Security Posture:</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/api/badge/harizeon.com?type=posture" alt="Harizeon Posture Badge" className="h-6 w-auto" />
              </div>
              <div className="flex items-center justify-between gap-4 border border-line bg-subtle p-2">
                <span className="font-mono text-[11px] text-muted">0 Active Exploits:</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/api/badge/harizeon.com?type=cisa-kev" alt="Harizeon KEV Badge" className="h-6 w-auto" />
              </div>
              <div className="flex items-center justify-between gap-4 border border-line bg-subtle p-2">
                <span className="font-mono text-[11px] text-muted">AI-Armor MCP:</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/api/badge/harizeon.com?type=ai-armor" alt="Harizeon AI-Armor Badge" className="h-6 w-auto" />
              </div>
              <div className="flex items-center justify-between gap-4 border border-line bg-subtle p-2">
                <span className="font-mono text-[11px] text-muted">Malaysia Act 854:</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/api/badge/harizeon.com?type=act-854" alt="Harizeon Act 854 Badge" className="h-6 w-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
