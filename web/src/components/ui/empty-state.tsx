import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function EmptyState({
  title,
  description,
  action,
  className,
  glyph = "[ ∅ ]",
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  glyph?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center gap-3 border border-line bg-canvas px-6 py-16 text-center select-none",
        className,
      )}
    >
      <span className="font-mono text-sm tracking-widest text-muted border border-line bg-subtle/50 px-2.5 py-1">
        {glyph}
      </span>
      <p className="text-base font-semibold font-sans text-ink">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-muted leading-relaxed font-sans">{description}</p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
