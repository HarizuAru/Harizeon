import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { TableKeyNav } from "./table-key-nav";

export type Column<T> = {
  key: string;
  header: ReactNode;
  align?: "left" | "right";
  mono?: boolean;
  render?: (row: T) => ReactNode;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  selectable = false,
  empty,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  selectable?: boolean;
  empty?: ReactNode;
  className?: string;
}) {
  const colSpan = columns.length + (selectable ? 1 : 0);

  return (
    <div className={cx("w-full overflow-x-auto border border-line bg-canvas relative", className)}>
      <TableKeyNav />
      <table className="w-full border-collapse text-sm" role="grid">
        <thead>
          <tr className="border-b border-line bg-subtle/40 select-none">
            {selectable ? (
              <th scope="col" className="w-8 px-3 py-2 text-left">
                <span className="sr-only">Select</span>
              </th>
            ) : null}
            {columns.map((c, idx) => (
              <th
                key={c.key}
                scope="col"
                className={cx(
                  "px-3 py-2.5 text-xs font-mono font-medium uppercase tracking-[0.08em] text-muted",
                  c.align === "right" ? "text-right" : "text-left",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{c.header}</span>
                  {idx === columns.length - 1 && rows.length > 0 && (
                    <span className="hidden lg:inline text-[10px] text-faint font-normal lowercase tracking-normal">
                      [j/k: nav · enter: open]
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="px-3 py-12 text-center text-sm text-faint">
                <div className="flex flex-col items-center justify-center gap-2 font-mono">
                  <span className="text-muted text-xs border border-line bg-subtle px-2 py-0.5">[ ∅ ]</span>
                  <span>{empty ?? "No rows recorded."}</span>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={rowKey(row)}
                data-table-row
                tabIndex={0}
                className={cx(
                  "border-b border-line last:border-0 transition-colors duration-100 outline-none",
                  "hover:bg-subtle focus-within:bg-subtle focus-visible:bg-subtle focus-visible:border-l-2 focus-visible:border-l-ink",
                  i % 2 === 1 ? "bg-subtle/40" : "bg-canvas",
                )}
              >
                {selectable ? (
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={`Select row ${rowKey(row)}`}
                      className="accent-black cursor-pointer"
                    />
                  </td>
                ) : null}
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cx(
                      "px-3 py-2.5 text-ink",
                      c.mono && "font-mono text-xs",
                      c.align === "right" ? "text-right" : "text-left",
                    )}
                  >
                    {c.render
                      ? c.render(row)
                      : String((row as Record<string, unknown>)[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
