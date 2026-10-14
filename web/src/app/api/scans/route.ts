import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import type { Scan } from "@/components/scans-list-table";

export async function GET() {
  try {
    const res = await apiFetch<{ data: Scan[] }>("/scans?limit=100");
    return NextResponse.json({ ok: true, data: res.data ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch scans";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
