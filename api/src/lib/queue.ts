import { randomUUID } from "node:crypto";
import type Redis from "ioredis";
import type { ScanPhase, ScanStatus } from "./scan-state";

export const JOBS_STREAM = "harizeon:scans:jobs";
export const EVENTS_STREAM = "harizeon:scans:events";
export const WORKERS_GROUP = "workers";
export const INGEST_GROUP = "ingest";
const HB_PREFIX = "harizeon:scan:hb:";
const CANCEL_PREFIX = "harizeon:scan:cancel:";

export type ScanProfile = "quick" | "standard" | "deep";

export type ScanJob = {
  scan_id: string;
  org_id: string;
  profile: ScanProfile;
  attempt: number;
  targets: { asset_id: string; type: string; value: string }[];
};

export type WorkerEvent = {
  scan_id: string;
  org_id: string;
  kind: "status" | "event" | "terminal";
  status?: ScanStatus;
  phase?: ScanPhase;
  level?: "info" | "warn" | "error";
  message?: string;
  progress_pct?: number;
  error_code?: string;
  attempt?: number;
  at?: string;
};

/**
 * The control-plane <-> worker seam. The implementation hides all Redis Streams
 * detail (consumer groups, acks, encoding, heartbeats, cancel flags); callers and
 * tests only see jobs, events and liveness. Two adapters exist — a Redis one for
 * production and an in-memory one for tests — so the seam is real, not hypothetical.
 */
export interface ScanQueue {
  ready(): Promise<void>;
  enqueue(job: ScanJob): Promise<void>;
  claimJobs(consumer: string, count: number): Promise<{ id: string; job: ScanJob }[]>;
  ackJob(id: string): Promise<void>;
  publish(ev: WorkerEvent): Promise<void>;
  consumeEvents(consumer: string, count: number): Promise<{ id: string; event: WorkerEvent }[]>;
  ackEvent(id: string): Promise<void>;
  setHeartbeat(scanId: string, ttlSeconds: number): Promise<void>;
  isAlive(scanId: string): Promise<boolean>;
  requestCancel(scanId: string): Promise<void>;
  isCancelled(scanId: string): Promise<boolean>;
}

/** Flatten to a Redis stream field map (non-strings JSON-encoded). */
export function serialise(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    out[k] = typeof v === "string" ? v : JSON.stringify(v);
  }
  return out;
}

const VALID_KINDS = new Set(["status", "event", "terminal"]);

export function parseJob(fields: Record<string, string>): ScanJob {
  const { scan_id, org_id, profile, targets } = fields;
  if (!scan_id || !org_id || !profile || !targets) throw new Error("invalid job payload");
  const parsed = JSON.parse(targets) as ScanJob["targets"];
  if (!Array.isArray(parsed)) throw new Error("invalid job targets");
  return {
    scan_id,
    org_id,
    profile: profile as ScanProfile,
    attempt: Number(fields.attempt ?? "0"),
    targets: parsed,
  };
}

export function parseEvent(fields: Record<string, string>): WorkerEvent {
  const kind = fields.kind;
  if (!fields.scan_id || !fields.org_id || !kind || !VALID_KINDS.has(kind)) {
    throw new Error("invalid event payload");
  }
  const ev: WorkerEvent = {
    scan_id: fields.scan_id,
    org_id: fields.org_id,
    kind: kind as WorkerEvent["kind"],
  };
  if (fields.status) ev.status = fields.status as ScanStatus;
  if (fields.phase) ev.phase = fields.phase as ScanPhase;
  if (fields.level) ev.level = fields.level as WorkerEvent["level"];
  if (fields.message !== undefined) ev.message = fields.message;
  if (fields.progress_pct !== undefined) ev.progress_pct = Number(fields.progress_pct);
  if (fields.error_code !== undefined) ev.error_code = fields.error_code;
  if (fields.attempt !== undefined) ev.attempt = Number(fields.attempt);
  if (fields.at !== undefined) ev.at = fields.at;
  return ev;
}

/** In-memory adapter: same contract, used by unit/integration tests. */
export class MemoryScanQueue implements ScanQueue {
  private jobs: { id: string; job: ScanJob }[] = [];
  private events: { id: string; event: WorkerEvent }[] = [];
  private heartbeats = new Map<string, number>();
  private cancelled = new Set<string>();

  async ready(): Promise<void> {}

  async enqueue(job: ScanJob): Promise<void> {
    this.jobs.push({ id: randomUUID(), job });
  }

  async claimJobs(_consumer: string, count: number): Promise<{ id: string; job: ScanJob }[]> {
    return this.jobs.splice(0, count);
  }

  async ackJob(_id: string): Promise<void> {}

