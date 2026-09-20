import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuditLogManager, type AuditLogItem } from "@/components/audit-log-manager";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Audit Log" };

export default async function AuditLogPage() {
  let logs: AuditLogItem[] = [
    {
      id: "aud-001",
      org_id: "org-01",
      actor_type: "user",
      actor_id: "usr-01",
      action: "asset.verify",
      target_type: "asset",
      target_id: "ast-01",
      ip: "203.0.113.195",
      user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      metadata: { method: "dns_txt", domain: "example.com", status: "verified" },
      created_at: "2026-09-19T06:00:00.000Z",
    },
    {
      id: "aud-002",
      org_id: "org-01",
      actor_type: "user",
      actor_id: "usr-01",
      action: "scan.start",
      target_type: "scan",
      target_id: "scn-01",
      ip: "203.0.113.195",
      user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      metadata: { profile: "standard", asset_ids: ["ast-01"] },
      created_at: "2026-09-19T06:01:00.000Z",
    },
    {
      id: "aud-003",
      org_id: "org-01",
      actor_type: "system",
      actor_id: null,
      action: "finding.create",
      target_type: "finding",
      target_id: "fnd-101",
      ip: null,
      user_agent: "harizeon-worker/0.1",
      metadata: { severity: "critical", title: "TLS 1.0/1.1 Deprecated Protocol Enabled" },
      created_at: "2026-09-19T06:05:00.000Z",
    },
    {
      id: "aud-004",
      org_id: "org-01",
      actor_type: "user",
      actor_id: "usr-01",
      action: "member.invite",
      target_type: "user",
      target_id: "usr-02",
      ip: "203.0.113.195",
      user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      metadata: { email: "devops-eng@acme.corp", role: "admin" },
      created_at: "2026-09-19T08:30:00.000Z",
    },
  ];

  try {
    const res = await apiFetch<{ logs: AuditLogItem[] }>("/audit-log");
    if (res.logs && res.logs.length > 0) {
      logs = res.logs;
    }
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login");
    }
  }

  return <AuditLogManager initialLogs={logs} />;
}
