import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { VerifyFlow } from "@/components/verify-flow";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Verify ownership" };

type Detail = {
  asset: { id: string; value: string; type: string };
  verification: { method: string; status: string; token: string; verified_at: string | null } | null;
};

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
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
        <PageHeader title="Verify ownership" description="Could not load this asset." />
        <EmptyState title="Could not load asset." description={error ?? "Unknown error."} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Verify ownership"
        description={<span className="font-mono">{detail.asset.value}</span>}
      />
      <VerifyFlow
        assetId={detail.asset.id}
        assetValue={detail.asset.value}
        assetType={detail.asset.type}
        initial={detail.verification}
      />
    </div>
  );
}
