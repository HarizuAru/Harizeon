import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OrganizationManager, type OrgProfile } from "@/components/organization-manager";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Organization Settings" };

export default async function OrganizationPage() {
  let org: OrgProfile | null = null;
  let error: string | null = null;

  try {
    const res = await apiFetch<{ org: OrgProfile }>("/org");
    org = res.org ?? null;
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login");
    }
    error = e instanceof ApiError ? e.message : "Cannot reach the API. Is it running?";
  }

  if (!org) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Organization Settings"
          description="Configure your workspace profile, compliance boundary rules, and organization-wide security posture."
        />
        <EmptyState
          title="Could not load organization settings."
          description={error ?? "Organization profile unavailable."}
        />
      </div>
    );
  }

  return <OrganizationManager initialOrg={org} />;
}
