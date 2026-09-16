import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center gap-3 border border-line bg-canvas px-6 py-16 text-center",
        className,
      )}
    >
      <p className="text-base font-medium text-ink">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
