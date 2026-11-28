import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config";
import { FastifyError } from "./errors";
import { redis } from "./redis";

export const WINDOW_MS = 60_000;

export type RedisRateLimitClient = {
  status?: string;
  incr(key: string): Promise<number>;
  pexpire(key: string, ms: number): Promise<unknown>;
  pttl(key: string): Promise<number>;
};

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Atomic Redis fixed-window counter (`INCR` + `PEXPIRE`) under the `rl:` ACL prefix.
 */
export async function consumeRedis(
  client: RedisRateLimitClient,
  key: string,
  limit: number,
  windowMs = WINDOW_MS,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const redisKey = key.startsWith("rl:") ? key : `rl:${key}`;
  const count = await client.incr(redisKey);
  if (count === 1) {
    await client.pexpire(redisKey, windowMs);
  }
  if (count > limit) {
    const ttl = await client.pttl(redisKey);
    const retryAfterSec = ttl > 0 ? Math.ceil(ttl / 1000) : Math.ceil(windowMs / 1000);
    return { allowed: false, retryAfterSec };
  }
  return { allowed: true, retryAfterSec: 0 };
}

/**
 * Pure in-memory fixed-window fallback used when Redis is not connected (e.g. unit tests).
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

/** Drop expired in-memory windows so the fallback map cannot grow without bound. */
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

export async function rateLimit(
  req: FastifyRequest,
  reply: FastifyReply,
  client: RedisRateLimitClient = redis,
): Promise<void> {
  if (!config.RATE_LIMIT_ENABLED) return;

  const now = Date.now();
  const isAuth = req.url.startsWith("/v1/auth/");
  const bucket = isAuth ? "auth" : "api";
  const limit = isAuth ? config.RATE_LIMIT_AUTH_PER_MIN : config.RATE_LIMIT_PER_MIN;
  const principal = req.auth?.userId ?? req.auth?.apiKeyId ?? req.ip;
  const rlKey = `rl:${principal}:${bucket}`;

  let result: { allowed: boolean; retryAfterSec: number };
  const canUseRedis = client.status === undefined || client.status === "ready";
  if (canUseRedis) {
    try {
      result = await consumeRedis(client, rlKey, limit, WINDOW_MS);
    } catch {
      if (now - lastSweep > WINDOW_MS) {
        sweep(now);
        lastSweep = now;
      }
      result = consume(rlKey, limit, now);
    }
  } else {
    if (now - lastSweep > WINDOW_MS) {
      sweep(now);
      lastSweep = now;
    }
    result = consume(rlKey, limit, now);
  }

  if (result.allowed) return;

  reply.header("Retry-After", result.retryAfterSec);
  throw new FastifyError(
    429,
    "rate_limited",
    "Too many requests. Please slow down.",
    "/docs/errors/rate_limited",
  );
}
