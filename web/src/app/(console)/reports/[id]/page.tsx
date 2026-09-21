import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ReportDocument, type ReportContent } from "@/components/report-document";
import { PrintButton } from "@/components/print-button";
import { EmptyState } from "@/components/ui/empty-state";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Security Assessment Report" };

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let content: ReportContent | null = null;
  let error: string | null = null;

  try {
    const res = await apiFetch<{ report: unknown; content: ReportContent }>(`/reports/${id}`);
    content = res.content;
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    if (e instanceof ApiError && e.status === 404) notFound();
    error = e instanceof ApiError ? e.message : "Cannot reach the API. Is it running?";
  }

  if (error || !content) {
    return (
      <div className="flex flex-col gap-6">
        <EmptyState title="Could not load this report." description={error ?? "Report has no content."} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end no-print">
        <PrintButton />
      </div>
      <ReportDocument content={content} />
    </div>
  );
}
