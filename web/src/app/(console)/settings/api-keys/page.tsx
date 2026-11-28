import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ApiKeysManager, type ApiKeyItem } from "@/components/api-keys-manager";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "API Keys" };

export default async function ApiKeysPage() {
  let keys: ApiKeyItem[] = [];

  try {
    const res = await apiFetch<{ keys: ApiKeyItem[] }>("/api-keys");
    keys = res.keys ?? [];
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login");
    }
  }

  return <ApiKeysManager initialKeys={keys} />;
}
