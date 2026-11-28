import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { pool } from "../db";
import { getOrgBySlug } from "../repo/orgs";
import { notFound } from "../lib/errors";
import { sha256Hex } from "../lib/tokens";

export interface TrustProfile {
  org_name: string;
  slug: string;
  posture_score: number;
  grade: string;
  verified_domains_count: number;
  open_critical_count: number;
  last_scan_at: string;
  is_verified: boolean;
  sha256_attestation: string;
}

export function computeGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

export async function trustRoutes(app: FastifyInstance) {
  // GET /v1/public/trust/:slug — unauthenticated public trust certification
  app.get("/public/trust/:slug", async (req: FastifyRequest, reply: FastifyReply) => {
    const { slug } = req.params as { slug: string };

    const client = await pool.connect();
    try {
      const org = await getOrgBySlug(client, slug);
      if (!org || !org.public_trust_enabled) {
        throw notFound("trust_profile_not_found", "Public trust profile not found or disabled for this organization");
      }

      const score = Math.max(0, Math.min(100, org.posture_score ?? 100));
      const grade = computeGrade(score);

      const assetsRes = await client.query<{ cnt: string }>(
        `SELECT COUNT(*)::int AS cnt FROM assets WHERE org_id = $1 AND is_active = true AND verification_status = 'verified'`,
        [org.id],
      );
      const verifiedDomainsCount = Number(assetsRes.rows[0]?.cnt ?? 0);

      const critRes = await client.query<{ cnt: string }>(
        `SELECT COUNT(*)::int AS cnt FROM findings WHERE org_id = $1 AND status = 'open' AND severity = 'critical'`,
        [org.id],
      );
      const openCriticalCount = Number(critRes.rows[0]?.cnt ?? 0);

      const scanRes = await client.query<{ finished_at: string | Date | null }>(
        `SELECT finished_at FROM scans WHERE org_id = $1 AND status = 'completed' ORDER BY finished_at DESC LIMIT 1`,
        [org.id],
      );
      const lastScanAt = scanRes.rows[0]?.finished_at
        ? new Date(scanRes.rows[0].finished_at).toISOString()
        : new Date(org.created_at).toISOString();

      const attestation = sha256Hex(`${org.id}|${org.slug}|${score}|${lastScanAt}`);

      const profile: TrustProfile = {
        org_name: org.name,
        slug: org.slug,
        posture_score: score,
        grade,
        verified_domains_count: verifiedDomainsCount,
        open_critical_count: openCriticalCount,
        last_scan_at: lastScanAt,
        is_verified: verifiedDomainsCount > 0,
        sha256_attestation: attestation,
      };

      return reply.send({ profile });
    } finally {
      client.release();
    }
  });
}
