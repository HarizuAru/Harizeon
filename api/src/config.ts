import { z } from "zod";

const Env = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  // Namespaces the Redis Streams keys so tests never touch a running worker's
  // queue (e.g. "test:").
  HARIZEON_QUEUE_PREFIX: z.string().default(""),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  COOKIE_DOMAIN: z.string().optional(),
  HARIZEON_SESSION_SECRET: z.string().min(32).optional(),
  HARIZEON_MASTER_KEY: z.string().min(32).optional(),
  PUBLIC_API_BASE: z.string().url().default("http://localhost:8080"),
  // Allow verification fetches to non-public hosts (loopback/test). NEVER true
  // in production — the SSRF guard (§11) must stay enforced where it matters.
  VERIFY_ALLOW_PRIVATE: z.coerce.boolean().default(false),
});

export const config = Env.parse(process.env);