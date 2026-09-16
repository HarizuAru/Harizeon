import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  hint?: string;
}) {
  return (
    <div className="border border-line bg-canvas p-4">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-2 font-mono text-[2rem] leading-none text-ink">{value}</p>
      {delta || hint ? (
        <p className="mt-2 font-mono text-xs text-faint">
          {delta}
          {delta && hint ? " · " : ""}
          {hint}
        </p>
      ) : null}
    </div>
  );
}
