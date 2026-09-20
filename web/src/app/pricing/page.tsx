"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

const COMPARISON_ROWS = [
  { label: "Monitored Verified Assets", free: "1", starter: "5", growth: "25", scale: "100" },
  { label: "Included Scans / Month", free: "1", starter: "50", growth: "500", scale: "Unlimited" },
  { label: "Scan Profile Depth", free: "Quick only", starter: "Quick + Standard", growth: "All profiles", scale: "All profiles" },
  { label: "Automated Cadence", free: "Monthly", starter: "Weekly", growth: "Daily", scale: "Continuous / Daily" },
  { label: "Evidence Retention", free: "14 days", starter: "90 days", growth: "365 days", scale: "730 days (2 years)" },
  { label: "Workspace Seats", free: "1 seat", starter: "1 seat", growth: "3 seats", scale: "10 seats" },
  { label: "PDF Compliance Reports", free: "No", starter: "Yes (Standard)", growth: "Yes + White-label", scale: "Yes + White-label" },
  { label: "REST API & Webhooks", free: "No", starter: "No", growth: "Yes (Full access)", scale: "Yes (Full access)" },
  { label: "Support & SLA", free: "Community", starter: "Email (48h)", growth: "Email + Slack (24h)", scale: "Dedicated Slack + 4h SLA" },
];

const FAQS = [
  {
    q: "What counts as a verified asset?",
    a: "A verified asset is any domain, subdomain, or IP address that you have cryptographically proven ownership of via a DNS TXT record or HTTP well-known token. Unverified assets cannot be scanned and do not consume quota.",
  },
  {
    q: "What happens if I need to monitor more assets?",
    a: "You can either upgrade to a higher tier or add metered overage assets. Overage assets are billed at a simple flat rate of MYR 8.00 per asset per month on the Scale plan. We warn you at 80% quota capacity so you never encounter unexpected overages.",
  },
  {
    q: "How does Malaysian Sales and Service Tax (SST) apply?",
    a: "Under the Malaysian Service Tax Act 2018, digital services provided to Malaysian resident entities are subject to 8% SST. Formal tax invoices meeting Malaysian Inland Revenue Board (LHDN) e-Invoicing guidelines are issued with every payment.",
  },
  {
    q: "Can I cancel or downgrade my subscription at any time?",
    a: "Yes. There are no annual lock-ins. You can switch plans or cancel in your billing console at any moment; your subscription remains active until the end of your current monthly cycle.",
  },
];

