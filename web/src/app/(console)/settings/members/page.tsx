import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MembersManager, type MemberItem } from "@/components/members-manager";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Team Members" };

export default async function MembersPage() {
  let members: MemberItem[] = [
    {
      id: "mem-01",
      org_id: "org-01",
      user_id: "usr-01",
      role: "owner",
      user_email: "security-lead@acme.corp",
      user_name: "Security Lead",
      created_at: "2026-08-01T00:00:00.000Z",
    },
    {
      id: "mem-02",
      org_id: "org-01",
      user_id: "usr-02",
      role: "admin",
      user_email: "devops-eng@acme.corp",
      user_name: "DevOps Engineer",
      created_at: "2026-08-15T09:30:00.000Z",
    },
    {
      id: "mem-03",
      org_id: "org-01",
      user_id: "usr-03",
      role: "readonly",
      user_email: "compliance-auditor@acme.corp",
      user_name: "Compliance Auditor",
      created_at: "2026-09-01T14:20:00.000Z",
    },
  ];

  try {
    const res = await apiFetch<{ members: MemberItem[] }>("/org/members");
    if (res.members && res.members.length > 0) {
      members = res.members;
    }
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login");
    }
  }

  return <MembersManager initialMembers={members} />;
}
