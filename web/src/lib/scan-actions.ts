"use server";

import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "./api";

export type ScanActionState = { error?: string } | null;

export async function createScanAction(
  _prev: ScanActionState,
  formData: FormData,
): Promise<ScanActionState> {
  const profile = String(formData.get("profile") ?? "standard");
  const assetIds = formData.getAll("asset_ids").map(String).filter(Boolean);
  if (assetIds.length === 0) return { error: "Select at least one verified asset" };

  let id: string;
  try {
    const res = await apiFetch<{ scan: { id: string } }>("/scans", {
      method: "POST",
      body: { asset_ids: assetIds, profile },
    });
    id = res.scan.id;
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    if (e instanceof ApiError) return { error: e.message };
    return { error: "Cannot reach the API. Is it running?" };
  }
  redirect(`/scans/${id}`);
}

export async function cancelScanAction(
  scanId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiFetch(`/scans/${scanId}/cancel`, { method: "POST", body: {} });
    return { ok: true };
  } catch (e: unknown) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: "Cannot reach the API. Is it running?" };
  }
}

export async function retryScanAction(
  scanId: string,
  assetIds?: string[],
  profile?: string,
): Promise<{ ok: boolean; scanId?: string; error?: string }> {
  try {
    let res: { scan: { id: string } };
    try {
      res = await apiFetch<{ scan: { id: string } }>(`/scans/${scanId}/retry`, {
        method: "POST",
        body: {},
      });
    } catch (e: unknown) {
      if (assetIds && assetIds.length > 0) {
        res = await apiFetch<{ scan: { id: string } }>("/scans", {
          method: "POST",
          body: { asset_ids: assetIds, profile: profile ?? "standard" },
        });
      } else {
        throw e;
      }
    }
    return { ok: true, scanId: res.scan.id };
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: "Cannot reach the API. Is it running?" };
  }
}

