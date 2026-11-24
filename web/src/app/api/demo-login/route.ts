import { type NextRequest } from "next/server";
import { apiBase, SESSION_COOKIE, SESSION_MAX_AGE, DEMO_MODE } from "@/lib/api";

const DEMO_EMAIL = "demo@harizeon.demo";
const DEMO_PASSWORD = "demo-console-1234";
const DEMO_SLUG = "demo";

function createRedirectResponse(token: string, redirectPath: string) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=${redirectPath}">
  <title>Entering Harizeon Console…</title>
</head>
<body style="background:#000;color:#fff;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p>Entering Harizeon Console…</p>
  <script>window.location.replace(${JSON.stringify(redirectPath)});</script>
</body>
</html>`;

  const headers = new Headers();
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Location", redirectPath);
  headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax; HttpOnly`
  );

  return new Response(html, { status: 307, headers });
}

/**
 * One-click demo access: create (or reuse) a throwaway demo tenant, log in for
 * real through the control plane, or fall back to local demo workspace if in dev/standalone mode.
 */
export async function GET(request: NextRequest) {
  const redirectPath = request.nextUrl.searchParams.get("next") || "/dashboard";

  try {
    // Best-effort signup: a 409 (email/slug taken) on a repeat click is fine.
    await fetch(`${apiBase()}/v1/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD, orgName: "Demo Org", orgSlug: DEMO_SLUG }),
    });

    const login = await fetch(`${apiBase()}/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
    });

    const token = login.headers.get("set-cookie")?.match(/hz_session=([^;]+)/)?.[1];
    if (login.ok && token) {
      return createRedirectResponse(token, redirectPath);
    }
  } catch {
    // If backend API is not up and running, fall through to demo session
  }

  // Graceful standalone fallback when DEMO_MODE is active
  if (DEMO_MODE) {
    const mockToken = `mock-session-demo-${Math.random().toString(36).slice(2, 10)}`;
    return createRedirectResponse(mockToken, redirectPath);
  }

  return new Response("Demo unavailable · is the API running?", { status: 502 });
}
