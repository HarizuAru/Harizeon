import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export type StatusType =
  | "completed"
  | "failed"
  | "cancelled"
  | "timeout"
  | "running"
  | "queued"
  | (string & {});

interface StatusVisualConfig {
  dotColor: string;
  badgeClass: string;
  dotPulse?: boolean;
  badgePulse?: boolean;
}

const STATUS_MAP: Record<string, StatusVisualConfig> = {
  completed: {
    dotColor: "var(--status-completed-dot, #16a34a)",
    badgeClass:
      "status-badge-completed text-emerald-700 bg-emerald-50 border-emerald-300 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800",
  },
  failed: {
    dotColor: "var(--status-failed-dot, #dc2626)",
    badgeClass:
      "status-badge-failed text-rose-700 bg-rose-50 border-rose-300 dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-800",
  },
  cancelled: {
    dotColor: "var(--status-cancelled-dot, #71717a)",
    badgeClass:
      "status-badge-cancelled text-zinc-600 bg-zinc-100 border-zinc-300 dark:text-zinc-400 dark:bg-zinc-800/40 dark:border-zinc-700",
  },
  timeout: {
    dotColor: "var(--status-timeout-dot, #d97706)",
    badgeClass:
      "status-badge-timeout text-amber-700 bg-amber-50 border-amber-300 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800",
  },
  running: {
    dotColor: "var(--status-running-dot, #2563eb)",
    badgeClass:
      "status-badge-running text-blue-700 bg-blue-50 border-blue-300 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-800 animate-pulse",
    dotPulse: true,
    badgePulse: true,
  },
  queued: {
    dotColor: "var(--status-queued-dot, #737373)",
    badgeClass:
      "status-badge-queued text-neutral-600 bg-neutral-100 border-neutral-300 dark:text-neutral-400 dark:bg-neutral-800/40 dark:border-neutral-700",
  },
};

export function StatusBadge({
  children,
  status,
  className,
}: {
  children?: ReactNode;
  status?: StatusType;
  className?: string;
}) {
  const statusKey = (
    typeof status === "string"
      ? status
      : typeof children === "string"
        ? children
        : ""
  ).toLowerCase().trim();

  const config = STATUS_MAP[statusKey];
  const isRunning = statusKey === "running" || config?.badgePulse;

  return (
    <span
      data-status={statusKey || undefined}
      className={cx(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-xs uppercase tracking-[0.08em] whitespace-nowrap",
        config ? config.badgeClass : "border-line bg-canvas text-muted",
        isRunning && "animate-pulse",
        className,
      )}
    >
      {config && (
        <span
          className={cx(
            "inline-block h-1.5 w-1.5 rounded-full shrink-0",
            (config.dotPulse || isRunning) && "animate-pulse",
          )}
          style={{ backgroundColor: config.dotColor }}
          aria-hidden="true"
        />
      )}
      <span className={cx(config && "font-semibold")}>
        {children ?? status}
      </span>
    </span>
  );
}

export { StatusBadge as ScanStatusBadge };

