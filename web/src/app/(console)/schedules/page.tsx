import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ApiErrorNotice } from "@/components/api-error-notice";
import { SchedulesManager, type ScheduleItem } from "@/components/schedules-manager";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Schedules" };

export default async function SchedulesPage() {
  let schedules: ScheduleItem[] = [];
  let error: string | null = null;

  try {
    const res = await apiFetch<{ data: ScheduleItem[] }>("/schedules");
    schedules = res.data ?? [];
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login");
    }
    error = e instanceof ApiError ? e.message : "Cannot reach the API. Is it running?";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Schedules"
        description="Automated recurring baseline rescans with drift detection across verified scope."
      />
      {error ? <ApiErrorNotice message={error} /> : null}
      <SchedulesManager initialSchedules={schedules} />
    </div>
  );
}
