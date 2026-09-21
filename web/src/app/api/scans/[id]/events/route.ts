import { apiBase, sessionToken, SESSION_COOKIE } from "@/lib/api";

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

  // The API is the only source of scan truth. Never simulate a "completed"
  // stream: a security console that invents a finished scan is worse than one
  // that reports a disconnect. A non-2xx makes EventSource fire `error`, which
  // the client already handles.
  return new Response("scan event stream unavailable", { status: 502 });
}
