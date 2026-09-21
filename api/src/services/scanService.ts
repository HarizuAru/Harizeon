import { withTx, type Queryable } from "../db";
import { writeAudit } from "../lib/audit";
import { badRequest, notFound } from "../lib/errors";
import { isTerminal, type ScanStatus } from "../lib/scan-state";
import { sha256Hex } from "../lib/tokens";
import { assertScanAllowed, recordUsage } from "../lib/quota";
import type { ScanJob, ScanQueue, WorkerEvent } from "../lib/queue";
import * as repo from "../repo/scans";
import * as assetsRepo from "../repo/assets";

const SEVERITIES = new Set(["info", "low", "medium", "high", "critical"]);

export type WorkerFinding = {
  checkId: string;
  location: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  description?: string;
  remediation?: string;
  cweId?: string;
  category?: string;
  evidence?: string;
};

export const SCAN_PROFILES = ["quick", "standard", "deep"] as const;
const MAX_TARGETS = 50;

const TERMINAL_SQL = `('completed','failed','timeout','cancelled')`;

const HOST_RE = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

/** Parse + validate a discovery payload; drop anything that is not a hostname. */
export function parseDiscovered(raw: string | undefined): { fqdn: string }[] {
  if (!raw) return [];
  let arr: unknown;
  try {
    arr = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  const out: { fqdn: string }[] = [];
  for (const item of arr) {
    const fqdn = String((item as { fqdn?: unknown })?.fqdn ?? "")
      .trim()
      .toLowerCase()
      .replace(/\.$/, "");
    if (fqdn && HOST_RE.test(fqdn)) out.push({ fqdn });
  }
  return out;
}

/** Auto-create discovered subdomains (out of scope until reviewed) + link parent. */
async function applyDiscovered(client: Queryable, ev: WorkerEvent): Promise<void> {
  const entries = parseDiscovered(ev.discovered);
  const parentId = ev.parent_asset_id || null;

  // Only accept hostnames that are strict subdomains of the scanned asset, so a
  // buggy/compromised worker cannot inject arbitrary assets into the org.
  let parentValue: string | null = null;
  if (parentId) {
    const p = await client.query<{ value: string }>(
      `SELECT value FROM assets WHERE id = $1 AND org_id = $2`,
      [parentId, ev.org_id],
    );
    parentValue = p.rows[0]?.value ?? null;
  }
  const accepted = parentId
    ? parentValue
      ? entries.filter((e) => e.fqdn.endsWith("." + parentValue))
      : [] // unknown parent in this org -> reject the batch entirely
    : entries;

  let created = 0;
  for (const entry of accepted) {
    const ins = await client.query(
      `INSERT INTO assets (org_id, type, value, parent_asset_id, discovered_by, is_active)
       VALUES ($1,'subdomain',$2,$3,'discovery',false)
       ON CONFLICT (org_id, type, value) DO NOTHING
       RETURNING id`,
      [ev.org_id, entry.fqdn, parentId],
    );
    if ((ins.rowCount ?? 0) > 0) {
      created += 1;
    } else {
      await client.query(
        `UPDATE assets SET last_seen_at = now(), updated_at = now(),
           parent_asset_id = COALESCE(parent_asset_id, $3)
         WHERE org_id = $1 AND type = 'subdomain' AND value = $2`,
        [ev.org_id, entry.fqdn, parentId],
      );
    }
  }

  await client.query(
    `INSERT INTO scan_events (scan_id, phase, level, message) VALUES ($1,'discover','info',$2)`,
    [ev.scan_id, `discovery inventory: ${accepted.length} host(s), ${created} new`],
  );

  if (created > 0) {
    await writeAudit(client, {
      orgId: ev.org_id,
      actorType: "system",
      action: "asset.discovered",
      targetType: "scan",
      targetId: ev.scan_id,
      metadata: { created, total: accepted.length },
    });
  }
}

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
    // §13.2 plan limits (profiles / scans per month / assets).
    await assertScanAllowed(client, input.orgId, input.profile);

    const assets = await repo.resolveScanAssets(client, input.orgId, input.assetIds);
    if (assets.length !== input.assetIds.length) {
      throw badRequest("asset_not_found", "One or more assets were not found");
    }
    for (const a of assets) {
      if (!a.is_active) throw badRequest("asset_inactive", `Asset ${a.value} is retired`);
      if (a.verification_status !== "verified") {
        const inherited = await assetsRepo.isVerifiedOrInherited(client, input.orgId, a.id);
        if (!inherited) {
          throw badRequest(
            "asset_not_verified",
            `Asset ${a.value} must be verified before scanning.`,
          );
        }
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
    // Meter the billable unit (§13.1): deep scans cost more than standard.
    await recordUsage(client, input.orgId, `scan.${input.profile}`, input.profile === "deep" ? 5 : 0);
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

/** Parse + validate a findings payload; escape HTML-ish fields stay verbatim. */
export function parseFindings(raw: string | undefined): WorkerFinding[] {
  if (!raw) return [];
  let arr: unknown;
  try {
    arr = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  const out: WorkerFinding[] = [];
  for (const item of arr) {
    const o = (item ?? {}) as Record<string, unknown>;
    const title = String(o.title ?? "").trim();
    const severity = String(o.severity ?? "").trim().toLowerCase();
    if (!title || !SEVERITIES.has(severity)) continue; // drop invalid, keep the rest
    out.push({
      checkId: String(o.check_id ?? o.checkId ?? "unknown"),
      location: String(o.location ?? "").slice(0, 300),
      severity: severity as WorkerFinding["severity"],
      title: title.slice(0, 200),
      description: typeof o.description === "string" ? o.description.slice(0, 2000) : undefined,
      remediation: typeof o.remediation === "string" ? o.remediation.slice(0, 2000) : undefined,
      cweId: typeof o.cwe_id === "string" ? o.cwe_id.slice(0, 20) : undefined,
      category: typeof o.category === "string" ? o.category.slice(0, 60) : undefined,
      evidence: typeof o.evidence === "string" ? o.evidence.slice(0, 2000) : undefined,
    });
  }
  return out;
}

/**
 * Persist a findings batch into the §07 findings schema. One fingerprint per
 * (asset, check, location) means the same issue across scans stays ONE finding
 * with history instead of piling up rows.
 */
async function applyFindings(client: Queryable, ev: WorkerEvent): Promise<void> {
  const items = parseFindings(ev.findings);
  const assetId = ev.parent_asset_id || null;

  if (assetId) {
    const owned = await client.query(`SELECT 1 FROM assets WHERE id = $1 AND org_id = $2`, [assetId, ev.org_id]);
    if ((owned.rowCount ?? 0) === 0) return; // asset is not ours -> reject the batch
  }

  let created = 0;
  let updated = 0;
  for (const f of items) {
    const fingerprint = sha256Hex(`${assetId ?? ""}|${f.checkId}|${f.location}`);
    const description = [f.description, f.evidence ? `Evidence: ${f.evidence}` : null]
      .filter(Boolean)
      .join(" — ");

    const existing = await client.query<{ id: string }>(
      `SELECT id FROM findings WHERE org_id = $1 AND fingerprint = $2`,
      [ev.org_id, fingerprint],
    );
    if ((existing.rowCount ?? 0) === 0) {
      await client.query(
        `INSERT INTO findings (org_id, asset_id, scan_id, fingerprint, title, description,
           severity, cwe_id, category, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7::severity,$8,$9,'open')`,
        [ev.org_id, assetId, ev.scan_id, fingerprint, f.title, description, f.severity, f.cweId ?? null, f.category ?? null],
      );
      created += 1;
    } else {
      await client.query(
        `UPDATE findings SET last_seen_at = now(), severity = $3::severity, description = $4,
           remediation = COALESCE($5, remediation), updated_at = now()
         WHERE org_id = $1 AND fingerprint = $2`,
        [ev.org_id, fingerprint, f.severity, description, f.remediation ?? null],
      );
      updated += 1;
    }
  }

  await client.query(
    `INSERT INTO scan_events (scan_id, phase, level, message) VALUES ($1,$2::scan_phase,'info',$3)`,
    [ev.scan_id, ev.phase ?? "normalize", `findings recorded: ${created} new, ${updated} unchanged`],
  );
}

/**
 * Apply one worker event to the control-plane state machine. Tenant writes run
 * inside withTx(org). Terminal transitions are first-writer-wins so a late event
 * cannot resurrect a cancelled/finished scan.
 */
export async function applyEvent(client: Queryable, ev: WorkerEvent): Promise<void> {
  // Ignore events for scans that no longer exist (avoids FK poison messages).
  const exists = await client.query(`SELECT 1 FROM scans WHERE id = $1`, [ev.scan_id]);
  if ((exists.rowCount ?? 0) === 0) return;

  if (ev.kind === "discovered") {
    await applyDiscovered(client, ev);
    return;
  }

  if (ev.kind === "findings") {
    await applyFindings(client, ev);
    return;
  }

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
