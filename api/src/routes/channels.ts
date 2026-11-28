import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { withTx } from "../db";
import {
  listChannels,
  getChannel,
  createChannel,
  updateChannel,
  deleteChannel,
  testChannel,
  publicChannel,
} from "../repo/channels";
import { writeAudit } from "../lib/audit";
import { requireRole, requireScope } from "../plugins/auth";

const ChannelParams = z.object({ id: z.string().uuid() });

const ChannelConfigSchema = z
  .object({
    address: z.string().email().optional(),
    to: z.string().email().optional(),
    recipients: z.union([z.string().min(1).max(1000), z.array(z.string().email()).max(20)]).optional(),
    url: z.string().url().optional(),
    webhook_url: z.string().url().optional(),
    secret: z.string().min(1).max(256).optional(),
    channel: z.string().min(1).max(128).optional(),
  })
  .strict();

export const CreateChannelBody = z
  .object({
    type: z.enum(["email", "slack", "webhook", "discord"]),
    config: ChannelConfigSchema,
    min_severity: z.enum(["info", "low", "medium", "high", "critical"]).optional(),
    enabled: z.boolean().optional(),
  })
  .strict();

export const UpdateChannelBody = z
  .object({
    config: ChannelConfigSchema.optional(),
    min_severity: z.enum(["info", "low", "medium", "high", "critical"]).optional(),
    enabled: z.boolean().optional(),
  })
  .strict()
  .refine((v) => v.config !== undefined || v.min_severity !== undefined || v.enabled !== undefined, {
    message: "At least one field must be provided",
  });

export const channelRoutes: FastifyPluginAsync = async (app) => {
  app.get("/channels", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const data = await withTx((c) => listChannels(c, orgId), orgId);
    reply.send({ data: data.map(publicChannel) });
  });

  app.get<{ Params: { id: string } }>("/channels/:id", async (req, reply) => {
    const orgId = req.auth!.orgId;
    const { id } = ChannelParams.parse(req.params);
    const channel = await withTx((c) => getChannel(c, orgId, id), orgId);
    reply.send({ channel: publicChannel(channel) });
  });

  app.post("/channels", { preHandler: [requireRole(["owner", "admin"]), requireScope("channels:write")] }, async (req, reply) => {
    const orgId = req.auth!.orgId;
    const body = CreateChannelBody.parse(req.body);
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

  app.patch<{ Params: { id: string } }>(
    "/channels/:id",
    { preHandler: [requireRole(["owner", "admin"]), requireScope("channels:write")] },
    async (req, reply) => {
      const orgId = req.auth!.orgId;
      const { id } = ChannelParams.parse(req.params);
      const body = UpdateChannelBody.parse(req.body);
      const channel = await withTx((c) => updateChannel(c, orgId, id, body), orgId);
      reply.send({ channel: publicChannel(channel) });
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/channels/:id",
    { preHandler: [requireRole(["owner", "admin"]), requireScope("channels:write")] },
    async (req, reply) => {
      const orgId = req.auth!.orgId;
      const { id } = ChannelParams.parse(req.params);
      await withTx(async (c) => {
        await deleteChannel(c, orgId, id);
        await writeAudit(c, {
          orgId,
          actorType: req.auth!.actorType,
          actorId: req.auth!.userId ?? req.auth!.apiKeyId,
          action: "channel.delete",
          targetType: "channel",
          targetId: id,
        });
      }, orgId);
      reply.status(204).send();
    },
  );

  app.post<{ Params: { id: string } }>(
    "/channels/:id/test",
    { preHandler: [requireRole(["owner", "admin"]), requireScope("channels:write")] },
    async (req, reply) => {
      const orgId = req.auth!.orgId;
      const { id } = ChannelParams.parse(req.params);
      const result = await withTx((c) => testChannel(c, orgId, id), orgId);
      reply.send(result);
    },
  );
};
