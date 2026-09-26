import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { ScansTrendChart } from "@/components/scans-trend-chart";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Scans" };

type Scan = {
  id: string;
  status: string;
  profile: string;
  phase: string | null;
  progress_pct: number;
  created_at: string;
};

const columns: Column<Scan>[] = [
  {
    key: "id",
    header: "Scan",
    mono: true,
    render: (r) => (
      <Link href={`/scans/${r.id}`} className="underline">
        {r.id.slice(0, 8)}…
      </Link>
    ),
  },
  { key: "status", header: "Status" },
  { key: "profile", header: "Profile" },
  { key: "phase", header: "Phase", mono: true, render: (r) => r.phase ?? "—" },
  { key: "progress_pct", header: "Progress", align: "right", mono: true, render: (r) => `${r.progress_pct}%` },
  {
    key: "created_at",
    header: "Started",
    mono: true,
    render: (r) => new Date(r.created_at).toLocaleString(),
  },
];

export default async function ScansPage() {
  let scans: Scan[] = [];
  let error: string | null = null;
  try {
    scans = (await apiFetch<{ data: Scan[] }>("/scans?limit=100")).data;
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    error = e instanceof ApiError ? e.message : "Cannot reach the API. Is it running?";
  }

  const failedCount = scans.filter((s) => s.status === "failed" || s.status === "timeout").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Scans"
        description="Scan history and live progress."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard#system-health" className={buttonClass("secondary", "md")}>
              System Health
            </Link>
            <Link href="/scans/new" className={buttonClass("primary", "md")}>
              New scan
            </Link>
          </div>
        }
      />

      {/* D3 30-Day Historical Trend Chart */}
      <ScansTrendChart scans={scans} />

      {failedCount > 0 && (
        <div className="border border-line bg-subtle p-3.5 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="border border-ink bg-ink text-canvas px-1.5 py-0.5 text-[10px] font-bold uppercase">
              [!] Failure Alert
            </span>
            <span className="font-bold text-ink">
              {failedCount} {failedCount === 1 ? "scan" : "scans"} failed or timed out recently.
            </span>
            <span className="text-muted hidden md:inline">·</span>
            <span className="text-muted hidden md:inline">
              Check System Health diagnostics for root-cause analysis and firewall/DNS fixes.
            </span>
          </div>
          <Link
            href="/dashboard#system-health"
            className="text-ink underline font-bold hover:no-underline whitespace-nowrap"
          >
            Diagnose Scan Failures →
          </Link>
        </div>
      )}
      {error ? (
        <EmptyState title="Could not load scans." description={error} />
      ) : (
        <DataTable
          columns={columns}
          rows={scans}
          rowKey={(r) => r.id}
          empty="No scans yet. Add a verified asset and start one."
        />
      )}
    </div>
  );
}
