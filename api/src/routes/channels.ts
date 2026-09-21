import type { FastifyPluginAsync } from "fastify";
import { withTx } from "../db";
import {
  listChannels,
  getChannel,
  createChannel,
  updateChannel,
  deleteChannel,
  testChannel,
  publicChannel,
  type ChannelType,
  type SeverityLevel,
} from "../repo/channels";
import { writeAudit } from "../lib/audit";

export const channelRoutes: FastifyPluginAsync = async (app) => {
  app.get("/channels", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const data = await withTx((c) => listChannels(c, orgId), orgId);
    reply.send({ data: data.map(publicChannel) });
  });

  app.get<{ Params: { id: string } }>("/channels/:id", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const channel = await withTx((c) => getChannel(c, orgId, req.params.id), orgId);
    reply.send({ channel: publicChannel(channel) });
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
    const body = req.body ?? { type: "email" as ChannelType, config: {} };
    const channel = await withTx(async (c) => {
      const row = await createChannel(c, orgId, body);
      await writeAudit(c, {
        orgId,
        actorType: req.auth!.actorType,
        actorId: req.auth!.userId ?? req.auth!.apiKeyId,
        action: "channel.create",
        targetType: "channel",
        targetId: row.id,
        metadata: { type: row.type, minSeverity: row.min_severity },
      });
      return row;
    }, orgId);
    reply.status(201).send({ channel: publicChannel(channel) });
  });

  app.patch<{
    Params: { id: string };
    Body: { config?: Record<string, unknown>; min_severity?: SeverityLevel; enabled?: boolean };
  }>("/channels/:id", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const channel = await withTx((c) => updateChannel(c, orgId, req.params.id, req.body ?? {}), orgId);
    reply.send({ channel: publicChannel(channel) });
  });

  app.delete<{ Params: { id: string } }>("/channels/:id", async (req, reply) => {
    const orgId = req.auth!.orgId;
    await withTx(async (c) => {
      await deleteChannel(c, orgId, req.params.id);
      await writeAudit(c, {
        orgId,
        actorType: req.auth!.actorType,
        actorId: req.auth!.userId ?? req.auth!.apiKeyId,
        action: "channel.delete",
        targetType: "channel",
        targetId: req.params.id,
      });
    }, orgId);
    reply.status(204).send();
  });

  app.post<{ Params: { id: string } }>("/channels/:id/test", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const result = await withTx((c) => testChannel(c, orgId, req.params.id), orgId);
    reply.send(result);
  });
};
