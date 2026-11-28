"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  code: string;
  label: string;
  href: string;
  badge?: string;
  quickAction?: {
    href: string;
    title: string;
    icon: string;
  };
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: "Attack Surface",
    items: [
      { code: "HUB", label: "Dashboard", href: "/dashboard" },
      {
        code: "ASM",
        label: "Perimeter Assets",
        href: "/assets",
        quickAction: { href: "/assets/new", title: "Add new asset (+)", icon: "+" },
      },
      { code: "DFT", label: "Perimeter Drift", href: "/drift" },
    ],
  },
  {
    group: "Scanning & Risk",
    items: [
      {
        code: "SCN",
        label: "Security Scans",
        href: "/scans",
        quickAction: { href: "/scans/new", title: "Launch new scan (▶)", icon: "▶" },
      },
      { code: "SCH", label: "Scan Schedules", href: "/schedules" },
      { code: "FND", label: "Security Findings", href: "/findings" },
    ],
  },
  {
    group: "Reports & Governance",
    items: [
      { code: "REP", label: "Compliance Reports", href: "/reports" },
      { code: "CMP", label: "Compliance (MY)", href: "/compliance" },
      { code: "ADT", label: "Audit Trail & Logs", href: "/settings/audit-log" },
    ],
  },
  {
    group: "Administration",
    items: [
      { code: "SET", label: "Workspace Settings", href: "/settings" },
      { code: "CIG", label: "CI/CD Quality Gates", href: "/settings/ci-cd" },
      { code: "KEY", label: "API Credentials", href: "/settings/api-keys" },
    ],
  },
];

export function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={cx(
          "flex flex-col border-r border-line bg-canvas transition-all duration-200 select-none",
          "fixed inset-y-0 left-0 z-50 lg:static lg:z-auto lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-14 w-60 shrink-0" : "w-60 shrink-0",
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
                v1.1
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
        <nav className="flex-1 overflow-y-auto p-2" aria-label="Console Navigation">
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
                    <div
                      key={item.href}
                      className={cx(
                        "group flex items-center justify-between px-2.5 py-1.5 text-xs rounded-xl transition-all",
                        active
                          ? "bg-[#02acc5]/10 text-[#02acc5] font-semibold border-l-2 border-[#02acc5]"
                          : "text-muted hover:bg-subtle/80 hover:text-ink",
                        isCollapsed && "justify-center px-0 py-2",
                      )}
                    >
                      <Link
                        href={item.href}
                        onClick={onCloseMobile}
                        title={isCollapsed ? `${item.label} (${item.code})` : undefined}
                        aria-current={active ? "page" : undefined}
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <span
                          className={cx(
                            "rounded-md font-mono text-[9px] px-1.5 py-0.5 shrink-0 transition-all",
                            active
                              ? "bg-[#02acc5] text-white font-bold border-transparent"
                              : "border border-line bg-canvas text-faint group-hover:text-muted",
                          )}
                        >
                          {item.code}
                        </span>
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>

                      {!isCollapsed && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.badge && (
                            <span className="rounded-full bg-[#02acc5]/15 border border-[#02acc5]/30 px-1.5 py-0.2 text-[9px] font-mono font-bold text-[#02acc5]">
                              {item.badge}
                            </span>
                          )}
                          {item.quickAction && (
                            <Link
                              href={item.quickAction.href}
                              title={item.quickAction.title}
                              className="rounded-md border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-muted hover:border-[#02acc5] hover:text-[#02acc5] hover:bg-subtle transition-colors"
                            >
                              {item.quickAction.icon}
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Console Footer Info Rail */}
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
    </>
  );
}
