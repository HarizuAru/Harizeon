import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  DashboardView,
  type DashboardFinding,
  type DashboardAsset,
  type DashboardScan,
  type DashboardUsage,
} from "@/components/dashboard-view";
import { type SystemHealthData } from "@/components/system-health-dashboard";
import { type EmergingThreatSummary } from "@/components/emerging-threat-banner";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * A security console must never present fabricated data (§10.8): when the API
 * is unreachable the dashboard shows what it knows (nothing) and says so.
 */
export default async function DashboardPage() {
  let findings: DashboardFinding[] = [];
  let assets: DashboardAsset[] = [];
  let scans: DashboardScan[] = [];
  let systemHealth: SystemHealthData | null = null;
  let usage: DashboardUsage | null = null;
  let emergingThreats: EmergingThreatSummary | null = null;
  let error: string | null = null;

  try {
    const [findingsRes, assetsRes, scansRes, systemHealthRes, usageRes, threatsRes] = await Promise.all([
      apiFetch<{ data: DashboardFinding[] }>("/findings?limit=50"),
      apiFetch<{ data: DashboardAsset[] }>("/assets?limit=50"),
      apiFetch<{ data: DashboardScan[] }>("/scans?limit=50"),
      apiFetch<SystemHealthData>("/system/health").catch(() => null),
      apiFetch<DashboardUsage>("/usage").catch(() => null),
      apiFetch<EmergingThreatSummary>("/threats/emerging").catch(() => null),
    ]);
    findings = findingsRes.data ?? [];
    assets = assetsRes.data ?? [];
    scans = scansRes.data ?? [];
    systemHealth = systemHealthRes;
    usage = usageRes;
    emergingThreats = threatsRes;
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    error = e instanceof ApiError ? e.message : "Cannot reach the API. Is it running?";
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <div className="border border-line bg-canvas p-3">
          <p className="font-mono text-xs font-bold text-ink">ERROR: {error}</p>
          <p className="mt-1 text-sm text-muted">
            Showing no data rather than invented data. Start the API and reload.
          </p>
        </div>
      ) : null}
      <DashboardView
        findings={findings}
        assets={assets}
        scans={scans}
        systemHealth={systemHealth}
        usage={usage}
        emergingThreats={emergingThreats}
      />
    </div>
  );
}
