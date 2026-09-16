import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Scans" };

export default function ScansPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Scans"
        description="Scan history and the live scan view. W04 builds the job pipeline; W05–W08 add real phases."
      />
      <EmptyState
        title="No scans yet."
        description="A scan can only run against an asset you have verified. Add and verify an asset first."
      />
    </div>
  );
}
