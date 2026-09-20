import type { FastifyPluginAsync } from "fastify";
import {
  listSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../repo/schedules";

export const scheduleRoutes: FastifyPluginAsync = async (app) => {
  app.get("/schedules", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const data = await listSchedules(app.pg, orgId);
    reply.send({ data });
  });

  app.get<{ Params: { id: string } }>("/schedules/:id", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const schedule = await getSchedule(app.pg, orgId, req.params.id);
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
    const schedule = await createSchedule(app.pg, orgId, req.body ?? {});
    reply.status(201).send({ schedule });
  });

  app.patch<{
    Params: { id: string };
    Body: {
      cron?: string;
      profile?: "quick" | "standard" | "deep";
      timezone?: string;
      enabled?: boolean;
    };
  }>("/schedules/:id", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const schedule = await updateSchedule(app.pg, orgId, req.params.id, req.body ?? {});
    reply.send({ schedule });
  });

  app.delete<{ Params: { id: string } }>("/schedules/:id", async (req, reply) => {
    const orgId = req.auth!.orgId;
    await deleteSchedule(app.pg, orgId, req.params.id);
    reply.status(204).send();
  });
};
