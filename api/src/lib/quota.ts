import type { Queryable } from "../db";
import { badRequest, FastifyError } from "./errors";

export type PlanLimits = {
  max_assets: number;
  scans_per_month: number;
  profiles: string[];
  retention_days: number;
  seats: number;
  pdf_reports: boolean;
  api: boolean;
};

const UNLIMITED = -1;

async function limitsForOrg(db: Queryable, orgId: string): Promise<PlanLimits> {
  const res = await db.query<{ limits: PlanLimits }>(
    `SELECT p.limits FROM orgs o JOIN plans p ON p.id = o.plan_id WHERE o.id = $1`,
    [orgId],
  );
  const limits = res.rows[0]?.limits;
  if (limits) return limits;
  // New orgs have no plan_id until checkout: the free tier applies.
  const free = await db.query<{ limits: PlanLimits }>(`SELECT limits FROM plans WHERE code = 'free' LIMIT 1`);
  return (
    free.rows[0]?.limits ?? {
      max_assets: 1,
      scans_per_month: 1,
      profiles: ["quick"],
      retention_days: 14,
      seats: 1,
      pdf_reports: false,
      api: false,
    }
  );
}

/**
 * §13.2 limits enforced on scan creation. `-1` means unlimited. Callers run this
 * inside withTx(orgId) so it sees the tenant's own rows.
 */
export async function assertScanAllowed(db: Queryable, orgId: string, profile: string): Promise<void> {
  const limits = await limitsForOrg(db, orgId);

  if (!limits.profiles.includes(profile)) {
    throw badRequest(
      "profile_not_in_plan",
      `The ${profile} profile is not included in your plan (allowed: ${limits.profiles.join(", ")}).`,
    );
  }

  if (limits.scans_per_month !== UNLIMITED) {
    const used = await db.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM scans
       WHERE org_id = $1 AND created_at >= date_trunc('month', now())`,
      [orgId],
    );
    if (Number(used.rows[0]?.count ?? "0") >= limits.scans_per_month) {
      throw new FastifyError(
        402,
        "scan_limit_reached",
        `Monthly scan limit reached (${limits.scans_per_month}). Upgrade your plan to scan more.`,
        "/docs/errors/scan_limit_reached",
      );
    }
  }

  if (limits.max_assets !== UNLIMITED) {
    const assets = await db.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM assets WHERE org_id = $1 AND is_active = true`,
      [orgId],
    );
    if (Number(assets.rows[0]?.count ?? "0") > limits.max_assets) {
      throw new FastifyError(
        402,
        "asset_limit_reached",
        `Asset limit reached (${limits.max_assets}). Upgrade your plan to monitor more assets.`,
        "/docs/errors/asset_limit_reached",
      );
    }
  }
}

/** Meter one billable unit (§13.1/§07 usage_records). */
export async function recordUsage(
  db: Queryable,
  orgId: string,
  metric: string,
  unitCost: number,
  quantity = 1,
): Promise<void> {
  await db.query(
    `INSERT INTO usage_records (org_id, metric, quantity, unit_cost) VALUES ($1,$2,$3,$4)`,
    [orgId, metric, quantity, unitCost],
  );
}
