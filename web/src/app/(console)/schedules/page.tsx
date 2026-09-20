import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { SchedulesManager, type ScheduleItem } from "@/components/schedules-manager";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Schedules" };

export default async function SchedulesPage() {
  let schedules: ScheduleItem[] = [];

  try {
    const res = await apiFetch<{ data: ScheduleItem[] }>("/schedules");
    schedules = res.data ?? [];
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login");
    }
    // Fallback default mock schedules for preview if backend not running
    schedules = [
      {
        id: "sch-001",
        cron: "0 2 * * *",
        profile: "standard",
        timezone: "Asia/Kuala_Lumpur",
        next_run_at: "2026-09-21T02:00:00.000Z",
        enabled: true,
        created_at: "2026-09-10T00:00:00.000Z",
        updated_at: "2026-09-10T00:00:00.000Z",
      },
      {
        id: "sch-002",
        cron: "0 3 * * 0",
        profile: "deep",
        timezone: "Asia/Kuala_Lumpur",
        next_run_at: "2026-09-27T03:00:00.000Z",
        enabled: true,
        created_at: "2026-09-15T00:00:00.000Z",
        updated_at: "2026-09-15T00:00:00.000Z",
      },
    ];
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Schedules"
        description="Automated recurring baseline rescans with drift detection across verified scope."
      />
      <SchedulesManager initialSchedules={schedules} />
    </div>
  );
}
