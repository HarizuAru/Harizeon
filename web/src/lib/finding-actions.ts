"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "./api";

export type FindingActionState = {
  ok: boolean;
  error?: string;
};

export const FINDING_STATUSES = [
  "open",
  "acknowledged",
  "fixed",
  "false_positive",
  "accepted",
] as const;
export type FindingStatusAction = (typeof FINDING_STATUSES)[number];

export async function updateFindingStatusAction(
  findingId: string,
  status: FindingStatusAction,
  reason?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiFetch(`/findings/${findingId}`, {
      method: "PATCH",
      body: { status, status_reason: reason || undefined },
    });
    revalidatePath("/findings");
    revalidatePath(`/findings/${findingId}`);
    return { ok: true };
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: "Cannot reach the API. Is it running?" };
  }
}
