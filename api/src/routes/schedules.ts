import type { FastifyPluginAsync } from "fastify";
import { withTx } from "../db";
import {
  listSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../repo/schedules";
import { getProjectByOrg } from "../repo/orgs";
import { writeAudit } from "../lib/audit";

export const scheduleRoutes: FastifyPluginAsync = async (app) => {
  app.get("/schedules", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const data = await withTx((c) => listSchedules(c, orgId), orgId);
    reply.send({ data });
  });

  app.get<{ Params: { id: string } }>("/schedules/:id", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const schedule = await withTx((c) => getSchedule(c, orgId, req.params.id), orgId);
    reply.send({ schedule });
  });

  app.post<{
    Body: {
      cron: string;
      profile?: "quick" | "standard" | "deep";
      timezone?: string;
      enabled?: boolean;
    };
  }>("/schedules", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const schedule = await withTx(async (c) => {
      const project = await getProjectByOrg(c, orgId);
      const row = await createSchedule(c, orgId, { ...(req.body ?? { cron: "" }), project_id: project?.id ?? null });
      await writeAudit(c, {
        orgId,
        actorType: req.auth!.actorType,
        actorId: req.auth!.userId ?? req.auth!.apiKeyId,
        action: "schedule.create",
        targetType: "schedule",
        targetId: row.id,
        metadata: { cron: row.cron, profile: row.profile },
      });
      return row;
    }, orgId);
    reply.status(201).send({ schedule });
  });

  app.patch<{
    Params: { id: string };
    Body: { cron?: string; profile?: "quick" | "standard" | "deep"; timezone?: string; enabled?: boolean };
  }>("/schedules/:id", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const schedule = await withTx(async (c) => {
      const row = await updateSchedule(c, orgId, req.params.id, req.body ?? {});
      await writeAudit(c, {
        orgId,
        actorType: req.auth!.actorType,
        actorId: req.auth!.userId ?? req.auth!.apiKeyId,
        action: "schedule.update",
        targetType: "schedule",
        targetId: row.id,
        metadata: { ...(req.body ?? {}) },
      });
      return row;
    }, orgId);
    reply.send({ schedule });
  });

  app.delete<{ Params: { id: string } }>("/schedules/:id", async (req, reply) => {
    const orgId = req.auth!.orgId;
    await withTx(async (c) => {
      await deleteSchedule(c, orgId, req.params.id);
      await writeAudit(c, {
        orgId,
        actorType: req.auth!.actorType,
        actorId: req.auth!.userId ?? req.auth!.apiKeyId,
        action: "schedule.delete",
        targetType: "schedule",
        targetId: req.params.id,
      });
    }, orgId);
    reply.status(204).send();
  });
};
