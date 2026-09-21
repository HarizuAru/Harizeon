"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";

export interface PlanLimits {
  max_assets: number;
  scans_per_month: number;
  profiles: string[];
  retention_days: number;
  seats: number;
  pdf_reports: boolean;
  api: boolean;
  schedule: string;
}

export interface PlanData {
  id: string;
  code: string;
  price_myr_month: number;
  limits: PlanLimits;
}

export interface UsageData {
  assets_monitored: number;
  max_assets: number;
  scans_this_month: number;
  max_scans_per_month: number;
  is_asset_limit_near: boolean;
  is_scan_limit_near: boolean;
  retention_days: number;
  seats_used: number;
  max_seats: number;
  period_start: string;
  period_end: string;
}

export interface InvoiceItem {
  id: string;
  number: string;
  period_start: string;
  period_end: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  pdf_ref: string | null;
  paid_at: string | null;
}

const AVAILABLE_PLANS = [
  {
    code: "free",
    name: "Free",
    price: 0,
    assets: 1,
    scans: "1 / month",
    depth: "Quick only",
    schedule: "Monthly",
    retention: "14 days",
    seats: 1,
    reports: "No PDF",
    api: "No",
    support: "Community",
  },
  {
    code: "starter",
    name: "Starter",
    price: 79,
    assets: 5,
    scans: "50 / month",
    depth: "Quick + Standard",
    schedule: "Weekly",
    retention: "90 days",
    seats: 1,
    reports: "Yes (PDF)",
    api: "No",
    support: "Email",
  },
  {
    code: "growth",
    name: "Growth",
    price: 249,
    assets: 25,
    scans: "500 / month",
    depth: "Quick, Standard, Deep",
    schedule: "Daily",
    retention: "365 days",
    seats: 3,
    reports: "Yes (PDF + White-label)",
    api: "Yes",
    support: "Email + Slack",
    recommended: true,
  },
  {
    code: "scale",
    name: "Scale",
    price: 799,
    assets: 100,
    scans: "Unlimited",
    depth: "All profiles",
    schedule: "Continuous / Daily",
    retention: "730 days",
    seats: 10,
    reports: "Yes (PDF + White-label)",
    api: "Yes",
    support: "Dedicated Slack + 4h SLA",
  },
];

