import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Schedules" };

export default function SchedulesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Schedules"
        description="Recurring scans. W09 adds cron schedules and notification channels."
      />
      <EmptyState
        title="No schedules."
        description="Schedule daily, weekly, or monthly rescans and get a diff when something changes."
      />
    </div>
  );
}
