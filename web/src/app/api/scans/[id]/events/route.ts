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

  // Fallback: simulated SSE stream for in-memory scan
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`event: status\ndata: ${JSON.stringify({ status: "completed", phase: "report", progress_pct: 100 })}\n\n`),
      );
      controller.enqueue(
        encoder.encode(`event: done\ndata: ${JSON.stringify({ status: "completed" })}\n\n`),
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
