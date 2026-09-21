import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ApiErrorNotice } from "@/components/api-error-notice";
import { NotificationsManager, type ChannelItem } from "@/components/notifications-manager";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Notification channels · Settings" };

export default async function NotificationSettingsPage() {
  let channels: ChannelItem[] = [];
  let error: string | null = null;

  try {
    const res = await apiFetch<{ data: ChannelItem[] }>("/channels");
    channels = res.data ?? [];
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login");
    }
    error = e instanceof ApiError ? e.message : "Cannot reach the API. Is it running?";
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

      {error ? <ApiErrorNotice message={error} /> : null}
      <NotificationsManager initialChannels={channels} />
    </div>
  );
}
