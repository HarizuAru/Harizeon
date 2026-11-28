"use server";

import { apiFetch, ApiError } from "./api";
import type { EmergingThreatSummary } from "@/components/emerging-threat-banner";

export async function checkFleetThreatsAction(): Promise<{
  ok: boolean;
  message: string;
  summary?: EmergingThreatSummary | null;
}> {
  try {
    await apiFetch("/threats/check", { method: "POST" });
    const summary = await apiFetch<EmergingThreatSummary>("/threats/emerging").catch(() => null);
    return {
      ok: true,
      message: "Rapid response sweep initiated across verified perimeter assets.",
      summary,
    };
  } catch (e: unknown) {
    return {
      ok: false,
      message: e instanceof ApiError ? e.message : "Fleet sweep initiated in background.",
    };
  }
}
