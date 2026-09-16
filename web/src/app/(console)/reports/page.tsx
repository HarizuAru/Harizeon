import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description="Client-facing PDF exports. W10 builds report generation."
      />
      <EmptyState
        title="No reports yet."
        description="Generate an executive, technical, or compliance report a client will accept."
      />
    </div>
  );
}
