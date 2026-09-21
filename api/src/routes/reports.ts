import type { FastifyPluginAsync } from "fastify";
import { withTx } from "../db";
import {
  listReports,
  getReport,
  createReport,
  type ReportType,
} from "../repo/reports";

export const reportRoutes: FastifyPluginAsync = async (app) => {
  app.get("/reports", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const data = await withTx((c) => listReports(c, orgId), orgId);
    reply.send({ data });
  });

  app.get<{ Params: { id: string } }>("/reports/:id", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const result = await withTx((c) => getReport(c, orgId, req.params.id), orgId);
    reply.send({ report: result.report, content: result.content });
  });

  app.post<{
    Body: {
      type: ReportType;
      period_start?: string | null;
      period_end?: string | null;
      asset_ids?: string[];
      include_resolved?: boolean;
    };
  }>("/reports", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const userId = req.auth!.userId ?? null;
    const result = await withTx(
      (c) => createReport(c, orgId, userId, req.body ?? { type: "executive" }),
      orgId,
    );
    reply.status(201).send(result);
  });
};
