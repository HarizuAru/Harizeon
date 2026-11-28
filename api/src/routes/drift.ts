import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { withTx } from "../db";
import * as repo from "../repo/drift";
import { badRequest } from "../lib/errors";

const ListQuery = z.object({
  severity: z.string().optional(),
  event_type: z.string().optional(),
  asset_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export async function driftRoutes(app: FastifyInstance) {
  // GET /v1/drift?severity=&event_type=&asset_id=&limit=&cursor=
  app.get("/drift", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const q = ListQuery.parse(req.query);
    try {
      return await withTx((c) => repo.listDriftEvents(c, orgId, q), orgId);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "Invalid cursor") {
        throw badRequest("invalid_cursor", "Invalid pagination cursor");
      }
      throw e;
    }
  });
}
