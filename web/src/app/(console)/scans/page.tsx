import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
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
    scans = (await apiFetch<{ data: Scan[] }>("/scans?limit=50")).data;
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    error = e instanceof ApiError ? e.message : "Cannot reach the API. Is it running?";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Scans"
        description="Scan history and live progress."
        actions={
          <Link href="/scans/new" className={buttonClass("primary", "md")}>
            New scan
          </Link>
        }
      />
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
