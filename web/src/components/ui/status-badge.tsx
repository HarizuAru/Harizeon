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
  prefix: string;
  badgeClass: string;
  isPulse?: boolean;
}

/**
 * Pure Monochrome Status Badges (§10).
 * Constraint is the brand: no green, red, or blue.
 * Status is encoded through border, fill, type weight, and explicit glyph prefixes.
 */
const STATUS_MAP: Record<string, StatusVisualConfig> = {
  completed: {
    prefix: "[✓]",
    badgeClass: "border-line bg-canvas text-ink font-medium",
  },
  failed: {
    prefix: "[✕]",
    badgeClass: "border-ink bg-ink text-canvas font-bold",
  },
  cancelled: {
    prefix: "[-]",
    badgeClass: "border-line bg-subtle text-muted line-through",
  },
  timeout: {
    prefix: "[⏱]",
    badgeClass: "border-line bg-canvas text-muted",
  },
  running: {
    prefix: "[●]",
    badgeClass: "border-2 border-ink bg-canvas text-ink font-bold",
    isPulse: true,
  },
  queued: {
    prefix: "[○]",
    badgeClass: "border-line bg-canvas text-faint",
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

  const config = STATUS_MAP[statusKey] || {
    prefix: "[•]",
    badgeClass: "border-line bg-canvas text-muted",
  };

  const isRunning = statusKey === "running" || config.isPulse;

  return (
    <span
      data-status={statusKey || undefined}
      className={cx(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-xs uppercase tracking-[0.08em] whitespace-nowrap select-none",
        config.badgeClass,
        isRunning && "animate-pulse",
        className,
      )}
    >
      <span aria-hidden="true" className="font-mono text-[10px]">
        {config.prefix}
      </span>
      <span>{children ?? status}</span>
    </span>
  );
}

export { StatusBadge as ScanStatusBadge };
