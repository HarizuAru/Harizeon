import type { Queryable } from "../db";

export type AuditEvent = {
  orgId: string;
  actorType: "user" | "api_key" | "system";
  actorId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Write an audit-log entry within the caller's transaction (GUC already set).
 */
export async function writeAudit(client: Queryable, e: AuditEvent): Promise<void> {
  await client.query(
    `INSERT INTO audit_log (org_id, actor_type, actor_id, action, target_type, target_id, ip, user_agent, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      e.orgId,
      e.actorType,
      e.actorId ?? null,
      e.action,
      e.targetType ?? null,
      e.targetId ?? null,
      e.ip ?? null,
      e.userAgent ?? null,
      e.metadata ? JSON.stringify(e.metadata) : "{}",
    ],
  );
}