"use server";

import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "./api";

export type AssetActionState = { error?: string } | null;

function toState(e: unknown): AssetActionState {
  if (e instanceof ApiError && e.status === 401) redirect("/login");
  if (e instanceof ApiError) return { error: e.message };
  return { error: "Cannot reach the API. Is it running?" };
}

export async function createAssetAction(_prev: AssetActionState, formData: FormData): Promise<AssetActionState> {
  const type = String(formData.get("type") ?? "domain");
  const value = String(formData.get("value") ?? "");
  const criticality = String(formData.get("criticality") ?? "medium");
  let id: string;
  try {
    const res = await apiFetch<{ asset: { id: string } }>("/assets", {
      method: "POST",
      body: { type, value, criticality, tags: [] },
    });
    id = res.asset.id;
  } catch (e: unknown) {
    return toState(e);
  }
  redirect(`/assets/${id}`);
}

export type VerificationResult = {
  method: string;
  status: string;
  token?: string;
  instructions?: Record<string, string>;
  verified_at?: string | null;
  last_checked_at?: string | null;
  reason?: string;
  message?: string;
  checked_at?: string;
};

export async function initiateVerificationAction(
  assetId: string,
  method: string,
): Promise<VerificationResult | { error: string }> {
  try {
    return await apiFetch<VerificationResult>(`/assets/${assetId}/verification`, {
      method: "POST",
      body: { method },
    });
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    if (e instanceof ApiError) return { error: e.message };
    return { error: "Cannot reach the API. Is it running?" };
  }
}

export async function checkVerificationAction(
  assetId: string,
): Promise<VerificationResult | { error: string }> {
  try {
    // Empty JSON object body so the request always carries parseable JSON.
    return await apiFetch<VerificationResult>(`/assets/${assetId}/verification/check`, {
      method: "POST",
      body: {},
    });
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    if (e instanceof ApiError) return { error: e.message };
    return { error: "Cannot reach the API. Is it running?" };
  }
}
