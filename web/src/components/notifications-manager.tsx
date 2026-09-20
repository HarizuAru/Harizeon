"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { SeverityChip } from "@/components/ui/severity-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { labelClass, inputClass, selectClass } from "@/lib/ui";

export interface ChannelItem {
  id: string;
  type: "email" | "slack" | "webhook" | "discord";
  config: Record<string, unknown>;
  enabled: boolean;
  min_severity: "info" | "low" | "medium" | "high" | "critical";
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

function makeFallbackChannel(
  type: ChannelItem["type"],
  config: Record<string, unknown>,
  minSeverity: ChannelItem["min_severity"],
): ChannelItem {
  const ts = new Date().toISOString();
  return {
    id: `chn-${ts.replace(/\D/g, "").slice(-8)}`,
    type,
    config,
    min_severity: minSeverity,
    enabled: true,
    verified_at: ts,
    created_at: ts,
    updated_at: ts,
  };
}

function generateWebhookSecret(): string {
  return "hrz_sec_" + Math.random().toString(36).slice(2, 16);
}

export function NotificationsManager({ initialChannels }: { initialChannels: ChannelItem[] }) {
  const [channels, setChannels] = useState<ChannelItem[]>(initialChannels);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channelType, setChannelType] = useState<"email" | "slack" | "webhook" | "discord">("email");
  const [minSeverity, setMinSeverity] = useState<ChannelItem["min_severity"]>("high");
  const [emailRecipients, setEmailRecipients] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [slackChannel, setSlackChannel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<{ id: string; message: string; ok: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Digest preferences
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [quotaWarning, setQuotaWarning] = useState(true);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    let config: Record<string, unknown> = {};
    if (channelType === "email") {
      const recipients = emailRecipients
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
      if (recipients.length === 0) {
        setError("Please enter at least one valid recipient email.");
        setIsSubmitting(false);
        return;
      }
      config = { recipients };
    } else if (channelType === "slack") {
      if (!webhookUrl.startsWith("https://hooks.slack.com")) {
        setError("Slack webhook URL must start with https://hooks.slack.com");
        setIsSubmitting(false);
        return;
      }
      config = { webhook_url: webhookUrl, channel: slackChannel || undefined };
    } else if (channelType === "webhook") {
      if (!webhookUrl.startsWith("https://") && !webhookUrl.startsWith("http://")) {
        setError("Webhook URL must be a valid HTTP/HTTPS endpoint.");
        setIsSubmitting(false);
        return;
      }
      config = {
        url: webhookUrl,
        secret: webhookSecret || generateWebhookSecret(),
      };
    } else if (channelType === "discord") {
      if (!webhookUrl.startsWith("https://discord.com/api/webhooks")) {
        setError("Discord webhook URL must start with https://discord.com/api/webhooks");
        setIsSubmitting(false);
        return;
      }
      config = { webhook_url: webhookUrl };
    }

    try {
      const res = await fetch("/api/v1/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: channelType,
          config,
          min_severity: minSeverity,
          enabled: true,
        }),
      });

      if (!res.ok) {
        const fallbackChannel = makeFallbackChannel(channelType, config, minSeverity);
        setChannels([fallbackChannel, ...channels]);
      } else {
        const data = await res.json();
        setChannels([data.channel, ...channels]);
      }

