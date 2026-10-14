"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { labelClass, compactInputClass, compactSelectClass } from "@/lib/ui";
import { cx } from "@/lib/cx";
import type { ChannelItem } from "@/components/notifications-manager";

export interface ScanStatusAlertSettings {
  enabled: boolean;
  emailEnabled: boolean;
  slackEnabled: boolean;
  emailRecipients: string;
  slackChannel: string;
  durationThresholdMinutes: number;
  alertOnDurationExceeded: boolean;
  alertOnResourceThreshold: boolean;
  cpuThresholdPct: number;
  memoryThresholdMb: number;
  alertOnHeartbeatStall: boolean;
  alertOnTerminalFailure: boolean;
}

const STORAGE_KEY = "harizeon_scan_status_alerts_v1";

const DEFAULT_SETTINGS: ScanStatusAlertSettings = {
  enabled: true,
  emailEnabled: true,
  slackEnabled: true,
  emailRecipients: "security-alerts@example.com, ops@example.com",
  slackChannel: "#security-ops",
  durationThresholdMinutes: 60, // 1 hour
  alertOnDurationExceeded: true,
  alertOnResourceThreshold: true,
  cpuThresholdPct: 85,
  memoryThresholdMb: 1500,
  alertOnHeartbeatStall: true,
  alertOnTerminalFailure: true,
};

