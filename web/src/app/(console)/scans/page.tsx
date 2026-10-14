import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { ScansPageView } from "@/components/scans-page-view";
import type { Scan } from "@/components/scans-list-table";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Scans" };

export default async function ScansPage({
  searchParams,
}: {
  searchParams?: Promise<{ duration?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const initialDuration = sp.duration ?? "all";

  let scans: Scan[] = [];
  let error: string | null = null;
  try {
    scans = (await apiFetch<{ data: Scan[] }>("/scans?limit=100")).data;
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    error = e instanceof ApiError ? e.message : "Cannot reach the API. Is it running?";
  }

  if (error) {
    return <EmptyState title="Could not load scans." description={error} />;
  }

  return <ScansPageView initialScans={scans} initialDuration={initialDuration} />;
}
