"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { RetryScanButton } from "@/components/retry-scan-button";
import { ScanComparisonModal } from "@/components/scan-comparison-modal";
import { cx } from "@/lib/cx";

export type Scan = {
  id: string;
  status: string;
  profile: string;
  phase: string | null;
  progress_pct: number;
  created_at: string;
  finished_at?: string | null;
  completed_at?: string | null;
  ended_at?: string | null;
  updated_at?: string | null;
  error_code?: string | null;
  targets?: { asset_id?: string; type?: string; value?: string }[];
};

export type DurationFilterKey = "all" | "fast" | "medium" | "slow";

export function getScanDurationSeconds(scan: Scan): number | null {
  const isFinished = ["completed", "failed", "timeout", "cancelled"].includes(scan.status);
  if (!isFinished) return null;

  const completionTimestamp =
    scan.finished_at ?? scan.completed_at ?? scan.ended_at ?? scan.updated_at;
  if (!completionTimestamp || !scan.created_at) return null;

  const start = new Date(scan.created_at).getTime();
  const end = new Date(completionTimestamp).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return null;

  return Math.floor((end - start) / 1000);
}

export function formatDuration(scan: Scan): string {
  const isFinished = ["completed", "failed", "timeout", "cancelled"].includes(scan.status);
  if (!isFinished) return "—";

  const completionTimestamp =
    scan.finished_at ?? scan.completed_at ?? scan.ended_at ?? scan.updated_at;
  if (!completionTimestamp || !scan.created_at) return "—";

  const start = new Date(scan.created_at).getTime();
  const end = new Date(completionTimestamp).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return "—";

  const totalSec = Math.floor((end - start) / 1000);
  if (totalSec < 60) {
    return `${totalSec}s`;
  }
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins < 60) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
}

