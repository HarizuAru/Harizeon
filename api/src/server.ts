import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { fileURLToPath } from "node:url";
import { config } from "./config";
import { pool } from "./db";
import { authRoutes } from "./routes/auth";
import { orgRoutes } from "./routes/org";
import { apiKeyRoutes } from "./routes/apiKeys";
import { assetRoutes } from "./routes/assets";
import { scanRoutes } from "./routes/scans";
import { findingRoutes } from "./routes/findings";
import { scheduleRoutes } from "./routes/schedules";
import { channelRoutes } from "./routes/channels";
import { reportRoutes } from "./routes/reports";
import { billingRoutes } from "./routes/billing";
import { auditLogRoutes } from "./routes/auditLog";
import { healthRoutes } from "./routes/health";
import { authenticate, requireAuth } from "./plugins/auth";
import { requestIdHook, errorHandler } from "./lib/errors";
import { rateLimit } from "./lib/ratelimit";
import { startVerificationRecheck } from "./lib/recheck";
import { scanQueue } from "./services/scanQueue";
import { startIngest } from "./workers/ingest";
import { startReaper } from "./workers/reaper";
import { startScheduler } from "./workers/scheduler";

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === "production" ? "info" : "debug",
      redact: ["req.headers.authorization", "req.headers.cookie"],
    },
    // Cap request bodies; behind a proxy we need the real client IP for rate
    // limiting (X-Forwarded-For is only trusted when trustProxy is on).
    bodyLimit: config.BODY_LIMIT_BYTES,
    trustProxy: true,
  });

  app.decorate("pg", pool);

  app.addHook("onRequest", requestIdHook);
  app.setErrorHandler(errorHandler);

  await app.register(cookie);

  // Populate req.auth when a valid credential is present; never throws.
  app.addHook("preHandler", authenticate);
  // Rate limit AFTER authenticate so the bucket can key on the authenticated
  // user rather than the (shared) IP of the Next console.
  app.addHook("preHandler", rateLimit);

  // Public
  await app.register(healthRoutes);

  await app.register(
    async (v1) => {
    // Public auth routes — route paths already include /auth/...
    await v1.register(authRoutes);

      // Protected routes in their own encapsulated context: requireAuth is added
      // BEFORE these register, so it can never leak onto the public routes.
      // (route paths already include /org, /api-keys, /assets — no prefix here.)
      await v1.register(async (priv) => {
        priv.addHook("preHandler", requireAuth);
        await priv.register(orgRoutes);
        await priv.register(apiKeyRoutes);
        await priv.register(assetRoutes);
        await priv.register(scanRoutes);
        await priv.register(findingRoutes);
        await priv.register(scheduleRoutes);
        await priv.register(channelRoutes);
        await priv.register(reportRoutes);
        await priv.register(billingRoutes);
        await priv.register(auditLogRoutes);
      });
    },
    { prefix: "/v1" },
  );

  app.setNotFoundHandler((req, reply) => {
    reply.status(404).send({
      error: {
        code: "not_found",
        message: "Route not found",
        doc_url: "/docs/errors/not_found",
        request_id: req.id,
      },
    });
  });

  return app;
}

async function start() {
  const app = await buildServer();
  try {
    await app.listen({ port: config.PORT, host: "0.0.0.0" });

    // Background control-plane loops run in exactly ONE process. Extra API
    // replicas must set HARIZEON_RUN_LOOPS=0, or each would schedule scans and
    // consume the same Redis Streams jobs.
    if (config.HARIZEON_RUN_LOOPS) {
      // (NOT started by buildServer, so tests stay quiet.)
      await scanQueue.ready();
      startIngest(scanQueue);
      startReaper(scanQueue);
      startScheduler();
      // Hourly ownership re-verification (background system task, not a request).
      startVerificationRecheck();
    } else {
      app.log.warn(
        "background loops disabled (HARIZEON_RUN_LOOPS=0): ensure one process runs them",
      );
    }

    // Graceful shutdown so rolling restarts drain in-flight requests.
    const shutdown = async (signal: string) => {
      app.log.info({ signal }, "shutting down");
      try {
        await app.close();
        await pool.end();
      } finally {
        process.exit(0);
      }
    };
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
    process.on("SIGINT", () => void shutdown("SIGINT"));
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  await start();
}
