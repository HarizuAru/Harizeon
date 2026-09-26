import { apiFetch, ApiError } from "@/lib/api";
import { type SystemHealthData } from "@/components/system-health-dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await apiFetch<SystemHealthData>("/system/health");
    return Response.json(data);
  } catch (e: unknown) {
    const message = e instanceof ApiError ? e.message : "Failed to fetch system health";
    const status = e instanceof ApiError ? e.status : 500;
    return Response.json({ error: message }, { status });
  }
}
