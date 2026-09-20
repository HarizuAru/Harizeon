import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { withTx } from "../db";
import { getOrgById, updateOrg, getProjectByOrg } from "../repo/orgs";
import { getMembershipsByOrg } from "../repo/memberships";
import { writeAudit } from "../lib/audit";
import { notFound } from "../lib/errors";

const UpdateOrgBody = z.object({ name: z.string().min(1).max(100) });
const InviteMemberBody = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "readonly"]).default("member"),
});

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
    return withTx(async (client) => {
      const res = await client.query(
        `SELECT m.id, m.org_id, m.user_id, m.role, m.invited_by, m.accepted_at, m.created_at,
                u.email as user_email, u.name as user_name
         FROM memberships m
         LEFT JOIN users u ON u.id = m.user_id
         WHERE m.org_id = $1 ORDER BY m.created_at ASC`,
        [orgId],
      );
      return { members: res.rows };
    }, orgId);
  });

  // POST /v1/org/members/invite
  app.post("/org/members/invite", {
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const orgId = req.auth!.orgId;
      const body = InviteMemberBody.parse(req.body);

      const invited = await withTx(async (client) => {
        // Find or create pending user
        const existing = await client.query(`SELECT id, email FROM users WHERE email = $1`, [body.email]);
        let userId: string;
        if (existing.rows.length > 0) {
          userId = existing.rows[0].id;
        } else {
          const uRes = await client.query(
            `INSERT INTO users (email, password_hash, name)
             VALUES ($1, 'invited_placeholder_hash', $2) RETURNING id`,
            [body.email, body.email.split("@")[0]],
          );
          userId = uRes.rows[0].id;
        }

        const memRes = await client.query(
          `INSERT INTO memberships (org_id, user_id, role, invited_by, accepted_at)
           VALUES ($1, $2, $3, $4, now())
           ON CONFLICT (org_id, user_id) DO UPDATE SET role = $3
           RETURNING *`,
          [orgId, userId, body.role, req.auth!.userId ?? null],
        );

        await writeAudit(client, {
          orgId,
          actorType: req.auth!.actorType,
          actorId: req.auth!.userId ?? req.auth!.apiKeyId,
          action: "member.invite",
          targetType: "user",
          targetId: userId,
          metadata: { email: body.email, role: body.role },
        });

        return {
          ...memRes.rows[0],
          user_email: body.email,
          user_name: body.email.split("@")[0],
        };
      }, orgId);

      return reply.status(201).send({ member: invited });
    },
  });

  // DELETE /v1/org/members/:id
  app.delete("/org/members/:id", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const { id } = req.params as { id: string };

    return withTx(async (client) => {
      await client.query(`DELETE FROM memberships WHERE id = $1 AND org_id = $2`, [id, orgId]);
      await writeAudit(client, {
        orgId,
        actorType: req.auth!.actorType,
        actorId: req.auth!.userId ?? req.auth!.apiKeyId,
        action: "member.remove",
        targetType: "membership",
        targetId: id,
      });
      return { success: true };
    }, orgId);
  });
}
