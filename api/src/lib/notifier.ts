import { sendEmail } from "./email";
import { signWebhook } from "./seal";
import { isPublicHost, resolvesToPublicOnly } from "./verify";

export type NotifyEvent = {
  kind: "scan.completed" | "channel.test" | "asset.discovered";
  orgId: string;
  title: string;
  message: string;
  severity?: "info" | "low" | "medium" | "high" | "critical";
};

const RANK: Record<string, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };

export function meetsThreshold(severity: string | undefined, min: string): boolean {
  return (RANK[severity ?? "info"] ?? 0) >= (RANK[min] ?? 0);
}

/** A user-supplied destination is an SSRF surface for the control plane (§11). */
export function validateDestination(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return "destination must be a valid URL";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return "destination must be http(s)";
  if (!isPublicHost(url.hostname)) return "destination must be a public host";
  return null;
}

const TIMEOUT_MS = 8000;

async function postJson(url: string, body: string, headers: Record<string, string>): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "POST", headers, body, signal: controller.signal, redirect: "error" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } finally {
    clearTimeout(timer);
  }
}

export type DeliveryResult = { ok: boolean; error?: string };

export type DeliverOpts = {
  force?: boolean;
  /** Test seam: defaults to a real DNS resolution check (§11). */
  resolvePublic?: (host: string) => Promise<boolean>;
};

/**
 * Deliver one event to one channel. The destination (already unsealed by the
 * caller) is validated before any request. Never throws.
 */
export async function deliver(
  channel: { type: string; config: Record<string, unknown>; min_severity?: string },
  event: NotifyEvent,
  opts: DeliverOpts = {},
): Promise<DeliveryResult> {
  if (!opts.force && !meetsThreshold(event.severity, channel.min_severity ?? "high")) {
    return { ok: true }; // filtered by min_severity: not an error
  }
  const config = channel.config ?? {};
  try {
    if (channel.type === "email") {
      const to = String(config.address ?? config.to ?? "");
      if (!to) return { ok: false, error: "email channel has no address" };
      await sendEmail({ to, subject: event.title, text: event.message });
      return { ok: true };
    }

    const url = String(config.url ?? config.webhook_url ?? "");
    if (!url) return { ok: false, error: `${channel.type} channel has no webhook URL` };
    const invalid = validateDestination(url);
    if (invalid) return { ok: false, error: invalid };
    // A public-looking name can still resolve to an internal address (§11).
    const checkPublic = opts.resolvePublic ?? resolvesToPublicOnly;
    if (!(await checkPublic(new URL(url).hostname))) {
      return { ok: false, error: "destination does not resolve to a public host" };
    }

    if (channel.type === "slack" || channel.type === "discord") {
      await postJson(url, JSON.stringify({ text: `*${event.title}*\n${event.message}` }), {
        "content-type": "application/json",
      });
      return { ok: true };
    }

    // generic webhook: signed + replay-protected (§08)
    const body = JSON.stringify({
      kind: event.kind,
      org_id: event.orgId,
      title: event.title,
      message: event.message,
      severity: event.severity ?? null,
      at: new Date().toISOString(),
    });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const secret = typeof config.secret === "string" && config.secret ? config.secret : url;
    await postJson(url, body, {
      "content-type": "application/json",
      "X-Harizeon-Signature": signWebhook(secret, timestamp, body),
      "X-Harizeon-Timestamp": timestamp,
    });
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "delivery failed" };
  }
}
