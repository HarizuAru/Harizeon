import type { Queryable } from "../db";
import { config } from "../config";
import { badRequest, notFound } from "../lib/errors";
import { redactConfig, sealConfig, openConfig } from "../lib/seal";
import { deliver } from "../lib/notifier";

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

const COLS = `id, org_id, type, config, enabled, min_severity, verified_at, created_at, updated_at`;

/** Secrets inside config are encrypted at rest (§11); responses are redacted. */
export function publicChannel(row: ChannelRow): ChannelRow {
  return { ...row, config: redactConfig(row.config) };
}

export async function listChannels(db: Queryable, orgId: string): Promise<ChannelRow[]> {
  const res = await db.query<ChannelRow>(
    `SELECT ${COLS} FROM notification_channels WHERE org_id = $1 ORDER BY created_at DESC`,
    [orgId],
  );
  return res.rows;
}

export async function getChannel(db: Queryable, orgId: string, id: string): Promise<ChannelRow> {
  const res = await db.query<ChannelRow>(
    `SELECT ${COLS} FROM notification_channels WHERE org_id = $1 AND id = $2`,
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
  const sealed = sealConfig(input.config ?? {}, config.HARIZEON_MASTER_KEY);

  const res = await db.query<ChannelRow>(
    `INSERT INTO notification_channels (org_id, type, config, min_severity, enabled)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLS}`,
    [orgId, input.type, JSON.stringify(sealed), minSeverity, enabled],
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
  const nextConfig =
    input.config !== undefined ? sealConfig(input.config, config.HARIZEON_MASTER_KEY) : current.config;
  const minSeverity = input.min_severity !== undefined ? input.min_severity : current.min_severity;
  const enabled = input.enabled !== undefined ? input.enabled : current.enabled;

  const res = await db.query<ChannelRow>(
    `UPDATE notification_channels
     SET config = $1, min_severity = $2, enabled = $3, updated_at = now()
     WHERE org_id = $4 AND id = $5
     RETURNING ${COLS}`,
    [JSON.stringify(nextConfig), minSeverity, enabled, orgId, id],
  );
  return res.rows[0];
}

export async function deleteChannel(db: Queryable, orgId: string, id: string): Promise<void> {
  const res = await db.query(`DELETE FROM notification_channels WHERE org_id = $1 AND id = $2`, [orgId, id]);
  if ((res.rowCount ?? 0) === 0) throw notFound("channel_not_found", "Notification channel not found");
}

/**
 * Send a real test event. Marks `verified_at` ONLY on success and returns an
 * honest result — a channel that cannot deliver must not look healthy.
 */
export async function testChannel(
  db: Queryable,
  orgId: string,
  id: string,
): Promise<{ ok: boolean; message: string }> {
  const channel = await getChannel(db, orgId, id);
  const opened = openConfig(channel.config, config.HARIZEON_MASTER_KEY);

  const result = await deliver(
    { type: channel.type, config: opened },
    {
      kind: "channel.test",
      orgId,
      severity: "critical",
      title: "Harizeon test notification",
      message: "This is a test from your Harizeon notification channel.",
    },
    { force: true },
  );

  if (result.ok) {
    await db.query(
      `UPDATE notification_channels SET verified_at = now(), updated_at = now() WHERE org_id = $1 AND id = $2`,
      [orgId, id],
    );
    return { ok: true, message: `Test delivered to ${channel.type} channel.` };
  }
  return { ok: false, message: result.error ?? "Test delivery failed." };
}
