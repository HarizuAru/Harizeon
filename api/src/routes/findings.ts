import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { withTx } from "../db";
import * as repo from "../repo/findings";
import { badRequest, notFound } from "../lib/errors";
import { writeAudit } from "../lib/audit";

const ListQuery = z.object({
  severity: z.enum(["info", "low", "medium", "high", "critical"]).optional(),
  status: z.enum(["open", "acknowledged", "fixed", "false_positive", "accepted"]).optional(),
  asset_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

const PatchBody = z.object({
  status: z.enum(["open", "acknowledged", "fixed", "false_positive", "accepted"]),
  status_reason: z.string().max(500).optional(),
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

  // GET /v1/findings/counts — severity counts for the filter rail
  app.get("/findings/counts", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    return withTx((c) => repo.severityCounts(c, orgId), orgId);
  });

  // GET /v1/findings/:id
  app.get("/findings/:id", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const { id } = req.params as { id: string };
    const finding = await withTx((c) => repo.getFinding(c, orgId, id), orgId);
    if (!finding) {
      throw notFound("finding_not_found", "Finding not found");
    }
    const events = await withTx((c) => repo.listFindingEvents(c, id), orgId);
    return { finding, events };
  });

  // PATCH /v1/findings/:id { status, status_reason }
  app.patch("/findings/:id", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const { id } = req.params as { id: string };
    const body = PatchBody.parse(req.body);
    const actorId = req.auth!.userId ?? req.auth!.apiKeyId;

    const result = await withTx(async (c) => {
      const before = await repo.getFinding(c, orgId, id);
      if (!before) throw notFound("finding_not_found", "Finding not found");
      if (before.status === body.status) {
        return { finding: before, changed: false };
      }

      const updated = await repo.setFindingStatus(c, orgId, id, body.status, body.status_reason);
      if (!updated) throw notFound("finding_not_found", "Finding not found");

      await repo.recordFindingTransition(c, {
        findingId: id,
        actorId: actorId,
        from: before.status,
        to: body.status,
        note: body.status_reason,
      });
      await writeAudit(c, {
        orgId,
        actorType: req.auth!.actorType,
        actorId,
        action: `finding.${body.status}`,
        targetType: "finding",
        targetId: id,
        metadata: { from: before.status, to: body.status },
      });
      return { finding: updated, changed: true };
    }, orgId);

    return { finding: result.finding, changed: result.changed };
  });
}

export type { FindingRow } from "../repo/findings";
