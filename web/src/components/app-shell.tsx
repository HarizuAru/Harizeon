"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { CloudShellDrawer } from "@/components/cloudshell-drawer";

export function AppShell({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCloudShellOpen, setIsCloudShellOpen] = useState(false);
  const [activeRegion, setActiveRegion] = useState("ap-southeast-1");

  const pathname = usePathname();

  // Compute AWS-style breadcrumb trail
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbName =
    segments.length === 0
      ? "Home"
      : segments[0] === "dashboard"
      ? "Dashboard"
      : segments[0].charAt(0).toUpperCase() + segments[0].slice(1);

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      {/* Top AWS Console Global Header */}
      <TopBar
        isCloudShellOpen={isCloudShellOpen}
        onToggleCloudShell={() => setIsCloudShellOpen(!isCloudShellOpen)}
        activeRegion={activeRegion}
        onSelectRegion={setActiveRegion}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* AWS Console Sub-Header / Breadcrumb & Status Bar */}
      <div className="flex h-9 items-center justify-between border-b border-line bg-subtle/50 px-4 font-mono text-[11px] select-none">
        <div className="flex items-center gap-2 text-muted">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="border border-line bg-canvas px-1.5 py-0.5 text-muted hover:border-ink hover:text-ink transition-colors"
            title="Toggle left service sidebar"
          >
            {isSidebarCollapsed ? "☰ Expand" : "☷ Collapse"}
          </button>
          <span className="text-faint">|</span>
          <Link href="/dashboard" className="text-muted hover:text-ink">
            Harizeon Console
          </Link>
          <span className="text-faint">&gt;</span>
          <span className="font-semibold text-ink">{breadcrumbName}</span>
          {segments.length > 1 && (
            <>
              <span className="text-faint">&gt;</span>
              <span className="text-muted truncate max-w-[150px]">{segments[1]}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Scanner Fleet Status Indicator */}
          <Link
            href="/status"
            className="hidden sm:flex items-center gap-1.5 border border-line bg-canvas px-2 py-0.5 text-muted hover:border-ink hover:text-ink transition-colors"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-ink" />
            <span>All Systems Operational</span>
          </Link>

          {/* Region Indicator Pill */}
          <span className="border border-line bg-canvas px-2 py-0.5 text-faint">
            Cluster: <strong className="text-ink">{activeRegion}</strong>
          </span>

          {/* Quick Terminal Trigger */}
          <button
            onClick={() => setIsCloudShellOpen(!isCloudShellOpen)}
            className="border border-line bg-canvas px-2 py-0.5 text-muted hover:border-ink hover:text-ink font-bold"
            title="Toggle CloudShell Terminal Drawer"
          >
            &gt;_
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 min-w-0">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-x-auto">{children}</main>
      </div>

      {/* Interactive AWS CloudShell Bottom Drawer */}
      <CloudShellDrawer
        isOpen={isCloudShellOpen}
        onClose={() => setIsCloudShellOpen(false)}
        activeRegion={activeRegion}
      />
    </div>
  );
}
