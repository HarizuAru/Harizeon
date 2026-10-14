"use client";

import { useMemo } from "react";
import { cx } from "@/lib/cx";
import Link from "next/link";

export type OutcomeScan = {
  id: string;
  status: string;
  profile: string;
  phase: string | null;
  progress_pct: number;
  created_at: string;
  error_code?: string | null;
};

export function ScansOutcomeSummaryCard({ scans }: { scans: OutcomeScan[] }) {
  const stats = useMemo(() => {
    const total = scans.length;
    if (total === 0) {
      return {
        total: 0,
        completedClean: 0,
        completedCleanPct: "0.0",
        failedOrTimeout: 0,
        failedOrTimeoutPct: "0.0",
        inFlightOrCancelled: 0,
        inFlightOrCancelledPct: "0.0",
        terminalTotal: 0,
        statusVerdict: "NO DATA",
        verdictClass: "border-line text-muted bg-canvas",
      };
    }

    // Scans that completed successfully without errors
    const completedClean = scans.filter(
      (s) => s.status === "completed" && !s.error_code,
    ).length;

    // Scans that failed or timed out
    const failedOrTimeout = scans.filter(
      (s) => s.status === "failed" || s.status === "timeout",
    ).length;

    // In-flight (running, queued) or cancelled
    const inFlightOrCancelled = total - completedClean - failedOrTimeout;

    const completedCleanPct = ((completedClean / total) * 100).toFixed(1);
    const failedOrTimeoutPct = ((failedOrTimeout / total) * 100).toFixed(1);
    const inFlightOrCancelledPct = ((inFlightOrCancelled / total) * 100).toFixed(1);

    const numericSuccessPct = Number(completedCleanPct);

    let statusVerdict = "HEALTHY (≥90% SUCCESS)";
    let verdictClass =
      "text-emerald-700 bg-emerald-50 border-emerald-300 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800 status-badge-completed";

    if (numericSuccessPct < 75) {
      statusVerdict = "CRITICAL (<75% SUCCESS)";
      verdictClass =
        "text-rose-700 bg-rose-50 border-rose-300 dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-800 status-badge-failed";
    } else if (numericSuccessPct < 90) {
      statusVerdict = "DEGRADED (<90% SUCCESS)";
      verdictClass =
        "text-amber-700 bg-amber-50 border-amber-300 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800 status-badge-timeout";
    }

    return {
      total,
      completedClean,
      completedCleanPct,
      failedOrTimeout,
      failedOrTimeoutPct,
      inFlightOrCancelled,
      inFlightOrCancelledPct,
      statusVerdict,
      verdictClass,
    };
  }, [scans]);

  if (stats.total === 0) return null;

  return (
    <div className="border border-line bg-canvas font-mono text-xs text-ink">
      {/* Header Bar */}
      <div className="flex flex-col gap-2.5 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between bg-subtle/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="border border-ink bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase text-canvas">
              Reliability KPI
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
              Scan Outcome Distribution & Success Ratio
            </h2>
          </div>
          <p className="mt-0.5 text-[11px] text-muted">
            Comparison of scans completed cleanly without errors vs. pipeline failures and worker timeouts.
          </p>
        </div>

        {/* Verdict Badge */}
        <div className="flex items-center gap-2">
          <span
            className={cx(
              "inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide",
              stats.verdictClass,
            )}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current shrink-0" aria-hidden="true" />
            {stats.statusVerdict}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 divide-x divide-y divide-line border-b border-line sm:grid-cols-4 sm:divide-y-0">
        {/* Completed Cleanly */}
        <div className="p-4 bg-emerald-500/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
              Completed (Clean)
            </span>
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--status-completed-dot, #16a34a)" }}
              aria-hidden="true"
            />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">{stats.completedCleanPct}%</span>
            <span className="text-xs text-muted">({stats.completedClean} scans)</span>
          </div>
          <p className="mt-1 text-[10px] text-muted">
            Finished full scan pipeline with zero fatal execution errors.
          </p>
        </div>

        {/* Failed or Timed Out */}
        <div className="p-4 bg-rose-500/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400">
              Failed / Timed Out
            </span>
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--status-failed-dot, #dc2626)" }}
              aria-hidden="true"
            />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">{stats.failedOrTimeoutPct}%</span>
            <span className="text-xs text-muted">({stats.failedOrTimeout} scans)</span>
          </div>
          <p className="mt-1 text-[10px] text-muted">
            Terminated by TCP drop, worker heartbeat timeout, or NXDOMAIN.
          </p>
        </div>

        {/* In-Flight or Cancelled */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-muted">
              In-Flight / Cancelled
            </span>
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--status-cancelled-dot, #71717a)" }}
              aria-hidden="true"
            />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">{stats.inFlightOrCancelledPct}%</span>
            <span className="text-xs text-muted">({stats.inFlightOrCancelled} scans)</span>
          </div>
          <p className="mt-1 text-[10px] text-muted">
            Currently active pipeline runs or manually aborted jobs.
          </p>
        </div>

        {/* Total Analyzed */}
        <div className="p-4">
          <span className="block text-[10px] font-bold uppercase text-muted">
            Total Scans Analyzed
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">{stats.total}</span>
            <span className="text-xs text-muted">jobs recorded</span>
          </div>
          <p className="mt-1 text-[10px] text-muted">
            Historical audit sample window across all active profiles.
          </p>
        </div>
      </div>

      {/* Proportional Segmented Progress Bar */}
      <div className="p-4 bg-canvas">
        <div className="flex items-center justify-between mb-2 text-[11px]">
          <span className="font-bold text-ink">Outcome Breakdown Ratio</span>
          <span className="text-muted">
            {stats.completedCleanPct}% Successful vs {stats.failedOrTimeoutPct}% Failed
          </span>
        </div>

        {/* Bar */}
        <div
          role="progressbar"
          aria-label="Scan outcome ratio"
          aria-valuenow={Number(stats.completedCleanPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-3 w-full border border-line bg-subtle flex overflow-hidden"
        >
          {/* Completed Segment (Green) */}
          <div
            style={{ width: `${stats.completedCleanPct}%` }}
            className="h-full bg-emerald-600 transition-all duration-300"
            title={`Completed without errors: ${stats.completedCleanPct}% (${stats.completedClean})`}
          />

          {/* Failed / Timeout Segment (Red) */}
          <div
            style={{ width: `${stats.failedOrTimeoutPct}%` }}
            className="h-full bg-rose-600 transition-all duration-300"
            title={`Failed or timed out: ${stats.failedOrTimeoutPct}% (${stats.failedOrTimeout})`}
          />

          {/* Other / In-Flight Segment (Muted) */}
          <div
            style={{ width: `${stats.inFlightOrCancelledPct}%` }}
            className="h-full bg-neutral-400 dark:bg-neutral-600 transition-all duration-300"
            title={`In-flight or cancelled: ${stats.inFlightOrCancelledPct}% (${stats.inFlightOrCancelled})`}
          />
        </div>

        {/* Legend Strip */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] pt-1">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" aria-hidden="true" />
              <span className="font-bold text-ink">Completed Cleanly:</span>
              <span className="text-muted">
                {stats.completedClean} ({stats.completedCleanPct}%)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-600 shrink-0" aria-hidden="true" />
              <span className="font-bold text-ink">Failed / Timed Out:</span>
              <span className="text-muted">
                {stats.failedOrTimeout} ({stats.failedOrTimeoutPct}%)
              </span>
            </div>

            {stats.inFlightOrCancelled > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-neutral-400 dark:bg-neutral-600 shrink-0" aria-hidden="true" />
                <span className="font-bold text-ink">In-Flight / Cancelled:</span>
                <span className="text-muted">
                  {stats.inFlightOrCancelled} ({stats.inFlightOrCancelledPct}%)
                </span>
              </div>
            )}
          </div>

          {stats.failedOrTimeout > 0 && (
            <Link
              href="/dashboard#system-health"
              className="text-[11px] font-bold text-ink underline hover:no-underline"
            >
              Analyze Worker & Queue Diagnostics →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
