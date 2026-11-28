import { withTx, type Queryable } from "../db";
import { writeAudit } from "../lib/audit";
import { badRequest, notFound } from "../lib/errors";
import { isTerminal, type ScanStatus } from "../lib/scan-state";
import { sha256Hex } from "../lib/tokens";
import { assertScanAllowed, recordUsage } from "../lib/quota";
import type { ScanJob, ScanQueue, WorkerEvent } from "../lib/queue";
import { calculatePostureScore } from "../lib/scoring";
import * as repo from "../repo/scans";
import * as assetsRepo from "../repo/assets";
import * as outboxRepo from "../repo/outbox";

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
  cveIds?: string[];
  /** CISA KEV: this CVE is known exploited in the wild (worker enrichment). */
  knownExploited?: boolean;
  sourceTool?: string;
  remediationSnippets?: Record<string, string>;
  epssScore?: number;
  epssPercentile?: number;
  isKev?: boolean;
};

export const SCAN_PROFILES = ["quick", "standard", "deep", "ai", "api"] as const;
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

/** Auto-create discovered subdomains (out of scope until reviewed) + link parent.
 *  Returns the newly created hostnames so the caller can alert on them. */
async function applyDiscovered(client: Queryable, ev: WorkerEvent): Promise<string[]> {
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
  const newValues: string[] = [];
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
      newValues.push(entry.fqdn);
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

  return newValues;
}

