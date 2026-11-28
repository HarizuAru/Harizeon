import { randomUUID } from "node:crypto";
import type Redis from "ioredis";
import type { ScanPhase, ScanStatus } from "./scan-state";

export const JOBS_STREAM = "harizeon:scans:jobs";
export const EVENTS_STREAM = "harizeon:scans:events";
export const WORKERS_GROUP = "workers";
export const INGEST_GROUP = "ingest";
const HB_PREFIX = "harizeon:scan:hb:";
const CANCEL_PREFIX = "harizeon:scan:cancel:";

export type ScanProfile = "quick" | "standard" | "deep" | "ai" | "api";

export type ScanTargetJob = {
  asset_id: string;
  type: string;
  value: string;
  verification_token?: string;
  verification_method?: "dns_txt" | "http_file";
};

export type ScanJob = {
  scan_id: string;
  org_id: string;
  profile: ScanProfile;
  attempt: number;
  targets: ScanTargetJob[];
  asset_id?: string;
  mode?: "full" | "verify_finding";
  verify_check_id?: string;
  verify_location?: string;
  verification_token?: string;
  verification_method?: "dns_txt" | "http_file";
  target_domain?: string;
};

export type WorkerEvent = {
  scan_id: string;
  org_id: string;
  kind: "status" | "event" | "terminal" | "discovered" | "findings" | "snapshot" | "verify_result";
  status?: ScanStatus;
  phase?: ScanPhase;
  level?: "info" | "warn" | "error";
  message?: string;
  progress_pct?: number;
  error_code?: string;
  attempt?: number;
  at?: string;
  /** kind=discovered|findings: the asset the results belong to. */
  parent_asset_id?: string;
  /** kind=discovered: JSON array of { fqdn, ips, source }. */
  discovered?: string;
  /** kind=findings: JSON array of { checkId, location, title, severity, ... }. */
  findings?: string;
  /** kind=snapshot: JSON object of asset snapshot telemetry. */
  snapshot?: string;
  /** kind=verify_result: verification outcome */
  payload?: string;
  check_id?: string;
  location?: string;
  fixed?: boolean | string;
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
  /** Re-deliver events left pending by a failed/crashed ingest (at-least-once). */
  reclaimEvents(consumer: string, minIdleMs: number, count: number): Promise<{ id: string; event: WorkerEvent }[]>;
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

const VALID_KINDS = new Set([
  "status", "event", "terminal", "discovered", "findings", "snapshot", "verify_result",
  "completed", "failed", "phase", "finding",
]);

export function parseJob(fields: Record<string, string>): ScanJob {
  const { scan_id, org_id, profile, targets } = fields;
  if (!scan_id || !org_id || !profile || !targets) throw new Error("invalid job payload");
  const parsed = JSON.parse(targets) as ScanJob["targets"];
  if (!Array.isArray(parsed)) throw new Error("invalid job targets");
  const job: ScanJob = {
    scan_id,
    org_id,
    profile: profile as ScanProfile,
    attempt: Number(fields.attempt ?? "0"),
    targets: parsed,
  };
  if (fields.asset_id) job.asset_id = fields.asset_id;
  if (fields.mode) job.mode = fields.mode as ScanJob["mode"];
  if (fields.verify_check_id) job.verify_check_id = fields.verify_check_id;
  if (fields.verify_location) job.verify_location = fields.verify_location;
  if (fields.verification_token) job.verification_token = fields.verification_token;
  if (fields.verification_method === "dns_txt" || fields.verification_method === "http_file") {
    job.verification_method = fields.verification_method;
  }
  if (fields.target_domain) job.target_domain = fields.target_domain;
  return job;
}

export function parseEvent(fields: Record<string, string>): WorkerEvent {
  const rawKind = fields.kind || fields.type;
  if (!fields.scan_id || !fields.org_id || !rawKind || !VALID_KINDS.has(rawKind)) {
    throw new Error("invalid event payload");
  }

  let kind: WorkerEvent["kind"] = "status";
  let status: ScanStatus | undefined = fields.status as ScanStatus | undefined;
  if (rawKind === "completed") {
    kind = "terminal";
    status = "completed";
  } else if (rawKind === "failed") {
    kind = "terminal";
    status = "failed";
  } else if (rawKind === "phase") {
    kind = "status";
  } else if (rawKind === "finding") {
    kind = "findings";
  } else {
    kind = rawKind as WorkerEvent["kind"];
  }

  const ev: WorkerEvent = {
    scan_id: fields.scan_id,
    org_id: fields.org_id,
    kind,
  };
  if (status) ev.status = status;
  if (fields.phase) ev.phase = fields.phase as ScanPhase;
  if (fields.level) ev.level = fields.level as WorkerEvent["level"];
  if (fields.message !== undefined) ev.message = fields.message;
  if (fields.progress_pct !== undefined) ev.progress_pct = Number(fields.progress_pct);
  if (fields.error_code !== undefined) ev.error_code = fields.error_code;
  if (fields.attempt !== undefined) ev.attempt = Number(fields.attempt);
  if (fields.at !== undefined) ev.at = fields.at;
  if (fields.parent_asset_id) ev.parent_asset_id = fields.parent_asset_id;
  if (fields.discovered !== undefined) ev.discovered = fields.discovered;
  if (fields.findings !== undefined) ev.findings = fields.findings;
  if (fields.snapshot !== undefined) ev.snapshot = fields.snapshot;
  if (fields.payload !== undefined) ev.payload = fields.payload;
  if (fields.check_id !== undefined) ev.check_id = fields.check_id;
  if (fields.location !== undefined) ev.location = fields.location;
  if (fields.fixed !== undefined) ev.fixed = fields.fixed === "true";
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

  async reclaimEvents(_consumer: string, _minIdleMs: number, _count: number): Promise<{ id: string; event: WorkerEvent }[]> {
    return []; // the in-memory adapter never leaves anything pending
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
  private readonly jobs: string;
  private readonly events: string;

  constructor(private readonly redis: Redis, prefix = "") {
    this.jobs = prefix + JOBS_STREAM;
    this.events = prefix + EVENTS_STREAM;
  }

  async ready(): Promise<void> {
    const streams: [string, string][] = [
      [this.jobs, WORKERS_GROUP],
      [this.events, INGEST_GROUP],
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
    await this.redis.xadd(this.jobs, "*", ...flat(serialise(job as unknown as Record<string, unknown>)));
  }

  async claimJobs(consumer: string, count: number): Promise<{ id: string; job: ScanJob }[]> {
    const res = await this.withGroupRecovery(() =>
      this.redis.xreadgroup("GROUP", WORKERS_GROUP, consumer, "COUNT", count, "STREAMS", this.jobs, ">"),
    );
    const out: { id: string; job: ScanJob }[] = [];
    for (const { id, fields } of parseReadGroup(res)) {
      try {
        out.push({ id, job: parseJob(fields) });
      } catch {
        await this.redis.xack(this.jobs, WORKERS_GROUP, id); // drop poison
      }
    }
    return out;
  }

  async ackJob(id: string): Promise<void> {
    await this.redis.xack(this.jobs, WORKERS_GROUP, id);
  }

  async publish(ev: WorkerEvent): Promise<void> {
    await this.redis.xadd(this.events, "*", ...flat(serialise(ev as unknown as Record<string, unknown>)));
  }

  async consumeEvents(consumer: string, count: number): Promise<{ id: string; event: WorkerEvent }[]> {
    const res = await this.withGroupRecovery(() =>
      this.redis.xreadgroup("GROUP", INGEST_GROUP, consumer, "COUNT", count, "STREAMS", this.events, ">"),
    );
    return this.mapEvents(res);
  }

  async reclaimEvents(consumer: string, minIdleMs: number, count: number): Promise<{ id: string; event: WorkerEvent }[]> {
    // Re-deliver messages a previous ingest pass failed to ack (at-least-once).
    const res = (await this.withGroupRecovery(() =>
      this.redis.xautoclaim(this.events, INGEST_GROUP, consumer, minIdleMs, "0-0", "COUNT", count),
    )) as unknown as [string, [string, string[]][], string[]];
    const entries = Array.isArray(res?.[1]) ? res[1] : [];
    return this.mapEvents([[this.events, entries]]);
  }

  /** Recreate streams/groups if they were removed (NOGROUP) and retry once. */
  private async withGroupRecovery<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (e: unknown) {
      if (String((e as Error)?.message ?? "").includes("NOGROUP")) {
        await this.ready();
        return await fn();
      }
      throw e;
    }
  }

  private async mapEvents(res: unknown): Promise<{ id: string; event: WorkerEvent }[]> {
    const out: { id: string; event: WorkerEvent }[] = [];
    for (const { id, fields } of parseReadGroup(res)) {
      try {
        out.push({ id, event: parseEvent(fields) });
      } catch {
        await this.redis.xack(this.events, INGEST_GROUP, id); // drop poison
      }
    }
    return out;
  }

  async ackEvent(id: string): Promise<void> {
    await this.redis.xack(this.events, INGEST_GROUP, id);
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
