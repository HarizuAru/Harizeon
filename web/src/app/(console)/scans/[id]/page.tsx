import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LiveScan } from "@/components/live-scan";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Scan" };

type Detail = {
  scan: {
    id: string;
    status: string;
    phase: string | null;
    progress_pct: number;
    profile: string;
    error_code?: string;
    error_message?: string;
  };
  targets: { asset_id: string; type: string; value: string }[];
  events: { seq: number; phase: string | null; level: string; message: string; at: string }[];
  summary?: { new: number; resolved: number; unchanged: number } | null;
};

export default async function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let detail: Detail | null = null;
  let error: string | null = null;
  try {
    detail = await apiFetch<Detail>(`/scans/${id}`);
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    if (e instanceof ApiError && e.status === 404) notFound();
    error = e instanceof ApiError ? e.message : "Cannot reach the API. Is it running?";
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Scan" description="Could not load this scan." />
        <EmptyState title="Could not load scan." description={error ?? "Unknown error."} />
      </div>
    );
  }

  const { scan, targets, events } = detail;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<span className="font-mono">{scan.id.slice(0, 8)}…</span>}
        description={`profile: ${scan.profile} · targets: ${targets.map((t) => t.value).join(", ") || "—"}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/scans"
              className="border border-line bg-canvas px-3 py-1.5 font-mono text-xs text-ink hover:bg-subtle"
            >
              ← All scans
            </Link>
            <Link
              href="/dashboard#system-health"
              className="border border-line bg-canvas px-3 py-1.5 font-mono text-xs text-ink hover:bg-subtle"
            >
              System Health
            </Link>
          </div>
        }
      />
      <LiveScan
        scanId={scan.id}
        initialStatus={scan.status}
        initialPhase={scan.phase}
        initialProgress={scan.progress_pct}
        initialEvents={events}
        initialSummary={detail.summary ?? null}
        profile={scan.profile}
        targets={targets}
        errorCode={scan.error_code}
        errorMessage={scan.error_message}
      />
    </div>
  );
}
