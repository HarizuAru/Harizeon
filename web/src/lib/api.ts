import { cookies } from "next/headers";
import { handleMockApi } from "./mock-service";

export const SESSION_COOKIE = "hz_session";
export const SESSION_MAX_AGE = 30 * 24 * 3600;

export function apiBase(): string {
  return process.env.HARIZEON_API_BASE ?? "http://localhost:8080";
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** Session token from the browser cookie (server components/actions only). */
export async function sessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

/** Call the control-plane API, forwarding the browser session. No-store. */
export async function apiFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = await sessionToken();
  try {
    const res = await fetch(`${apiBase()}/v1${path}`, {
      method: init.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
    let json: unknown = {};
    try {
      json = await res.json();
    } catch {
      json = {};
    }
    if (!res.ok) {
      const err = (json as { error?: { code?: string; message?: string } }).error;
      throw new ApiError(res.status, err?.code ?? "request_failed", err?.message ?? `Request failed (${res.status})`);
    }
    return json as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    // Fallback to in-memory mock service if API is offline
    try {
      return await handleMockApi<T>(path, init);
    } catch (mockErr: unknown) {
      if (mockErr && typeof mockErr === "object" && "status" in mockErr && "message" in mockErr) {
        const e = mockErr as { status: number; code?: string; message: string };
        throw new ApiError(e.status, e.code ?? "error", e.message);
      }
      throw err;
    }
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Move hz_session from an API Set-Cookie header onto the browser response.
 * Server actions / route handlers only.
 */
export async function forwardSessionCookie(apiRes: Response): Promise<string | null> {
  const headers = apiRes.headers as Headers & { getSetCookie?: () => string[] };
  const list = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
  let found = list.map((c) => c.match(/hz_session=([^;]+)/)?.[1]).find(Boolean);
  if (!found) {
    const raw = apiRes.headers.get("set-cookie");
    if (raw) {
      found = raw.match(/hz_session=([^;]+)/)?.[1];
    }
  }
  if (found) {
    await setSessionCookie(found);
    return found;
  }
  return null;
}
