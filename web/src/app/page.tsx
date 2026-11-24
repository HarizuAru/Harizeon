import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Harizeon · Security Infrastructure, Provisioned Like Cloud",
  description:
    "Scan, monitor, and prove the security of everything you own. Self-serve. Metered. No sales call.",
};

const SOLUTION_PILLARS = [
  {
    code: "SURFACE",
    badge: "PILLAR 01",
    name: "Harizeon Surface (EASM)",
    tagline: "Attack Surface Reconnaissance",
    description:
      "Automated perimeter intelligence. Continuously discovers verified subdomains from Certificate Transparency logs, maps public port exposures, and audits TLS protocols and security headers.",
    engines: [
      { code: "ASM", name: "Surface Discovery", href: "/services/asm", status: "available" },
      { code: "PRO", name: "Port & Banner Recon", href: "/services/pro", status: "available" },
      { code: "INS", name: "TLS & Protocol Audit", href: "/services/ins", status: "available" },
    ],
    primaryAction: "Explore Surface Recon →",
    primaryHref: "/services/asm",
  },
  {
    code: "THREAT",
    badge: "PILLAR 02",
    name: "Harizeon Threat (Scanner)",
    tagline: "Autonomous Vulnerability Sweeps",
    description:
      "Non-destructive multi-phase security scanner. Probes your verified attack surface for known CVEs, exposed configuration files, unauthenticated model endpoints, and leaked API secrets.",
    engines: [
      { code: "SCN", name: "Vulnerability Scanner", href: "/services/scan", status: "available" },
      { code: "AIA", name: "AI-Armor (LLM & Vector Defense)", href: "/services/aia", status: "available" },
      { code: "VLT", name: "Vault Secret Monitor", href: "/services/vlt", status: "roadmap" },
      { code: "WCH", name: "Drift & Integrity Watch", href: "/services/wch", status: "roadmap" },
    ],
    primaryAction: "Explore Scanner →",
    primaryHref: "/services/scan",
  },
  {
    code: "GOVERNANCE",
    badge: "PILLAR 03",
    name: "Harizeon Governance (Audit)",
    tagline: "Compliance & Executive Scoring",
    description:
      "Executive posture scoring (0–100) and client-ready audit reports. Findings are mapped to ISO/IEC 27001:2022, SOC 2, BNM RMiT, and Malaysian PDPA controls with one-click PDF export.",
    engines: [
      { code: "ADT", name: "Audit & Posture Reports", href: "/services/adt", status: "available" },
      { code: "RSP", name: "Triage Playbooks", href: "/services/rsp", status: "roadmap" },
      { code: "SHD", name: "Edge Cloaking Rules", href: "/services/shd", status: "roadmap" },
    ],
    primaryAction: "Explore Compliance →",
    primaryHref: "/services/adt",
  },
];

const PRICING_PLANS = [
  {
    code: "free",
    name: "Free",
    price: "MYR 0",
    period: "forever",
    assets: "1 asset",
    cadence: "Monthly scan",
    features: "Quick scan profile · 14d retention · Community support",
  },
  {
    code: "starter",
    name: "Starter",
    price: "MYR 79",
    period: "/ month",
    assets: "5 assets",
    cadence: "Weekly scan cadence",
    features: "50 scans/mo · Quick + Standard profiles · PDF reports",
  },
  {
    code: "growth",
    name: "Growth",
    price: "MYR 249",
    period: "/ month",
    assets: "25 assets",
    cadence: "Daily scan cadence",
    features: "500 scans/mo · Deep profiles · API access · 3 seats",
    recommended: true,
  },
  {
    code: "scale",
    name: "Scale",
    price: "MYR 799",
    period: "/ month",
    assets: "100 assets",
    cadence: "Continuous cadence",
    features: "Unlimited scans · 10 seats · Dedicated Slack · 4h SLA",
  },
];

