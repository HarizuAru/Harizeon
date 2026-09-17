import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { withTx } from "../db";
import { config } from "../config";
import {
  createAsset,
  listAssets,
  getAsset,
  updateAsset,
  listDiscoveredChildren,
  type AssetType,
  type Criticality,
} from "../repo/assets";
import {
  getLatestVerification,
  initiateVerification,
  markVerification,
  touchVerificationCheck,
} from "../repo/verifications";
import {
  generateVerificationToken,
  dnsTxtHost,
  dnsTxtValue,
  httpFileUrl,
  VERIFY_HTTP_PATH,
  checkDnsTxt,
  checkHttpFile,
  hostnameForVerification,
  methodAllowedForType,
  requiresManualReview,
  isPublicHost,
} from "../lib/verify";
import { writeAudit } from "../lib/audit";
import { badRequest, conflict, notFound } from "../lib/errors";

const AssetTypeEnum = z.enum(["domain", "subdomain", "ip", "url"]);
const CriticalityEnum = z.enum(["low", "medium", "high"]);
const MethodEnum = z.enum(["dns_txt", "http_file"]);

const CreateAssetBody = z.object({
  type: AssetTypeEnum,
  value: z.string().min(1).max(2048),
  criticality: CriticalityEnum.default("medium"),
  tags: z.array(z.string().max(64)).max(32).default([]),
});
const ListQuery = z.object({
  type: AssetTypeEnum.optional(),
  q: z.string().max(256).optional(),
  criticality: CriticalityEnum.optional(),
  verified: z.enum(["yes", "no"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});
const UpdateAssetBody = z.object({
  criticality: CriticalityEnum.optional(),
  tags: z.array(z.string().max(64)).max(32).optional(),
  is_active: z.boolean().optional(),
  ignored: z.boolean().optional(),
});
const InitiateBody = z.object({ method: MethodEnum });

function toHttpError(e: unknown): never {
  if ((e as { code?: string })?.code === "23505") {
    throw conflict("asset_exists", "Asset already exists in this organization");
  }
  throw e;
}

const CHECK_MESSAGES: Record<string, string> = {
  not_found: "Verification record not found yet. If you just added it, wait a few minutes and check again.",
  mismatch: "Found a record, but the token does not match. Check for typos and try again.",
  dns_error: "DNS lookup failed. Check the domain is live and try again.",
  fetch_error: "Could not fetch the verification file. Check the URL is reachable and try again.",
  timeout: "The verification check timed out. Try again.",
};

function checkMessage(reason: string): string {
  if (reason.startsWith("http_")) return `The verification file URL returned HTTP ${reason.slice(5)}.`;
  return CHECK_MESSAGES[reason] ?? "Verification not confirmed yet. Try again.";
}

export async function assetRoutes(app: FastifyInstance) {
  // GET /v1/assets?type=&q=&limit=&cursor=
  app.get("/assets", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const q = ListQuery.parse(req.query);
    try {
      return await withTx(async (client) => listAssets(client, orgId, q), orgId);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "Invalid cursor") {
        throw badRequest("invalid_cursor", "Invalid pagination cursor");
      }
      throw e;
    }
  });

  // POST /v1/assets
  app.post("/assets", async (req: FastifyRequest, reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const body = CreateAssetBody.parse(req.body);
    try {
      const created = await withTx(async (client) => {
        const asset = await createAsset(client, {
          orgId,
          type: body.type as AssetType,
          value: body.value,
          criticality: body.criticality as Criticality,
          tags: body.tags,
        });
        await writeAudit(client, {
          orgId,
          actorType: req.auth!.actorType,
          actorId: req.auth!.userId ?? req.auth!.apiKeyId,
          action: "asset.create",
          targetType: "asset",
          targetId: asset.id,
          metadata: { type: asset.type, value: asset.value },
        });
        return asset;
      }, orgId);
      return reply.status(201).send({ asset: created });
    } catch (e: unknown) {
      toHttpError(e);
    }
  });

  // GET /v1/assets/:id
  app.get("/assets/:id", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const { id } = req.params as { id: string };
    return withTx(async (client) => {
      const asset = await getAsset(client, orgId, id);
      if (!asset) throw notFound("asset_not_found", "Asset not found");
      const verification = await getLatestVerification(client, orgId, id);
      return { asset, verification };
    }, orgId);
  });

  // GET /v1/assets/:id/discovered — subdomains found by discovery, awaiting review
  app.get("/assets/:id/discovered", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const { id } = req.params as { id: string };
    return withTx(async (client) => {
      const asset = await getAsset(client, orgId, id);
      if (!asset) throw notFound("asset_not_found", "Asset not found");
      return { data: await listDiscoveredChildren(client, orgId, id) };
    }, orgId);
  });

  // PATCH /v1/assets/:id
  app.patch("/assets/:id", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const { id } = req.params as { id: string };
    const body = UpdateAssetBody.parse(req.body);
    return withTx(async (client) => {
      const updated = await updateAsset(client, orgId, id, body);
      if (!updated) throw notFound("asset_not_found", "Asset not found");
      await writeAudit(client, {
        orgId,
        actorType: req.auth!.actorType,
        actorId: req.auth!.userId ?? req.auth!.apiKeyId,
        action: "asset.update",
        targetType: "asset",
        targetId: id,
        metadata: { ...body },
      });
      return { asset: updated };
    }, orgId);
  });

  // DELETE /v1/assets/:id (soft delete; preserves findings history)
  app.delete("/assets/:id", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const { id } = req.params as { id: string };
    await withTx(async (client) => {
      const asset = await getAsset(client, orgId, id);
      if (!asset) throw notFound("asset_not_found", "Asset not found");
      await updateAsset(client, orgId, id, { is_active: false });
      await writeAudit(client, {
        orgId,
        actorType: req.auth!.actorType,
        actorId: req.auth!.userId ?? req.auth!.apiKeyId,
        action: "asset.delete",
        targetType: "asset",
        targetId: id,
      });
    }, orgId);
    return { ok: true };
  });

  // POST /v1/assets/:id/verification — initiate DNS TXT or HTTP file proof
  app.post("/assets/:id/verification", async (req: FastifyRequest, reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const { id } = req.params as { id: string };
    const { method } = InitiateBody.parse(req.body);

    const initiated = await withTx(async (client) => {
      const asset = await getAsset(client, orgId, id);
      if (!asset) throw notFound("asset_not_found", "Asset not found");
      if (!asset.is_active) throw badRequest("asset_inactive", "Asset is retired");
      if (requiresManualReview(asset.type)) {
        throw badRequest(
          "verification_manual_review_required",
          "IP assets are authorized manually (reverse DNS + signed form), not automatically. Contact support to have this IP reviewed.",
        );
      }
      if (!methodAllowedForType(method, asset.type)) {
        throw badRequest("method_not_supported", `Method ${method} is not supported for asset type ${asset.type}`);
      }
      const token = generateVerificationToken();
      const row = await initiateVerification(client, { orgId, assetId: id, method, token });
      await writeAudit(client, {
        orgId,
        actorType: req.auth!.actorType,
        actorId: req.auth!.userId ?? req.auth!.apiKeyId,
        action: "asset.verify.initiate",
        targetType: "asset",
        targetId: id,
        metadata: { method },
      });

      const host = hostnameForVerification(asset.type, asset.value) ?? asset.value;
      const instructions =
        method === "dns_txt"
          ? { host: dnsTxtHost(host), type: "TXT", value: dnsTxtValue(token) }
          : {
              url: asset.type === "url" ? new URL(asset.value).origin + VERIFY_HTTP_PATH : httpFileUrl(host),
              path: VERIFY_HTTP_PATH,
              content: token,
            };
      return {
        method: row.method,
        status: row.status,
        token,
        instructions,
        verified_at: row.verified_at,
        last_checked_at: row.last_checked_at,
      };
    }, orgId);

    return reply.status(201).send(initiated);
  });

  // POST /v1/assets/:id/verification/check — pollable; stays pending until proven
  app.post("/assets/:id/verification/check", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const { id } = req.params as { id: string };

    return withTx(async (client) => {
      const asset = await getAsset(client, orgId, id);
      if (!asset) throw notFound("asset_not_found", "Asset not found");
      const v = await getLatestVerification(client, orgId, id);
      if (!v) throw notFound("no_verification", "No verification initiated for this asset");
      if (v.status !== "pending") {
        return { status: v.status, method: v.method, verified_at: v.verified_at, last_checked_at: v.last_checked_at };
      }

      let result: { ok: boolean; reason: string };
      if (v.method === "dns_txt") {
        const domain = hostnameForVerification(asset.type, asset.value);
        if (!domain) throw badRequest("method_not_supported", "DNS verification needs a hostname");
        result = await checkDnsTxt(domain, v.token);
      } else {
        let url: string;
        if (asset.type === "url") {
          let origin: string;
          try {
            origin = new URL(asset.value).origin;
          } catch {
            throw badRequest("invalid_asset", "Asset URL is invalid");
          }
          url = origin + VERIFY_HTTP_PATH;
        } else {
          const host = hostnameForVerification(asset.type, asset.value) ?? asset.value;
          url = httpFileUrl(host);
        }
        let host: string;
        try {
          host = new URL(url).hostname;
        } catch {
          throw badRequest("invalid_asset", "Cannot build verification URL");
        }
        // SSRF guard (§11): never fetch non-public hosts from the control plane.
        // Relaxed only when VERIFY_ALLOW_PRIVATE is explicitly set (dev/test).
        if (!config.VERIFY_ALLOW_PRIVATE && !isPublicHost(host)) {
          throw badRequest("verification_target_blocked", "Verification target is not a public host");
        }
        result = await checkHttpFile(url, v.token);
      }

      if (result.ok) {
        await markVerification(client, v.id, "verified");
        await writeAudit(client, {
          orgId,
          actorType: req.auth!.actorType,
          actorId: req.auth!.userId ?? req.auth!.apiKeyId,
          action: "asset.verify.verified",
          targetType: "asset",
          targetId: id,
          metadata: { method: v.method },
        });
        const updated = await getLatestVerification(client, orgId, id);
        return {
          status: "verified",
          method: v.method,
          verified_at: updated?.verified_at ?? null,
          checked_at: new Date().toISOString(),
        };
      }

      await touchVerificationCheck(client, v.id);
      return {
        status: "pending",
        method: v.method,
        reason: result.reason,
        message: checkMessage(result.reason),
        checked_at: new Date().toISOString(),
      };
    }, orgId);
  });
}