export function DurationCellTooltip({ scan }: { scan: Scan }) {
  const durationStr = formatDuration(scan);
  const sec = getScanDurationSeconds(scan);

  const startedIso = scan.created_at;
  const startedFormatted = startedIso
    ? new Date(startedIso).toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  const finishIso =
    scan.finished_at ?? scan.completed_at ?? scan.ended_at ?? scan.updated_at;
  const isFinished = ["completed", "failed", "timeout", "cancelled"].includes(scan.status);

  const finishedFormatted =
    isFinished && finishIso
      ? new Date(finishIso).toLocaleString(undefined, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : isFinished
        ? "Finished (Timestamp unrecorded)"
        : "In progress (Active execution)";

  const titleText = `Started: ${startedFormatted} (${startedIso})\nFinished: ${finishedFormatted}${
    finishIso && isFinished ? ` (${finishIso})` : ""
  }\nDuration: ${durationStr}`;

  return (
    <div
      className="group relative inline-flex items-center justify-end cursor-help"
      title={titleText}
      tabIndex={0}
      aria-label={`Duration: ${durationStr}. Started: ${startedFormatted}, Finished: ${finishedFormatted}`}
    >
      <span className="border-b border-dotted border-line/90 group-hover:border-ink transition-colors">
        {durationStr}
      </span>

      {/* Styled Micro Tooltip */}
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 mb-2 hidden w-max max-w-xs border border-ink bg-canvas p-2.5 text-left font-mono text-[11px] text-ink shadow-2xl z-50 group-hover:block group-focus:block"
      >
        <div className="border-b border-line pb-1 mb-1.5 flex items-center justify-between text-[10px] text-muted font-bold">
          <span>SCAN TIMESTAMPS</span>
          <span className="uppercase text-ink">{scan.status}</span>
        </div>
        <div className="flex flex-col gap-1.5 text-[11px]">
          <div>
            <span className="text-muted block text-[10px] uppercase font-bold">Start Time:</span>
            <span className="font-bold text-ink">{startedFormatted}</span>
            <span className="text-[10px] text-faint block">{startedIso}</span>
          </div>
          <div className="border-t border-line/60 pt-1">
            <span className="text-muted block text-[10px] uppercase font-bold">Finish Time:</span>
            <span className="font-bold text-ink">{finishedFormatted}</span>
            {finishIso && isFinished && (
              <span className="text-[10px] text-faint block">{finishIso}</span>
            )}
          </div>
          {sec !== null && (
            <div className="border-t border-line/60 pt-1 flex justify-between text-[10px]">
              <span className="text-muted">Total Duration:</span>
              <span className="font-bold text-ink">
                {sec}s ({durationStr})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  completed: "status-badge-completed text-emerald-700 bg-emerald-50 border-emerald-300 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800",
  failed: "status-badge-failed text-rose-700 bg-rose-50 border-rose-300 dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-800",
  cancelled: "status-badge-cancelled text-zinc-600 bg-zinc-100 border-zinc-300 dark:text-zinc-400 dark:bg-zinc-800/40 dark:border-zinc-700",
  timeout: "status-badge-timeout text-amber-700 bg-amber-50 border-amber-300 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800",
  running: "status-badge-running text-blue-700 bg-blue-50 border-blue-300 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-800 animate-pulse",
  queued: "status-badge-queued text-neutral-600 bg-neutral-100 border-neutral-300 dark:text-neutral-400 dark:bg-neutral-800/40 dark:border-neutral-700",
};

export function renderScanStatusBadge(status: string) {
  const key = status.toLowerCase().trim();
  const badgeClass = STATUS_BADGE_CLASSES[key] || "border-line bg-canvas text-muted";

  return (
    <StatusBadge status={status} className={badgeClass}>
      {status}
    </StatusBadge>
  );
}

export type SortKey = "created_at" | "duration" | "status" | "profile" | "progress_pct" | "id";
export type SortDirection = "asc" | "desc";

export const SORT_LABELS: Record<SortKey, string> = {
  created_at: "Started Date",
  duration: "Duration",
  status: "Status",
  profile: "Profile",
  progress_pct: "Progress",
  id: "Scan ID",
};

function SortHeader({
  title,
  columnKey,
  currentKey,
  direction,
  onSort,
  align = "left",
}: {
  title: string;
  columnKey: SortKey;
  currentKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const isCurrent = currentKey === columnKey;
  return (
    <button
      type="button"
      onClick={() => onSort(columnKey)}
      className={cx(
        "group inline-flex items-center gap-1.5 uppercase font-medium text-xs tracking-[0.08em] transition-colors cursor-pointer text-inherit",
        align === "right" ? "justify-end ml-auto" : "justify-start",
        isCurrent ? "text-ink font-bold" : "text-muted hover:text-ink",
      )}
      aria-label={`Sort by ${title} ${isCurrent ? (direction === "asc" ? "(currently ascending)" : "(currently descending)") : ""}`}
      title={`Sort by ${title} (${isCurrent ? (direction === "asc" ? "Click for descending" : "Click for ascending") : "Click to sort"})`}
    >
      <span>{title}</span>
      <span
        className={cx(
          "font-mono text-[10px] select-none",
          isCurrent
            ? "text-ink font-bold"
            : "text-muted/40 group-hover:text-ink",
        )}
      >
        {isCurrent ? (direction === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );
}

const FILTER_CONFIG: {
  key: DurationFilterKey;
  label: string;
  badge: string;
  description: string;
}[] = [
  {
    key: "all",
    label: "All Durations",
    badge: "all",
    description: "Showing all scans regardless of execution duration.",
  },
  {
    key: "fast",
    label: "Fast (< 1m)",
    badge: "< 1m",
    description: "Showing quick scans completed in under 60 seconds (rapid port probes & DNS checks).",
  },
  {
    key: "medium",
    label: "Medium (1-5m)",
    badge: "1-5m",
    description: "Showing scans completed between 1 and 5 minutes (standard TLS & service audits).",
  },
  {
    key: "slow",
    label: "Slow (> 5m)",
    badge: "> 5m",
    description: "Showing long-running scans completed in over 5 minutes (deep web spidering & extensive sweeps).",
  },
];

export function ScansListTable({
  scans,
  initialDuration = "all",
}: {
  scans: Scan[];
  initialDuration?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Selection state for side-by-side comparison
  const [selectedScanIds, setSelectedScanIds] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  // Column sorting state
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Validate initial filter from URL
  const validInitial: DurationFilterKey =
    initialDuration === "fast" || initialDuration === "medium" || initialDuration === "slow"
      ? (initialDuration as DurationFilterKey)
      : "all";

  const [activeFilter, setActiveFilter] = useState<DurationFilterKey>(validInitial);

  // Pre-calculate counts for each filter option
  const counts = useMemo(() => {
    let fast = 0;
    let medium = 0;
    let slow = 0;

    for (const s of scans) {
      const sec = getScanDurationSeconds(s);
      if (sec === null) continue;
      if (sec < 60) fast++;
      else if (sec <= 300) medium++;
      else slow++;
    }

    return {
      all: scans.length,
      fast,
      medium,
      slow,
    };
  }, [scans]);

  // Filter scans by active duration category
  const filteredScans = useMemo(() => {
    if (activeFilter === "all") return scans;

    return scans.filter((s) => {
      const sec = getScanDurationSeconds(s);
      if (sec === null) return false;

      if (activeFilter === "fast") return sec < 60;
      if (activeFilter === "medium") return sec >= 60 && sec <= 300;
      if (activeFilter === "slow") return sec > 300;
      return true;
    });
  }, [scans, activeFilter]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDirection((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
        return prevKey;
      }
      setSortDirection(
        key === "created_at" || key === "duration" || key === "progress_pct" ? "desc" : "asc",
      );
      return key;
    });
  }, []);

  // Sort scans according to active sortKey and sortDirection
  const sortedScans = useMemo(() => {
    const list = [...filteredScans];
    list.sort((a, b) => {
      if (sortKey === "duration") {
        const durA = getScanDurationSeconds(a);
        const durB = getScanDurationSeconds(b);
        if (durA === null && durB === null) return 0;
        if (durA === null) return sortDirection === "asc" ? 1 : -1;
        if (durB === null) return sortDirection === "asc" ? -1 : 1;
        return sortDirection === "asc" ? durA - durB : durB - durA;
      }
      if (sortKey === "created_at") {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
      }
      if (sortKey === "status") {
        const res = a.status.localeCompare(b.status);
        return sortDirection === "asc" ? res : -res;
      }
      if (sortKey === "profile") {
        const res = a.profile.localeCompare(b.profile);
        return sortDirection === "asc" ? res : -res;
      }
      if (sortKey === "progress_pct") {
        return sortDirection === "asc"
          ? a.progress_pct - b.progress_pct
          : b.progress_pct - a.progress_pct;
      }
      if (sortKey === "id") {
        const res = a.id.localeCompare(b.id);
        return sortDirection === "asc" ? res : -res;
      }
      return 0;
    });
    return list;
  }, [filteredScans, sortKey, sortDirection]);

  const handleFilterSelect = (key: DurationFilterKey) => {
    setActiveFilter(key);

    // Sync to URL searchParams without reloading
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (key === "all") {
      params.delete("duration");
    } else {
      params.set("duration", key);
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedScanIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        // Keep max 2 scans selected, rotating to the newest selection
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const selectedScans = useMemo(() => {
    return selectedScanIds
      .map((id) => scans.find((s) => s.id === id))
      .filter(Boolean) as Scan[];
  }, [selectedScanIds, scans]);

  const handleSwapSelected = () => {
    setSelectedScanIds((prev) => (prev.length === 2 ? [prev[1], prev[0]] : prev));
  };

  // Table columns with selection checkbox and sortable headers
  const tableColumns = useMemo<Column<Scan>[]>(
    () => [
      {
        key: "select",
        header: (
          <input
            type="checkbox"
            aria-label="Select first two scans for comparison"
            checked={selectedScanIds.length === 2}
            onChange={() => {
              if (selectedScanIds.length > 0) {
                setSelectedScanIds([]);
              } else {
                setSelectedScanIds(sortedScans.slice(0, 2).map((s) => s.id));
              }
            }}
            className="h-3.5 w-3.5 rounded-none border border-line text-ink focus:ring-0 cursor-pointer"
          />
        ),
        render: (r) => {
          const isChecked = selectedScanIds.includes(r.id);
          return (
            <input
              type="checkbox"
              aria-label={`Select scan ${r.id.slice(0, 8)} for comparison`}
              checked={isChecked}
              onChange={(e) => {
                e.stopPropagation();
                handleToggleSelect(r.id);
              }}
              className="h-3.5 w-3.5 rounded-none border border-line text-ink focus:ring-0 cursor-pointer"
            />
          );
        },
      },
      {
        key: "id",
        header: (
          <SortHeader
            title="Scan"
            columnKey="id"
            currentKey={sortKey}
            direction={sortDirection}
            onSort={handleSort}
          />
        ),
        mono: true,
        render: (r) => (
          <Link href={`/scans/${r.id}`} className="underline">
            {r.id.slice(0, 8)}…
          </Link>
        ),
      },
      {
        key: "status",
        header: (
          <SortHeader
            title="Status"
            columnKey="status"
            currentKey={sortKey}
            direction={sortDirection}
            onSort={handleSort}
          />
        ),
        render: (r) => renderScanStatusBadge(r.status),
      },
      {
        key: "profile",
        header: (
          <SortHeader
            title="Profile"
            columnKey="profile"
            currentKey={sortKey}
            direction={sortDirection}
            onSort={handleSort}
          />
        ),
      },
      {
        key: "phase",
        header: "Phase",
        mono: true,
        render: (r) => r.phase ?? "—",
      },
      {
        key: "progress_pct",
        header: (
          <SortHeader
            title="Progress"
            columnKey="progress_pct"
            currentKey={sortKey}
            direction={sortDirection}
            onSort={handleSort}
            align="right"
          />
        ),
        align: "right",
        mono: true,
        render: (r) => `${r.progress_pct}%`,
      },
      {
        key: "duration",
        header: (
          <SortHeader
            title="Duration"
            columnKey="duration"
            currentKey={sortKey}
            direction={sortDirection}
            onSort={handleSort}
            align="right"
          />
        ),
        align: "right",
        mono: true,
        render: (r) => <DurationCellTooltip scan={r} />,
      },
      {
        key: "created_at",
        header: (
          <SortHeader
            title="Started"
            columnKey="created_at"
            currentKey={sortKey}
            direction={sortDirection}
            onSort={handleSort}
          />
        ),
        mono: true,
        render: (r) => new Date(r.created_at).toLocaleString(),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        render: (r) => (
          <RetryScanButton
            scanId={r.id}
            status={r.status}
            profile={r.profile}
            targets={r.targets}
          />
        ),
      },
    ],
    [selectedScanIds, sortedScans, sortKey, sortDirection, handleSort],
  );

  const currentConfig = FILTER_CONFIG.find((f) => f.key === activeFilter) ?? FILTER_CONFIG[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Compare Scans Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-line bg-canvas p-3 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            id="btn-compare-scans"
            onClick={() => {
              if (selectedScanIds.length === 2) {
                setIsComparing(true);
              }
            }}
            disabled={selectedScanIds.length !== 2}
            className={cx(
              "inline-flex items-center gap-2 border px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors",
              selectedScanIds.length === 2
                ? "border-ink bg-ink text-canvas font-bold hover:bg-canvas hover:text-ink cursor-pointer shadow-sm"
                : "border-line bg-subtle text-muted opacity-60 cursor-not-allowed",
            )}
            aria-label="Compare selected scans side-by-side"
          >
            <span>⇄ Compare</span>
            <span
              className={cx(
                "px-1.5 py-0.5 text-[10px] font-bold border",
                selectedScanIds.length === 2
                  ? "border-canvas/40 bg-canvas/20 text-canvas"
                  : "border-line bg-canvas text-muted",
              )}
            >
              {selectedScanIds.length}/2
            </span>
          </button>

          {selectedScanIds.length === 0 && (
            <span className="text-[11px] text-muted">
              Select any 2 scans using the checkboxes below to compare findings side-by-side.
            </span>
          )}

          {selectedScanIds.length === 1 && (
            <span className="text-[11px] text-ink font-bold">
              1 scan selected ({selectedScanIds[0].slice(0, 8)}…). Select 1 more to compare.
            </span>
          )}

          {selectedScanIds.length === 2 && (
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span>✓</span>
              <span>
                2 scans selected ({selectedScanIds[0].slice(0, 8)}… vs {selectedScanIds[1].slice(0, 8)}…). Ready to compare!
              </span>
            </span>
          )}
        </div>

        {selectedScanIds.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedScanIds([])}
            className="text-[11px] text-muted hover:text-ink underline uppercase tracking-wide self-start sm:self-auto"
          >
            Clear selection ({selectedScanIds.length})
          </button>
        )}
      </div>

      {/* Duration Filtering Control Bar */}
      <div className="border border-line bg-canvas p-3 font-mono text-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted mr-1">
              Duration Filter:
            </span>

            {FILTER_CONFIG.map((cfg) => {
              const count = counts[cfg.key];
              const isSelected = activeFilter === cfg.key;

              return (
                <button
                  key={cfg.key}
                  type="button"
                  onClick={() => handleFilterSelect(cfg.key)}
                  className={cx(
                    "inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-mono uppercase tracking-[0.05em] transition-colors",
                    isSelected
                      ? "border-ink bg-ink text-canvas font-bold"
                      : "border-line bg-canvas text-muted hover:border-ink hover:text-ink",
                  )}
                  aria-pressed={isSelected}
                  aria-label={`Filter by ${cfg.label} (${count} scans)`}
                >
                  <span>{cfg.label}</span>
                  <span
                    className={cx(
                      "px-1 py-0.2 text-[10px] border",
                      isSelected
                        ? "border-canvas/40 bg-canvas/20 text-canvas font-bold"
                        : "border-line bg-subtle text-muted",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filter Status & Reset */}
          <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px]">
            <span className="text-muted">
              Showing <strong className="text-ink">{filteredScans.length}</strong> of{" "}
              <strong className="text-ink">{scans.length}</strong> scans
            </span>

            {activeFilter !== "all" && (
              <button
                type="button"
                onClick={() => handleFilterSelect("all")}
                className="text-ink underline hover:no-underline font-bold"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>

        {/* Informational Subtext & Active Sort Indicator */}
        <div className="mt-2.5 pt-2 border-t border-line/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-faint">
          <div>
            <span>{currentConfig.description}</span>
            {activeFilter !== "all" && (
              <span className="ml-2 font-bold text-muted">
                (Filter: {currentConfig.label})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span>
              Sorted by: <strong className="text-ink">{SORT_LABELS[sortKey]}</strong> ({sortDirection === "asc" ? "Ascending ▲" : "Descending ▼"})
            </span>
            {(sortKey !== "created_at" || sortDirection !== "desc") && (
              <button
                type="button"
                onClick={() => {
                  setSortKey("created_at");
                  setSortDirection("desc");
                }}
                className="text-ink underline hover:no-underline font-bold"
              >
                Reset sort
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scans Data Table with Checkbox Selector and Sorting */}
      <DataTable
        columns={tableColumns}
        rows={sortedScans}
        rowKey={(r) => r.id}
        empty={
          activeFilter === "all" ? (
            "No scans yet. Add a verified asset and start one."
          ) : (
            <div className="py-6 text-center font-mono">
              <p className="text-muted">
                No scans match the <strong className="text-ink">&apos;{currentConfig.label}&apos;</strong> duration filter.
              </p>
              <button
                type="button"
                onClick={() => handleFilterSelect("all")}
                className="mt-2 inline-block border border-ink bg-canvas px-3 py-1 text-xs text-ink hover:bg-subtle font-bold uppercase"
              >
                Reset to All Durations
              </button>
            </div>
          )
        }
      />

      {/* Side-by-Side Scan Findings Comparison Modal */}
      {isComparing && selectedScans.length === 2 && (
        <ScanComparisonModal
          scanA={selectedScans[0]}
          scanB={selectedScans[1]}
          onClose={() => setIsComparing(false)}
          onSwap={handleSwapSelected}
        />
      )}
    </div>
  );
}
