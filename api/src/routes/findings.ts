import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { withTx } from "../db";
import * as repo from "../repo/findings";
import { badRequest, notFound } from "../lib/errors";

const ListQuery = z.object({
  severity: z.enum(["info", "low", "medium", "high", "critical"]).optional(),
  status: z.enum(["open", "acknowledged", "fixed", "false_positive", "accepted"]).optional(),
  asset_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export async function findingRoutes(app: FastifyInstance) {
  // GET /v1/findings?severity=&status=&asset_id=&limit=&cursor=
  app.get("/findings", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const q = ListQuery.parse(req.query);
    try {
      return await withTx((c) => repo.listFindings(c, orgId, q), orgId);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "Invalid cursor") {
        throw badRequest("invalid_cursor", "Invalid pagination cursor");
      }
      throw e;
    }
  });

  // GET /v1/findings/:id
  app.get("/findings/:id", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const { id } = req.params as { id: string };
    const finding = await withTx((c) => repo.getFinding(c, orgId, id), orgId);
    if (!finding) {
      throw notFound("finding_not_found", "Finding not found");
    }
    return { finding };
  });
}

export type { FindingRow } from "../repo/findings";
