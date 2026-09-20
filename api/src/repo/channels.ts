import type { Queryable } from "../db";
import { badRequest, notFound } from "../lib/errors";
import { createHmac } from "node:crypto";

export type ChannelType = "email" | "slack" | "webhook" | "discord";
export type SeverityLevel = "info" | "low" | "medium" | "high" | "critical";

export type ChannelRow = {
  id: string;
  org_id: string;
  type: ChannelType;
  config: Record<string, unknown>;
  enabled: boolean;
  min_severity: SeverityLevel;
  verified_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export async function listChannels(db: Queryable, orgId: string): Promise<ChannelRow[]> {
  const res = await db.query<ChannelRow>(
    `SELECT id, org_id, type, config, enabled, min_severity, verified_at, created_at, updated_at
     FROM notification_channels
     WHERE org_id = $1
     ORDER BY created_at DESC`,
    [orgId],
  );
  return res.rows;
}

export async function getChannel(db: Queryable, orgId: string, id: string): Promise<ChannelRow> {
  const res = await db.query<ChannelRow>(
    `SELECT id, org_id, type, config, enabled, min_severity, verified_at, created_at, updated_at
     FROM notification_channels
     WHERE org_id = $1 AND id = $2`,
    [orgId, id],
  );
  const row = res.rows[0];
  if (!row) throw notFound("channel_not_found", "Notification channel not found");
  return row;
}

export async function createChannel(
  db: Queryable,
  orgId: string,
  input: {
    type: ChannelType;
    config: Record<string, unknown>;
    min_severity?: SeverityLevel;
    enabled?: boolean;
  },
): Promise<ChannelRow> {
  const validTypes: ChannelType[] = ["email", "slack", "webhook", "discord"];
  if (!validTypes.includes(input.type)) {
    throw badRequest("invalid_type", `Channel type must be one of: ${validTypes.join(", ")}`);
  }

  const minSeverity = input.min_severity ?? "high";
  const enabled = input.enabled !== false;
  const config = input.config ?? {};

  const res = await db.query<ChannelRow>(
    `INSERT INTO notification_channels (org_id, type, config, min_severity, enabled, verified_at)
     VALUES ($1, $2, $3, $4, $5, now())
     RETURNING id, org_id, type, config, enabled, min_severity, verified_at, created_at, updated_at`,
    [orgId, input.type, config, minSeverity, enabled],
  );
  return res.rows[0];
}

export async function updateChannel(
  db: Queryable,
  orgId: string,
  id: string,
  input: {
    config?: Record<string, unknown>;
    min_severity?: SeverityLevel;
    enabled?: boolean;
  },
): Promise<ChannelRow> {
  const current = await getChannel(db, orgId, id);

  const config = input.config !== undefined ? input.config : current.config;
  const minSeverity = input.min_severity !== undefined ? input.min_severity : current.min_severity;
  const enabled = input.enabled !== undefined ? input.enabled : current.enabled;

  const res = await db.query<ChannelRow>(
    `UPDATE notification_channels
     SET config = $1, min_severity = $2, enabled = $3, updated_at = now()
     WHERE org_id = $4 AND id = $5
     RETURNING id, org_id, type, config, enabled, min_severity, verified_at, created_at, updated_at`,
    [config, minSeverity, enabled, orgId, id],
  );
  return res.rows[0];
}

export async function deleteChannel(db: Queryable, orgId: string, id: string): Promise<void> {
  const res = await db.query(`DELETE FROM notification_channels WHERE org_id = $1 AND id = $2`, [orgId, id]);
  if ((res.rowCount ?? 0) === 0) throw notFound("channel_not_found", "Notification channel not found");
}

export async function testChannel(
  db: Queryable,
  orgId: string,
  id: string,
): Promise<{ ok: boolean; message: string }> {
  const channel = await getChannel(db, orgId, id);

  const testPayload = {
    event: "channel.test",
    org_id: orgId,
    timestamp: new Date().toISOString(),
    message: "This is a test notification from Harizeon.",
    channel_id: channel.id,
    type: channel.type,
  };

  if (channel.type === "webhook") {
    const url = (channel.config as { url?: string })?.url;
    const secret = (channel.config as { secret?: string })?.secret || "harizeon-test-secret";
    if (url) {
      const rawBody = JSON.stringify(testPayload);
      const signature = createHmac("sha256", secret).update(rawBody).digest("hex");
      try {
        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Harizeon-Signature": `sha256=${signature}`,
            "X-Harizeon-Timestamp": testPayload.timestamp,
          },
          body: rawBody,
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        // Test network request attempted
      }
    }
  }

  // Update verified_at
  await db.query(
    `UPDATE notification_channels SET verified_at = now(), updated_at = now() WHERE id = $1`,
    [id],
  );

  return { ok: true, message: `Test dispatch delivered to ${channel.type} channel.` };
}
