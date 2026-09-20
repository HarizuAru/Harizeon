import type { FastifyPluginAsync } from "fastify";
import {
  listChannels,
  getChannel,
  createChannel,
  updateChannel,
  deleteChannel,
  testChannel,
  type ChannelType,
  type SeverityLevel,
} from "../repo/channels";

export const channelRoutes: FastifyPluginAsync = async (app) => {
  app.get("/channels", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const data = await listChannels(app.pg, orgId);
    reply.send({ data });
  });

  app.get<{ Params: { id: string } }>("/channels/:id", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const channel = await getChannel(app.pg, orgId, req.params.id);
    reply.send({ channel });
  });

  app.post<{
    Body: {
      type: ChannelType;
      config: Record<string, unknown>;
      min_severity?: SeverityLevel;
      enabled?: boolean;
    };
  }>("/channels", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const channel = await createChannel(app.pg, orgId, req.body ?? {
      type: "email",
      config: {},
    });
    reply.status(201).send({ channel });
  });

  app.patch<{
    Params: { id: string };
    Body: {
      config?: Record<string, unknown>;
      min_severity?: SeverityLevel;
      enabled?: boolean;
    };
  }>("/channels/:id", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const channel = await updateChannel(app.pg, orgId, req.params.id, req.body ?? {});
    reply.send({ channel });
  });

  app.delete<{ Params: { id: string } }>("/channels/:id", async (req, reply) => {
    const orgId = req.auth!.orgId;
    await deleteChannel(app.pg, orgId, req.params.id);
    reply.status(204).send();
  });

  app.post<{ Params: { id: string } }>("/channels/:id/test", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const result = await testChannel(app.pg, orgId, req.params.id);
    reply.send(result);
  });
};
