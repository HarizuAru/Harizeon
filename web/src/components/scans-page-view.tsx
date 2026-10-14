"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClass } from "@/components/ui/button";
import { ScansOutcomeSummaryCard } from "@/components/scans-outcome-summary-card";
import { ScansTrendChart } from "@/components/scans-trend-chart";
import { ScansDurationHistogram } from "@/components/scans-duration-histogram";
import { ScansAverageDurationTrendChart } from "@/components/scans-average-duration-trend-chart";
import { DownloadScansCsvButton } from "@/components/download-scans-csv-button";
import { ScansListTable, type Scan } from "@/components/scans-list-table";
import { useScansPolling } from "@/hooks/use-scans-polling";
import { cx } from "@/lib/cx";

export function ScansPageView({
  initialScans,
  initialDuration = "all",
}: {
  initialScans: Scan[];
  initialDuration?: string;
}) {
  const {
    scans,
    activeScans,
    hasActiveScans,
    isPolling,
    isRefreshing,
    secondsSincePoll,
    pollingEnabled,
    setPollingEnabled,
    refreshNow,
    error,
  } = useScansPolling({
    initialScans,
    activeIntervalMs: 3000, // 3s active polling for running/queued scans
    idleIntervalMs: 30000, // 30s background check when all scans terminal
    autoStart: true,
  });

  const failedCount = scans.filter(
    (s) => s.status === "failed" || s.status === "timeout",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Scans"
        description="Scan history and live progress."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DownloadScansCsvButton scans={scans} />
            <Link
              href="/dashboard#system-health"
              className={buttonClass("secondary", "md")}
            >
              System Health
            </Link>
            <Link href="/scans/new" className={buttonClass("primary", "md")}>
              New scan
            </Link>
          </div>
        }
      />

      {/* Auto-Refresh & Live Polling Status Strip */}
      <div
        className={cx(
          "border p-3 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors",
          hasActiveScans
            ? "border-blue-500/60 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/30 text-ink"
            : "border-line bg-canvas text-muted",
        )}
      >
        <div className="flex items-center gap-2.5">
          {hasActiveScans && isPolling ? (
            <span className="flex items-center gap-1.5 border border-blue-600 bg-blue-600 text-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              <span>LIVE POLLING (3s)</span>
            </span>
          ) : hasActiveScans ? (
            <span className="border border-line bg-subtle text-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-bold">
              [POLLING PAUSED]
            </span>
          ) : (
            <span className="border border-line bg-subtle text-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
              [IDLE STANDBY]
            </span>
          )}

          <div className="flex items-center gap-2 text-xs">
            {hasActiveScans ? (
              <span className="text-ink font-bold">
                {activeScans.length} {activeScans.length === 1 ? "scan" : "scans"} currently in progress (
                {activeScans.map((s) => `${s.id.slice(0, 8)}… [${s.status.toUpperCase()}]`).join(", ")}
                ). Auto-refreshing every 3s.
              </span>
            ) : (
              <span>
                All scans are in terminal state. Auto-polling stands by until a new scan is launched.
              </span>
            )}
          </div>
        </div>

        {/* Polling Actions & Timing Info */}
        <div className="flex items-center gap-3 text-[11px] self-end sm:self-auto">
          <span className="text-faint">
            {isRefreshing ? "Refreshing..." : `Polled ${secondsSincePoll}s ago`}
          </span>

          <button
            type="button"
            onClick={() => void refreshNow()}
            disabled={isRefreshing}
            className="border border-line bg-canvas px-2.5 py-1 text-ink font-bold hover:bg-subtle uppercase transition-colors disabled:opacity-50"
            title="Fetch latest scan records from API"
          >
            {isRefreshing ? "Syncing..." : "Sync now"}
          </button>

          <button
            type="button"
            onClick={() => setPollingEnabled((prev) => !prev)}
            className="text-xs text-muted hover:text-ink underline uppercase"
          >
            {pollingEnabled ? "Pause auto-refresh" : "Resume auto-refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 p-3 font-mono text-xs text-rose-800 dark:text-rose-400">
          <span>[!] Polling warning: {error}</span>
        </div>
      )}

      {/* Outcome Success vs Failure Summary Card */}
      <ScansOutcomeSummaryCard scans={scans} />

      {/* D3 30-Day Historical Trend Chart */}
      <ScansTrendChart scans={scans} />

      {/* Recharts Scan Duration Histogram */}
      <ScansDurationHistogram scans={scans} />

      {/* Recharts 30-Day Average Scan Duration & Profile Degradation Trend */}
      <ScansAverageDurationTrendChart scans={scans} />

      {failedCount > 0 && (
        <div className="border border-line bg-subtle p-3.5 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="border border-ink bg-ink text-canvas px-1.5 py-0.5 text-[10px] font-bold uppercase">
              [!] Failure Alert
            </span>
            <span className="font-bold text-ink">
              {failedCount} {failedCount === 1 ? "scan" : "scans"} failed or timed out recently.
            </span>
            <span className="text-muted hidden md:inline">·</span>
            <span className="text-muted hidden md:inline">
              Click &apos;Retry&apos; on any failed scan in the table below, or inspect diagnostics in System Health.
            </span>
          </div>
          <Link
            href="/dashboard#system-health"
            className="text-ink underline font-bold hover:no-underline whitespace-nowrap"
          >
            Diagnose Scan Failures →
          </Link>
        </div>
      )}

      {/* Scans List Table with Checkbox Selector & Column Sorting */}
      <ScansListTable scans={scans} initialDuration={initialDuration} />
    </div>
  );
}
