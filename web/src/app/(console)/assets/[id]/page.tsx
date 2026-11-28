import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { DiscoveredList, type DiscoveredChild } from "@/components/discovered-list";
import { BadgeEmbedCard } from "@/components/badge-embed-card";
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
  const cleanDomain = asset.value.replace(/[^a-zA-Z0-9.-]/g, "").toLowerCase();

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
        <Fact k="Tags" v={asset.tags.length > 0 ? asset.tags.join(", ") : "-"} mono />
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
        <div className="border border-line bg-subtle p-4 font-mono text-xs text-muted flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold text-ink uppercase block mb-0.5">Ownership verification required</span>
            <span>Harizeon security modules can only scan perimeters you prove you own.</span>
          </div>
          <Link
            href={`/assets/${asset.id}/verify`}
            className="border border-ink bg-ink text-canvas px-4 py-2 font-bold uppercase tracking-wider hover:bg-canvas hover:text-ink transition-colors shrink-0"
          >
            Verify Ownership Now →
          </Link>
        </div>
      ) : null}

      {/* Connected Services Grid */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-line pb-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-ink font-mono">
            Connected Services for {asset.value}
          </h2>
          <span className="text-[11px] font-mono text-muted">
            All Harizeon modules operate directly on your verified asset
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Service 1: Harizeon Scan (SCN) */}
          <div className="border border-line bg-canvas p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-ink">SCN · Harizeon Scan</span>
                <span className="border border-line bg-subtle px-1 text-[9px] font-mono text-muted uppercase">Perimeter</span>
              </div>
              <p className="mt-1 text-xs text-muted font-sans leading-relaxed">
                Autonomous port probing, TLS and certificate inspection, and web vulnerability analysis.
              </p>
            </div>
            {verified ? (
              <Link
                href={`/scans/new?asset_id=${asset.id}&profile=standard`}
                className="border border-line bg-subtle py-2 text-center font-mono text-xs uppercase tracking-wider text-ink hover:border-ink hover:bg-canvas transition-colors"
              >
                Launch Scan (SCN) →
              </Link>
            ) : (
              <Link
                href={`/assets/${asset.id}/verify`}
                className="border border-line bg-subtle py-2 text-center font-mono text-xs uppercase tracking-wider text-muted hover:text-ink hover:border-ink"
              >
                Verify to Scan
              </Link>
            )}
          </div>

          {/* Service 2: Harizeon AI-Armor (AIA) */}
          <div className="border border-line bg-canvas p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-ink">AIA · Harizeon AI-Armor</span>
                <span className="border border-[#02acc5]/40 bg-[#02acc5]/10 px-1 text-[9px] font-mono text-[#02acc5] font-semibold uppercase">AI Defense</span>
              </div>
              <p className="mt-1 text-xs text-muted font-sans leading-relaxed">
                Specialized audit for LLM inference daemons, vector databases, and client-side key leaks.
              </p>
            </div>
            {verified ? (
              <Link
                href={`/scans/new?asset_id=${asset.id}&profile=ai`}
                className="border border-[#02acc5] bg-[#02acc5]/10 py-2 text-center font-mono text-xs uppercase tracking-wider text-[#02acc5] hover:bg-[#02acc5] hover:text-white transition-colors"
              >
                Run AI-Armor (AIA) →
              </Link>
            ) : (
              <Link
                href={`/assets/${asset.id}/verify`}
                className="border border-line bg-subtle py-2 text-center font-mono text-xs uppercase tracking-wider text-muted hover:text-ink hover:border-ink"
              >
                Verify to Audit
              </Link>
            )}
          </div>

          {/* Service 3: Harizeon Surface (ASM) */}
          <div className="border border-line bg-canvas p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-ink">ASM · Attack Surface</span>
                <span className="border border-line bg-subtle px-1 text-[9px] font-mono text-muted uppercase">Discovery</span>
              </div>
              <p className="mt-1 text-xs text-muted font-sans leading-relaxed">
                Automated continuous subdomain discovery via Certificate Transparency and DNS records.
              </p>
            </div>
            <div className="border border-line bg-subtle py-2 text-center font-mono text-xs text-muted">
              {discovered.length} Discovered Subdomains
            </div>
          </div>

          {/* Service 4: Scan Schedules (SCH) */}
          <div className="border border-line bg-canvas p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-ink">SCH · Scan Schedules</span>
                <span className="border border-line bg-subtle px-1 text-[9px] font-mono text-muted uppercase">Automation</span>
              </div>
              <p className="mt-1 text-xs text-muted font-sans leading-relaxed">
                Automated recurring daily or weekly baseline scans with drift detection alerts.
              </p>
            </div>
            <Link
              href={`/schedules?asset_id=${asset.id}`}
              className="border border-line bg-subtle py-2 text-center font-mono text-xs uppercase tracking-wider text-ink hover:border-ink hover:bg-canvas transition-colors"
            >
              Create Schedule →
            </Link>
          </div>

          {/* Service 5: Compliance Reports (ADT) */}
          <div className="border border-line bg-canvas p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-ink">ADT · Compliance Reports</span>
                <span className="border border-line bg-subtle px-1 text-[9px] font-mono text-muted uppercase">Reporting</span>
              </div>
              <p className="mt-1 text-xs text-muted font-sans leading-relaxed">
                Formal executive and technical reports mapped to ISO 27001, SOC 2, and Act 854.
              </p>
            </div>
            <Link
              href={`/reports?asset_id=${asset.id}`}
              className="border border-line bg-subtle py-2 text-center font-mono text-xs uppercase tracking-wider text-ink hover:border-ink hover:bg-canvas transition-colors"
            >
              Generate Report →
            </Link>
          </div>

          {/* Service 6: Public Trust Certification Badge */}
          <div className="border border-line bg-canvas p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-ink">CERT · Live Trust Badge</span>
                <span className="border border-line bg-subtle px-1 text-[9px] font-mono text-muted uppercase">Trust</span>
              </div>
              <p className="mt-1 text-xs text-muted font-sans leading-relaxed">
                Live SVG benchmark certification badge and public verification audit portal.
              </p>
            </div>
            <Link
              href={`/verify-benchmark/${cleanDomain}`}
              target="_blank"
              className="border border-line bg-subtle py-2 text-center font-mono text-xs uppercase tracking-wider text-ink hover:border-ink hover:bg-canvas transition-colors"
            >
              Public Certificate →
            </Link>
          </div>
        </div>
      </section>

      <BadgeEmbedCard domain={asset.value} isVerified={verified} />

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
          Discovered subdomains {discovered.length > 0 ? `(${discovered.length})` : ""}
        </h2>
        <DiscoveredList parentId={asset.id} items={discovered} />
      </section>
    </div>
  );
}
