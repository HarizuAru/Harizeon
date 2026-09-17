import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { AssetFilters } from "@/components/asset-filters";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Assets" };

type Asset = {
  id: string;
  value: string;
  type: string;
  criticality: string;
  created_at: string;
  verification_status: string | null;
};

const columns: Column<Asset>[] = [
  {
    key: "value",
    header: "Value",
    mono: true,
    render: (r) => (
      <Link href={`/assets/${r.id}`} className="underline">
        {r.value}
      </Link>
    ),
  },
  { key: "type", header: "Type" },
  {
    key: "verification_status",
    header: "Verified",
    mono: true,
    render: (r) => (r.verification_status ?? "unverified").toUpperCase(),
  },
  { key: "criticality", header: "Crit" },
  {
    key: "created_at",
    header: "Added",
    mono: true,
    render: (r) => new Date(r.created_at).toLocaleDateString(),
  },
];

type SP = { q?: string; type?: string; criticality?: string; verified?: string; cursor?: string };

function pick(value: string | undefined, allowed: readonly string[]): string {
  const v = value ?? "";
  return allowed.includes(v) ? v : "";
}

export default async function AssetsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 256);
  const type = pick(sp.type, ["domain", "subdomain", "ip", "url"]);
  const criticality = pick(sp.criticality, ["low", "medium", "high"]);
  const verified = pick(sp.verified, ["yes", "no"]);
  const cursor = sp.cursor ?? "";

  const filters = new URLSearchParams();
  if (q) filters.set("q", q);
  if (type) filters.set("type", type);
  if (criticality) filters.set("criticality", criticality);
  if (verified) filters.set("verified", verified);

  const query = new URLSearchParams(filters);
  query.set("limit", "50");
  if (cursor) query.set("cursor", cursor);

  let data: Asset[] = [];
  let nextCursor: string | null = null;
  let error: string | null = null;
  try {
    const res = await apiFetch<{ data: Asset[]; next_cursor: string | null }>(
      `/assets?${query.toString()}`,
    );
    data = res.data;
    nextCursor = res.next_cursor;
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    error = e instanceof ApiError ? e.message : "Cannot reach the API. Is it running?";
  }

  const nextQuery = new URLSearchParams(filters);
  if (nextCursor) nextQuery.set("cursor", nextCursor);
  const nextHref = nextCursor ? `/assets?${nextQuery.toString()}` : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assets"
        description="Everything you own and have verified."
        actions={
          <Link href="/assets/new" className={buttonClass("primary", "md")}>
            Add asset
          </Link>
        }
      />
      <AssetFilters q={q} type={type} criticality={criticality} verified={verified} />
      {error ? (
        <EmptyState title="Could not load assets." description={error} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data}
            rowKey={(r) => r.id}
            empty={
              filters.toString()
                ? "No assets match these filters."
                : "No assets. Harizeon can only scan what you prove you own."
            }
          />
          {nextHref ? (
            <div>
              <Link href={nextHref} className="text-sm font-medium text-ink underline">
                Next page →
              </Link>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
