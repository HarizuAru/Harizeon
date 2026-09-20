"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavGroup {
  group: string;
  items: {
    code: string;
    label: string;
    href: string;
    badge?: string;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: "Attack Surface",
    items: [
      { code: "HUB", label: "Dashboard", href: "/dashboard" },
      { code: "ASM", label: "Perimeter Assets", href: "/assets" },
      { code: "NEW", label: "Add Asset", href: "/assets/new" },
    ],
  },
  {
    group: "Scanning Engines",
    items: [
      { code: "SCN", label: "Scans History", href: "/scans" },
      { code: "RUN", label: "Launch Scan", href: "/scans/new" },
      { code: "SCH", label: "Scan Schedules", href: "/schedules" },
    ],
  },
  {
    group: "Threat & Risk",
    items: [
      { code: "FND", label: "Security Findings", href: "/findings", badge: "3" },
    ],
  },
  {
    group: "Reports & Audit",
    items: [
      { code: "REP", label: "Compliance Reports", href: "/reports" },
      { code: "ADT", label: "CloudTrail & Audit", href: "/settings/audit-log" },
    ],
  },
  {
    group: "IAM & Settings",
    items: [
      { code: "KEY", label: "API Credentials", href: "/settings/api-keys" },
      { code: "USR", label: "Members & RBAC", href: "/settings/members" },
      { code: "BIL", label: "Billing & Quotas", href: "/settings/billing" },
      { code: "NOT", label: "Notifications & SIEM", href: "/settings/notifications" },
      { code: "ORG", label: "Organization", href: "/settings/organization" },
    ],
  },
];

export function Sidebar({ isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cx(
        "relative flex flex-col border-r border-line bg-canvas transition-all duration-200 select-none",
        isCollapsed ? "w-14 shrink-0" : "w-60 shrink-0",
      )}
    >
      {/* Sidebar Header / Service Title */}
      <div className="flex h-12 items-center justify-between border-b border-line px-3">
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.05em] text-ink">
              Security Hub
            </span>
            <span className="border border-line bg-subtle px-1 text-[9px] font-mono text-faint">
              v0.1
            </span>
          </div>
        ) : (
          <span className="mx-auto font-mono text-xs font-bold text-ink">SH</span>
        )}

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="border border-line bg-subtle p-1 font-mono text-[10px] text-muted hover:border-ink hover:text-ink"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? "»" : "«"}
          </button>
        )}
      </div>

      {/* Navigation Group Items */}
      <nav className="flex-1 overflow-y-auto p-2" aria-label="AWS Console Navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group.group} className="mb-4">
            {!isCollapsed && (
              <div className="px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-faint">
                {group.group}
              </div>
            )}

            <div className="mt-1 flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? `${item.label} (${item.code})` : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "flex items-center justify-between px-2.5 py-1.5 text-xs transition-colors",
                      active
                        ? "border-l-2 border-ink bg-subtle font-bold text-ink"
                        : "text-muted hover:bg-subtle/50 hover:text-ink",
                      isCollapsed && "justify-center px-0 py-2",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cx(
                          "border font-mono text-[9px] px-1 py-0.5",
                          active
                            ? "border-ink bg-ink text-canvas font-bold"
                            : "border-line bg-canvas text-faint",
                        )}
                      >
                        {item.code}
                      </span>
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span className="border border-line bg-subtle px-1 text-[9px] font-mono font-bold text-ink">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* AWS Console Footer Info Rail */}
      <div className="border-t border-line p-2.5 font-mono text-[10px] text-faint">
        {!isCollapsed ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span>Tenant:</span>
              <span className="text-ink font-semibold">org-prod-01</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Fleet:</span>
              <span className="text-ink">4 Workers Online</span>
            </div>
          </div>
        ) : (
          <div className="text-center">●</div>
        )}
      </div>
    </aside>
  );
}
