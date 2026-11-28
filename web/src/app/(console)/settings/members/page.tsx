import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MembersManager, type MemberItem } from "@/components/members-manager";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Team Members" };

export default async function MembersPage() {
  let members: MemberItem[] = [];

  try {
    const res = await apiFetch<{ members: MemberItem[] }>("/org/members");
    members = res.members ?? [];
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login");
    }
  }

  return <MembersManager initialMembers={members} />;
}
