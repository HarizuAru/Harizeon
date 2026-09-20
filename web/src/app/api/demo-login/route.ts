import { type NextRequest } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/api";

export async function GET(request: NextRequest) {
  const redirectPath = request.nextUrl.searchParams.get("next") || "/dashboard";
  const token = `mock-session-demo-${Math.random().toString(36).slice(2, 12)}`;

  // Using a relative Location header and instant HTML/JS redirect guarantees that
  // regardless of reverse proxies, container ports, or custom domains, the client's browser
  // resolves the URL relative to the active public origin, never hitting 0.0.0.0 or localhost.
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=${redirectPath}">
  <title>Redirecting to Harizeon Console...</title>
</head>
<body style="background:#000;color:#fff;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p>Entering Harizeon Console...</p>
  <script>
    window.location.replace(${JSON.stringify(redirectPath)});
  </script>
</body>
</html>`;

  const headers = new Headers();
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Location", redirectPath);
  headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax; HttpOnly`
  );

  return new Response(html, {
    status: 307,
    headers,
  });
}

