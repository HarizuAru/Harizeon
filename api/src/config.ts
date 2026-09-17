import { z } from "zod";

const Env = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().min(1),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  COOKIE_DOMAIN: z.string().optional(),
  HARIZEON_SESSION_SECRET: z.string().min(32).optional(),
  HARIZEON_MASTER_KEY: z.string().min(32).optional(),
  PUBLIC_API_BASE: z.string().url().default("http://localhost:8080"),
});

export const config = Env.parse(process.env);