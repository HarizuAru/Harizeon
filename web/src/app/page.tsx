import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Harizeon — Security Infrastructure, Provisioned Like Cloud",
  description:
    "Scan, monitor, and prove the security of everything you own. Self-serve. Metered. No sales call.",
};

const SERVICES = [
  {
    code: "SCN",
    name: "Harizeon Scan",
    description: "Active and passive external vulnerability scanner. Port recon, TLS verification, CVE matching.",
    status: "available",
    href: "/services/scan",
  },
  {
    code: "ASM",
    name: "Harizeon Surface",
    description: "Continuous external attack-surface discovery. Subdomains from CT logs and DNS, held for your review and alerted on when new.",
    status: "available",
    href: "/services/asm",
  },
  {
    code: "PRO",
    name: "Harizeon Probe",
    description: "Deep port reconnaissance, banner grabbing, and non-destructive service fingerprinting.",
    status: "available",
    href: "/services/pro",
  },
  {
    code: "INS",
    name: "Harizeon Inspect",
    description: "TLS legacy-protocol detection, certificate expiry tracking, and HTTP security headers.",
    status: "available",
    href: "/services/ins",
  },
  {
    code: "ADT",
    name: "Harizeon Audit",
    description: "Executive reports with a security score, remediation plan, and ISO 27001 / SOC 2 / BNM RMiT / PDPA control mapping.",
    status: "available",
    href: "/services/adt",
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
                className="w-full sm:w-auto border border-ink bg-ink px-8 py-3.5 font-mono text-xs uppercase font-bold tracking-[0.05em] text-canvas hover:bg-canvas hover:text-ink transition-colors"
              >
                Start free
              </Link>
              <Link
                href="/docs"
                className="w-full sm:w-auto border border-line bg-canvas px-8 py-3.5 font-mono text-xs uppercase tracking-[0.05em] text-ink hover:border-ink hover:bg-subtle transition-colors"
              >
                Read the docs
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

        {/* 3x3 Service Grid (§9.2) */}
        <section className="border-b border-line py-20 px-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-line pb-6 mb-12">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-muted block mb-1">
                  Modular Architecture
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-ink font-sans">
                  The Harizeon Service Matrix
                </h2>
              </div>
              <p className="font-mono text-xs text-muted mt-2 sm:mt-0">
                Independent micro-services. Unified telemetry.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SERVICES.map((s) => {
                const isAvailable = s.status === "available";
                const isBeta = s.status === "beta";
                return (
                  <Link
                    key={s.code}
                    href={s.href}
                    className="group border border-line bg-canvas p-6 flex flex-col justify-between hover:border-ink transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="border border-ink px-2 py-0.5 font-mono text-xs font-bold text-ink">
                          {s.code}
                        </span>
                        <span
                          className={`font-mono text-[10px] uppercase px-1.5 py-0.5 border ${
                            isAvailable
                              ? "border-ink bg-ink text-canvas font-bold"
                              : isBeta
                              ? "border-line bg-subtle text-ink"
                              : "border-line text-faint"
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                      <h3 className="mt-4 font-mono text-base font-bold text-ink group-hover:underline">
                        {s.name}
                      </h3>
                      <p className="mt-2 text-xs text-muted font-sans leading-relaxed">
                        {s.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-line flex items-center justify-between font-mono text-[11px] text-muted">
                      <span>Explore specifications</span>
                      <span>→</span>
                    </div>
                  </Link>
                );
              })}
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
              <div className="border border-line bg-canvas p-6 flex flex-col">
                <span className="font-mono text-3xl font-bold text-ink mb-4">01</span>
                <h3 className="font-mono text-base font-bold text-ink mb-2">
                  Verify Ownership
                </h3>
                <p className="text-xs text-muted leading-relaxed font-sans">
                  Publish a DNS TXT record or HTTP well-known token. Harizeon verifies you control the infrastructure before a single packet is transmitted. No bypass flag.
                </p>
              </div>

              {/* Step 2 */}
              <div className="border border-line bg-canvas p-6 flex flex-col">
                <span className="font-mono text-3xl font-bold text-ink mb-4">02</span>
                <h3 className="font-mono text-base font-bold text-ink mb-2">
                  Scan & Fingerprint
                </h3>
                <p className="text-xs text-muted leading-relaxed font-sans">
                  Execute Quick, Standard, or Deep scans. Worker pool analyzes open ports, TLS configurations, security headers, CVE exposure, and subdomains without service degradation.
                </p>
              </div>

              {/* Step 3 */}
              <div className="border border-line bg-canvas p-6 flex flex-col">
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
                  className={`border p-6 flex flex-col justify-between ${
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
