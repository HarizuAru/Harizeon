"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { logoutAction } from "@/lib/auth-actions";
import { ServicesMegaMenu } from "@/components/services-mega-menu";
import { AwsSearchPalette } from "@/components/aws-search-palette";

export const CLUSTER_REGIONS = [
  { id: "ap-southeast-1", label: "ap-southeast-1 (Singapore)" },
  { id: "us-east-1", label: "us-east-1 (N. Virginia)" },
  { id: "eu-west-1", label: "eu-west-1 (Ireland)" },
  { id: "ap-northeast-1", label: "ap-northeast-1 (Tokyo)" },
  { id: "us-west-2", label: "us-west-2 (Oregon)" },
];

interface AlertItem {
  id: string;
  title: string;
  severity: string;
  asset_value?: string | null;
  last_seen_at?: string | null;
}

export function TopBar({
  onToggleCloudShell,
  isCloudShellOpen,
  activeRegion,
  onSelectRegion,
  onToggleSidebar,
}: {
  onToggleCloudShell?: () => void;
  isCloudShellOpen?: boolean;
  activeRegion?: string;
  onSelectRegion?: (r: string) => void;
  onToggleSidebar?: () => void;
}) {
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[] | null>(null);
  const [copiedAccountId, setCopiedAccountId] = useState(false);

  const pathname = usePathname();
  const currentRegion = activeRegion || "ap-southeast-1";

  // Alerts are the org's real open findings, never a canned sample (§10.8).
  useEffect(() => {
    if (!isNotificationsOpen || alerts !== null) return;
    fetch("/api/v1/findings?limit=5&status=open")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j: { data?: AlertItem[] }) => setAlerts((j.data ?? []).slice(0, 5)))
      .catch(() => setAlerts([]));
  }, [isNotificationsOpen, alerts]);

  // Global hotkeys (AWS style: '/' or 'Alt+S' for search, '`' for CloudShell)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If active element is an input, do not hijack unless Escape
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.key === "/" || (e.altKey && e.key.toLowerCase() === "s")) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const copyAccountId = () => {
    navigator.clipboard?.writeText("9073-7530-3530");
    setCopiedAccountId(true);
    setTimeout(() => setCopiedAccountId(false), 2000);
  };

  const PINNED_SERVICES = [
    { label: "Assets", href: "/assets" },
    { label: "Scans", href: "/scans" },
    { label: "Findings", href: "/findings" },
    { label: "Reports", href: "/reports" },
    { label: "Schedules", href: "/schedules" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-line bg-canvas px-3 select-none">
        {/* Left Section: Logo + Services Mega-Menu + Pinned Items */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Sidebar Toggle Button */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="border border-line p-1.5 text-muted hover:border-ink hover:text-ink lg:hidden"
              title="Toggle sidebar navigation"
              aria-label="Toggle sidebar"
            >
              <span className="font-mono text-xs">☰</span>
            </button>
          )}

          {/* Harizeon Console Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink"
          >
            <span className="border border-ink bg-ink px-1.5 py-0.5 text-canvas">◆</span>
            <span className="hidden sm:inline">HARIZEON</span>
            <span className="border border-line bg-subtle px-1 text-[9px] font-normal text-muted">
              Console
            </span>
          </Link>

          {/* AWS Services Mega-Menu Button */}
          <button
            onClick={() => setIsServicesOpen(!isServicesOpen)}
            className={`flex items-center gap-1.5 border px-2.5 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
              isServicesOpen
                ? "border-ink bg-ink text-canvas"
                : "border-line bg-subtle text-ink hover:border-ink"
            }`}
            title="Browse all Harizeon security services"
          >
            <span className="text-[10px]">☷</span>
            <span>Services</span>
            <span className="text-[9px]">▾</span>
          </button>

          {/* AWS Pinned Services Bar */}
          <nav className="hidden xl:flex items-center gap-1 pl-2 border-l border-line" aria-label="Pinned favorites">
            {PINNED_SERVICES.map((pin) => {
              const active = pathname === pin.href || pathname.startsWith(pin.href + "/");
              return (
                <Link
                  key={pin.href}
                  href={pin.href}
                  className={`px-2 py-1 font-mono text-[11px] transition-colors ${
                    active
                      ? "border-b-2 border-ink font-bold text-ink"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {pin.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: AWS Global Search Bar */}
        <div className="flex flex-1 items-center justify-center max-w-md px-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex h-8 w-full items-center justify-between border border-line bg-subtle/70 px-3 font-mono text-xs text-muted hover:border-ink hover:bg-canvas transition-colors"
            title="Search services, assets, findings, and documentation (Press / or Alt+S)"
          >
            <div className="flex items-center gap-2 text-faint">
              <span>🔍</span>
              <span className="truncate">Search services, assets, scans, findings...</span>
            </div>
            <span className="hidden sm:inline border border-line bg-canvas px-1.5 text-[10px] text-faint">
              /
            </span>
          </button>
        </div>

        {/* Right Section: CloudShell + Region + Notifications + Account + Theme */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* CloudShell Button */}
          <button
            onClick={onToggleCloudShell}
            className={`flex items-center gap-1 border px-2 py-1 font-mono text-xs transition-colors ${
              isCloudShellOpen
                ? "border-ink bg-ink text-canvas font-bold"
                : "border-line bg-canvas text-muted hover:border-ink hover:text-ink"
            }`}
            title="Open Harizeon CloudShell Terminal (Interactive CLI)"
          >
            <span className="text-[11px]">&gt;_</span>
            <span className="hidden md:inline">CloudShell</span>
          </button>

          {/* Region Selector (AWS style) */}
          <div className="relative">
            <button
              onClick={() => {
                setIsRegionOpen(!isRegionOpen);
                setIsAccountOpen(false);
                setIsNotificationsOpen(false);
              }}
              className="flex items-center gap-1 border border-line bg-canvas px-2 py-1 font-mono text-xs text-muted hover:border-ink hover:text-ink"
              title="Scanner Cluster Region"
            >
              <span className="hidden lg:inline">{currentRegion}</span>
              <span className="lg:hidden">{currentRegion.split("-")[0]}</span>
              <span className="text-[9px]">▾</span>
            </button>

            {isRegionOpen && (
              <div className="absolute right-0 top-full mt-1 w-72 border border-line bg-canvas p-2 font-mono shadow-xl z-50">
                <div className="border-b border-line pb-1.5 px-2 text-[10px] uppercase tracking-wider text-faint">
                  Scanner Cluster Regions
                </div>
                <div className="mt-1 flex flex-col gap-0.5">
                  {CLUSTER_REGIONS.map((r) => {
                    const active = r.id === currentRegion;
                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          onSelectRegion?.(r.id);
                          setIsRegionOpen(false);
                        }}
                        className={`flex items-center justify-between px-2 py-1.5 text-left text-xs transition-colors ${
                          active
                            ? "bg-subtle font-bold text-ink"
                            : "text-muted hover:bg-subtle/50 hover:text-ink"
                        }`}
                      >
                        <div>
                          <div>{r.label}</div>
                        </div>
                        {active && <span className="text-[10px] text-ink font-bold">●</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsAccountOpen(false);
                setIsRegionOpen(false);
              }}
              className="relative flex h-8 w-8 items-center justify-center border border-line bg-canvas text-muted hover:border-ink hover:text-ink"
              title="Notifications & Security Alerts"
            >
              <span>🔔</span>
              {alerts && alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center border border-ink bg-ink text-[9px] font-bold text-canvas font-mono">
                  {alerts.length}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-1 w-80 border border-line bg-canvas p-3 font-mono shadow-xl z-50">
                <div className="flex items-center justify-between border-b border-line pb-2 text-xs">
                  <span className="font-bold text-ink uppercase tracking-wider">
                    Open findings{alerts ? ` (${alerts.length})` : ""}
                  </span>
                  <Link
                    href="/settings/notifications"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-[10px] text-muted hover:text-ink underline"
                  >
                    Manage channels
                  </Link>
                </div>

                <div className="mt-2 divide-y divide-line text-xs">
                  {alerts === null ? (
                    <div className="py-3 text-[11px] text-muted">Loading…</div>
                  ) : alerts.length === 0 ? (
                    <div className="py-3 text-[11px] text-muted">No open findings.</div>
                  ) : (
                    alerts.map((a) => (
                      <div key={a.id} className="py-2">
                        <div className="flex items-center justify-between">
                          <span className="border border-ink bg-ink px-1 text-[9px] font-bold text-canvas uppercase">
                            {a.severity}
                          </span>
                          <span className="text-[10px] text-faint">
                            {a.last_seen_at ? new Date(a.last_seen_at).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <p className="mt-1 font-sans text-xs text-ink font-medium">{a.title}</p>
                        <p className="text-[11px] text-muted">{a.asset_value ?? ""}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-line text-center">
                  <Link
                    href="/findings"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-[11px] text-muted hover:text-ink underline"
                  >
                    View all security findings →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Account / IAM Menu (AWS style) */}
          <div className="relative">
            <button
              onClick={() => {
                setIsAccountOpen(!isAccountOpen);
                setIsRegionOpen(false);
                setIsNotificationsOpen(false);
              }}
              className="flex items-center gap-1.5 border border-line bg-canvas px-2.5 py-1 font-mono text-xs text-muted hover:border-ink hover:text-ink"
              title="Account & IAM Identity"
            >
              <span className="hidden md:inline truncate max-w-[130px]">
                hariziskandar0504
              </span>
              <span className="md:hidden">IAM</span>
              <span className="text-[9px]">▾</span>
            </button>

            {isAccountOpen && (
              <div className="absolute right-0 top-full mt-1 w-80 border border-line bg-canvas p-4 font-mono shadow-2xl z-50">
                <div className="border-b border-line pb-3">
                  <div className="text-[10px] uppercase tracking-wider text-faint">
                    Authenticated Identity
                  </div>
                  <div className="mt-1 font-bold text-ink text-xs truncate">
                    hariziskandar0504@gmail.com
                  </div>

                  {/* AWS Account ID copy box */}
                  <div className="mt-2 flex items-center justify-between border border-line bg-subtle p-2 text-xs">
                    <div>
                      <div className="text-[10px] text-faint">Account ID:</div>
                      <div className="font-bold text-ink">9073-7530-3530</div>
                    </div>
                    <button
                      onClick={copyAccountId}
                      className="border border-line bg-canvas px-2 py-0.5 text-[10px] hover:border-ink"
                    >
                      {copiedAccountId ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                    <span>Role: <strong className="text-ink">SecurityAdmin</strong></span>
                    <span>Org: <strong className="text-ink">Harizeon SecOps</strong></span>
                  </div>
                </div>

                {/* Account Navigation Links */}
                <div className="mt-3 flex flex-col gap-1 text-xs">
                  <Link
                    href="/settings/organization"
                    onClick={() => setIsAccountOpen(false)}
                    className="px-2 py-1 text-muted hover:bg-subtle hover:text-ink"
                  >
                    Organization Settings
                  </Link>
                  <Link
                    href="/settings/api-keys"
                    onClick={() => setIsAccountOpen(false)}
                    className="px-2 py-1 text-muted hover:bg-subtle hover:text-ink"
                  >
                    Security Credentials (API Keys)
                  </Link>
                  <Link
                    href="/settings/billing"
                    onClick={() => setIsAccountOpen(false)}
                    className="px-2 py-1 text-muted hover:bg-subtle hover:text-ink"
                  >
                    Billing &amp; Service Quotas
                  </Link>
                  <Link
                    href="/settings/audit-log"
                    onClick={() => setIsAccountOpen(false)}
                    className="px-2 py-1 text-muted hover:bg-subtle hover:text-ink"
                  >
                    CloudTrail &amp; Audit Logs
                  </Link>
                </div>

                {/* Sign Out Action */}
                <div className="mt-3 pt-3 border-t border-line">
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="w-full border border-line bg-canvas py-1.5 text-center font-mono text-xs uppercase tracking-wider text-muted hover:border-ink hover:bg-subtle hover:text-ink transition-colors"
                    >
                      Sign Out
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </header>

      {/* Services Mega Menu Modal */}
      <ServicesMegaMenu
        isOpen={isServicesOpen}
        onClose={() => setIsServicesOpen(false)}
      />

      {/* AWS Search Palette Modal */}
      <AwsSearchPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
