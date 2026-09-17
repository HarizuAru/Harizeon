import { withTx, type Queryable } from "../db";
import { writeAudit } from "../lib/audit";
import { badRequest, notFound } from "../lib/errors";
import { isTerminal, type ScanStatus } from "../lib/scan-state";
import type { ScanJob, ScanQueue, WorkerEvent } from "../lib/queue";
import * as repo from "../repo/scans";

export const SCAN_PROFILES = ["quick", "standard", "deep"] as const;
const MAX_TARGETS = 50;

const TERMINAL_SQL = `('completed','failed','timeout','cancelled')`;

export type CreateScanInput = {
  orgId: string;
  projectId: string | null;
  profile: string;
  triggerSource: "manual" | "scheduled" | "api" | "webhook";
  requestedBy: string | null;
  assetIds: string[];
};

/**
 * Create a scan for verified assets only (§12) and enqueue its job. Throws 400
 * `asset_not_verified` when any target lacks proof of ownership.
 */
export async function createScan(queue: ScanQueue, input: CreateScanInput): Promise<repo.ScanRow> {
  if (input.assetIds.length === 0) throw badRequest("no_targets", "Select at least one asset");
  if (input.assetIds.length > MAX_TARGETS) {
    throw badRequest("too_many_targets", `At most ${MAX_TARGETS} assets per scan`);
  }

  const { scan, job } = await withTx(async (client) => {
    const assets = await repo.resolveScanAssets(client, input.orgId, input.assetIds);
    if (assets.length !== input.assetIds.length) {
      throw badRequest("asset_not_found", "One or more assets were not found");
    }
    for (const a of assets) {
      if (!a.is_active) throw badRequest("asset_inactive", `Asset ${a.value} is retired`);
      if (a.verification_status !== "verified") {
        throw badRequest(
          "asset_not_verified",
          `Asset ${a.value} must be verified before scanning.`,
        );
      }
    }

    const row = await repo.createScanRow(client, {
      orgId: input.orgId,
      projectId: input.projectId,
      triggerSource: input.triggerSource,
      profile: input.profile,
      requestedBy: input.requestedBy,
    });
    await repo.insertScanTargets(client, row.id, input.assetIds);
    await writeAudit(client, {
      orgId: input.orgId,
      actorType: input.requestedBy ? "user" : "system",
      actorId: input.requestedBy ?? undefined,
      action: "scan.start",
      targetType: "scan",
      targetId: row.id,
      metadata: { profile: input.profile, assets: assets.length },
    });

    const job: ScanJob = {
      scan_id: row.id,
      org_id: input.orgId,
      profile: input.profile as ScanJob["profile"],
      attempt: 0,
      targets: assets.map((a) => ({ asset_id: a.id, type: a.type, value: a.value })),
    };
    return { scan: row, job };
  }, input.orgId);

  try {
    await queue.enqueue(job);
  } catch (e) {
    // Scan row exists; the reaper will requeue it after the stale cutoff.
    console.error("[scan] enqueue failed:", e instanceof Error ? e.message : e);
  }
  return scan;
}

/**
 * Apply one worker event to the control-plane state machine. Tenant writes run
 * inside withTx(org). Terminal transitions are first-writer-wins so a late event
 * cannot resurrect a cancelled/finished scan.
 */
export async function applyEvent(client: Queryable, ev: WorkerEvent): Promise<void> {
  if (ev.kind === "event") {
    await client.query(
      `INSERT INTO scan_events (scan_id, phase, level, message, at)
       VALUES ($1, $2::scan_phase, $3::event_level, $4, COALESCE($5::timestamptz, now()))`,
      [ev.scan_id, ev.phase ?? null, ev.level ?? "info", ev.message ?? "", ev.at ?? null],
    );
    await client.query(`UPDATE scans SET updated_at = now() WHERE id = $1`, [ev.scan_id]);
    return;
  }

  const sets: string[] = ["updated_at = now()"];
  const params: unknown[] = [ev.scan_id];
  if (ev.status) {
    params.push(ev.status);
    sets.push(`status = $${params.length}::scan_status`);
  }
  if (ev.phase) {
    params.push(ev.phase);
    sets.push(`phase = $${params.length}::scan_phase`);
  }
  if (ev.progress_pct !== undefined) {
    params.push(ev.progress_pct);
    sets.push(`progress_pct = $${params.length}`);
  }
  if (ev.attempt !== undefined) {
    params.push(ev.attempt);
    sets.push(`attempt = $${params.length}`);
  }
  if (ev.error_code !== undefined) {
    params.push(ev.error_code);
    sets.push(`error_code = $${params.length}`);
  }
  if (ev.status === "claimed") sets.push(`started_at = COALESCE(started_at, now())`);
  if (ev.kind === "terminal") {
    sets.push(`finished_at = now()`);
    if (ev.progress_pct === undefined) sets.push(`progress_pct = 100`);
  }

  const res = await client.query(
    `UPDATE scans SET ${sets.join(", ")}
     WHERE id = $1 AND status NOT IN ${TERMINAL_SQL}`,
    params,
  );
  if (res.rowCount === 0) return; // already terminal — ignore late transition

  if (ev.kind === "terminal") {
    const status = (ev.status ?? "completed") as ScanStatus;
    await client.query(
      `INSERT INTO scan_events (scan_id, phase, level, message)
       VALUES ($1, $2::scan_phase, $3::event_level, $4)`,
      [
        ev.scan_id,
        ev.phase ?? "report",
        status === "completed" ? "info" : "error",
        `scan ${status}`,
      ],
    );
    await writeAudit(client, {
      orgId: ev.org_id,
      actorType: "system",
      action: `scan.${status}`,
      targetType: "scan",
      targetId: ev.scan_id,
    });
  }
}

/** Cancel an in-flight scan and signal the worker. */
export async function cancelScan(
  queue: ScanQueue,
  orgId: string,
  scanId: string,
  actorId: string | undefined,
): Promise<repo.ScanRow> {
  const updated = await withTx(async (client) => {
    const scan = await repo.getScan(client, orgId, scanId);
    if (!scan) throw notFound("scan_not_found", "Scan not found");
    if (isTerminal(scan.status as ScanStatus)) {
      throw badRequest("scan_finished", "Scan has already finished");
    }
    const res = await client.query<repo.ScanRow>(
      `UPDATE scans SET status = 'cancelled', finished_at = now(), updated_at = now()
       WHERE id = $1 AND status NOT IN ${TERMINAL_SQL} RETURNING ${repo.SCAN_COLS}`,
      [scanId],
    );
    if (res.rowCount === 0) throw badRequest("scan_finished", "Scan has already finished");
    await client.query(
      `INSERT INTO scan_events (scan_id, level, message) VALUES ($1,'warn','scan cancelled by user')`,
      [scanId],
    );
    await writeAudit(client, {
      orgId,
      actorType: "user",
      actorId,
      action: "scan.cancel",
      targetType: "scan",
      targetId: scanId,
    });
    return res.rows[0];
  }, orgId);

  try {
    await queue.requestCancel(scanId);
  } catch (e) {
    console.error("[scan] cancel signal failed:", e instanceof Error ? e.message : e);
  }
  return updated;
}

export type StaleScan = { scan_id: string; org_id: string; attempt: number; status: string };

/** In-flight scans with no progress past the cutoff, across all orgs. */
export async function staleScans(db: Queryable, cutoff: Date): Promise<StaleScan[]> {
  const res = await db.query<StaleScan>(`SELECT scan_id, org_id, attempt, status FROM scans_stale($1)`, [cutoff]);
  return res.rows;
}
