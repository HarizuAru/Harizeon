import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { SeverityChip, type Severity } from "@/components/ui/severity-chip";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Findings" };

type FindingRow = {
  id: string;
  title: string;
  severity: string;
  status: string;
  asset_value: string | null;
  first_seen_at: string;
};

type ListRes = { data: FindingRow[]; next_cursor: string | null; has_more: boolean };
type Counts = Partial<Record<Severity, number>>;

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info"];
const STATUSES = ["open", "acknowledged", "fixed", "false_positive", "accepted"];

const columns: Column<FindingRow>[] = [
  { key: "severity", header: "Severity", render: (r) => <SeverityChip severity={r.severity as Severity} /> },
  {
    key: "title",
    header: "Title",
    render: (r) => (
      <Link href={`/findings/${r.id}`} className="underline">
        {r.title}
      </Link>
    ),
  },
  { key: "asset_value", header: "Asset", mono: true },
  {
    key: "first_seen_at",
    header: "First seen",
    mono: true,
    render: (r) => new Date(r.first_seen_at).toLocaleDateString(),
  },
  { key: "status", header: "Status", render: (r) => <StatusBadge>{r.status}</StatusBadge> },
];

export default async function FindingsPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string; status?: string; cursor?: string }>;
}) {
  const sp = await searchParams;
  const severity = SEVERITIES.includes(sp.severity as Severity) ? sp.severity! : "";
  const status = STATUSES.includes(sp.status ?? "") ? sp.status! : "";
  const cursor = sp.cursor ?? "";

  const filters = new URLSearchParams();
  if (severity) filters.set("severity", severity);
  if (status) filters.set("status", status);

  const query = new URLSearchParams(filters);
  query.set("limit", "50");
  if (cursor) query.set("cursor", cursor);

  let rows: FindingRow[] = [];
  let counts: Counts = {};
  let hasMore = false;
  let nextCursor: string | null = null;
  let error: string | null = null;

  try {
    const [list, cnt] = await Promise.all([
      apiFetch<ListRes>(`/findings?${query.toString()}`),
      apiFetch<Counts>(`/findings/counts`),
    ]);
    rows = list.data;
    counts = cnt;
    hasMore = list.has_more;
    nextCursor = list.next_cursor;
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    error = e instanceof ApiError ? e.message : "Cannot reach the API. Is it running?";
  }

  const total = SEVERITIES.reduce((n, s) => n + (counts[s] ?? 0), 0);
  const hrefWith = (extra: Record<string, string>) => {
    const q = new URLSearchParams(filters);
    for (const [k, v] of Object.entries(extra)) q.set(k, v);
    const qs = q.toString();
    return qs ? `/findings?${qs}` : "/findings";
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Findings"
        description="Open issues from scans against verified assets."
      />

      <div className="flex flex-wrap items-end gap-4 border border-line bg-canvas p-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
            Severity
          </span>
          <Link href={hrefWith({})} className="text-xs text-muted underline">
            all ({total})
          </Link>
          {SEVERITIES.map((s) => (
            <Link
              key={s}
              href={hrefWith({ severity: s })}
              className="inline-flex items-center gap-1 no-underline"
              aria-current={severity === s ? "true" : undefined}
            >
              <SeverityChip severity={s} />
              <span className={`font-mono text-xs ${severity === s ? "text-ink" : "text-muted"}`}>
                {counts[s] ?? 0}
              </span>
            </Link>
          ))}
        </div>
        <form method="get" className="flex flex-wrap items-end gap-3">
          {severity ? <input type="hidden" name="severity" value={severity} /> : null}
          <div className="flex w-44 flex-col gap-1">
            <label htmlFor="f-status" className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
              Status
            </label>
            <select
              id="f-status"
              name="status"
              defaultValue={status}
              className="h-8 w-full border border-line bg-canvas px-2 pr-1 text-xs text-ink focus:border-ink"
            >
              <option value="">any</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="h-8 border border-ink bg-canvas px-3 text-sm text-ink transition-colors duration-200 hover:bg-subtle"
          >
            Apply
          </button>
        </form>
        {filters.toString() ? (
          <Link href="/findings" className="inline-flex h-8 items-center px-1 text-sm text-muted underline">
            Clear
          </Link>
        ) : null}
      </div>

      {error ? (
        <EmptyState title="Could not load findings." description={error} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            empty={
              filters.toString()
                ? "No findings match these filters."
                : "No open findings. Run a scan to detect issues."
            }
          />
          {hasMore && nextCursor ? (
            <div>
              <Link href={hrefWith({ cursor: nextCursor })} className="text-sm font-medium text-ink underline">
                Next page →
              </Link>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
