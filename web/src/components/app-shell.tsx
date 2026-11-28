"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { CloudShellDrawer } from "@/components/cloudshell-drawer";
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal";

export function AppShell({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCloudShellOpen, setIsCloudShellOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [activeRegion, setActiveRegion] = useState("ap-southeast-1");
  const [chordPending, setChordPending] = useState<string | null>(null);

  const pathname = usePathname();
  const router = useRouter();

  // Compute breadcrumb trail
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbName =
    segments.length === 0
      ? "Home"
      : segments[0] === "dashboard"
        ? "Dashboard"
        : segments[0].charAt(0).toUpperCase() + segments[0].slice(1);

  // Global keyboard shortcuts (Vim / GitHub style chords)
  useEffect(() => {
    let chordTimer: NodeJS.Timeout | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isContentEditable = (e.target as HTMLElement)?.isContentEditable;
      if (tag === "input" || tag === "textarea" || tag === "select" || isContentEditable) {
        return;
      }

      // '?' opens keyboard shortcuts modal
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // '`' or '~' toggles CloudShell
      if (e.key === "`" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsCloudShellOpen((prev) => !prev);
        return;
      }

      // 'Esc' closes active modals
      if (e.key === "Escape") {
        if (isShortcutsOpen) setIsShortcutsOpen(false);
        if (isCloudShellOpen) setIsCloudShellOpen(false);
        setChordPending(null);
        return;
      }

      // Two-key chords starting with 'g' (e.g., 'g' then 'f' for findings)
      if (chordPending === "g") {
        setChordPending(null);
        if (chordTimer) clearTimeout(chordTimer);

        switch (e.key.toLowerCase()) {
          case "d":
            e.preventDefault();
            router.push("/dashboard");
            break;
          case "f":
            e.preventDefault();
            router.push("/findings");
            break;
          case "a":
            e.preventDefault();
            router.push("/assets");
            break;
          case "s":
            e.preventDefault();
            router.push("/scans");
            break;
          case "r":
            e.preventDefault();
            router.push("/reports");
            break;
          case "c":
            e.preventDefault();
            router.push("/schedules");
            break;
          case "l":
            e.preventDefault();
            router.push("/settings/audit-log");
            break;
          case "k":
            e.preventDefault();
            router.push("/settings/api-keys");
            break;
          case "n":
            e.preventDefault();
            router.push("/settings/notifications");
            break;
          default:
            break;
        }
        return;
      }

      if (e.key === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setChordPending("g");
        chordTimer = setTimeout(() => {
          setChordPending(null);
        }, 1800);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (chordTimer) clearTimeout(chordTimer);
    };
  }, [chordPending, isShortcutsOpen, isCloudShellOpen, router]);

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      {/* Accessible Skip Link (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:border-2 focus:border-ink focus:bg-canvas focus:px-3 focus:py-1.5 font-mono text-xs text-ink focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Top Global Header */}
      <div className="print:hidden">
        <TopBar
          isCloudShellOpen={isCloudShellOpen}
          onToggleCloudShell={() => setIsCloudShellOpen(!isCloudShellOpen)}
          activeRegion={activeRegion}
          onSelectRegion={setActiveRegion}
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />
      </div>

      {/* Console Sub-Header / Breadcrumb & Status Bar */}
      <div className="flex h-9 items-center justify-between gap-2 overflow-hidden border-b border-line bg-subtle/50 px-3 sm:px-4 font-mono text-[11px] select-none print:hidden">
        <div className="flex items-center gap-2 text-muted min-w-0">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:inline-flex border border-line bg-canvas px-1.5 py-0.5 text-muted hover:border-ink hover:text-ink transition-colors cursor-pointer shrink-0"
            title="Toggle left service sidebar"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? "☰ Expand" : "☷ Collapse"}
          </button>
          <span className="hidden lg:inline text-faint" aria-hidden="true">|</span>
          <Link href="/dashboard" className="text-muted hover:text-ink truncate">
            Harizeon Console
          </Link>
          <span className="text-faint shrink-0" aria-hidden="true">&gt;</span>
          <span className="font-semibold text-ink truncate">{breadcrumbName}</span>
          {segments.length > 1 && (
            <>
              <span className="hidden sm:inline text-faint" aria-hidden="true">&gt;</span>
              <span className="hidden sm:inline text-muted truncate max-w-[150px]">{segments[1]}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Scanner Fleet Status Indicator */}
          <Link
            href="/status"
            className="hidden sm:flex items-center gap-1.5 border border-line bg-canvas px-2 py-0.5 text-muted hover:border-ink hover:text-ink transition-colors"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
            <span>All Systems Operational</span>
          </Link>

          {/* Region Indicator Pill */}
          <span className="hidden md:inline-flex border border-line bg-canvas px-2 py-0.5 text-faint">
            Cluster: <strong className="text-ink ml-1">{activeRegion}</strong>
          </span>

          {/* Keyboard Shortcuts Help Trigger */}
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="hidden sm:inline-flex items-center gap-1 border border-line bg-canvas px-2 py-0.5 text-muted hover:border-ink hover:text-ink cursor-pointer"
            title="View keyboard shortcuts (?)"
            aria-label="View keyboard shortcuts"
          >
            <span>?</span>
            <span className="text-[10px] text-faint">Shortcuts</span>
          </button>

          {/* Quick Terminal Trigger */}
          <button
            onClick={() => setIsCloudShellOpen(!isCloudShellOpen)}
            className="border border-line bg-canvas px-2 py-0.5 text-muted hover:border-ink hover:text-ink font-bold cursor-pointer"
            title="Toggle CloudShell Terminal Drawer (`)"
            aria-label="Toggle CloudShell Terminal"
          >
            &gt;_
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 min-w-0 print:block print:w-full print:m-0 print:p-0">
        <div className="print:hidden">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
        </div>
        <main id="main-content" tabIndex={-1} className="flex-1 min-w-0 p-4 sm:p-6 overflow-x-auto focus:outline-none print:p-0 print:m-0 print:w-full print:max-w-none print:overflow-visible">
          {children}
        </main>
      </div>

      {/* Interactive CloudShell Bottom Drawer */}
      <div className="print:hidden">
        <CloudShellDrawer
          isOpen={isCloudShellOpen}
          onClose={() => setIsCloudShellOpen(false)}
          activeRegion={activeRegion}
        />

        {/* Keyboard Shortcuts Reference Modal */}
        <KeyboardShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />
      </div>

      {/* Chord Pending Toast Indicator */}
      {chordPending && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 border-2 border-ink bg-canvas px-3 py-1.5 font-mono text-xs text-ink shadow-none print:hidden">
          <span className="font-bold">[G] GO TO:</span>
          <span className="text-muted">
            [d] Dashboard · [f] Findings · [a] Assets · [s] Scans · [r] Reports · [c] Schedules
          </span>
        </div>
      )}
    </div>
  );
}
