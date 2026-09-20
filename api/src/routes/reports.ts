import type { FastifyPluginAsync } from "fastify";
import {
  listReports,
  getReport,
  createReport,
  type ReportType,
} from "../repo/reports";

export const reportRoutes: FastifyPluginAsync = async (app) => {
  app.get("/reports", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const data = await listReports(app.pg, orgId);
    reply.send({ data });
  });

  app.get<{ Params: { id: string } }>("/reports/:id", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const { report, content } = await getReport(app.pg, orgId, req.params.id);
    reply.send({ report, content });
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
    const result = await createReport(app.pg, orgId, userId, req.body ?? { type: "executive" });
    reply.status(201).send(result);
  });
};
