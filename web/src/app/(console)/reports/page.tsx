import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ApiErrorNotice } from "@/components/api-error-notice";
import { ReportsManager, type ReportItem } from "@/components/reports-manager";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  let reports: ReportItem[] = [];
  let error: string | null = null;

  try {
    const res = await apiFetch<{ data: ReportItem[] }>("/reports");
    reports = res.data ?? [];
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login");
    }
    error = e instanceof ApiError ? e.message : "Cannot reach the API. Is it running?";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description="Formal print-ready executive summaries, technical vulnerability assessments, and compliance deliverables."
      />
      {error ? <ApiErrorNotice message={error} /> : null}
      <ReportsManager initialReports={reports} />
    </div>
  );
}
