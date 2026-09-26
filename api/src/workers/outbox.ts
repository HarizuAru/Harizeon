import { pool } from "../db";
import * as outboxRepo from "../repo/outbox";
import type { ScanQueue } from "../lib/queue";

/**
 * Publish staged dispatch intents to the job stream. Failures are left pending
 * and retried on the next pass; a crash between publish and mark only causes a
 * duplicate job, which the control plane de-duplicates by fingerprint.
 */
export async function runOutboxOnce(queue: ScanQueue, limit = 50): Promise<number> {
  const rows = await outboxRepo.pending(pool, limit);
  const done: string[] = [];
  for (const row of rows) {
    try {
      await queue.enqueue(row.job);
      done.push(row.id);
    } catch (e) {
      // Leave un-published; the next pass retries.
      console.error("[outbox]", e instanceof Error ? e.message : e);
    }
  }
  await outboxRepo.markPublished(pool, done);
  return done.length;
}

export function startOutboxDispatcher(queue: ScanQueue, intervalMs = 1_000): () => void {
  const timer = setInterval(() => {
    runOutboxOnce(queue).catch((e: unknown) => console.error("[outbox]", e));
  }, intervalMs);
  if (typeof timer.unref === "function") timer.unref();
  return () => clearInterval(timer);
}
