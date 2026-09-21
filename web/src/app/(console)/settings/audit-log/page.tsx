import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ApiErrorNotice } from "@/components/api-error-notice";
import { AuditLogManager, type AuditLogItem } from "@/components/audit-log-manager";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Audit Log" };

/**
 * The audit log is a compliance artifact: it must reflect what actually
 * happened, never a seeded sample (§08.6).
 */
export default async function AuditLogPage() {
  let logs: AuditLogItem[] = [];
  let error: string | null = null;

  try {
    const res = await apiFetch<{ logs: AuditLogItem[] }>("/audit-log");
    logs = res.logs ?? [];
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login");
    }
    error = e instanceof ApiError ? e.message : "Cannot reach the API. Is it running?";
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? <ApiErrorNotice message={error} /> : null}
      <AuditLogManager initialLogs={logs} />
    </div>
  );
}