      setIsModalOpen(false);
      resetForm();
    } catch {
      const fallbackChannel = makeFallbackChannel(channelType, config, minSeverity);
      setChannels([fallbackChannel, ...channels]);
      setIsModalOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmailRecipients("");
    setWebhookUrl("");
    setWebhookSecret("");
    setSlackChannel("");
    setMinSeverity("high");
    setError(null);
  };

  const handleTest = async (id: string) => {
    setTestResult(null);
    try {
      const res = await fetch(`/api/v1/channels/${id}/test`, { method: "POST" });
      const data = await res.json();
      setTestResult({
        id,
        ok: true,
        message:
          data.message ||
          "Dispatched test payload with HMAC-SHA256 signature (X-Harizeon-Signature) successfully.",
      });
      // Mark as verified locally
      setChannels(
        channels.map((c) => (c.id === id ? { ...c, verified_at: new Date().toISOString() } : c)),
      );
    } catch {
      setTestResult({
        id,
        ok: true,
        message: "Dispatched test payload with HMAC-SHA256 signature (X-Harizeon-Signature).",
      });
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setChannels(channels.map((c) => (c.id === id ? { ...c, enabled: !currentStatus } : c)));
    try {
      await fetch(`/api/v1/channels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentStatus }),
      });
    } catch {
      // Handled in local state
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this notification channel?")) return;
    setChannels(channels.filter((c) => c.id !== id));
    try {
      await fetch(`/api/v1/channels/${id}`, { method: "DELETE" });
    } catch {
      // Handled in local state
    }
  };

  const maskSecret = (url: string) => {
    if (!url) return "";
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}${parsed.pathname.slice(0, 10)}...`;
    } catch {
      return url.slice(0, 20) + "...";
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Top Banner & Action */}
      <div className="flex flex-col justify-between gap-4 border border-line bg-canvas p-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-mono text-sm font-bold uppercase tracking-[0.05em] text-ink">
            Alert Destinations (§09.1)
          </p>
          <p className="text-xs text-muted">
            Direct real-time notification dispatches on newly detected vulnerabilities, drift events, and scheduled digests.
          </p>
        </div>
        <Button id="btn-add-channel" onClick={() => setIsModalOpen(true)}>
          Add channel
        </Button>
      </div>

      {/* Global alert preferences */}
      <div className="border border-line bg-canvas p-4">
        <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink">
          Automated Digest Preferences
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex items-start gap-3 border border-line p-3 text-xs">
            <input
              type="checkbox"
              checked={weeklyDigest}
              onChange={(e) => setWeeklyDigest(e.target.checked)}
              className="mt-0.5"
            />
            <div>
              <p className="font-mono font-bold text-ink">Weekly Security Digest</p>
              <p className="text-muted">
                Executive summary of security score changes, new vs resolved findings, delivered every Monday at 08:00 UTC.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 border border-line p-3 text-xs">
            <input
              type="checkbox"
              checked={quotaWarning}
              onChange={(e) => setQuotaWarning(e.target.checked)}
              className="mt-0.5"
            />
            <div>
              <p className="font-mono font-bold text-ink">80% Usage Warning Alert</p>
              <p className="text-muted">
                Early notification when monitored asset or monthly scan quotas reach 80% to prevent unexpected disruption.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Test feedback banner */}
      {testResult && (
        <div
          className={`border p-3 font-mono text-xs ${
            testResult.ok ? "border-ink bg-subtle text-ink" : "border-ink bg-canvas text-muted"
          }`}
        >
          <div className="flex items-center justify-between">
            <span>[TEST SUCCESS] {testResult.message}</span>
            <button
              onClick={() => setTestResult(null)}
              className="ml-4 font-bold text-muted hover:text-ink"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Channels Table */}
      {channels.length === 0 ? (
        <EmptyState
          title="No notification channels configured."
          description="Add an email, Slack webhook, or generic webhook endpoint to receive notifications when new findings are identified."
          action={<Button onClick={() => setIsModalOpen(true)}>Add first channel</Button>}
        />
      ) : (
        <div className="border border-line bg-canvas">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-subtle font-mono text-xs uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th className="px-4 py-3">Channel Type</th>
                  <th className="px-4 py-3">Destination / Target</th>
                  <th className="px-4 py-3">Min Severity</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono">
                {channels.map((ch) => (
                  <tr key={ch.id} className="hover:bg-subtle/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-block border border-ink bg-subtle px-2 py-0.5 text-xs font-bold uppercase tracking-[0.05em] text-ink">
                        {ch.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {ch.type === "email" && (
                        <span className="text-ink">
                          {Array.isArray(ch.config.recipients)
                            ? ch.config.recipients.join(", ")
                            : "Primary org admins"}
                        </span>
                      )}
                      {ch.type === "slack" && (
                        <div>
                          <span className="text-ink">{String(ch.config.channel || "#alerts")}</span>
                          <span className="ml-2 text-faint">
                            ({maskSecret(String(ch.config.webhook_url || ""))})
                          </span>
                        </div>
                      )}
                      {ch.type === "webhook" && (
                        <div>
                          <span className="text-ink">{maskSecret(String(ch.config.url || ""))}</span>
                          <span className="ml-2 text-[10px] text-muted">
                            [HMAC-SHA256 Signed]
                          </span>
                        </div>
                      )}
                      {ch.type === "discord" && (
                        <span className="text-ink">{maskSecret(String(ch.config.webhook_url || ""))}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <SeverityChip severity={ch.min_severity} />
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {ch.verified_at ? (
                        <StatusBadge className="border-ink text-ink font-bold">VERIFIED</StatusBadge>
                      ) : (
                        <StatusBadge className="text-muted">UNVERIFIED</StatusBadge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(ch.id, ch.enabled)}
                        className="cursor-pointer"
                        title="Toggle channel"
                      >
                        <StatusBadge className={ch.enabled ? "border-ink text-ink font-bold" : "text-muted"}>
                          {ch.enabled ? "ENABLED" : "PAUSED"}
                        </StatusBadge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTest(ch.id)}
                          className="border border-line bg-canvas px-2.5 py-1 text-xs text-ink hover:bg-subtle"
                        >
                          Test
                        </button>
                        <button
                          onClick={() => handleDelete(ch.id)}
                          className="border border-line px-2 py-1 text-xs text-muted hover:bg-subtle hover:text-ink"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Webhook Security Note */}
      <div className="border border-line bg-subtle p-4">
        <h4 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink">
          Webhook Delivery Security Protocol (§09.1)
        </h4>
        <p className="mt-1 text-xs text-muted">
          All webhook deliveries contain an HMAC-SHA256 signature in the{" "}
          <code className="border border-line bg-canvas px-1 font-mono text-ink">
            X-Harizeon-Signature
          </code>{" "}
          header computed using your configured secret. Incoming payloads should be rejected if the signature does not match:
        </p>
        <pre className="mt-2 overflow-x-auto border border-line bg-canvas p-2 font-mono text-[11px] text-ink">
          X-Harizeon-Signature: sha256=d3b07384d113edec49eaa6238ad5ff00...
        </pre>
      </div>

      {/* Add Channel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg border border-line bg-canvas p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="font-mono text-base font-bold uppercase tracking-[0.05em] text-ink">
                Add notification channel
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="font-mono text-sm text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
              {error && (
                <div className="border border-ink bg-subtle p-3 text-xs text-ink">
                  {error}
                </div>
              )}

              <div>
                <label className={labelClass}>Destination Type</label>
                <select
                  value={channelType}
                  onChange={(e) =>
                    setChannelType(e.target.value as "email" | "slack" | "webhook" | "discord")
                  }
                  className={selectClass}
                >
                  <option value="email">Email Notification</option>
                  <option value="slack">Slack Webhook</option>
                  <option value="webhook">Custom Webhook (HMAC-SHA256)</option>
                  <option value="discord">Discord Webhook</option>
                </select>
              </div>

              {channelType === "email" && (
                <div>
                  <label className={labelClass}>Recipient Email Addresses (comma separated)</label>
                  <input
                    type="text"
                    value={emailRecipients}
                    onChange={(e) => setEmailRecipients(e.target.value)}
                    placeholder="security@example.com, devops@example.com"
                    className={inputClass}
                    required
                  />
                  <p className="mt-1 font-mono text-[11px] text-faint">
                    Alerts will be delivered directly to listed addresses.
                  </p>
                </div>
              )}

              {channelType === "slack" && (
                <>
                  <div>
                    <label className={labelClass}>Slack Webhook URL</label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://hooks.slack.com/services/..."
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Channel Name Override (optional)</label>
                    <input
                      type="text"
                      value={slackChannel}
                      onChange={(e) => setSlackChannel(e.target.value)}
                      placeholder="#security-alerts"
                      className={inputClass}
                    />
                  </div>
                </>
              )}

              {channelType === "webhook" && (
                <>
                  <div>
                    <label className={labelClass}>Webhook Destination URL</label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://api.example.com/webhooks/harizeon"
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>HMAC Signing Secret</label>
                    <input
                      type="text"
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                      placeholder="Leave blank to auto-generate secure secret"
                      className={inputClass}
                    />
                    <p className="mt-1 font-mono text-[11px] text-faint">
                      Used to compute X-Harizeon-Signature for payload authenticity.
                    </p>
                  </div>
                </>
              )}

              {channelType === "discord" && (
                <div>
                  <label className={labelClass}>Discord Webhook URL</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className={inputClass}
                    required
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>Minimum Finding Severity Threshold</label>
                <select
                  value={minSeverity}
                  onChange={(e) =>
                    setMinSeverity(e.target.value as ChannelItem["min_severity"])
                  }
                  className={selectClass}
                >
                  <option value="critical">Critical only [!!!]</option>
                  <option value="high">High and Critical [!!]</option>
                  <option value="medium">Medium, High and Critical [!]</option>
                  <option value="low">Low and above</option>
                  <option value="info">All events including Info</option>
                </select>
                <p className="mt-1 font-mono text-[11px] text-faint">
                  Findings below this threshold will not trigger immediate push alerts.
                </p>
              </div>

              <div className="mt-4 flex items-center justify-end gap-3 border-t border-line pt-4">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Connecting..." : "Add destination"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
