import { withTx } from "../db";
import { config } from "../config";
import { listChannels, type SeverityLevel } from "../repo/channels";
import { newFindingSeverities } from "../repo/scans";
import { deliver, meetsThreshold } from "../lib/notifier";
import { openConfig } from "../lib/seal";

const RANK: Record<string, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };

/**
 * Notify the org's channels after a scan completes WITH new findings. Silent
 * when a scan finds nothing new, so channels stay signal. Runs after the ingest
 * transaction commits, never inside it.
 */
export async function notifyScanCompleted(orgId: string, scanId: string): Promise<void> {
  const { channels, severities } = await withTx(async (c) => {
    const chans = await listChannels(c, orgId);
    const sev = await newFindingSeverities(c, orgId, scanId);
    return { channels: chans, severities: sev };
  }, orgId);

  if (severities.length === 0 || channels.length === 0) return;

  const worst = severities.reduce((acc, s) => ((RANK[s] ?? 0) > (RANK[acc] ?? 0) ? s : acc), "info") as SeverityLevel;

  for (const channel of channels) {
    if (!channel.enabled) continue;
    if (!meetsThreshold(worst, channel.min_severity)) continue;
    const result = await deliver(
      { type: channel.type, config: openConfig(channel.config, config.HARIZEON_MASTER_KEY), min_severity: channel.min_severity },
      {
        kind: "scan.completed",
        orgId,
        severity: worst,
        title: `Harizeon: ${severities.length} new finding(s)`,
        message: `Scan ${scanId} recorded ${severities.length} new finding(s); highest severity ${worst}.`,
      },
    );
    if (!result.ok) console.error(`[notify] channel ${channel.id} (${channel.type}) failed: ${result.error}`);
  }
}