export default function PricingPage() {
  const [currency, setCurrency] = useState<"MYR" | "USD">("MYR");
  const [calcAssets, setCalcAssets] = useState(10);

  const rate = currency === "USD" ? 0.22 : 1;
  const symbol = currency === "USD" ? "$" : "MYR ";

  // Pricing calculation
  let suggestedPlan = "free";
  let basePrice = 0;
  let overageAssets = 0;

  if (calcAssets <= 1) {
    suggestedPlan = "free";
    basePrice = 0;
  } else if (calcAssets <= 5) {
    suggestedPlan = "starter";
    basePrice = 79;
  } else if (calcAssets <= 25) {
    suggestedPlan = "growth";
    basePrice = 249;
  } else if (calcAssets <= 100) {
    suggestedPlan = "scale";
    basePrice = 799;
  } else {
    suggestedPlan = "scale";
    basePrice = 799;
    overageAssets = calcAssets - 100;
  }

  const overageCost = overageAssets * 8;
  const subtotal = basePrice + overageCost;
  const sstTax = subtotal * 0.08;
  const total = subtotal + sstTax;

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col gap-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto">
            <span className="font-mono text-xs uppercase tracking-wider text-muted block mb-2">
              Transparent & Self-Serve
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink font-sans">
              Simple, Metered Pricing
            </h1>
            <p className="mt-4 text-sm sm:text-base text-muted font-sans leading-relaxed">
              No sales negotiations or opaque quotes. Choose a tier based on the verified assets you need to defend.
            </p>

            {/* Currency Switcher */}
            <div className="mt-6 inline-flex items-center gap-2 border border-line bg-canvas p-1 font-mono text-xs">
              <span className="text-muted text-[11px] px-2">CURRENCY:</span>
              <button
                onClick={() => setCurrency("MYR")}
                className={`px-3 py-1 uppercase font-bold transition-colors ${
                  currency === "MYR" ? "bg-ink text-canvas" : "text-muted hover:text-ink"
                }`}
              >
                MYR (Default)
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1 uppercase font-bold transition-colors ${
                  currency === "USD" ? "bg-ink text-canvas" : "text-muted hover:text-ink"
                }`}
              >
                USD (~0.22)
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Free */}
            <div className="border border-line bg-canvas p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold uppercase text-ink">Free</span>
                  <span className="border border-line px-1.5 py-0.5 text-[9px] font-mono uppercase text-muted">Dev</span>
                </div>
                <div className="mt-4">
                  <span className="font-mono text-3xl font-bold text-ink">
                    {symbol}{currency === "USD" ? "0" : "0"}
                  </span>
                  <span className="font-mono text-xs text-muted"> / forever</span>
                </div>
                <p className="mt-2 text-xs text-muted font-sans leading-relaxed">
                  Best for individual developers securing a personal project or root domain.
                </p>
                <div className="mt-6 pt-4 border-t border-line font-mono text-xs flex flex-col gap-2 text-muted">
                  <div>• 1 verified asset</div>
                  <div>• 1 quick scan per month</div>
                  <div>• 14 days evidence retention</div>
                  <div>• Community support</div>
                </div>
              </div>
              <Link
                href="/signup"
                className="mt-8 border border-line py-2 text-center font-mono text-xs uppercase text-ink hover:border-ink hover:bg-subtle transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Starter */}
            <div className="border border-line bg-canvas p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold uppercase text-ink">Starter</span>
                  <span className="border border-line px-1.5 py-0.5 text-[9px] font-mono uppercase text-muted">SMB</span>
                </div>
                <div className="mt-4">
                  <span className="font-mono text-3xl font-bold text-ink">
                    {symbol}{(79 * rate).toFixed(0)}
                  </span>
                  <span className="font-mono text-xs text-muted"> / month</span>
                </div>
                <p className="mt-2 text-xs text-muted font-sans leading-relaxed">
                  Ideal for startups with a primary domain, API subdomain, and staging server.
                </p>
                <div className="mt-6 pt-4 border-t border-line font-mono text-xs flex flex-col gap-2 text-muted">
                  <div>• 5 verified assets</div>
                  <div>• 50 scans per month (Weekly)</div>
                  <div>• Quick + Standard profiles</div>
                  <div>• PDF compliance reports</div>
                </div>
              </div>
              <Link
                href="/signup"
                className="mt-8 border border-line py-2 text-center font-mono text-xs uppercase text-ink hover:border-ink hover:bg-subtle transition-colors"
              >
                Select Starter
              </Link>
            </div>

            {/* Growth */}
            <div className="border-2 border-ink bg-subtle p-6 flex flex-col justify-between relative shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold uppercase text-ink">Growth</span>
                  <span className="border border-ink bg-ink text-canvas px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold">
                    Recommended
                  </span>
                </div>
                <div className="mt-4">
                  <span className="font-mono text-3xl font-bold text-ink">
                    {symbol}{(249 * rate).toFixed(0)}
                  </span>
                  <span className="font-mono text-xs text-muted"> / month</span>
                </div>
                <p className="mt-2 text-xs text-muted font-sans leading-relaxed">
                  For growing engineering teams requiring automated daily scans, API gating, and Slack alerts.
                </p>
                <div className="mt-6 pt-4 border-t border-line font-mono text-xs flex flex-col gap-2 text-muted">
                  <div>• 25 verified assets</div>
                  <div>• 500 scans / month (Daily)</div>
                  <div>• Deep scan profiles + CVE correlation</div>
                  <div>• Full REST API & Webhook HMAC</div>
                  <div>• 3 workspace seats included</div>
                </div>
              </div>
              <Link
                href="/signup"
                className="mt-8 border border-ink bg-ink py-2 text-center font-mono text-xs uppercase font-bold text-canvas hover:bg-canvas hover:text-ink transition-colors"
              >
                Select Growth
              </Link>
            </div>

            {/* Scale */}
            <div className="border border-line bg-canvas p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold uppercase text-ink">Scale</span>
                  <span className="border border-line px-1.5 py-0.5 text-[9px] font-mono uppercase text-muted">Enterprise</span>
                </div>
                <div className="mt-4">
                  <span className="font-mono text-3xl font-bold text-ink">
                    {symbol}{(799 * rate).toFixed(0)}
                  </span>
                  <span className="font-mono text-xs text-muted"> / month</span>
                </div>
                <p className="mt-2 text-xs text-muted font-sans leading-relaxed">
                  Complete attack surface protection with 100 assets, unlimited scans, and 4h SLA.
                </p>
                <div className="mt-6 pt-4 border-t border-line font-mono text-xs flex flex-col gap-2 text-muted">
                  <div>• 100 verified assets included</div>
                  <div>• Unlimited scan volume</div>
                  <div>• 730-day evidence retention</div>
                  <div>• 10 workspace seats included</div>
                  <div>• Dedicated Slack channel + 4h SLA</div>
                </div>
              </div>
              <Link
                href="/signup"
                className="mt-8 border border-line py-2 text-center font-mono text-xs uppercase text-ink hover:border-ink hover:bg-subtle transition-colors"
              >
                Select Scale
              </Link>
            </div>
          </div>

          {/* Interactive Metered Cost Calculator (§9.2) */}
          <div className="border border-line bg-canvas p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4 mb-6">
              <div>
                <h2 className="font-mono text-lg font-bold uppercase tracking-wider text-ink">
                  Interactive Metered Cost Calculator
                </h2>
                <p className="text-xs text-muted mt-1 font-sans">
                  Drag the slider to match your infrastructure size. Calculates your base plan and any metered overage.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="uppercase text-muted">Verified Targets:</span>
                  <span className="font-bold text-ink text-xl">{calcAssets} Assets</span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="150"
                  value={calcAssets}
                  onChange={(e) => setCalcAssets(parseInt(e.target.value, 10))}
                  className="w-full accent-black cursor-pointer"
                />

                <div className="flex justify-between font-mono text-[10px] text-muted">
                  <span>1 (Free)</span>
                  <span>5 (Starter)</span>
                  <span>25 (Growth)</span>
                  <span>100 (Scale)</span>
                  <span>150+ (Metered)</span>
                </div>

                <p className="text-xs text-muted font-sans leading-relaxed">
                  Best fit: <strong className="font-mono text-ink uppercase">{suggestedPlan} Plan</strong>.
                  {overageAssets > 0 ? ` Base includes 100 assets + ${overageAssets} additional targets at MYR 8/mo.` : ""}
                </p>
              </div>

              <div className="border border-line bg-subtle p-5 font-mono text-xs">
                <div className="flex justify-between py-1 text-muted">
                  <span>Base Tier ({suggestedPlan.toUpperCase()}):</span>
                  <span>{symbol}{(basePrice * rate).toFixed(2)}</span>
                </div>
                {overageCost > 0 && (
                  <div className="flex justify-between py-1 text-muted">
                    <span>Metered Overage ({overageAssets} assets):</span>
                    <span>{symbol}{(overageCost * rate).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 text-muted border-t border-line mt-2 pt-2">
                  <span>Subtotal:</span>
                  <span>{symbol}{(subtotal * rate).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 text-muted">
                  <span>Malaysian SST (8%):</span>
                  <span>{symbol}{(sstTax * rate).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-ink font-bold text-sm text-ink mt-2">
                  <span>TOTAL INVESTMENT:</span>
                  <span>{symbol}{(total * rate).toFixed(2)} / mo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Full Feature Comparison Matrix (§9.2) */}
          <div className="border border-line bg-canvas">
            <div className="p-4 border-b border-line">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
                Detailed Feature Comparison Matrix
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b border-line bg-subtle text-muted uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Capability</th>
                    <th className="px-4 py-3">Free</th>
                    <th className="px-4 py-3">Starter</th>
                    <th className="px-4 py-3">Growth</th>
                    <th className="px-4 py-3">Scale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.label} className="hover:bg-subtle">
                      <td className="px-4 py-3 font-medium text-ink">{row.label}</td>
                      <td className="px-4 py-3 text-muted">{row.free}</td>
                      <td className="px-4 py-3 text-muted">{row.starter}</td>
                      <td className="px-4 py-3 font-bold text-ink">{row.growth}</td>
                      <td className="px-4 py-3 text-ink">{row.scale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Section (§9.2) */}
          <div className="border border-line bg-canvas p-8">
            <h2 className="font-mono text-base font-bold uppercase tracking-wider text-ink mb-6">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FAQS.map((faq) => (
                <div key={faq.q} className="border border-line p-4">
                  <h3 className="font-mono text-xs font-bold text-ink mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-xs text-muted font-sans leading-relaxed">
                    {faq.a}
                  </p>
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
