import type { Queryable } from "../db";

export type OrgRow = {
  id: string;
  name: string;
  slug: string;
  plan_id: string | null;
  billing_status: string;
  country: string | null;
  currency: string;
  enforce_mfa: boolean;
  trial_ends_at: string | null;
  suspended_at: string | null;
  created_at: string;
  updated_at: string;
  public_trust_enabled?: boolean;
  posture_score?: number;
};

export type ProjectRow = {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

export async function createOrg(
  db: Queryable,
  input: { name: string; slug: string },
): Promise<OrgRow> {
  const res = await db.query<OrgRow>(
    `INSERT INTO orgs (name, slug, billing_status, currency)
     VALUES ($1,$2,'trialing','MYR')
     RETURNING id, name, slug, plan_id, billing_status, country, currency, trial_ends_at, suspended_at, created_at, updated_at`,
    [input.name, input.slug],
  );
  return res.rows[0];
}

export async function getOrgById(db: Queryable, orgId: string): Promise<OrgRow | null> {
  const res = await db.query<OrgRow>(
    `SELECT id, name, slug, plan_id, billing_status, country, currency, enforce_mfa, trial_ends_at, suspended_at, created_at, updated_at
     FROM orgs WHERE id = $1`,
    [orgId],
  );
  return res.rows[0] ?? null;
}

export async function updateOrg(
  db: Queryable,
  orgId: string,
  patch: { name?: string; enforce_mfa?: boolean },
): Promise<OrgRow | null> {
  const res = await db.query<OrgRow>(
    `UPDATE orgs
     SET name = COALESCE($2, name),
         enforce_mfa = COALESCE($3, enforce_mfa),
         updated_at = now()
     WHERE id = $1
     RETURNING id, name, slug, plan_id, billing_status, country, currency, enforce_mfa, trial_ends_at, suspended_at, created_at, updated_at`,
    [orgId, patch.name ?? null, patch.enforce_mfa ?? null],
  );
  return res.rows[0] ?? null;
}

export async function createProject(
  db: Queryable,
  input: { orgId: string; name: string; slug: string },
): Promise<ProjectRow> {
  const res = await db.query<ProjectRow>(
    `INSERT INTO projects (org_id, name, slug) VALUES ($1,$2,$3)
     RETURNING id, org_id, name, slug, created_at, updated_at`,
    [input.orgId, input.name, input.slug],
  );
  return res.rows[0];
}

export async function getProjectByOrg(db: Queryable, orgId: string): Promise<ProjectRow | null> {
  const res = await db.query<ProjectRow>(
    `SELECT id, org_id, name, slug, created_at, updated_at FROM projects WHERE org_id = $1 ORDER BY created_at LIMIT 1`,
    [orgId],
  );
  return res.rows[0] ?? null;
}

export async function getOrgBySlug(
  db: Queryable,
  slug: string,
): Promise<(OrgRow & { public_trust_enabled: boolean; posture_score: number }) | null> {
  const res = await db.query<OrgRow & { public_trust_enabled: boolean; posture_score: number }>(
    `SELECT id, name, slug, plan_id, billing_status, country, currency, trial_ends_at, suspended_at, created_at, updated_at,
            public_trust_enabled, posture_score
     FROM orgs WHERE slug = $1`,
    [slug],
  );
  return res.rows[0] ?? null;
}