export function BillingManager({
  initialPlan,
  initialUsage,
  initialInvoices,
}: {
  initialPlan: PlanData;
  initialUsage: UsageData;
  initialInvoices: InvoiceItem[];
}) {
  const [currentPlan, setCurrentPlan] = useState<PlanData>(initialPlan);
  const [invoices] = useState<InvoiceItem[]>(initialInvoices);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [calcAssets, setCalcAssets] = useState(initialUsage.assets_monitored || 5);
  const [currency, setCurrency] = useState<"MYR" | "USD">("MYR");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Metered calculator formula (§13.2)
  // Base plan determined by asset count
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

  const overageCost = overageAssets * 8; // MYR 8 per additional asset
  const subtotal = basePrice + overageCost;
  const sstTax = subtotal * 0.08; // 8% SST
  const total = subtotal + sstTax;

  const rate = currency === "USD" ? 0.22 : 1;
  const currencySymbol = currency === "USD" ? "$" : "MYR ";

  async function handleSelectPlan(planCode: string) {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/v1/billing/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_code: planCode }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setErrorMessage(body?.error?.message ?? `Could not change plan (HTTP ${res.status}).`);
        return;
      }
      const data = await res.json();
      setCurrentPlan(data.plan);
      setSuccessMessage(`Subscription updated: now on ${planCode.toUpperCase()} plan.`);
      setIsChangingPlan(false);
    } catch {
      setErrorMessage("Cannot reach the API. Is it running?");
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 5000);
    }
  }

  const assetPct =
    currentPlan.limits.max_assets > 0
      ? Math.min(Math.round((initialUsage.assets_monitored / currentPlan.limits.max_assets) * 100), 100)
      : 20;

  const scanPct =
    currentPlan.limits.scans_per_month > 0
      ? Math.min(Math.round((initialUsage.scans_this_month / currentPlan.limits.scans_per_month) * 100), 100)
      : 15;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Plan & Billing"
        description="Manage your subscription tier, track asset and scan quota utilization, and download tax invoices."
      />

      {errorMessage && (
        <div className="border border-ink bg-canvas p-4 font-mono text-sm text-ink">
          [FAIL] {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="border border-ink bg-canvas p-4 font-mono text-sm text-ink">
          [OK] {successMessage}
        </div>
      )}

      {/* 80% quota warning notice (§9.2: Never let a limit surprise someone. Warn at 80% by email and in-app) */}
      {(initialUsage.is_asset_limit_near || assetPct >= 80) && (
        <div className="border border-ink bg-ink p-4 text-canvas">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider">[!] QUOTA WARNING</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed">
            You are currently monitoring {initialUsage.assets_monitored} of {currentPlan.limits.max_assets} allowed assets ({assetPct}% capacity).
            Add capacity or upgrade to Growth plan to avoid interrupted automated scans.
          </p>
        </div>
      )}

      {/* Active Plan & Current Usage Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Plan Card */}
        <div className="border border-line bg-canvas p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-muted">Current Plan</span>
              <span className="border border-ink bg-ink px-2 py-0.5 font-mono text-xs font-bold uppercase text-canvas">
                {currentPlan.code}
              </span>
            </div>
            <div className="mt-4">
              <span className="font-mono text-3xl font-bold text-ink">
                MYR {currentPlan.price_myr_month}
              </span>
              <span className="font-mono text-xs text-muted"> / month</span>
            </div>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Subject to Malaysian 8% SST. Billed monthly via FPX or Credit Card.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-line flex flex-col gap-2">
            <button
              onClick={() => setIsChangingPlan(true)}
              className="w-full border border-ink bg-ink py-2 text-center font-mono text-xs font-medium uppercase tracking-[0.05em] text-canvas hover:bg-canvas hover:text-ink transition-colors"
            >
              Change Plan
            </button>
            <p className="text-[10px] text-faint text-center">
              Next billing cycle: 1st of next month · Cancel anytime
            </p>
          </div>
        </div>

        {/* Quota Limits & Utilization */}
        <div className="border border-line bg-canvas p-6 lg:col-span-2">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink mb-4">
            Monthly Quota Utilization
          </h2>

          <div className="flex flex-col gap-5">
            {/* Assets Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-ink">Monitored Assets</span>
                <span className="font-mono text-muted">
                  {initialUsage.assets_monitored} / {currentPlan.limits.max_assets > 0 ? currentPlan.limits.max_assets : "Unlimited"} ({assetPct}%)
                </span>
              </div>
              <div className="h-2 w-full bg-subtle border border-line">
                <div
                  className="h-full bg-ink transition-all"
                  style={{ width: `${assetPct}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-muted">
                Each verified domain, subdomain, or IP counts as 1 monitored asset.
              </p>
            </div>

            {/* Scans Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-ink">Scans Executed This Month</span>
                <span className="font-mono text-muted">
                  {initialUsage.scans_this_month} / {currentPlan.limits.scans_per_month > 0 ? currentPlan.limits.scans_per_month : "Unlimited"} ({scanPct}%)
                </span>
              </div>
              <div className="h-2 w-full bg-subtle border border-line">
                <div
                  className="h-full bg-ink transition-all"
                  style={{ width: `${scanPct}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-muted">
                Includes automated cron triggers and manual on-demand executions.
              </p>
            </div>

            {/* Feature specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-line text-xs font-mono">
              <div>
                <span className="text-muted block text-[10px]">RETENTION</span>
                <span className="font-bold text-ink">{currentPlan.limits.retention_days} days</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">SEATS</span>
                <span className="font-bold text-ink">{currentPlan.limits.seats} seat</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">CADENCE</span>
                <span className="font-bold text-ink">{currentPlan.limits.schedule}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">API ACCESS</span>
                <span className="font-bold text-ink">{currentPlan.limits.api ? "Active" : "Locked"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metered Usage Calculator (§9.2) */}
      <div className="border border-line bg-canvas p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4 mb-6">
          <div>
            <h2 className="font-mono text-base font-bold uppercase tracking-wider text-ink">
              Metered Usage Cost Calculator
            </h2>
            <p className="text-xs text-muted mt-1">
              Estimate your monthly investment based on the total active targets in your attack surface.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Currency:</span>
            <button
              onClick={() => setCurrency(currency === "MYR" ? "USD" : "MYR")}
              className="border border-line px-3 py-1 font-mono text-xs font-bold hover:border-ink"
            >
              [{currency}] Toggle
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase text-ink">
                Verified Assets to Monitor:
              </label>
              <span className="font-mono text-xl font-bold text-ink">
                {calcAssets} {calcAssets === 1 ? "asset" : "assets"}
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="200"
              value={calcAssets}
              onChange={(e) => setCalcAssets(parseInt(e.target.value, 10))}
              className="w-full accent-black cursor-pointer"
            />

            <div className="flex justify-between text-[10px] font-mono text-muted">
              <span>1 asset (Free)</span>
              <span>5 assets (Starter)</span>
              <span>25 assets (Growth)</span>
              <span>100+ assets (Scale)</span>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Recommendation: <strong className="text-ink font-mono uppercase">{suggestedPlan} Plan</strong>.
              {overageAssets > 0 ? ` Includes 100 assets on base Scale plan + ${overageAssets} metered overage assets at MYR 8/asset.` : ""}
            </p>
          </div>

          <div className="border border-line bg-subtle p-5 font-mono text-xs">
            <div className="flex justify-between py-1 text-muted">
              <span>Base Plan ({suggestedPlan.toUpperCase()}):</span>
              <span>{currencySymbol}{(basePrice * rate).toFixed(2)}</span>
            </div>
            {overageCost > 0 && (
              <div className="flex justify-between py-1 text-muted">
                <span>Overage ({overageAssets} assets × 8):</span>
                <span>{currencySymbol}{(overageCost * rate).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 text-muted border-t border-line mt-2 pt-2">
              <span>Subtotal:</span>
              <span>{currencySymbol}{(subtotal * rate).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 text-muted">
              <span>Malaysian SST (8%):</span>
              <span>{currencySymbol}{(sstTax * rate).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-ink font-bold text-sm text-ink mt-2">
              <span>ESTIMATED TOTAL:</span>
              <span>{currencySymbol}{(total * rate).toFixed(2)} / mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method & Billing Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-line bg-canvas p-6">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink mb-3">
            Payment Method
          </h2>
          <div className="flex items-center justify-between border border-line p-3 font-mono text-xs">
            <div>
              <p className="font-bold text-ink">FPX Malaysian Online Banking</p>
              <p className="text-muted text-[10px]">Autodebit enabled · Maybank2u / CIMB / Public</p>
            </div>
            <span className="border border-line px-2 py-0.5 text-[10px] uppercase">Default</span>
          </div>
          <p className="mt-3 text-xs text-muted">
            We support FPX online direct debit and Visa/Mastercard credit cards.
          </p>
        </div>

        <div className="border border-line bg-canvas p-6">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink mb-3">
            Tax & Legal Treatment
          </h2>
          <p className="text-xs text-muted leading-relaxed">
            Harizeon Technologies Sdn. Bhd. Registered in Malaysia (SSM).
            Service Tax Registration Number: <span className="font-mono text-ink">W10-2401-32000142</span>.
            Invoices meet Malaysian Inland Revenue Board (LHDN) e-Invoicing compliance guidelines.
          </p>
        </div>
      </div>

      {/* Invoice History Table (§9.2) */}
      <div className="border border-line bg-canvas">
        <div className="p-4 border-b border-line flex items-center justify-between">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
            Tax Invoices & Receipts
          </h2>
          <span className="font-mono text-xs text-muted">{invoices.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-line bg-subtle text-muted uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Invoice Number</th>
                <th className="px-4 py-3">Billing Period</th>
                <th className="px-4 py-3">Subtotal</th>
                <th className="px-4 py-3">SST (8%)</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-subtle">
                  <td className="px-4 py-3 font-bold text-ink">{inv.number}</td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(inv.period_start).toLocaleDateString()} – {new Date(inv.period_end).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-muted">{inv.currency} {Number(inv.subtotal).toFixed(2)}</td>
                  <td className="px-4 py-3 text-muted">{inv.currency} {Number(inv.tax).toFixed(2)}</td>
                  <td className="px-4 py-3 font-bold text-ink">{inv.currency} {Number(inv.total).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className="border border-line bg-canvas px-1.5 py-0.5 text-[10px] uppercase text-ink">
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => alert(`Downloading official SST tax invoice ${inv.number}`)}
                      className="border border-line px-2 py-1 text-[10px] uppercase hover:border-ink hover:text-ink"
                    >
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Selection Modal */}
      {isChangingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl border border-line bg-canvas p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-mono text-base font-bold uppercase tracking-wider text-ink">
                Select Subscription Tier
              </h3>
              <button
                onClick={() => setIsChangingPlan(false)}
                className="font-mono text-sm text-muted hover:text-ink"
              >
                [ESC]
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              {AVAILABLE_PLANS.map((plan) => {
                const isCurrent = currentPlan.code === plan.code;
                return (
                  <div
                    key={plan.code}
                    className={`border p-4 flex flex-col justify-between ${
                      isCurrent ? "border-ink bg-subtle" : "border-line bg-canvas hover:border-ink"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold uppercase text-ink">
                          {plan.name}
                        </span>
                        {plan.recommended && (
                          <span className="bg-ink text-canvas text-[9px] font-mono uppercase px-1 py-0.5">
                            Best Value
                          </span>
                        )}
                      </div>

                      <div className="mt-3">
                        <span className="font-mono text-2xl font-bold text-ink">
                          MYR {plan.price}
                        </span>
                        <span className="font-mono text-[10px] text-muted"> / mo</span>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 font-mono text-[11px] border-t border-line pt-3 text-muted">
                        <div>
                          <strong className="text-ink">{plan.assets}</strong> monitored {plan.assets === 1 ? "asset" : "assets"}
                        </div>
                        <div>
                          <strong className="text-ink">{plan.scans}</strong>
                        </div>
                        <div>
                          Profile: <strong className="text-ink">{plan.depth}</strong>
                        </div>
                        <div>
                          Cadence: <strong className="text-ink">{plan.schedule}</strong>
                        </div>
                        <div>
                          Retention: <strong className="text-ink">{plan.retention}</strong>
                        </div>
                        <div>
                          Reports: <strong className="text-ink">{plan.reports}</strong>
                        </div>
                        <div>
                          API: <strong className="text-ink">{plan.api}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      disabled={isCurrent || isLoading}
                      onClick={() => handleSelectPlan(plan.code)}
                      className={`mt-6 w-full py-2 font-mono text-xs uppercase transition-colors ${
                        isCurrent
                          ? "border border-line bg-canvas text-faint cursor-default"
                          : "border border-ink bg-ink text-canvas hover:bg-canvas hover:text-ink"
                      }`}
                    >
                      {isCurrent ? "Active Plan" : isLoading ? "Switching..." : `Select ${plan.name}`}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsChangingPlan(false)}
                className="border border-line px-4 py-2 font-mono text-xs uppercase hover:border-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
