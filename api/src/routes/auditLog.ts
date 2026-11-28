import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { withTx } from "../db";

export type AuditLogRow = {
  id: string;
  org_id: string;
  actor_type: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  ip: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function auditLogRoutes(app: FastifyInstance) {
  // GET /v1/audit-log
  app.get("/audit-log", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const query = req.query as { limit?: string; action?: string };
    const limit = Math.min(parseInt(query.limit ?? "50", 10), 100);

    return withTx(async (client) => {
      let sql = `SELECT id, org_id, actor_type, actor_id, action, target_type, target_id, ip, user_agent, metadata, created_at
                 FROM audit_log WHERE org_id = $1`;
      const params: unknown[] = [orgId];

      if (query.action) {
        params.push(query.action);
        sql += ` AND action = $${params.length}`;
      }

      sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const res = await client.query<AuditLogRow>(sql, params);
      return { logs: res.rows };
    }, orgId);
  });
}
