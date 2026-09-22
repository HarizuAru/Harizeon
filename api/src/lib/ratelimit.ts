import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config";
import { FastifyError } from "./errors";

export const WINDOW_MS = 60_000;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Fixed-window counter. Pure so it can be tested without Fastify.
 * ponytail: in-process memory, so N replicas give N× the limit. Fine while the
 * API is one process; swap in a Redis-backed store when you scale out.
 */
export function consume(key: string, limit: number, now: number): { allowed: boolean; retryAfterSec: number } {
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }
  b.count += 1;
  if (b.count > limit) return { allowed: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  return { allowed: true, retryAfterSec: 0 };
}

/** Drop expired windows so the map cannot grow without bound. */
export function sweep(now: number): void {
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

/** Test helper. */
export function resetBuckets(): void {
  buckets.clear();
}

let lastSweep = 0;

export async function rateLimit(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!config.RATE_LIMIT_ENABLED) return;

  const now = Date.now();
  if (now - lastSweep > WINDOW_MS) {
    sweep(now);
    lastSweep = now;
  }

  // Credential endpoints get a much tighter budget (brute-force/credential
  // stuffing), everything else a general one.
  const isAuth = req.url.startsWith("/v1/auth/");
  const bucket = isAuth ? "auth" : "api";
  const limit = isAuth ? config.RATE_LIMIT_AUTH_PER_MIN : config.RATE_LIMIT_PER_MIN;

  // Key by the authenticated principal when we have one: the console calls the
  // API server-side carrying the end user's cookie, so IP-keying would let one
  // busy Next server (or NAT) throttle every user. Runs after authenticate.
  const principal = req.auth?.userId ?? req.auth?.apiKeyId ?? req.ip;

  const { allowed, retryAfterSec } = consume(`${principal}:${bucket}`, limit, now);
  if (allowed) return;

  reply.header("Retry-After", retryAfterSec);
  throw new FastifyError(
    429,
    "rate_limited",
    "Too many requests. Please slow down.",
    "/docs/errors/rate_limited",
  );
}
