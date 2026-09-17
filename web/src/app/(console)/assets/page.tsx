import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Assets" };

type Asset = {
  id: string;
  value: string;
  type: string;
  criticality: string;
  created_at: string;
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
  { key: "criticality", header: "Crit" },
  {
    key: "created_at",
    header: "Added",
    mono: true,
    render: (r) => new Date(r.created_at).toLocaleDateString(),
  },
];

export default async function AssetsPage() {
  let assets: Asset[] = [];
  let error: string | null = null;
  try {
    const res = await apiFetch<{ data: Asset[] }>("/assets?limit=50");
    assets = res.data;
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    error = e instanceof ApiError ? e.message : "Cannot reach the API. Is it running?";
  }

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
      {error ? (
        <EmptyState title="Could not load assets." description={error} />
      ) : (
        <DataTable
          columns={columns}
          rows={assets}
          rowKey={(r) => r.id}
          empty="No assets. Harizeon can only scan what you prove you own."
        />
      )}
    </div>
  );
}
