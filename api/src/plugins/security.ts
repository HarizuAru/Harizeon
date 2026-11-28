import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config";
import { forbidden } from "../lib/errors";

/**
 * Control-plane security headers & explicit CORS allowlist (§2.2 Security Audit).
 * Avoids `origin: true` and enforces fail-closed origin checks for browsers
 * while still allowing non-browser CLI/API clients without an Origin header.
 */
export async function securityPlugin(app: FastifyInstance): Promise<void> {
  const allowed = new Set(
    config.ALLOWED_ORIGINS.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  app.addHook("onRequest", async (req: FastifyRequest, reply: FastifyReply) => {
    reply.header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    reply.header("X-Frame-Options", "DENY");
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("Referrer-Policy", "no-referrer");

    const origin = req.headers.origin;
    if (!origin) return;

    if (!allowed.has(origin)) {
      throw forbidden("cors_origin_rejected", "CORS origin rejected");
    }

    reply.header("Access-Control-Allow-Origin", origin);
    reply.header("Access-Control-Allow-Credentials", "true");
    reply.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Request-Id");
    reply.header("Vary", "Origin");

    if (req.method === "OPTIONS") {
      return reply.status(204).send();
    }
  });
}
