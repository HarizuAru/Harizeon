import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Settings" };

const SETTINGS_SECTIONS = [
  {
    title: "Organization Profile",
    href: "/settings/organization",
    badge: "ORG",
    desc: "Workspace name, reporting timezone, compliance policies, MFA requirements, and workspace deletion.",
  },
  {
    title: "Team Members & Access",
    href: "/settings/members",
    badge: "RBAC",
    desc: "Invite security engineers and auditors, assign roles (Owner, Admin, Member, Readonly), and review seats.",
  },
  {
    title: "Plan & Billing Quotas",
    href: "/settings/billing",
    badge: "W11",
    desc: "Subscription tier (Free, Starter, Growth, Scale), live asset quota bars, metered calculator, and tax invoices.",
  },
  {
    title: "API Keys & Scopes",
    href: "/settings/api-keys",
    badge: "AUTH",
    desc: "Generate scoped Bearer tokens for GitHub Actions, GitLab CI, or SIEM pipelines with one-time secret view.",
  },
  {
    title: "Notifications & Alerts",
    href: "/settings/notifications",
    badge: "ALERTS",
    desc: "Alert channels (email, Slack webhook, custom HMAC-SHA256 webhooks, Discord) and automated digests.",
  },
  {
    title: "Schedules & Rescan Cadence",
    href: "/schedules",
    badge: "CRON",
    desc: "Recurring cron-based scans and automated drift detection across all verified attack surfaces.",
  },
  {
    title: "Security Audit Trail",
    href: "/settings/audit-log",
    badge: "AUDIT",
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
            className="group flex flex-col justify-between border border-line bg-canvas p-5 transition-colors hover:border-ink hover:bg-subtle"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold uppercase tracking-[0.05em] text-ink">
                  {sec.title}
                </span>
                <span className="border border-line bg-canvas px-2 py-0.5 font-mono text-[10px] uppercase text-muted group-hover:border-ink group-hover:text-ink">
                  {sec.badge}
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted group-hover:text-ink">
                {sec.desc}
              </p>
            </div>
            <div className="mt-4 flex items-center font-mono text-xs text-faint group-hover:text-ink">
              <span>Open settings →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
