import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { DiscoveredList, type DiscoveredChild } from "@/components/discovered-list";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Asset" };

type Detail = {
  asset: {
    id: string;
    value: string;
    type: string;
    criticality: string;
    tags: string[];
    is_active: boolean;
    created_at: string;
    last_seen_at: string;
  };
  verification: { method: string; status: string; verified_at: string | null } | null;
};

function Fact({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line py-3 last:border-0 sm:flex-row sm:items-baseline sm:gap-6">
      <p className="w-32 shrink-0 text-xs font-medium uppercase tracking-[0.08em] text-muted">{k}</p>
      <p className={`text-sm text-ink ${mono ? "font-mono" : ""}`}>{v}</p>
    </div>
  );
}

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let detail: Detail | null = null;
  let error: string | null = null;
  try {
    detail = await apiFetch<Detail>(`/assets/${id}`);
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    if (e instanceof ApiError && e.status === 404) notFound();
    error = e instanceof ApiError ? e.message : "Cannot reach the API. Is it running?";
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Asset" description="Could not load this asset." />
        <EmptyState title="Could not load asset." description={error ?? "Unknown error."} />
      </div>
    );
  }

  const { asset, verification } = detail;

  let discovered: DiscoveredChild[] = [];
  try {
    discovered = (await apiFetch<{ data: DiscoveredChild[] }>(`/assets/${id}/discovered`)).data;
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
  }
  const verified = verification?.status === "verified";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<span className="font-mono">{asset.value}</span>}
        description={`Type: ${asset.type} · Added ${new Date(asset.created_at).toLocaleDateString()}`}
        actions={
          verified ? (
            <StatusBadge>Verified</StatusBadge>
          ) : (
            <Link href={`/assets/${asset.id}/verify`} className={buttonClass("primary", "md")}>
              Verify now
            </Link>
          )
        }
      />
      {!asset.is_active ? (
        <p className="border border-line bg-subtle p-3 font-mono text-xs text-muted">
          This asset is retired. It is excluded from lists and future scans.
        </p>
      ) : null}
      <div className="border border-line bg-canvas px-4">
        <Fact k="Type" v={asset.type} mono />
        <Fact k="Criticality" v={asset.criticality} />
        <Fact k="Tags" v={asset.tags.length > 0 ? asset.tags.join(", ") : "—"} mono />
        <Fact
          k="Verification"
          v={
            verified
              ? `verified via ${verification!.method}${verification!.verified_at ? ` at ${verification!.verified_at}` : ""}`
              : (verification?.status ?? "unverified")
          }
          mono
        />
      </div>
      {!verified ? (
        <p className="text-sm text-muted">
          Harizeon can only scan what you prove you own.{" "}
          <Link href={`/assets/${asset.id}/verify`} className="font-medium text-ink underline">
            Verify ownership
          </Link>{" "}
          to enable scanning.
        </p>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
          Discovered subdomains {discovered.length > 0 ? `(${discovered.length})` : ""}
        </h2>
        <DiscoveredList parentId={asset.id} items={discovered} />
      </section>
    </div>
  );
}
