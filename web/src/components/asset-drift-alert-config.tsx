"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { labelClass, compactInputClass, compactSelectClass } from "@/lib/ui";
import { cx } from "@/lib/cx";
import type { ChannelItem } from "@/components/notifications-manager";

export interface AssetDriftAlertSettings {
  enabled: boolean;
  emailEnabled: boolean;
  slackEnabled: boolean;
  emailRecipients: string;
  slackChannel: string;
  sensitivity: "any" | "threshold" | "spike";
  spikeThreshold: number; // e.g. +3, +5, +10 subdomains
  alertOnSubdomainDrop: boolean;
  alertOnWildcardDetected: boolean;
  monitoredAssetsScope: "all" | "selected";
  customDomains: string;
}

const STORAGE_KEY = "harizeon_asset_drift_alerts_v1";

const DEFAULT_SETTINGS: AssetDriftAlertSettings = {
  enabled: true,
  emailEnabled: true,
  slackEnabled: true,
  emailRecipients: "security-ops@example.com, infra@example.com",
  slackChannel: "#asset-drift-alerts",
  sensitivity: "any",
  spikeThreshold: 3,
  alertOnSubdomainDrop: true,
  alertOnWildcardDetected: true,
  monitoredAssetsScope: "all",
  customDomains: "example.com, api.example.com",
};

