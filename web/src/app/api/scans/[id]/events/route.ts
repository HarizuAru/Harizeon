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

  const upstream = await fetch(`${apiBase()}/v1/scans/${id}/events?since=${since}`, {
    headers: {
      Accept: "text/event-stream",
      ...(token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    return new Response(
      JSON.stringify({ error: { code: "stream_unavailable", message: `Upstream ${upstream.status}` } }),
      { status: upstream.status || 502, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
