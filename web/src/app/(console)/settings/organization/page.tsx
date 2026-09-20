import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OrganizationManager, type OrgProfile } from "@/components/organization-manager";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Organization Settings" };

export default async function OrganizationPage() {
  let org: OrgProfile = {
    id: "org-01",
    name: "Acme Security Operations",
    slug: "acme-sec",
    country: "Malaysia",
    currency: "MYR",
    timezone: "Asia/Kuala_Lumpur",
    billing_status: "active",
    created_at: "2026-08-01T00:00:00.000Z",
  };

  try {
    const res = await apiFetch<{ org: OrgProfile }>("/org");
    if (res.org) {
      org = {
        ...org,
        ...res.org,
      };
    }
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login");
    }
  }

  return <OrganizationManager initialOrg={org} />;
}
