import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

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
    <div className={cx("w-full overflow-x-auto border border-line", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            {selectable ? (
              <th scope="col" className="w-8 px-3 py-2">
                <span className="sr-only">Select</span>
              </th>
            ) : null}
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cx(
                  "px-3 py-2 text-xs font-medium uppercase tracking-[0.08em] text-muted",
                  c.align === "right" ? "text-right" : "text-left",
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="px-3 py-10 text-center text-sm text-faint">
                {empty ?? "No rows."}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={rowKey(row)}
                className={cx(
                  "border-b border-line last:border-0 hover:bg-subtle",
                  i % 2 === 1 && "bg-subtle",
                )}
              >
                {selectable ? (
                  <td className="px-3 py-2">
                    <input type="checkbox" aria-label={`Select row ${rowKey(row)}`} />
                  </td>
                ) : null}
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cx(
                      "px-3 py-2 text-ink",
                      c.mono && "font-mono",
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
