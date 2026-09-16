import { cx } from "@/lib/cx";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

const MAP: Record<Severity, { prefix: string; cls: string }> = {
  critical: { prefix: "[!!!]", cls: "border-accent bg-accent text-accent-ink font-bold" },
  high: { prefix: "[!!]", cls: "border-accent bg-accent text-accent-ink font-medium" },
  medium: { prefix: "[!]", cls: "border-2 border-ink bg-canvas text-ink font-medium" },
  low: { prefix: "[-]", cls: "border border-line bg-canvas text-muted" },
  info: { prefix: "[i]", cls: "border border-transparent bg-transparent text-faint" },
};

export function SeverityChip({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  const m = MAP[severity];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 px-1.5 py-0.5 font-mono text-xs uppercase tracking-[0.08em] whitespace-nowrap",
        m.cls,
        className,
      )}
    >
      <span aria-hidden="true">{m.prefix}</span>
      {severity}
    </span>
  );
}
