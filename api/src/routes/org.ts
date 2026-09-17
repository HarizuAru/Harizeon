import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { withTx } from "../db";
import { getOrgById, updateOrg, getProjectByOrg } from "../repo/orgs";
import { getMembershipsByOrg } from "../repo/memberships";
import { writeAudit } from "../lib/audit";
import { notFound } from "../lib/errors";

const UpdateOrgBody = z.object({ name: z.string().min(1).max(100) });

export async function orgRoutes(app: FastifyInstance) {
  // GET /v1/org
  app.get("/org", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    return withTx(async (client) => {
      const org = await getOrgById(client, orgId);
      if (!org) throw notFound("org_not_found", "Organization not found");
      const project = await getProjectByOrg(client, orgId);
      const members = await getMembershipsByOrg(client, orgId);
      return { org, project, members };
    }, orgId);
  });

  // PATCH /v1/org
  app.patch("/org", {
    handler: async (req: FastifyRequest, _reply: FastifyReply) => {
      const orgId = req.auth!.orgId;
      const body = UpdateOrgBody.parse(req.body);
      return withTx(async (client) => {
        const updated = await updateOrg(client, orgId, body);
        if (!updated) throw notFound("org_not_found", "Organization not found");
        await writeAudit(client, {
          orgId,
          actorType: req.auth!.actorType,
          actorId: req.auth!.userId ?? req.auth!.apiKeyId,
          action: "org.update",
          targetType: "org",
          targetId: orgId,
          metadata: { name: body.name },
        });
        return { org: updated };
      }, orgId);
    },
  });

  // GET /v1/org/members
  app.get("/org/members", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    return withTx(async (client) => ({ members: await getMembershipsByOrg(client, orgId) }), orgId);
  });
}
