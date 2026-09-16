import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function StatusBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 border border-line px-1.5 py-0.5 font-mono text-xs uppercase tracking-[0.08em] text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
