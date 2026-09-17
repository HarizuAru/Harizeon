import { withTx } from "../db";
import { applyEvent } from "../services/scanService";
import type { ScanQueue } from "../lib/queue";

/**
 * Drain one batch of worker events into the control-plane state machine.
 * Exposed separately from the loop so tests can pump deterministically.
 */
export async function runIngestOnce(queue: ScanQueue, batch = 50): Promise<number> {
  const messages = await queue.consumeEvents("ingest-1", batch);
  let applied = 0;
  for (const m of messages) {
    try {
      await withTx(async (client) => applyEvent(client, m.event), m.event.org_id);
      await queue.ackEvent(m.id);
      applied += 1;
    } catch (e) {
      // Leave unacked so a later pass can retry; never crash the loop on one event.
      console.error("[ingest]", e instanceof Error ? e.message : e);
    }
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
