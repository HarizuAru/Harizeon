import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { NewScanForm } from "@/components/new-scan-form";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "New scan" };

type Asset = { id: string; value: string; type: string };

export default async function NewScanPage() {
  let assets: Asset[] = [];
  let error: string | null = null;
  try {
    assets = (await apiFetch<{ data: Asset[] }>("/assets?verified=yes&limit=100")).data;
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    error = e instanceof ApiError ? e.message : "Cannot reach the API. Is it running?";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New scan"
        description="Only assets you have verified can be scanned."
      />
      {error ? (
        <EmptyState title="Could not load assets." description={error} />
      ) : (
        <NewScanForm assets={assets} />
      )}
    </div>
  );
}