export type CreateScanInput = {
  orgId: string;
  projectId: string | null;
  profile: string;
  triggerSource: "manual" | "scheduled" | "api" | "webhook";
  requestedBy: string | null;
  /** Set when the scan is raised by the scheduler, so it can pace itself. */
  scheduleId?: string | null;
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

  const { scan } = await withTx(async (client) => {
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
      scheduleId: input.scheduleId ?? null,
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

    const primary = assets[0];
    const primaryMethod =
      primary?.verification_method === "http_file" ? "http_file" : "dns_txt";
    const job: ScanJob = {
      scan_id: row.id,
      org_id: input.orgId,
      profile: input.profile as ScanJob["profile"],
      attempt: 0,
      asset_id: primary?.id,
      target_domain: primary?.value,
      verification_token: primary?.verification_token ?? undefined,
      verification_method: primaryMethod,
      targets: assets.map((a) => ({
        asset_id: a.id,
        type: a.type,
        value: a.value,
        verification_token: a.verification_token ?? undefined,
        verification_method: a.verification_method === "http_file" ? "http_file" : "dns_txt",
      })),
    };
    // Transactional outbox: the scan row and its dispatch intent commit in ONE
    // transaction (§06.1). The dispatcher publishes it; the reaper stays as the
    // backstop for anything older than the stale cutoff.
    await outboxRepo.stageScanJob(client, input.orgId, row.id, job);
    return { scan: row };
  }, input.orgId);

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
      cveIds: Array.isArray(o.cve_ids)
        ? (o.cve_ids as unknown[])
          .map((v) => String(v).toUpperCase())
          .filter((v) => /^CVE-\d{4}-\d{4,}$/.test(v))
          .slice(0, 10)
        : undefined,
      knownExploited: o.known_exploited === true,
      sourceTool: typeof o.source_tool === "string" ? o.source_tool.slice(0, 50) : "harizeon",
      remediationSnippets:
        typeof o.remediation_snippets === "object" && o.remediation_snippets !== null
          ? (o.remediation_snippets as Record<string, string>)
          : undefined,
      epssScore: typeof o.epss_score === "number" ? o.epss_score : undefined,
      epssPercentile: typeof o.epss_percentile === "number" ? o.epss_percentile : undefined,
      isKev: o.is_kev === true || o.known_exploited === true,
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

    const existing = await client.query<{ id: string; status: string }>(
      `SELECT id, status FROM findings WHERE org_id = $1 AND fingerprint = $2`,
      [ev.org_id, fingerprint],
    );
    if ((existing.rowCount ?? 0) === 0) {
      await client.query(
        `INSERT INTO findings (
           org_id, asset_id, scan_id, fingerprint, title, description,
           severity, cwe_id, category, cve_ids, status, known_exploited,
           check_id, location, source_tool, evidence, remediation_snippets,
           epss_score, epss_percentile, is_kev, remediation
         )
         VALUES ($1,$2,$3,$4,$5,$6,$7::severity,$8,$9,$10::text[],'open',$11,$12,$13,$14,$15,$16::jsonb,$17,$18,$19,$20)`,
        [
          ev.org_id,
          assetId,
          ev.scan_id,
          fingerprint,
          f.title,
          description,
          f.severity,
          f.cweId ?? null,
          f.category ?? null,
          f.cveIds ?? [],
          f.knownExploited === true,
          f.checkId,
          f.location,
          f.sourceTool ?? "harizeon",
          f.evidence ?? "",
          JSON.stringify(f.remediationSnippets ?? {}),
          f.epssScore ?? null,
          f.epssPercentile ?? null,
          f.isKev === true,
          f.remediation ?? null,
        ],
      );
      created += 1;

      if (assetId) {
        await client.query(
          `INSERT INTO drift_events (org_id, asset_id, scan_id, event_type, severity, summary, details)
           VALUES ($1, $2, $3, 'FINDING_INTRODUCED', $4, $5, $6)`,
          [
            ev.org_id,
            assetId,
            ev.scan_id,
            f.severity,
            f.title,
            JSON.stringify({ location: f.location, check_id: f.checkId }),
          ],
        );
      }
    } else {
      const prevStatus = existing.rows[0].status;
      await client.query(
        `UPDATE findings SET
           last_seen_at = now(),
           severity = $3::severity,
           description = $4,
           remediation = COALESCE($5, remediation),
           cve_ids = $6::text[],
           known_exploited = known_exploited OR $7,
           is_kev = is_kev OR $8,
           evidence = CASE WHEN $9 <> '' THEN $9 ELSE evidence END,
           remediation_snippets = CASE WHEN $10::jsonb <> '{}'::jsonb THEN $10::jsonb ELSE remediation_snippets END,
           source_tool = COALESCE($11, source_tool),
           check_id = COALESCE($12, check_id),
           location = COALESCE($13, location),
           status = CASE WHEN status = 'fixed' THEN 'open' ELSE status END,
           updated_at = now()
         WHERE org_id = $1 AND fingerprint = $2`,
        [
          ev.org_id,
          fingerprint,
          f.severity,
          description,
          f.remediation ?? null,
          f.cveIds ?? [],
          f.knownExploited === true,
          f.isKev === true,
          f.evidence ?? "",
          JSON.stringify(f.remediationSnippets ?? {}),
          f.sourceTool ?? "harizeon",
          f.checkId,
          f.location,
        ],
      );
      updated += 1;

      if (prevStatus === "fixed" && assetId) {
        await client.query(
          `INSERT INTO drift_events (org_id, asset_id, scan_id, event_type, severity, summary, details)
           VALUES ($1, $2, $3, 'FINDING_REGRESSED', $4, $5, $6)`,
          [
            ev.org_id,
            assetId,
            ev.scan_id,
            f.severity,
            `Regression: ${f.title}`,
            JSON.stringify({ location: f.location, check_id: f.checkId }),
          ],
        );
      }
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
export type ApplyResult = { discoveredAssets: string[] };
const NOTHING_DISCOVERED: ApplyResult = { discoveredAssets: [] };

export async function applyEvent(client: Queryable, ev: WorkerEvent): Promise<ApplyResult> {
  // Ignore events for scans that no longer exist (avoids FK poison messages),
  // and fetch the scan's attempt for the staleness guard below.
  const scanMeta = await client.query<{ attempt: number }>(
    `SELECT attempt FROM scans WHERE id = $1`,
    [ev.scan_id],
  );
  if ((scanMeta.rowCount ?? 0) === 0) return NOTHING_DISCOVERED;

  // §06.4: once a scan is retried (reaper bumps the attempt), late events from
  // the dead worker's run must not mutate the newer attempt's state.
  if (typeof ev.attempt === "number" && ev.attempt < scanMeta.rows[0].attempt) {
    return NOTHING_DISCOVERED;
  }

  if (ev.kind === "discovered") {
    return { discoveredAssets: await applyDiscovered(client, ev) };
  }

  if (ev.kind === "findings") {
    await applyFindings(client, ev);
    return NOTHING_DISCOVERED;
  }

  function safeParseRecord(raw: unknown): Record<string, unknown> {
    if (!raw) return {};
    if (typeof raw !== "string") return raw as Record<string, unknown>;
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  if (ev.kind === "snapshot") {
    const snap = ev.snapshot ? safeParseRecord(ev.snapshot) : safeParseRecord(ev.payload);
    const assetId = (snap.asset_id as string) || ev.parent_asset_id;
    if (assetId) {
      const prev = await client.query<{ hosts: string[]; open_ports: Record<string, number[]> }>(
        `SELECT hosts, open_ports FROM asset_snapshots
         WHERE asset_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [assetId],
      );
      if (prev.rows[0]) {
        const prevHosts = new Set<string>(prev.rows[0].hosts || []);
        for (const h of (snap.hosts || []) as string[]) {
          if (!prevHosts.has(h)) {
            await client.query(
              `INSERT INTO drift_events (org_id, asset_id, scan_id, event_type, severity, summary, details)
               VALUES ($1, $2, $3, 'NEW_SUBDOMAIN_DETECTED', 'low', $4, $5)`,
              [ev.org_id, assetId, ev.scan_id, `New subdomain exposed: ${h}`, JSON.stringify({ host: h })],
            );
          }
        }
        const prevPorts = prev.rows[0].open_ports || {};
        const currPorts = (snap.open_ports || {}) as Record<string, number[]>;
        for (const [host, ports] of Object.entries(currPorts)) {
          const oldHostPorts = new Set(prevPorts[host] || []);
          for (const p of ports) {
            if (!oldHostPorts.has(p)) {
              await client.query(
                `INSERT INTO drift_events (org_id, asset_id, scan_id, event_type, severity, summary, details)
                 VALUES ($1, $2, $3, 'NEW_PORT_EXPOSED', 'medium', $4, $5)`,
                [ev.org_id, assetId, ev.scan_id, `New port ${p} exposed on ${host}`, JSON.stringify({ host, port: p })],
              );
            }
          }
        }
      }
      if (snap.tls_expiry_iso && typeof snap.tls_expiry_iso === "object") {
        for (const [host, expStr] of Object.entries(snap.tls_expiry_iso as Record<string, string>)) {
          try {
            const expDate = new Date(expStr);
            const daysLeft = (expDate.getTime() - Date.now()) / (1000 * 86400);
            if (daysLeft > 0 && daysLeft <= 14) {
              await client.query(
                `INSERT INTO drift_events (org_id, asset_id, scan_id, event_type, severity, summary, details)
                 VALUES ($1, $2, $3, 'TLS_CERT_EXPIRING_SOON', 'medium', $4, $5)`,
                [
                  ev.org_id,
                  assetId,
                  ev.scan_id,
                  `TLS certificate for ${host} expires in ${Math.round(daysLeft)} days`,
                  JSON.stringify({ host, expiry: expStr, daysLeft: Math.round(daysLeft) }),
                ],
              );
            }
          } catch {
            // Skip invalid TLS expiry timestamp rather than dropping snapshot persistence
          }
        }
      }
      await client.query(
        `INSERT INTO asset_snapshots (org_id, asset_id, scan_id, hosts, live_urls, open_ports, tech_stack, tls_expiry_iso)
         VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb)`,
        [
          ev.org_id,
          assetId,
          ev.scan_id,
          JSON.stringify(snap.hosts || []),
          JSON.stringify(snap.live_urls || []),
          JSON.stringify(snap.open_ports || {}),
          JSON.stringify(snap.tech_stack || {}),
          JSON.stringify(snap.tls_expiry_iso || {}),
        ],
      );
    }
    return NOTHING_DISCOVERED;
  }

  if (ev.kind === "verify_result") {
    const payload = safeParseRecord(ev.payload);
    const checkId = ev.check_id || (payload.check_id as string | undefined);
    const location = ev.location || (payload.location as string | undefined);
    const fixed = ev.fixed ?? payload.fixed;
    const findingId = payload.finding_id as string | undefined;

    if (fixed) {
      let updatedFinding: { id: string; asset_id: string; title: string; severity: string } | null = null;
      if (findingId) {
        const u = await client.query<{ id: string; asset_id: string; title: string; severity: string }>(
          `UPDATE findings SET status = 'fixed', last_verified_at = now(), resolved_at = now(), updated_at = now()
           WHERE org_id = $1 AND id = $2 AND status != 'fixed'
           RETURNING id, asset_id, title, severity`,
          [ev.org_id, findingId],
        );
        updatedFinding = u.rows[0] ?? null;
      } else if (checkId && location) {
        const u = await client.query<{ id: string; asset_id: string; title: string; severity: string }>(
          `UPDATE findings SET status = 'fixed', last_verified_at = now(), resolved_at = now(), updated_at = now()
           WHERE org_id = $1 AND check_id = $2 AND location = $3 AND status != 'fixed'
           RETURNING id, asset_id, title, severity`,
          [ev.org_id, checkId, location],
        );
        updatedFinding = u.rows[0] ?? null;
      }

      if (updatedFinding) {
        await client.query(
          `INSERT INTO finding_events (finding_id, from_status, to_status, note)
           VALUES ($1, 'open', 'fixed', 'Resolved via micro-scan verification')`,
          [updatedFinding.id],
        );
        if (updatedFinding.asset_id) {
          await client.query(
            `INSERT INTO drift_events (org_id, asset_id, scan_id, event_type, severity, summary, details)
             VALUES ($1, $2, $3, 'FINDING_RESOLVED', 'info', $4, $5)`,
            [
              ev.org_id,
              updatedFinding.asset_id,
              ev.scan_id,
              `Finding resolved: ${updatedFinding.title}`,
              JSON.stringify({ finding_id: updatedFinding.id, check_id: checkId, location }),
            ],
          );
        }
      }
    }
    return NOTHING_DISCOVERED;
  }

  if (ev.kind === "event") {
    await client.query(
      `INSERT INTO scan_events (scan_id, phase, level, message, at)
       VALUES ($1, $2::scan_phase, $3::event_level, $4, COALESCE($5::timestamptz, now()))`,
      [ev.scan_id, ev.phase ?? null, ev.level ?? "info", ev.message ?? "", ev.at ?? null],
    );
    await client.query(`UPDATE scans SET updated_at = now() WHERE id = $1`, [ev.scan_id]);
    return NOTHING_DISCOVERED;
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
  if (res.rowCount === 0) return NOTHING_DISCOVERED; // already terminal — ignore late transition

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

    if (status === "completed") {
      const fRows = await client.query<{
        severity: string;
        epss_score: number | null;
        is_kev: boolean;
        check_id: string | null;
        criticality: string | null;
      }>(
        `SELECT f.severity, f.epss_score, f.is_kev, f.check_id, COALESCE(a.criticality, 'medium') as criticality
         FROM findings f
         LEFT JOIN assets a ON a.id = f.asset_id
         WHERE f.org_id = $1 AND f.status = 'open'`,
        [ev.org_id],
      );
      const aCount = await client.query<{ cnt: string }>(
        `SELECT COUNT(*)::int AS cnt FROM assets WHERE org_id = $1 AND is_active = true`,
        [ev.org_id],
      );
      const score = calculatePostureScore(
        fRows.rows.map((r) => ({
          severity: (r.severity as "info" | "low" | "medium" | "high" | "critical") || "info",
          assetCriticality: r.criticality === "low" || r.criticality === "high" ? r.criticality : "medium",
          epssScore: r.epss_score != null ? Number(r.epss_score) : null,
          isKev: r.is_kev === true,
          checkId: r.check_id || "unknown",
        })),
        Number(aCount.rows[0]?.cnt ?? 1),
      );
      await client.query(`UPDATE orgs SET posture_score = $1 WHERE id = $2`, [score, ev.org_id]);
    }
  }

  return NOTHING_DISCOVERED;
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