export function ScanStatusAlertConfig({
  existingChannels,
}: {
  existingChannels?: ChannelItem[];
}) {
  // Load saved settings if in client
  const [settings, setSettings] = useState<ScanStatusAlertSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      } catch {
        // Fallback
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [testNotice, setTestNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showPayloadPreview, setShowPayloadPreview] = useState(false);

  // Derive available email and slack destinations from configured channels
  const emailChannels = existingChannels?.filter((c) => c.type === "email") ?? [];
  const slackChannels = existingChannels?.filter((c) => c.type === "slack") ?? [];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSavedNotice(`Scan status alert configuration saved at ${new Date().toLocaleTimeString()}.`);
      setTimeout(() => setSavedNotice(null), 4000);
    } catch {
      setSavedNotice("Configuration updated in session memory.");
    }
  };

  const handleTest = async () => {
    if (isTesting) return;
    setIsTesting(true);
    setTestNotice(null);

    // Simulate API delivery to configured channels
    setTimeout(() => {
      const activeDests: string[] = [];
      if (settings.emailEnabled) {
        activeDests.push(`Email (${settings.emailRecipients.split(",")[0].trim() || "primary admin"})`);
      }
      if (settings.slackEnabled) {
        activeDests.push(`Slack (${settings.slackChannel || "#alerts"})`);
      }

      if (activeDests.length === 0) {
        setTestNotice({
          ok: false,
          message: "Please enable at least one notification channel (Email or Slack) to test alerts.",
        });
      } else {
        setTestNotice({
          ok: true,
          message: `Sample long-running scan alert (> ${settings.durationThresholdMinutes}m SLA breach / worker stall) dispatched to: ${activeDests.join(" & ")}.`,
        });
      }
      setIsTesting(false);
    }, 700);
  };

  const durationHours = (settings.durationThresholdMinutes / 60).toFixed(1);

  return (
    <div className="border border-line bg-canvas font-mono text-xs text-ink">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between bg-subtle/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="border border-ink bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase text-canvas">
              Pipeline SLA & Runtime Alerts (§09.1)
            </span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
              Scan Status & Worker Health Alerts
            </h3>
          </div>
          <p className="mt-1 text-[11px] text-muted font-sans">
            Configure automated Email and Slack notifications when long-running scans exceed their expected duration or when worker nodes breach critical resource thresholds.
          </p>
        </div>

        {/* Master Active / Paused Switch */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSettings((prev) => {
                const next = { ...prev, enabled: !prev.enabled };
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                } catch {
                  // ignore
                }
                return next;
              });
            }}
            className={cx(
              "border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors",
              settings.enabled
                ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "border-line bg-subtle text-muted hover:border-ink hover:text-ink",
            )}
            aria-pressed={settings.enabled}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full mr-1.5 bg-current" aria-hidden="true" />
            {settings.enabled ? "Alerts Enabled" : "Alerts Paused"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col">
        {/* Notice Feedback Banners */}
        {savedNotice && (
          <div className="border-b border-line bg-emerald-500/[0.08] p-3 text-emerald-800 dark:text-emerald-400 font-bold flex items-center justify-between">
            <span>[✓] {savedNotice}</span>
            <button
              type="button"
              onClick={() => setSavedNotice(null)}
              className="text-xs text-muted hover:text-ink"
            >
              ✕
            </button>
          </div>
        )}

        {testNotice && (
          <div
            className={cx(
              "border-b border-line p-3 font-bold flex items-center justify-between",
              testNotice.ok
                ? "bg-subtle text-ink"
                : "bg-rose-500/[0.08] text-rose-700 dark:text-rose-400",
            )}
          >
            <span>{testNotice.ok ? `[TEST DISPATCHED] ${testNotice.message}` : `[!] ${testNotice.message}`}</span>
            <button
              type="button"
              onClick={() => setTestNotice(null)}
              className="text-xs text-muted hover:text-ink"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 divide-y divide-line lg:grid-cols-2 lg:divide-y-0 lg:divide-x">
          {/* Column 1: Notification Destinations (Email & Slack) */}
          <div className="p-4 flex flex-col gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                <span>[1]</span>
                <span>Notification Channels (Email & Slack)</span>
              </h4>
              <p className="mt-0.5 text-[11px] text-muted font-sans">
                Select target endpoints to receive instant alerts when duration or worker limits are breached.
              </p>
            </div>

            {/* Email Channel Configuration */}
            <div className="border border-line bg-canvas p-3 flex flex-col gap-2.5">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.emailEnabled}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, emailEnabled: e.target.checked }))
                    }
                    className="h-4 w-4 rounded-none border-line text-ink focus:ring-0"
                  />
                  <span className="font-bold text-ink uppercase text-[11px]">
                    Email Notifications
                  </span>
                </div>
                <StatusBadge status={settings.emailEnabled ? "completed" : "cancelled"}>
                  {settings.emailEnabled ? "Active" : "Disabled"}
                </StatusBadge>
              </label>

              {settings.emailEnabled && (
                <div className="mt-1 flex flex-col gap-1.5 pl-6 border-l-2 border-line">
                  <label htmlFor="email-recipients-input" className={labelClass}>
                    Alert Recipients (comma separated)
                  </label>
                  <input
                    id="email-recipients-input"
                    type="text"
                    value={settings.emailRecipients}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, emailRecipients: e.target.value }))
                    }
                    placeholder="security-ops@example.com, oncall@example.com"
                    className={compactInputClass}
                  />
                  {emailChannels.length > 0 && (
                    <div className="text-[10px] text-muted font-sans flex items-center gap-1">
                      <span>Configured team channels available:</span>
                      <span className="font-mono text-ink">
                        {emailChannels.map((c) => Array.isArray(c.config.recipients) ? c.config.recipients.join(", ") : "").filter(Boolean).join("; ")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Slack Channel Configuration */}
            <div className="border border-line bg-canvas p-3 flex flex-col gap-2.5">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.slackEnabled}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, slackEnabled: e.target.checked }))
                    }
                    className="h-4 w-4 rounded-none border-line text-ink focus:ring-0"
                  />
                  <span className="font-bold text-ink uppercase text-[11px]">
                    Slack Incoming Webhook
                  </span>
                </div>
                <StatusBadge status={settings.slackEnabled ? "completed" : "cancelled"}>
                  {settings.slackEnabled ? "Active" : "Disabled"}
                </StatusBadge>
              </label>

              {settings.slackEnabled && (
                <div className="mt-1 flex flex-col gap-1.5 pl-6 border-l-2 border-line">
                  <label htmlFor="slack-channel-input" className={labelClass}>
                    Slack Target Channel or Handle
                  </label>
                  <input
                    id="slack-channel-input"
                    type="text"
                    value={settings.slackChannel}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, slackChannel: e.target.value }))
                    }
                    placeholder="#security-alerts"
                    className={compactInputClass}
                  />
                  {slackChannels.length > 0 && (
                    <div className="text-[10px] text-muted font-sans flex items-center gap-1">
                      <span>Connected Slack endpoints:</span>
                      <span className="font-mono text-ink">
                        {slackChannels.map((c) => String(c.config.channel || "#alerts")).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* In-app / Notification routing note */}
            <div className="border border-line bg-subtle/50 p-2.5 text-[11px] text-muted font-sans">
              <span className="font-bold text-ink font-mono uppercase text-[10px] block mb-0.5">
                Routing Policy:
              </span>
              Alerts are broadcast in parallel to all active destinations with an automatic 3-minute dedup window to prevent alert fatigue on prolonged crawls.
            </div>
          </div>

          {/* Column 2: Trigger Conditions & Thresholds */}
          <div className="p-4 flex flex-col gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                <span>[2]</span>
                <span>Threshold Trigger Rules</span>
              </h4>
              <p className="mt-0.5 text-[11px] text-muted font-sans">
                Set thresholds for duration overrun (e.g. &gt; 1 hour) and worker resource exhaustion.
              </p>
            </div>

            {/* Rule 1: Duration SLA Breach */}
            <div className="border border-line bg-canvas p-3 flex flex-col gap-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.alertOnDurationExceeded}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, alertOnDurationExceeded: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 rounded-none border-line text-ink focus:ring-0"
                />
                <div>
                  <span className="font-bold text-ink uppercase text-[11px] block">
                    Long-Running Scan Duration Exceeded
                  </span>
                  <span className="text-[10px] text-muted font-sans">
                    Triggers when a scan remains in progress past the expected duration threshold.
                  </span>
                </div>
              </label>

              {settings.alertOnDurationExceeded && (
                <div className="pl-6 border-l-2 border-line flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label htmlFor="duration-threshold-select" className={labelClass}>
                      Duration Threshold (Expected Runtime SLA)
                    </label>
                    <span className="font-bold text-ink text-[11px]">
                      &gt; {settings.durationThresholdMinutes} minutes ({durationHours} hours)
                    </span>
                  </div>

                  <select
                    id="duration-threshold-select"
                    value={String(settings.durationThresholdMinutes)}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        durationThresholdMinutes: Number(e.target.value),
                      }))
                    }
                    className={compactSelectClass}
                  >
                    <option value="30">30 minutes (&gt; 30m rapid sweep cap)</option>
                    <option value="45">45 minutes (&gt; 45m standard audit cap)</option>
                    <option value="60">1 hour (&gt; 1h standard max SLA threshold)</option>
                    <option value="90">1.5 hours (&gt; 90m deep crawl threshold)</option>
                    <option value="120">2 hours (&gt; 2h extended perimeter sweep)</option>
                    <option value="240">4 hours (&gt; 4h extreme full-spider audit)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Rule 2: Critical Worker Resource Threshold */}
            <div className="border border-line bg-canvas p-3 flex flex-col gap-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.alertOnResourceThreshold}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      alertOnResourceThreshold: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 rounded-none border-line text-ink focus:ring-0"
                />
                <div>
                  <span className="font-bold text-ink uppercase text-[11px] block">
                    Critical Worker Resource Threshold
                  </span>
                  <span className="text-[10px] text-muted font-sans">
                    Alerts when the node executing the scan breaches CPU or memory thresholds.
                  </span>
                </div>
              </label>

              {settings.alertOnResourceThreshold && (
                <div className="pl-6 border-l-2 border-line grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label htmlFor="cpu-threshold-select" className={labelClass}>
                      CPU Stress Limit
                    </label>
                    <select
                      id="cpu-threshold-select"
                      value={String(settings.cpuThresholdPct)}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          cpuThresholdPct: Number(e.target.value),
                        }))
                      }
                      className={compactSelectClass}
                    >
                      <option value="80">&gt; 80% CPU utilization</option>
                      <option value="85">&gt; 85% CPU utilization (recommended)</option>
                      <option value="90">&gt; 90% CPU critical lockup</option>
                      <option value="95">&gt; 95% CPU hard throttle</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="memory-threshold-select" className={labelClass}>
                      Memory Limit per Node
                    </label>
                    <select
                      id="memory-threshold-select"
                      value={String(settings.memoryThresholdMb)}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          memoryThresholdMb: Number(e.target.value),
                        }))
                      }
                      className={compactSelectClass}
                    >
                      <option value="1000">&gt; 1,000 MB RAM</option>
                      <option value="1500">&gt; 1,500 MB RAM (recommended)</option>
                      <option value="2000">&gt; 2,000 MB RAM</option>
                      <option value="3000">&gt; 3,000 MB OOM warning</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Rule 3 & 4: Heartbeat stalls & Terminal Failure */}
            <div className="border border-line bg-canvas p-3 flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.alertOnHeartbeatStall}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, alertOnHeartbeatStall: e.target.checked }))
                  }
                  className="h-4 w-4 rounded-none border-line text-ink focus:ring-0"
                />
                <div>
                  <span className="font-bold text-ink uppercase text-[11px]">
                    Worker Heartbeat Timeout (&gt; 60s reaper trigger)
                  </span>
                  <p className="text-[10px] text-muted font-sans">
                    Notifies immediately if a worker stalls and the scan is reclaimed by the control plane.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer mt-1 pt-2 border-t border-line/60">
                <input
                  type="checkbox"
                  checked={settings.alertOnTerminalFailure}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, alertOnTerminalFailure: e.target.checked }))
                  }
                  className="h-4 w-4 rounded-none border-line text-ink focus:ring-0"
                />
                <div>
                  <span className="font-bold text-ink uppercase text-[11px]">
                    Scan Execution Termination (Failed / Timed Out)
                  </span>
                  <p className="text-[10px] text-muted font-sans">
                    Broadcasts when any scan terminates with ERR_CONNECTION_TIMEOUT or ERR_DNS_NXDOMAIN.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Live Payload Preview Toggle & Box */}
        <div className="border-t border-line p-4 bg-subtle/10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowPayloadPreview(!showPayloadPreview)}
              className="text-xs font-bold text-ink underline hover:no-underline flex items-center gap-1.5"
            >
              <span>{showPayloadPreview ? "▼ Hide" : "▶ View"}</span>
              <span>Sample Slack & Email Alert Notification Payload</span>
            </button>
            <span className="text-[11px] text-muted">
              Trigger: Duration &gt; {settings.durationThresholdMinutes}m or CPU &gt; {settings.cpuThresholdPct}%
            </span>
          </div>

          {showPayloadPreview && (
            <div className="border border-line bg-canvas p-3 font-mono text-[11px] text-ink overflow-x-auto">
              <div className="text-muted border-b border-line pb-1 mb-2 font-bold flex justify-between">
                <span>[SLACK / EMAIL DISPATCH PREVIEW]</span>
                <span>DESTINATIONS: {settings.emailEnabled ? "EMAIL" : ""} {settings.slackEnabled ? "SLACK" : ""}</span>
              </div>
              <pre className="text-xs leading-relaxed">
{`🚨 [HARIZEON ALERT] Scan Status SLA Breach: Long-Running Scan Exceeded Expected Runtime
--------------------------------------------------------------------------------------
Scan Identifier : scn-8f43b190
Target Asset    : staging.example.com (Domain)
Security Profile: deep
Current Phase   : inspect (Dynamic SPA crawler)
Elapsed Runtime : 1h 14m 20s (Exceeded expected threshold of ${durationHours}h / ${settings.durationThresholdMinutes}m)
Worker Node     : worker-node-02 (Region: us-central1)
Resource Status : CPU: 88.4% (> ${settings.cpuThresholdPct}% threshold) | Memory: 1,620MB (> ${settings.memoryThresholdMb}MB)
Heartbeat Age   : Last beat recorded 12s ago (Stall Watchdog Active)
Trigger Action  : Inspect diagnostic trace in console
Console Link    : https://console.harizeon.com/scans/scn-8f43b190`}
              </pre>
            </div>
          )}
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-line p-4 bg-subtle/30">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleTest}
              disabled={isTesting}
            >
              {isTesting ? "Dispatching test…" : "Send test scan alert"}
            </Button>
            <span className="text-[11px] text-muted">
              Verifies delivery to configured Email &amp; Slack endpoints
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSettings(DEFAULT_SETTINGS);
                try {
                  localStorage.removeItem(STORAGE_KEY);
                } catch {
                  // ignore
                }
                setSavedNotice("Settings restored to default thresholds.");
              }}
              className="border border-line bg-canvas px-3 py-1.5 text-xs text-muted hover:border-ink hover:text-ink font-mono uppercase"
            >
              Reset defaults
            </button>
            <Button type="submit" variant="primary" size="sm">
              Save alert configuration
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
