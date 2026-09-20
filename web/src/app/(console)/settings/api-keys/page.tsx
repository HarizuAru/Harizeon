import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ApiKeysManager, type ApiKeyItem } from "@/components/api-keys-manager";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "API Keys" };

export default async function ApiKeysPage() {
  let keys: ApiKeyItem[] = [
    {
      id: "key-01",
      org_id: "org-01",
      name: "GitHub Actions CI Runner",
      prefix: "hrz_live_a9f2...",
      scopes: ["assets:read", "scans:write", "findings:read"],
      last_used_at: "2026-09-18T10:45:00.000Z",
      expires_at: null,
      revoked_at: null,
      created_at: "2026-08-01T00:00:00.000Z",
    },
    {
      id: "key-02",
      org_id: "org-01",
      name: "Internal SIEM Ingestion",
      prefix: "hrz_live_7c41...",
      scopes: ["findings:read", "reports:read"],
      last_used_at: "2026-09-19T02:15:00.000Z",
      expires_at: null,
      revoked_at: null,
      created_at: "2026-08-10T12:00:00.000Z",
    },
  ];

  try {
    const res = await apiFetch<{ keys: ApiKeyItem[] }>("/api-keys");
    if (res.keys && res.keys.length > 0) {
      keys = res.keys;
    }
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login");
    }
  }

  return <ApiKeysManager initialKeys={keys} />;
}
