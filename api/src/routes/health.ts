import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (_req, _reply) => {
    return { status: "ok", service: "harizeon-api", version: "0.1.0" };
  });
}