import { pool, withTx, type Queryable } from "../db";
import { config } from "../config";
import { writeAudit } from "./audit";
import {
  checkDnsTxt,
  checkHttpFile,
  httpFileUrl,
  VERIFY_HTTP_PATH,
  isPublicHost,
} from "./verify";

export type DueVerification = {
  verification_id: string;
  org_id: string;
  asset_id: string;
  method: string;
  token: string;
  asset_type: string;
  asset_value: string;
};

/** System-level list of stale verified rows (SECURITY DEFINER; bypasses RLS). */
export async function dueVerifications(db: Queryable, cutoff: Date): Promise<DueVerification[]> {
  const res = await db.query<DueVerification>(
    `SELECT verification_id, org_id, asset_id, method, token, asset_type, asset_value
     FROM verifications_due_for_recheck($1)`,
    [cutoff],
  );
  return res.rows;
}

async function recheckOne(v: DueVerification): Promise<boolean> {
  if (v.method === "dns_txt") {
    if (v.asset_type !== "domain" && v.asset_type !== "subdomain") return false;
    return (await checkDnsTxt(v.asset_value, v.token)).ok;
  }
  if (v.method !== "http_file") return false;
  let url: string;
  let host: string;
  if (v.asset_type === "url") {
    try {
      const origin = new URL(v.asset_value).origin;
      host = new URL(v.asset_value).hostname;
      url = origin + VERIFY_HTTP_PATH;
    } catch {
      return false;
    }
  } else if (v.asset_type === "domain" || v.asset_type === "subdomain" || v.asset_type === "ip") {
    host = v.asset_value;
    url = httpFileUrl(v.asset_value);
  } else {
    return false;
  }
  // SSRF guard (§11): a target that is no longer public cannot be re-proven;
  // skip it (kept verified, backed off) rather than wrongfully revoking.
  // Relaxed only when VERIFY_ALLOW_PRIVATE is explicitly set (dev/test).
  if (!config.VERIFY_ALLOW_PRIVATE && !isPublicHost(host)) return true;
  return (await checkHttpFile(url, v.token)).ok;
}

/**
 * Single recheck pass: for each stale verified row, re-prove ownership.
 * Still valid → touch last_checked_at. Lost → revoke + audit.
 * Per-row failures never abort the pass. Tenant writes run inside withTx(org).
 */
export async function runVerificationRecheckOnce(
  db: Queryable = pool,
  olderThanDays = 7,
): Promise<{ checked: number; revoked: number }> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 3600 * 1000);
  const due = await dueVerifications(db, cutoff);
  let revoked = 0;
  for (const v of due) {
    try {
      const ok = await recheckOne(v);
      await withTx(async (client) => {
        if (ok) {
          await client.query(
            `UPDATE asset_verifications SET last_checked_at = now(), updated_at = now() WHERE id = $1`,
            [v.verification_id],
          );
        } else {
          await client.query(
            `UPDATE asset_verifications SET status = 'revoked', last_checked_at = now(), updated_at = now() WHERE id = $1`,
            [v.verification_id],
          );
          await writeAudit(client, {
            orgId: v.org_id,
            actorType: "system",
            action: "asset.verify.revoked",
            targetType: "asset",
            targetId: v.asset_id,
            metadata: { method: v.method },
          });
          revoked += 1;
        }
      }, v.org_id);
    } catch {
      // leave it for the next pass; never crash the loop on one bad asset
    }
  }
  return { checked: due.length, revoked };
}

/** Hourly re-verification loop. Started by server listen, NOT by buildServer (tests). */
export function startVerificationRecheck(
  db: Queryable = pool,
  opts: { intervalMs?: number; olderThanDays?: number } = {},
): () => void {
  const intervalMs = opts.intervalMs ?? 60 * 60 * 1000;
  const olderThanDays = opts.olderThanDays ?? 7;
  const timer = setInterval(() => {
    runVerificationRecheckOnce(db, olderThanDays).catch((e: unknown) => {
      console.error("[recheck]", e instanceof Error ? e.message : e);
    });
  }, intervalMs);
  if (typeof timer.unref === "function") timer.unref();
  return () => clearInterval(timer);
}
