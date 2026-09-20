import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  BillingManager,
  type PlanData,
  type UsageData,
  type InvoiceItem,
} from "@/components/billing-manager";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Plan & Billing" };

export default async function BillingPage() {
  let plan: PlanData = {
    id: "plan-starter",
    code: "starter",
    price_myr_month: 79,
    limits: {
      max_assets: 5,
      scans_per_month: 50,
      profiles: ["quick", "standard"],
      retention_days: 90,
      seats: 1,
      pdf_reports: true,
      api: false,
      schedule: "weekly",
    },
  };

  let usage: UsageData = {
    assets_monitored: 4,
    max_assets: 5,
    scans_this_month: 28,
    max_scans_per_month: 50,
    is_asset_limit_near: true,
    is_scan_limit_near: false,
    retention_days: 90,
    seats_used: 1,
    max_seats: 1,
    period_start: "2026-09-01T00:00:00.000Z",
    period_end: "2026-09-30T23:59:59.000Z",
  };

  let invoices: InvoiceItem[] = [
    {
      id: "inv-001",
      number: "HRZ-2026-0089",
      period_start: "2026-08-01T00:00:00.000Z",
      period_end: "2026-08-31T23:59:59.000Z",
      subtotal: 79.0,
      tax: 6.32,
      total: 85.32,
      currency: "MYR",
      status: "paid",
      pdf_ref: "/invoices/HRZ-2026-0089.pdf",
      paid_at: "2026-08-01T04:12:00.000Z",
    },
    {
      id: "inv-002",
      number: "HRZ-2026-0044",
      period_start: "2026-07-01T00:00:00.000Z",
      period_end: "2026-07-31T23:59:59.000Z",
      subtotal: 79.0,
      tax: 6.32,
      total: 85.32,
      currency: "MYR",
      status: "paid",
      pdf_ref: "/invoices/HRZ-2026-0044.pdf",
      paid_at: "2026-07-01T04:15:00.000Z",
    },
  ];

  try {
    const subRes = await apiFetch<{ plan: PlanData; usage: UsageData }>("/billing/subscription");
    if (subRes.plan) plan = subRes.plan;
    if (subRes.usage) usage = subRes.usage;

    const invRes = await apiFetch<{ invoices: InvoiceItem[] }>("/billing/invoices");
    if (invRes.invoices && invRes.invoices.length > 0) {
      invoices = invRes.invoices;
    }
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login");
    }
  }

  return (
    <BillingManager
      initialPlan={plan}
      initialUsage={usage}
      initialInvoices={invoices}
    />
  );
}
