import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { withTx } from "../db";
import {
  listReports,
  getReport,
  createReport,
  publicReport,
} from "../repo/reports";
import { requireRole, requireScope } from "../plugins/auth";

const ReportParams = z.object({ id: z.string().uuid() });

export const CreateReportBody = z
  .object({
    type: z.enum(["executive", "technical", "compliance"]).default("executive"),
    period_start: z.string().datetime().nullable().optional(),
    period_end: z.string().datetime().nullable().optional(),
    asset_ids: z.array(z.string().uuid()).max(200).optional(),
    include_resolved: z.boolean().optional(),
  })
  .strict();

export const reportRoutes: FastifyPluginAsync = async (app) => {
  app.get("/reports", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const data = await withTx((c) => listReports(c, orgId), orgId);
    reply.send({ data: data.map(publicReport) });
  });

  app.get<{ Params: { id: string } }>("/reports/:id", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const { id } = ReportParams.parse(req.params);
    const result = await withTx((c) => getReport(c, orgId, id), orgId);
    reply.send({ report: publicReport(result.report), content: result.content });
  });

  app.post(
    "/reports",
    { preHandler: [requireRole(["owner", "admin", "member"]), requireScope("reports:write")] },
    async (req, reply) => {
      const orgId = req.auth!.orgId;
      const userId = req.auth!.userId ?? null;
      const body = CreateReportBody.parse(req.body);
      const result = await withTx(
        (c) => createReport(c, orgId, userId, body),
        orgId,
      );
      reply.status(201).send({ report: publicReport(result.report), content: result.content });
    },
  );
};
