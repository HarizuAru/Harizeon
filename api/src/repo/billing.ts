import type { Queryable } from "../db";

export type PlanLimits = {
  max_assets: number;
  scans_per_month: number;
  profiles: string[];
  retention_days: number;
  seats: number;
  pdf_reports: boolean;
  api: boolean;
  schedule: string;
};

export type PlanRow = {
  id: string;
  code: string;
  price_myr_month: number;
  limits: PlanLimits;
};

export type SubscriptionRow = {
  id: string;
  org_id: string;
  plan_id: string;
  provider: string;
  provider_ref: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export type InvoiceRow = {
  id: string;
  org_id: string;
  number: string;
  period_start: string;
  period_end: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  pdf_ref: string | null;
  paid_at: string | null;
  created_at: string;
};

export type UsageMetrics = {
  assets_monitored: number;
  max_assets: number;
  scans_this_month: number;
  max_scans_per_month: number;
  is_asset_limit_near: boolean;
  is_scan_limit_near: boolean;
  retention_days: number;
  seats_used: number;
  max_seats: number;
  period_start: string;
  period_end: string;
};

export async function getOrgPlanAndUsage(db: Queryable, orgId: string): Promise<{
  plan: PlanRow;
  subscription: SubscriptionRow | null;
  usage: UsageMetrics;
}> {
  // Fetch active org plan, or fallback to starter or free
  const orgRes = await db.query<{ plan_id: string | null }>(
    `SELECT plan_id FROM orgs WHERE id = $1`,
    [orgId],
  );

  let planRes;
  if (orgRes.rows[0]?.plan_id) {
    planRes = await db.query<PlanRow>(
      `SELECT id, code, price_myr_month, limits FROM plans WHERE id = $1`,
      [orgRes.rows[0].plan_id],
    );
  }

  if (!planRes || planRes.rows.length === 0) {
    planRes = await db.query<PlanRow>(
      `SELECT id, code, price_myr_month, limits FROM plans WHERE code = 'starter' LIMIT 1`,
    );
  }

  const plan = planRes.rows[0] ?? {
    id: "plan-starter",
    code: "starter",
    price_myr_month: 79,
    limits: {
      max_assets: 5,
      scans_per_month: 50,
      profiles: ["quick", "standard"],
      retention_days: 90,
      seats: 1,
      pdf_reports: true,
      api: false,
      schedule: "weekly",
    },
  };

  // Fetch subscription if present
  const subRes = await db.query<SubscriptionRow>(
    `SELECT id, org_id, plan_id, provider, provider_ref, status, current_period_end, cancel_at_period_end
     FROM subscriptions WHERE org_id = $1 LIMIT 1`,
    [orgId],
  );
  const subscription = subRes.rows[0] ?? null;

  // Compute live asset count
  const assetRes = await db.query<{ count: string }>(
    `SELECT count(*)::text as count FROM assets WHERE org_id = $1 AND is_active = true`,
    [orgId],
  );
  const assetCount = parseInt(assetRes.rows[0]?.count ?? "0", 10);

  // Compute scans in current month
  const now = new Date();
  const firstDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const lastDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59)).toISOString();

  const scanRes = await db.query<{ count: string }>(
    // created_at, not started_at: queued scans must count toward the quota or a
    // user could bypass the limit by queueing work (§13.2, same basis as quota.ts).
    `SELECT count(*)::text as count FROM scans WHERE org_id = $1 AND created_at >= $2`,
    [orgId, firstDay],
  );
  const scanCount = parseInt(scanRes.rows[0]?.count ?? "0", 10);

  // Members count
  const memRes = await db.query<{ count: string }>(
    `SELECT count(*)::text as count FROM memberships WHERE org_id = $1`,
    [orgId],
  );
  const seatCount = parseInt(memRes.rows[0]?.count ?? "1", 10);

  const maxAssets = plan.limits.max_assets;
  const maxScans = plan.limits.scans_per_month;

  return {
    plan,
    subscription,
    usage: {
      assets_monitored: assetCount,
      max_assets: maxAssets,
      scans_this_month: scanCount,
      max_scans_per_month: maxScans,
      is_asset_limit_near: maxAssets > 0 && assetCount / maxAssets >= 0.8,
      is_scan_limit_near: maxScans > 0 && scanCount / maxScans >= 0.8,
      retention_days: plan.limits.retention_days,
      seats_used: seatCount,
      max_seats: plan.limits.seats,
      period_start: firstDay,
      period_end: lastDay,
    },
  };
}

export async function listInvoices(db: Queryable, orgId: string): Promise<InvoiceRow[]> {
  const res = await db.query<InvoiceRow>(
    `SELECT id, org_id, number, period_start, period_end, subtotal, tax, total, currency, status, pdf_ref, paid_at, created_at
     FROM invoices WHERE org_id = $1 ORDER BY created_at DESC`,
    [orgId],
  );
  return res.rows;
}

export async function switchPlan(
  db: Queryable,
  orgId: string,
  targetPlanCode: string,
): Promise<{ plan: PlanRow; subscription: SubscriptionRow }> {
  const planRes = await db.query<PlanRow>(
    `SELECT id, code, price_myr_month, limits FROM plans WHERE code = $1`,
    [targetPlanCode],
  );
  if (planRes.rows.length === 0) {
    throw new Error(`Plan ${targetPlanCode} not found`);
  }
  const targetPlan = planRes.rows[0];

  // Update org's plan_id
  await db.query(`UPDATE orgs SET plan_id = $1, billing_status = 'active', updated_at = now() WHERE id = $2`, [
    targetPlan.id,
    orgId,
  ]);

  // Upsert subscription. One row per org; do it with a read-then-write because
  // subscriptions has no unique constraint on (org_id, plan_id) and a failing
  // ON CONFLICT inside withTx() would abort the whole transaction (25P02).
  const currentEnd = new Date(Date.now() + 30 * 86400000).toISOString();
  const existing = await db.query<SubscriptionRow>(
    `SELECT id FROM subscriptions WHERE org_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [orgId],
  );
  const subRes =
    existing.rows.length > 0
      ? await db.query<SubscriptionRow>(
          `UPDATE subscriptions SET plan_id = $1, status = 'active', current_period_end = $2, updated_at = now()
           WHERE id = $3 RETURNING *`,
          [targetPlan.id, currentEnd, existing.rows[0].id],
        )
      : await db.query<SubscriptionRow>(
          `INSERT INTO subscriptions (org_id, plan_id, provider, status, current_period_end, cancel_at_period_end)
           VALUES ($1, $2, 'fpx_stripe', 'active', $3, false) RETURNING *`,
          [orgId, targetPlan.id, currentEnd],
        );

  return {
    plan: targetPlan,
    subscription: subRes.rows[0],
  };
}
