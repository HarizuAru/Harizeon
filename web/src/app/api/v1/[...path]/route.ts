import { type NextRequest, NextResponse } from "next/server";
import { apiBase, SESSION_COOKIE, SESSION_MAX_AGE, DEMO_MODE } from "@/lib/api";
import { handleMockApi, handleMockAuthPost } from "@/lib/mock-service";

export const dynamic = "force-dynamic";

/**
 * API Proxy Route Handler (/api/v1/*):
 * Proxies requests from client components to the control-plane API (Fastify),
 * ensuring the 'hz_session' cookie is forwarded, verified, and preserved.
 * Falls back gracefully to the in-memory mock service if the API daemon is offline.
 */
async function proxyRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: pathSegments } = await params;
  const path = `/${pathSegments.join("/")}`;
  const search = req.nextUrl.search;
  const fullPathWithQuery = `${path}${search}`;

  // Extract session token from cookies, headers, or Bearer auth
  const cookieToken = req.cookies.get(SESSION_COOKIE)?.value;
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  const token = cookieToken || bearerToken;

  const method = req.method;
  let body: unknown = undefined;
  if (method !== "GET" && method !== "HEAD") {
    try {
      body = await req.json();
    } catch {
      body = undefined;
    }
  }

  // Handle Auth POST routes (signup/login)
  if (path === "/auth/login" || path === "/auth/signup") {
    if (!DEMO_MODE && process.env.HARIZEON_API_BASE) {
      try {
        const upstream = await fetch(`${apiBase()}/v1${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
          cache: "no-store",
        });

        const data = await upstream.json().catch(() => ({}));
        const res = NextResponse.json(data, { status: upstream.status });

        // Forward upstream Set-Cookie header if provided
        const setCookie = upstream.headers.get("set-cookie");
        if (setCookie) {
          const match = setCookie.match(/hz_session=([^;]+)/);
          if (match) {
            const isProd = process.env.NODE_ENV === "production";
            res.cookies.set(SESSION_COOKIE, match[1], {
              httpOnly: true,
              secure: isProd,
              sameSite: isProd ? "none" : "lax",
              path: "/",
              maxAge: SESSION_MAX_AGE,
            });
          }
        }
        return res;
      } catch {
        // Fall back to mock auth post if upstream fails
      }
    }

    // In-memory mock fallback for auth
    const { res: mockRes, json } = await handleMockAuthPost(path, body);
    const res = NextResponse.json(json, { status: mockRes.status });
    const mockSetCookie = mockRes.headers.get("Set-Cookie");
    if (mockSetCookie) {
      const match = mockSetCookie.match(/hz_session=([^;]+)/);
      if (match) {
        const isProd = process.env.NODE_ENV === "production";
        res.cookies.set(SESSION_COOKIE, match[1], {
          httpOnly: true,
          secure: isProd,
          sameSite: isProd ? "none" : "lax",
          path: "/",
          maxAge: SESSION_MAX_AGE,
        });
      }
    }
    return res;
  }

  // If token is a mock session or DEMO_MODE is active and API base is unreachable
  if (DEMO_MODE && (!token || token.startsWith("mock-session-"))) {
    try {
      const mockResult = await handleMockApi(fullPathWithQuery, { method, body });
      return NextResponse.json(mockResult);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "status" in err) {
        const e = err as { status: number; message: string; code?: string };
        return NextResponse.json({ error: { message: e.message, code: e.code } }, { status: e.status });
      }
      return NextResponse.json({ error: { message: "Internal mock error" } }, { status: 500 });
    }
  }

  // Attempt proxying to live upstream Fastify API
  try {
    const upstream = await fetch(`${apiBase()}/v1${fullPathWithQuery}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));
    const res = NextResponse.json(data, { status: upstream.status });

    // Propagate any Set-Cookie headers from upstream
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/hz_session=([^;]+)/);
      if (match) {
        const isProd = process.env.NODE_ENV === "production";
        res.cookies.set(SESSION_COOKIE, match[1], {
          httpOnly: true,
          secure: isProd,
          sameSite: isProd ? "none" : "lax",
          path: "/",
          maxAge: SESSION_MAX_AGE,
        });
      }
    }
    return res;
  } catch (err: unknown) {
    // If upstream is unreachable and DEMO_MODE is allowed, fall back to mock service
    if (DEMO_MODE) {
      try {
        const mockResult = await handleMockApi(fullPathWithQuery, { method, body });
        return NextResponse.json(mockResult);
      } catch (mockErr: unknown) {
        if (mockErr && typeof mockErr === "object" && "status" in mockErr) {
          const e = mockErr as { status: number; message: string; code?: string };
          return NextResponse.json({ error: { message: e.message, code: e.code } }, { status: e.status });
        }
      }
    }

    const message = err instanceof Error ? err.message : "Upstream API unavailable";
    return NextResponse.json({ error: { message, code: "upstream_unavailable" } }, { status: 502 });
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx);
}
