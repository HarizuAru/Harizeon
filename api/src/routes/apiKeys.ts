import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { withTx } from "../db";
import { createApiKey, listApiKeys, revokeApiKey } from "../repo/apiKeys";
import { writeAudit } from "../lib/audit";

const CreateApiKeyBody = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).default([]),
});

export async function apiKeyRoutes(app: FastifyInstance) {
  // GET /v1/api-keys
  app.get("/api-keys", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    return withTx(async (client) => ({ keys: await listApiKeys(client, orgId) }), orgId);
  });

  // POST /v1/api-keys — returns the secret ONCE
  app.post("/api-keys", {
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const orgId = req.auth!.orgId;
      const body = CreateApiKeyBody.parse(req.body);

      const created = await withTx(async (client) => {
        const { key, row } = await createApiKey(client, {
          orgId,
          name: body.name,
          scopes: body.scopes,
        });
        await writeAudit(client, {
          orgId,
          actorType: req.auth!.actorType,
          actorId: req.auth!.userId ?? req.auth!.apiKeyId,
          action: "apikey.create",
          targetType: "api_key",
          targetId: row.id,
          metadata: { name: body.name, scopes: body.scopes },
        });
        return { key, row };
      }, orgId);

      return reply.status(201).send({
        key: created.key, // shown once
        prefix: created.row.prefix,
        name: created.row.name,
        scopes: created.row.scopes,
        createdAt: created.row.created_at,
      });
    },
  });

  // DELETE /v1/api-keys/:id
  app.delete("/api-keys/:id", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const { id } = req.params as { id: string };
    await withTx(async (client) => {
      await revokeApiKey(client, orgId, id);
      await writeAudit(client, {
        orgId,
        actorType: req.auth!.actorType,
        actorId: req.auth!.userId ?? req.auth!.apiKeyId,
        action: "apikey.revoke",
        targetType: "api_key",
        targetId: id,
      });
    }, orgId);
    return { ok: true };
  });
}
