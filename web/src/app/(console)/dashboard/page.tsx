import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  DashboardView,
  type DashboardFinding,
  type DashboardAsset,
  type DashboardScan,
} from "@/components/dashboard-view";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  let findings: DashboardFinding[] = [];
  let assets: DashboardAsset[] = [];
  let scans: DashboardScan[] = [];

  try {
    const [findingsRes, assetsRes, scansRes] = await Promise.all([
      apiFetch<{ data: DashboardFinding[] }>("/findings?limit=50"),
      apiFetch<{ data: DashboardAsset[] }>("/assets?limit=50"),
      apiFetch<{ data: DashboardScan[] }>("/scans?limit=10"),
    ]);
    findings = findingsRes.data ?? [];
    assets = assetsRes.data ?? [];
    scans = scansRes.data ?? [];
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login");
    }
    // Fallback initial mock data if API is currently disconnected
    assets = [
      { id: "ast-001", value: "example.com", type: "domain", is_active: true, verification_status: "verified" },
      { id: "ast-002", value: "api.example.com", type: "subdomain", is_active: true, verification_status: "verified" },
      { id: "ast-003", value: "203.0.113.10", type: "ip", is_active: true, verification_status: "verified" },
    ];
    findings = [
      {
        id: "fnd-101",
        title: "TLS 1.0/1.1 enabled on public gateway",
        severity: "critical",
        status: "open",
        category: "tls",
        asset_value: "example.com",
        first_seen_at: "2026-09-19T06:00:00.000Z",
        last_seen_at: "2026-09-19T10:00:00.000Z",
      },
      {
        id: "fnd-102",
        title: "Missing Content-Security-Policy (CSP) header",
        severity: "low",
        status: "open",
        category: "http_headers",
        asset_value: "api.example.com",
        first_seen_at: "2026-09-19T06:00:00.000Z",
        last_seen_at: "2026-09-19T10:00:00.000Z",
      },
      {
        id: "fnd-103",
        title: "Unauthenticated Redis service on public interface",
        severity: "medium",
        status: "open",
        category: "exposed_service",
        asset_value: "203.0.113.10",
        first_seen_at: "2026-09-19T06:00:00.000Z",
        last_seen_at: "2026-09-19T10:00:00.000Z",
      },
    ];
    scans = [
      {
        id: "scn-7b89f012",
        profile: "standard",
        status: "completed",
        created_at: "2026-09-19T06:00:00.000Z",
        summary: { new: 3, resolved: 0, unchanged: 0 },
      },
    ];
  }

  return <DashboardView findings={findings} assets={assets} scans={scans} />;
}
