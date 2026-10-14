import { apiBase, sessionToken, SESSION_COOKIE, DEMO_MODE } from "@/lib/api";
import { getMockScanEvents } from "@/lib/mock-service";

export const dynamic = "force-dynamic";

/**
 * Same-origin SSE proxy: the browser's EventSource talks to Next (so the
 * HttpOnly session cookie is sent automatically); Next forwards it to the API.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await sessionToken();
  const since = new URL(req.url).searchParams.get("since") ?? "0";

  let upstream: Response | null = null;
  try {
    upstream = await fetch(`${apiBase()}/v1/scans/${id}/events?since=${since}`, {
      headers: {
        Accept: "text/event-stream",
        ...(token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}),
      },
      cache: "no-store",
    });
  } catch {
    upstream = null;
  }

  if (upstream && upstream.ok && upstream.body) {
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  // If in demo mode and upstream is unreachable, stream in-memory scan events
  if (DEMO_MODE) {
    const events = getMockScanEvents(id);
    const sinceNum = parseInt(since, 10) || 0;
    const filtered = events.filter((e) => e.seq > sinceNum);
    const body = filtered
      .map((e) => `event: scan_event\ndata: ${JSON.stringify(e)}\n\n`)
      .join("");
    return new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  return new Response("scan event stream unavailable", { status: 502 });
}
