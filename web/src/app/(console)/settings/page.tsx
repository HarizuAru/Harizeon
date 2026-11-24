import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Settings" };

const SETTINGS_SECTIONS = [
  {
    title: "Organization Profile",
    href: "/settings/organization",
    desc: "Workspace name, reporting timezone, compliance policies, MFA requirements, and workspace deletion.",
  },
  {
    title: "Team Members & Access",
    href: "/settings/members",
    desc: "Invite security engineers and auditors, assign roles (Owner, Admin, Member, Readonly), and review seats.",
  },
  {
    title: "Plan & Billing Quotas",
    href: "/settings/billing",
    desc: "Subscription tier (Free, Starter, Growth, Scale), live asset quota bars, metered calculator, and tax invoices.",
  },
  {
    title: "API Keys & Scopes",
    href: "/settings/api-keys",
    desc: "Generate scoped Bearer tokens for GitHub Actions, GitLab CI, or SIEM pipelines with one-time secret view.",
  },
  {
    title: "Notifications & Alerts",
    href: "/settings/notifications",
    desc: "Alert channels (email, Slack webhook, custom HMAC-SHA256 webhooks, Discord) and automated digests.",
  },
  {
    title: "Schedules & Rescan Cadence",
    href: "/schedules",
    desc: "Recurring cron-based scans and automated drift detection across all verified attack surfaces.",
  },
  {
    title: "Security Audit Trail",
    href: "/settings/audit-log",
    desc: "Immutable chronological log of all scan triggers, asset verifications, and permission mutations with CSV export.",
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Configure organization preferences, notification channels, API keys, and team access."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {SETTINGS_SECTIONS.map((sec) => (
          <Link
            key={sec.title}
            href={sec.href}
            className="group flex flex-col justify-between border border-line bg-canvas p-5 transition-colors hover:border-ink hover:bg-subtle card-interactive"
          >
            <div>
              <h2 className="font-mono text-sm font-bold uppercase tracking-[0.05em] text-ink">
                {sec.title}
              </h2>
              <p className="mt-2.5 text-xs leading-relaxed text-muted group-hover:text-ink">
                {sec.desc}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between font-mono text-xs text-muted group-hover:text-ink">
              <span>Open settings</span>
              <span>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
