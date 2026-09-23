import { withTx } from "../db";
import { applyEvent } from "../services/scanService";
import { notifyScanCompleted, notifyAssetsDiscovered } from "../services/notify";
import type { ScanQueue } from "../lib/queue";

/**
 * Drain one batch of worker events into the control-plane state machine.
 * Exposed separately from the loop so tests can pump deterministically.
 */
export async function runIngestOnce(queue: ScanQueue, batch = 50): Promise<number> {
  // New messages, plus any a previous pass left pending (crash / transient DB error).
  const fresh = await queue.consumeEvents("ingest-1", batch);
  const stranded = await queue.reclaimEvents("ingest-1", 30_000, batch);

  let applied = 0;
  const notify: { orgId: string; scanId: string }[] = [];
  const discovered: { orgId: string; values: string[] }[] = [];

  for (const m of [...fresh, ...stranded]) {
    try {
      const result = await withTx(async (client) => applyEvent(client, m.event), m.event.org_id);
      await queue.ackEvent(m.id);
      applied += 1;
      if (result.discoveredAssets.length > 0) {
        discovered.push({ orgId: m.event.org_id, values: result.discoveredAssets });
      }
      if (m.event.kind === "terminal" && m.event.status === "completed") {
        notify.push({ orgId: m.event.org_id, scanId: m.event.scan_id });
      }
    } catch (e) {
      // Leave unacked; reclaimEvents re-delivers it on a later pass.
      console.error("[ingest]", e instanceof Error ? e.message : e);
    }
  }

  // Notifications run after commit and never block ingest.
  for (const d of discovered) {
    notifyAssetsDiscovered(d.orgId, d.values).catch((e: unknown) =>
      console.error("[notify]", e instanceof Error ? e.message : e),
    );
  }
  for (const n of notify) {
    notifyScanCompleted(n.orgId, n.scanId).catch((e: unknown) =>
      console.error("[notify]", e instanceof Error ? e.message : e),
    );
  }

  return applied;
}

export function startIngest(queue: ScanQueue, intervalMs = 500): () => void {
  let busy = false;
  const timer = setInterval(() => {
    if (busy) return;
    busy = true;
    runIngestOnce(queue)
      .catch((e: unknown) => console.error("[ingest]", e))
      .finally(() => {
        busy = false;
      });
  }, intervalMs);
  if (typeof timer.unref === "function") timer.unref();
  return () => clearInterval(timer);
}