  async publish(ev: WorkerEvent): Promise<void> {
    this.events.push({ id: randomUUID(), event: ev });
  }

  async consumeEvents(_consumer: string, count: number): Promise<{ id: string; event: WorkerEvent }[]> {
    return this.events.splice(0, count);
  }

  async ackEvent(_id: string): Promise<void> {}

  async setHeartbeat(scanId: string, ttlSeconds: number): Promise<void> {
    this.heartbeats.set(scanId, Date.now() + ttlSeconds * 1000);
  }

  async isAlive(scanId: string): Promise<boolean> {
    const at = this.heartbeats.get(scanId);
    return at !== undefined && at > Date.now();
  }

  async requestCancel(scanId: string): Promise<void> {
    this.cancelled.add(scanId);
  }

  async isCancelled(scanId: string): Promise<boolean> {
    return this.cancelled.has(scanId);
  }
}

function flat(fields: Record<string, string>): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(fields)) out.push(k, v);
  return out;
}

function parseReadGroup(res: unknown): { id: string; fields: Record<string, string> }[] {
  if (!Array.isArray(res)) return [];
  const out: { id: string; fields: Record<string, string> }[] = [];
  for (const entry of res as [string, [string, string[]][]][]) {
    const entries = entry[1];
    if (!Array.isArray(entries)) continue;
    for (const [id, arr] of entries) {
      const fields: Record<string, string> = {};
      for (let i = 0; i < arr.length; i += 2) fields[arr[i]] = arr[i + 1];
      out.push({ id, fields });
    }
  }
  return out;
}

/** Redis Streams adapter (production). */
export class RedisScanQueue implements ScanQueue {
  constructor(private readonly redis: Redis) {}

  async ready(): Promise<void> {
    const streams: [string, string][] = [
      [JOBS_STREAM, WORKERS_GROUP],
      [EVENTS_STREAM, INGEST_GROUP],
    ];
    for (const [stream, group] of streams) {
      try {
        await this.redis.xgroup("CREATE", stream, group, "$", "MKSTREAM");
      } catch (e: unknown) {
        if (!String((e as Error).message).includes("BUSYGROUP")) throw e;
      }
    }
  }

  async enqueue(job: ScanJob): Promise<void> {
    await this.redis.xadd(JOBS_STREAM, "*", ...flat(serialise(job as unknown as Record<string, unknown>)));
  }

  async claimJobs(consumer: string, count: number): Promise<{ id: string; job: ScanJob }[]> {
    const res = await this.redis.xreadgroup(
      "GROUP", WORKERS_GROUP, consumer, "COUNT", count, "STREAMS", JOBS_STREAM, ">",
    );
    const out: { id: string; job: ScanJob }[] = [];
    for (const { id, fields } of parseReadGroup(res)) {
      try {
        out.push({ id, job: parseJob(fields) });
      } catch {
        await this.redis.xack(JOBS_STREAM, WORKERS_GROUP, id); // drop poison
      }
    }
    return out;
  }

  async ackJob(id: string): Promise<void> {
    await this.redis.xack(JOBS_STREAM, WORKERS_GROUP, id);
  }

  async publish(ev: WorkerEvent): Promise<void> {
    await this.redis.xadd(EVENTS_STREAM, "*", ...flat(serialise(ev as unknown as Record<string, unknown>)));
  }

  async consumeEvents(consumer: string, count: number): Promise<{ id: string; event: WorkerEvent }[]> {
    const res = await this.redis.xreadgroup(
      "GROUP", INGEST_GROUP, consumer, "COUNT", count, "STREAMS", EVENTS_STREAM, ">",
    );
    const out: { id: string; event: WorkerEvent }[] = [];
    for (const { id, fields } of parseReadGroup(res)) {
      try {
        out.push({ id, event: parseEvent(fields) });
      } catch {
        await this.redis.xack(EVENTS_STREAM, INGEST_GROUP, id); // drop poison
      }
    }
    return out;
  }

  async ackEvent(id: string): Promise<void> {
    await this.redis.xack(EVENTS_STREAM, INGEST_GROUP, id);
  }

  async setHeartbeat(scanId: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(`${HB_PREFIX}${scanId}`, "1", "EX", ttlSeconds);
  }

  async isAlive(scanId: string): Promise<boolean> {
    return (await this.redis.exists(`${HB_PREFIX}${scanId}`)) === 1;
  }

  async requestCancel(scanId: string): Promise<void> {
    await this.redis.set(`${CANCEL_PREFIX}${scanId}`, "1", "EX", 900);
  }

  async isCancelled(scanId: string): Promise<boolean> {
    return (await this.redis.exists(`${CANCEL_PREFIX}${scanId}`)) === 1;
  }
}
