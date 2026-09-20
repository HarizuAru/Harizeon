import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ReportsManager, type ReportItem } from "@/components/reports-manager";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  let reports: ReportItem[] = [];

  try {
    const res = await apiFetch<{ data: ReportItem[] }>("/reports");
    reports = res.data ?? [];
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login");
    }
    // Fallback default mock reports
    reports = [
      {
        id: "rep-001",
        type: "executive",
        generated_at: "2026-09-18T14:30:00.000Z",
        period_start: "2026-08-19T00:00:00.000Z",
        period_end: "2026-09-18T14:30:00.000Z",
        created_at: "2026-09-18T14:30:00.000Z",
      },
      {
        id: "rep-002",
        type: "technical",
        generated_at: "2026-09-13T09:15:00.000Z",
        period_start: "2026-09-06T00:00:00.000Z",
        period_end: "2026-09-13T09:15:00.000Z",
        created_at: "2026-09-13T09:15:00.000Z",
      },
    ];
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description="Formal print-ready executive summaries, technical vulnerability assessments, and compliance deliverables."
      />
      <ReportsManager initialReports={reports} />
    </div>
  );
}
