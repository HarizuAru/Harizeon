import type { Queryable } from "../db";

export type MembershipRow = {
  id: string;
  org_id: string;
  user_id: string;
  role: "owner" | "admin" | "member" | "readonly";
  invited_by: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function createMembership(
  db: Queryable,
  input: { orgId: string; userId: string; role?: "owner" | "admin" | "member" | "readonly" },
): Promise<MembershipRow> {
  const res = await db.query<MembershipRow>(
    `INSERT INTO memberships (org_id, user_id, role) VALUES ($1,$2,$3)
     RETURNING id, org_id, user_id, role, invited_by, accepted_at, created_at, updated_at`,
    [input.orgId, input.userId, input.role ?? "owner"],
  );
  return res.rows[0];
}

export async function getMembershipsByUser(db: Queryable, userId: string): Promise<MembershipRow[]> {
  const res = await db.query<MembershipRow>(
    `SELECT id, org_id, user_id, role, invited_by, accepted_at, created_at, updated_at
     FROM memberships WHERE user_id = $1`,
    [userId],
  );
  return res.rows;
}

export async function getMembershipsByOrg(db: Queryable, orgId: string): Promise<MembershipRow[]> {
  const res = await db.query<MembershipRow>(
    `SELECT id, org_id, user_id, role, invited_by, accepted_at, created_at, updated_at
     FROM memberships WHERE org_id = $1`,
    [orgId],
  );
  return res.rows;
}

/**
 * Pre-auth org resolution: uses the org_ids_for_user() SECURITY DEFINER function
 * so it works before any org GUC is set (memberships is org-scoped under RLS).
 */
export async function orgIdsForUser(db: Queryable, userId: string): Promise<string[]> {
  const res = await db.query<{ org_id: string }>(
    "SELECT org_id FROM org_ids_for_user($1)",
    [userId],
  );
  return res.rows.map((r) => r.org_id);
}