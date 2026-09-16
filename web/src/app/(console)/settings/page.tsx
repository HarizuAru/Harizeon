import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Organization, members, API keys, notifications, billing, and the audit log."
      />
      <EmptyState
        title="Settings panels land in W02."
        description="IAM (accounts, orgs, API keys, audit log) is the first milestone after the foundation, because everything depends on it."
      />
    </div>
  );
}
