import type { Queryable } from "../db";
import { badRequest } from "../lib/errors";
import { isIP } from "node:net";

export type AssetType = "domain" | "subdomain" | "ip" | "url";
export type Criticality = "low" | "medium" | "high";

export type AssetRow = {
  id: string;
  org_id: string;
  type: AssetType;
  value: string;
  parent_asset_id: string | null;
  discovered_by: string;
  first_seen_at: Date | string;
  last_seen_at: Date | string;
  is_active: boolean;
  tags: string[];
  criticality: Criticality;
  created_at: Date | string;
  updated_at: Date | string;
};

const HOSTNAME_RE = /^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*$/;

/** Normalise + validate an asset value. Throws 400 invalid_asset on bad input. */
export function normaliseAssetValue(type: AssetType, raw: string): string {
  const value = raw.trim();
  if (!value) throw badRequest("invalid_asset", "Asset value is required");

  if (type === "domain" || type === "subdomain") {
    let host = value.toLowerCase().replace(/^https?:\/\//, "");
    host = host.split("/")[0].split("?")[0].split(":")[0].replace(/\.+$/, "");
    if (!HOSTNAME_RE.test(host)) throw badRequest("invalid_asset", "Invalid hostname");
    if (type === "domain" && host.split(".").length < 2) {
      throw badRequest("invalid_asset", "Domain must contain a dot (use subdomain for single labels)");
    }
    return host;
  }

  if (type === "ip") {
    if (!isIP(value)) throw badRequest("invalid_asset", "Invalid IP address");
    return value;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw badRequest("invalid_asset", "Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw badRequest("invalid_asset", "URL must use http or https");
  }
  return url.toString();
}

const ASSET_COLS = `id, org_id, type, value, parent_asset_id, discovered_by,
  first_seen_at, last_seen_at, is_active, tags, criticality, created_at, updated_at`;

export async function createAsset(
  db: Queryable,
  input: { orgId: string; type: AssetType; value: string; criticality?: Criticality; tags?: string[] },
): Promise<AssetRow> {
  const value = normaliseAssetValue(input.type, input.value);
  const res = await db.query<AssetRow>(
    `INSERT INTO assets (org_id, type, value, discovered_by, criticality, tags)
     VALUES ($1,$2,$3,'manual',$4,$5)
     RETURNING ${ASSET_COLS}`,
    [input.orgId, input.type, value, input.criticality ?? "medium", JSON.stringify(input.tags ?? [])],
  );
  return res.rows[0];
}

export function encodeCursor(createdAt: Date | string, id: string): string {
  const ts = createdAt instanceof Date ? createdAt.toISOString() : String(createdAt);
  return Buffer.from(JSON.stringify({ created_at: ts, id }), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): { created_at: string; id: string } | null {
  try {
    const o = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown;
    if (
      typeof o === "object" && o !== null &&
      typeof (o as { created_at?: unknown }).created_at === "string" &&
      typeof (o as { id?: unknown }).id === "string"
    ) {
      return o as { created_at: string; id: string };
    }
    return null;
  } catch {
    return null;
  }
}

export type AssetListRow = AssetRow & { verification_status: string | null };

export async function listAssets(
  db: Queryable,
  orgId: string,
  opts: {
    type?: AssetType;
    q?: string;
    criticality?: Criticality;
    verified?: "yes" | "no";
    limit?: number;
    cursor?: string;
  },
): Promise<{ data: AssetListRow[]; next_cursor: string | null; has_more: boolean }> {
  const lim = Math.min(Math.max(opts.limit ?? 50, 1), 100);
  const params: unknown[] = [orgId];
  let where = `org_id = $1 AND is_active = true`;
  if (opts.type) {
    params.push(opts.type);
    where += ` AND type = $${params.length}`;
  }
  if (opts.criticality) {
    params.push(opts.criticality);
    where += ` AND criticality = $${params.length}`;
  }
  if (opts.q) {
    params.push(`%${opts.q}%`);
    where += ` AND value ILIKE $${params.length}`;
  }
  if (opts.verified === "yes") {
    where += ` AND EXISTS (SELECT 1 FROM asset_verifications v WHERE v.asset_id = assets.id AND v.status = 'verified')`;
  }
  if (opts.verified === "no") {
    where += ` AND NOT EXISTS (SELECT 1 FROM asset_verifications v WHERE v.asset_id = assets.id AND v.status = 'verified')`;
  }
  if (opts.cursor) {
    const c = decodeCursor(opts.cursor);
    if (!c) throw new Error("Invalid cursor");
    params.push(c.created_at, c.id);
    where += ` AND (created_at, id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`;
  }
  params.push(lim + 1);
  const res = await db.query<AssetListRow>(
    `SELECT ${ASSET_COLS},
       (SELECT v.status::text FROM asset_verifications v
         WHERE v.asset_id = assets.id ORDER BY v.created_at DESC LIMIT 1) AS verification_status
     FROM assets WHERE ${where}
     ORDER BY created_at DESC, id DESC LIMIT $${params.length}`,
    params,
  );
  const has_more = res.rows.length > lim;
  const data = has_more ? res.rows.slice(0, lim) : res.rows;
  const last = data[data.length - 1];
  return { data, next_cursor: has_more && last ? encodeCursor(last.created_at, last.id) : null, has_more };
}

export async function getAsset(db: Queryable, orgId: string, assetId: string): Promise<AssetRow | null> {
  const res = await db.query<AssetRow>(
    `SELECT ${ASSET_COLS} FROM assets WHERE org_id = $1 AND id = $2`,
    [orgId, assetId],
  );
  return res.rows[0] ?? null;
}

export async function updateAsset(
  db: Queryable,
  orgId: string,
  assetId: string,
  patch: { criticality?: Criticality; tags?: string[]; is_active?: boolean },
): Promise<AssetRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [orgId, assetId];
  if (patch.criticality !== undefined) {
    params.push(patch.criticality);
    sets.push(`criticality = $${params.length}`);
  }
  if (patch.tags !== undefined) {
    params.push(JSON.stringify(patch.tags));
    sets.push(`tags = $${params.length}`);
  }
  if (patch.is_active !== undefined) {
    params.push(patch.is_active);
    sets.push(`is_active = $${params.length}`);
  }
  if (sets.length === 0) return getAsset(db, orgId, assetId);
  sets.push(`last_seen_at = now()`, `updated_at = now()`);
  const res = await db.query<AssetRow>(
    `UPDATE assets SET ${sets.join(", ")} WHERE org_id = $1 AND id = $2 RETURNING ${ASSET_COLS}`,
    params,
  );
  return res.rows[0] ?? null;
}
