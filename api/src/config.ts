import { z } from "zod";

/**
 * z.coerce.boolean() is a footgun: Boolean("false") is true, so a security
 * flag set to "false" would silently ENABLE it. Accept only explicit values.
 */
const bool = (def: boolean) =>
  z
    .enum(["true", "false", "1", "0"])
    .default(def ? "1" : "0")
    .transform((v) => v === "true" || v === "1");

/** Rate limiting protects production; it is off by default everywhere else so
 *  integration tests (which sign up/log in in tight loops from one IP) are not
 *  throttled. Force it with RATE_LIMIT_ENABLED=true to test. */
const isProd = process.env.NODE_ENV === "production";

const Env = z.object({  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  // Namespaces the Redis Streams keys so tests never touch a running worker's
  // queue (e.g. "test:").
  HARIZEON_QUEUE_PREFIX: z.string().default(""),
  COOKIE_SECURE: bool(false),
  COOKIE_DOMAIN: z.string().optional(),
  HARIZEON_SESSION_SECRET: z.string().min(32).optional(),
  HARIZEON_MASTER_KEY: z.string().min(32).optional(),
  PUBLIC_API_BASE: z.string().url().default("http://localhost:8080"),
  // Allow verification fetches to non-public hosts (loopback/test). NEVER true
  // in production — the SSRF guard (§11) must stay enforced where it matters.
  VERIFY_ALLOW_PRIVATE: bool(false),

  // --- Capacity / operations -------------------------------------------------
  // Background loops (ingest, reaper, scheduler, recheck) must run in exactly
  // ONE process. Set to 0 on every additional API replica, or those replicas
  // will each schedule scans and consume the same jobs.
  HARIZEON_RUN_LOOPS: bool(true),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  DB_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().int().nonnegative().default(30000),
  // Server-side wall clock so a stuck query cannot hold a pool slot forever.
  DB_STATEMENT_TIMEOUT_MS: z.coerce.number().int().nonnegative().default(15000),
  BODY_LIMIT_BYTES: z.coerce.number().int().positive().default(262144),
  RATE_LIMIT_ENABLED: bool(isProd),
  RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_AUTH_PER_MIN: z.coerce.number().int().positive().default(20),
});

export const config = Env.parse(process.env);

// Fail at boot, not at first channel write: sealed secrets need the key, and a
// production deployment without it would 500 on channel creation.
if (config.NODE_ENV === "production" && !config.HARIZEON_MASTER_KEY) {
  throw new Error(
    "HARIZEON_MASTER_KEY is required in production (notification channel secrets are sealed with it)",
  );
}