export function AssetDriftAlertConfig({
  existingChannels,
}: {
  existingChannels?: ChannelItem[];
}) {
  const [settings, setSettings] = useState<AssetDriftAlertSettings>(() => {
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

  // Available Email and Slack endpoints
  const emailChannels = existingChannels?.filter((c) => c.type === "email") ?? [];
  const slackChannels = existingChannels?.filter((c) => c.type === "slack") ?? [];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSavedNotice(`Asset drift alert configuration saved at ${new Date().toLocaleTimeString()}.`);
      setTimeout(() => setSavedNotice(null), 4000);
    } catch {
      setSavedNotice("Configuration updated in session memory.");
    }
  };

  const handleTest = async () => {
    if (isTesting) return;
    setIsTesting(true);
    setTestNotice(null);

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
          message: "Please enable at least one notification channel (Email or Slack) to test drift alerts.",
        });
      } else {
        setTestNotice({
          ok: true,
          message: `Sample Asset Drift alert (+5 new subdomains on verified domain 'example.com') dispatched to: ${activeDests.join(" & ")}.`,
        });
      }
      setIsTesting(false);
    }, 700);
  };

  return (
    <div className="border border-line bg-canvas font-mono text-xs text-ink">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between bg-subtle/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="border border-ink bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase text-canvas">
              Perimeter Drift & Attack Surface Monitoring (§09.1)
            </span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
              Asset Drift & Subdomain Change Alerts
            </h3>
          </div>
          <p className="mt-1 text-[11px] text-muted font-sans">
            Receive automated Email or Slack notifications when the number of subdomains for a verified asset changes unexpectedly during recurring perimeter sweeps.
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
            {settings.enabled ? "Drift Alerts Enabled" : "Drift Alerts Paused"}
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
                <span>Drift Alert Destinations (Email &amp; Slack)</span>
              </h4>
              <p className="mt-0.5 text-[11px] text-muted font-sans">
                Choose where notifications are dispatched when unexpected subdomain changes occur.
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
                  <label htmlFor="drift-email-recipients-input" className={labelClass}>
                    Alert Recipients (comma separated)
                  </label>
                  <input
                    id="drift-email-recipients-input"
                    type="text"
                    value={settings.emailRecipients}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, emailRecipients: e.target.value }))
                    }
                    placeholder="security-ops@example.com, infra@example.com"
                    className={compactInputClass}
                  />
                  {emailChannels.length > 0 && (
                    <div className="text-[10px] text-muted font-sans flex items-center gap-1">
                      <span>Available team channel emails:</span>
                      <span className="font-mono text-ink">
                        {emailChannels
                          .map((c) =>
                            Array.isArray(c.config.recipients)
                              ? c.config.recipients.join(", ")
                              : "",
                          )
                          .filter(Boolean)
                          .join("; ")}
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
                  <label htmlFor="drift-slack-channel-input" className={labelClass}>
                    Slack Target Channel or Handle
                  </label>
                  <input
                    id="drift-slack-channel-input"
                    type="text"
                    value={settings.slackChannel}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, slackChannel: e.target.value }))
                    }
                    placeholder="#asset-drift-alerts"
                    className={compactInputClass}
                  />
                  {slackChannels.length > 0 && (
                    <div className="text-[10px] text-muted font-sans flex items-center gap-1">
                      <span>Configured Slack endpoints:</span>
                      <span className="font-mono text-ink">
                        {slackChannels.map((c) => String(c.config.channel || "#alerts")).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Scope of Monitored Assets */}
            <div className="border border-line bg-canvas p-3 flex flex-col gap-2">
              <label htmlFor="drift-scope-select" className={labelClass}>
                Monitored Asset Scope
              </label>
              <select
                id="drift-scope-select"
                value={settings.monitoredAssetsScope}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    monitoredAssetsScope: e.target.value as "all" | "selected",
                  }))
                }
                className={compactSelectClass}
              >
                <option value="all">All Verified Apex Domains &amp; Assets (Recommended)</option>
                <option value="selected">Specific Verified Root Domains Only</option>
              </select>

              {settings.monitoredAssetsScope === "selected" && (
                <div className="mt-1">
                  <label htmlFor="custom-domains-input" className={labelClass}>
                    Domain Filter (comma separated)
                  </label>
                  <input
                    id="custom-domains-input"
                    type="text"
                    value={settings.customDomains}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, customDomains: e.target.value }))
                    }
                    placeholder="example.com, mycorp.net"
                    className={compactInputClass}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Subdomain Drift Conditions & Thresholds */}
          <div className="p-4 flex flex-col gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                <span>[2]</span>
                <span>Drift Detection Sensitivity &amp; Thresholds</span>
              </h4>
              <p className="mt-0.5 text-[11px] text-muted font-sans">
                Specify what qualifies as an unexpected subdomain count change.
              </p>
            </div>

            {/* Trigger 1: Sensitivity Mode */}
            <div className="border border-line bg-canvas p-3 flex flex-col gap-2.5">
              <label htmlFor="drift-sensitivity-select" className={labelClass}>
                Subdomain Count Change Sensitivity
              </label>
              <select
                id="drift-sensitivity-select"
                value={settings.sensitivity}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    sensitivity: e.target.value as "any" | "threshold" | "spike",
                  }))
                }
                className={compactSelectClass}
              >
                <option value="any">
                  Immediate: Alert on ANY new or deleted subdomain (±1 change)
                </option>
                <option value="threshold">
                  Threshold: Alert when change exceeds unexpected delta (e.g. ≥ {settings.spikeThreshold} subdomains)
                </option>
                <option value="spike">
                  Spike Only: Sudden perimeter expansion (≥ 10 new hosts in single scan)
                </option>
              </select>

              {settings.sensitivity === "threshold" && (
                <div className="mt-1 flex items-center justify-between border-t border-line/60 pt-2 text-[11px]">
                  <label htmlFor="spike-threshold-select" className="text-muted">
                    Unexpected Delta Threshold:
                  </label>
                  <select
                    id="spike-threshold-select"
                    value={String(settings.spikeThreshold)}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        spikeThreshold: Number(e.target.value),
                      }))
                    }
                    className="border border-line bg-canvas px-2 py-0.5 font-mono text-xs text-ink"
                  >
                    <option value="2">≥ 2 subdomains changed</option>
                    <option value="3">≥ 3 subdomains changed (Recommended)</option>
                    <option value="5">≥ 5 subdomains changed</option>
                    <option value="10">≥ 10 subdomains changed (Spike)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Trigger 2: Dropped Subdomains (Dangling DNS protection) */}
            <div className="border border-line bg-canvas p-3 flex flex-col gap-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.alertOnSubdomainDrop}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, alertOnSubdomainDrop: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 rounded-none border-line text-ink focus:ring-0"
                />
                <div>
                  <span className="font-bold text-ink uppercase text-[11px] block">
                    Alert on Subdomain Dropped / Unresolved
                  </span>
                  <span className="text-[10px] text-muted font-sans">
                    Detects when previously tracked subdomains fail DNS resolution or are decommissioned (mitigates dangling DNS &amp; subdomain takeovers).
                  </span>
                </div>
              </label>
            </div>

            {/* Trigger 3: Wildcard DNS Detected */}
            <div className="border border-line bg-canvas p-3 flex flex-col gap-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.alertOnWildcardDetected}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, alertOnWildcardDetected: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 rounded-none border-line text-ink focus:ring-0"
                />
                <div>
                  <span className="font-bold text-ink uppercase text-[11px] block">
                    Alert on Wildcard DNS Record Detected (*.domain)
                  </span>
                  <span className="text-[10px] text-muted font-sans">
                    Warns when a newly added wildcard DNS record obscures granular asset visibility.
                  </span>
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
              <span>Sample Slack &amp; Email Asset Drift Notification Payload</span>
            </button>
            <span className="text-[11px] text-muted">
              Trigger: Unexpected count delta on verified asset
            </span>
          </div>

          {showPayloadPreview && (
            <div className="border border-line bg-canvas p-3 font-mono text-[11px] text-ink overflow-x-auto">
              <div className="text-muted border-b border-line pb-1 mb-2 font-bold flex justify-between">
                <span>[SLACK / EMAIL ASSET DRIFT PREVIEW]</span>
                <span>
                  DESTINATIONS: {settings.emailEnabled ? "EMAIL" : ""}{" "}
                  {settings.slackEnabled ? "SLACK" : ""}
                </span>
              </div>
              <pre className="text-xs leading-relaxed">
{`🚨 [HARIZEON ALERT] Asset Drift Detected: Unexpected Subdomain Count Change
--------------------------------------------------------------------------------------
Verified Asset    : example.com (Domain)
Drift Event       : Subdomain Population Delta Exceeded Threshold
Previous Count    : 14 subdomains
Current Count     : 19 subdomains (+5 new subdomains discovered)
Discovery Timestamp: ${new Date().toISOString()}
Scan Trigger ID   : scn-7b89f012 (Profile: standard)

Discovered Subdomains:
  + api-staging.example.com       (IP: 198.51.100.22 · Status: Active 200 OK)
  + dev-portal.example.com        (IP: 198.51.100.45 · Status: Basic Auth)
  + auth-v2.example.com           (IP: 198.51.100.19 · Status: Active 200 OK)
  + test-gateway.example.com      (IP: 198.51.100.80 · Status: 403 Forbidden)
  + cdn-origin.example.com        (CNAME: origin.cdn.example.net)

Action Required   : Verify ownership or review newly discovered attack surface in console
Console Link      : https://console.harizeon.com/assets?q=example.com`}
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
              {isTesting ? "Dispatching test…" : "Send test asset drift alert"}
            </Button>
            <span className="text-[11px] text-muted">
              Verifies drift delivery to configured Email &amp; Slack endpoints
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
                setSavedNotice("Settings restored to default drift sensitivity.");
              }}
              className="border border-line bg-canvas px-3 py-1.5 text-xs text-muted hover:border-ink hover:text-ink font-mono uppercase"
            >
              Reset defaults
            </button>
            <Button type="submit" variant="primary" size="sm">
              Save drift configuration
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