export default async function LandingPage() {
  const store = await cookies();
  const hasSession = !!store.get("hz_session");

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicHeader hasSession={hasSession} />

      <main className="flex-1">
        {/* Hero Section (§9.2) */}
        <section className="border-b border-line py-20 px-4 sm:px-6">
          <div className="mx-auto max-w-5xl text-center flex flex-col items-center">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted border border-line px-3 py-1 mb-6">
              v0.1 Production Architecture · Constraint is the brand
            </span>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-ink font-sans max-w-4xl leading-tight">
              Security infrastructure, provisioned like cloud.
            </h1>

            <p className="mt-6 text-base sm:text-lg text-muted max-w-2xl leading-relaxed font-sans">
              Scan, monitor, and prove the security of everything you own. Self-serve. Metered. No sales call.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto border border-ink bg-ink px-8 py-3.5 font-mono text-xs uppercase font-bold tracking-[0.05em] text-canvas hover:bg-canvas hover:text-ink button-tactile transition-all"
              >
                Start free
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto border border-line bg-canvas px-8 py-3.5 font-mono text-xs uppercase tracking-[0.05em] text-ink hover:border-ink hover:bg-subtle button-tactile transition-all"
              >
                Log in
              </Link>
              <Link
                href="/docs"
                className="w-full sm:w-auto border border-line bg-canvas px-6 py-3.5 font-mono text-xs uppercase tracking-[0.05em] text-muted hover:text-ink button-tactile transition-all"
              >
                Docs
              </Link>
            </div>

            <p className="mt-6 font-mono text-xs text-muted">
              Verify a domain. First scan in four minutes.
            </p>
          </div>
        </section>

        {/* Live Terminal Block (§9.2) */}
        <section className="border-b border-line bg-subtle py-12 px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-between border-t border-x border-line bg-canvas px-4 py-2 font-mono text-xs text-muted">
              <span>BASH / CURL EXAMPLE</span>
              <span>REST API v1</span>
            </div>
            <pre className="border border-line bg-canvas p-6 font-mono text-xs text-ink overflow-x-auto leading-relaxed">
{`$ curl -X POST https://api.harizeon.com/v1/scans \\
    -H "Authorization: Bearer hrz_live_9f82ac40..." \\
    -H "Content-Type: application/json" \\
    -d '{"asset_ids": ["ast_01H89K2P00"], "profile": "standard"}'

{
  "id": "scn_01H89K2P99",
  "status": "queued",
  "profile": "standard",
  "assets_count": 1,
  "created_at": "2026-09-19T06:00:00.000Z"
}`}
            </pre>
          </div>
        </section>

        {/* 3 Core Solutions & Service Matrix (§9.2) */}
        <section className="border-b border-line py-20 px-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-line pb-6 mb-12">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-muted block mb-1">
                  Unified Solution Architecture
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-ink font-sans">
                  The Three Security Pillars
                </h2>
              </div>
              <Link
                href="/services"
                className="font-mono text-xs text-muted hover:text-ink underline mt-2 sm:mt-0 flex items-center gap-1.5"
              >
                <span>Explore all 9 granular engine specifications</span>
                <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {SOLUTION_PILLARS.map((p) => (
                <div
                  key={p.code}
                  className="border border-line bg-canvas p-7 flex flex-col justify-between card-interactive"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                      <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-muted">
                        {p.badge}
                      </span>
                      <span className="border border-ink bg-ink text-canvas font-mono text-[10px] uppercase px-1.5 py-0.5 font-bold">
                        Unified Suite
                      </span>
                    </div>

                    <h3 className="font-mono text-lg font-bold text-ink">
                      {p.name}
                    </h3>
                    <span className="font-mono text-[11px] text-muted block mt-0.5 mb-3">
                      {p.tagline}
                    </span>
                    <p className="text-xs text-muted font-sans leading-relaxed">
                      {p.description}
                    </p>

                    {/* Constituent Engines Strip */}
                    <div className="mt-6 pt-4 border-t border-line">
                      <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-muted block mb-2.5">
                        Integrated Engines:
                      </span>
                      <div className="flex flex-col gap-2">
                        {p.engines.map((eng) => (
                          <Link
                            key={eng.code}
                            href={eng.href}
                            className="flex items-center justify-between border border-line bg-subtle/30 px-3 py-1.5 font-mono text-xs hover:border-ink hover:bg-canvas transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-ink">{eng.code}</span>
                              <span className="text-muted text-[11px]">· {eng.name}</span>
                            </div>
                            <span
                              className={`text-[9px] uppercase font-bold px-1 py-0.2 border ${
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

                  <div className="mt-8 pt-4 border-t border-line">
                    <Link
                      href={p.primaryHref}
                      className="flex items-center justify-between border border-ink bg-canvas px-4 py-2 font-mono text-xs uppercase font-bold text-ink hover:bg-ink hover:text-canvas transition-colors button-tactile"
                    >
                      <span>{p.primaryAction}</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works (3 Steps) (§9.2) */}
        <section className="border-b border-line bg-subtle py-20 px-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="font-mono text-xs uppercase tracking-wider text-muted block mb-1">
                Zero Friction Workflow
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-ink font-sans">
                How Harizeon Operates
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="border border-line bg-canvas p-6 flex flex-col card-interactive">
                <span className="font-mono text-3xl font-bold text-ink mb-4">01</span>
                <h3 className="font-mono text-base font-bold text-ink mb-2">
                  Verify Ownership
                </h3>
                <p className="text-xs text-muted leading-relaxed font-sans">
                  Publish a DNS TXT record or HTTP well-known token. Harizeon verifies you control the infrastructure before a single packet is transmitted. No bypass flag.
                </p>
              </div>

              {/* Step 2 */}
              <div className="border border-line bg-canvas p-6 flex flex-col card-interactive">
                <span className="font-mono text-3xl font-bold text-ink mb-4">02</span>
                <h3 className="font-mono text-base font-bold text-ink mb-2">
                  Scan &amp; Fingerprint
                </h3>
                <p className="text-xs text-muted leading-relaxed font-sans">
                  Execute Quick, Standard, or Deep scans. Worker pool analyzes open ports, TLS configurations, security headers, CVE exposure, and subdomains without service degradation.
                </p>
              </div>

              {/* Step 3 */}
              <div className="border border-line bg-canvas p-6 flex flex-col card-interactive">
                <span className="font-mono text-3xl font-bold text-ink mb-4">03</span>
                <h3 className="font-mono text-base font-bold text-ink mb-2">
                  Fix and Prove
                </h3>
                <p className="text-xs text-muted leading-relaxed font-sans">
                  Receive structured, deduplicated findings with exact reproduction curl commands. Generate print-ready executive compliance PDF reports for auditors and stakeholders.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Strip (§9.2) */}
        <section className="py-20 px-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-line pb-6 mb-12">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-muted block mb-1">
                  Transparent Metering
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-ink font-sans">
                  Predictable, Tiered Capacity
                </h2>
              </div>
              <Link
                href="/pricing"
                className="font-mono text-xs uppercase text-ink underline hover:no-underline mt-2 sm:mt-0"
              >
                View full feature matrix & calculator →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {PRICING_PLANS.map((plan) => (
                <div
                  key={plan.code}
                  className={`border p-6 flex flex-col justify-between card-interactive ${
                    plan.recommended ? "border-ink bg-subtle" : "border-line bg-canvas"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold uppercase text-ink">
                        {plan.name}
                      </span>
                      {plan.recommended && (
                        <span className="bg-ink text-canvas text-[9px] font-mono uppercase px-1.5 py-0.5">
                          Standard
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      <span className="font-mono text-2xl font-bold text-ink">
                        {plan.price}
                      </span>
                      <span className="font-mono text-xs text-muted"> {plan.period}</span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-line font-mono text-xs flex flex-col gap-2 text-muted">
                      <div>
                        Capacity: <strong className="text-ink">{plan.assets}</strong>
                      </div>
                      <div>
                        Cadence: <strong className="text-ink">{plan.cadence}</strong>
                      </div>
                      <p className="text-[11px] text-faint mt-1 leading-relaxed">
                        {plan.features}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/signup"
                    className="mt-6 border border-ink bg-canvas py-2 text-center font-mono text-xs uppercase text-ink hover:bg-ink hover:text-canvas transition-colors"
                  >
                    Select {plan.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
