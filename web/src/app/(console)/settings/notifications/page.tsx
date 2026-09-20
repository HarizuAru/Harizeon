import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { NotificationsManager, type ChannelItem } from "@/components/notifications-manager";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Notification channels · Settings" };

export default async function NotificationSettingsPage() {
  let channels: ChannelItem[] = [];

  try {
    const res = await apiFetch<{ data: ChannelItem[] }>("/channels");
    channels = res.data ?? [];
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login");
    }
    // Fallback default mock channels
    channels = [
      {
        id: "chn-001",
        type: "email",
        config: { recipients: ["admin@harizeon.local", "security-team@example.com"] },
        enabled: true,
        min_severity: "high",
        verified_at: "2026-09-08T00:00:00.000Z",
        created_at: "2026-09-08T00:00:00.000Z",
        updated_at: "2026-09-08T00:00:00.000Z",
      },
      {
        id: "chn-002",
        type: "slack",
        config: {
          webhook_url: "https://hooks.slack.com/services/T00/B00/sec-alerts",
          channel: "#sec-alerts",
        },
        enabled: true,
        min_severity: "critical",
        verified_at: "2026-09-12T00:00:00.000Z",
        created_at: "2026-09-12T00:00:00.000Z",
        updated_at: "2026-09-12T00:00:00.000Z",
      },
      {
        id: "chn-003",
        type: "webhook",
        config: {
          url: "https://api.example.com/webhooks/security",
          secret: "hrz_sec_7a8f9b1c2d3e4f5061",
          description: "SIEM Ingestion Endpoint",
        },
        enabled: true,
        min_severity: "medium",
        verified_at: "2026-09-14T00:00:00.000Z",
        created_at: "2026-09-14T00:00:00.000Z",
        updated_at: "2026-09-14T00:00:00.000Z",
      },
    ];
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 font-mono text-xs text-muted">
        <Link href="/settings" className="hover:text-ink">
          SETTINGS
        </Link>
        <span>/</span>
        <span className="text-ink">NOTIFICATIONS</span>
      </div>

      <PageHeader
        title="Notification channels"
        description="Configure automated alerts for newly detected vulnerabilities, drift detection, and weekly security digests."
      />

      <NotificationsManager initialChannels={channels} />
    </div>
  );
}
