import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { withTx } from "../db";
import { badRequest, notFound } from "../lib/errors";
import { isTerminal, type ScanStatus } from "../lib/scan-state";
import * as repo from "../repo/scans";
import { getProjectByOrg } from "../repo/orgs";
import { createScan, cancelScan } from "../services/scanService";
import { scanQueue } from "../services/scanQueue";

const CreateScanBody = z.object({
  asset_ids: z.array(z.string().uuid()).min(1).max(50),
  profile: z.enum(["quick", "standard", "deep"]),
});
const ListQuery = z.object({
  status: z.string().optional(),
  asset_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});
const EventsQuery = z.object({ since: z.coerce.number().int().min(0).default(0) });

export async function scanRoutes(app: FastifyInstance) {
  // POST /v1/scans — create + enqueue. Verified assets only (§12).
  app.post("/scans", async (req: FastifyRequest, reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const body = CreateScanBody.parse(req.body);
    const project = await withTx((c) => getProjectByOrg(c, orgId), orgId);
    const scan = await createScan(scanQueue, {
      orgId,
      projectId: project?.id ?? null,
      profile: body.profile,
      triggerSource: req.auth!.actorType === "api_key" ? "api" : "manual",
      requestedBy: req.auth!.userId ?? req.auth!.apiKeyId ?? null,
      assetIds: body.asset_ids,
    });
    return reply.status(201).send({ scan });
  });

  // GET /v1/scans?status=&asset_id=&limit=&cursor=
  app.get("/scans", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const q = ListQuery.parse(req.query);
    try {
      return await withTx((c) => repo.listScans(c, orgId, q), orgId);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "Invalid cursor") {
        throw badRequest("invalid_cursor", "Invalid pagination cursor");
      }
      throw e;
    }
  });

  // GET /v1/scans/:id
  app.get("/scans/:id", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const { id } = req.params as { id: string };
    return withTx(async (c) => {
      const scan = await repo.getScan(c, orgId, id);
      if (!scan) throw notFound("scan_not_found", "Scan not found");
      const targets = await repo.listScanTargets(c, id);
      const events = await repo.getScanEvents(c, id, 0, 500);
      const summary = await repo.scanDiff(c, orgId, id);
      return { scan, targets, events, summary };
    }, orgId);
  });

  // GET /v1/scans/:id/events — Server-Sent Events; resume with ?since=<seq>
  app.get("/scans/:id/events", async (req: FastifyRequest, reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const { id } = req.params as { id: string };
    const { since } = EventsQuery.parse(req.query);

    const scan = await withTx((c) => repo.getScan(c, orgId, id), orgId);
    if (!scan) throw notFound("scan_not_found", "Scan not found");

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    reply.hijack();

    let cursor = since;
    let closed = false;
    req.raw.on("close", () => {
      closed = true;
    });
    const send = (event: string, data: unknown): void => {
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    send("open", { scan_id: id });

    const pump = async (): Promise<void> => {
      while (!closed) {
        try {
          const snap = await withTx(async (c) => {
            const events = await repo.getScanEvents(c, id, cursor);
            const s = await repo.getScan(c, orgId, id);
            return {
              events,
              status: s?.status,
              phase: s?.phase,
              progress_pct: s?.progress_pct,
              done: s ? isTerminal(s.status as ScanStatus) : true,
            };
          }, orgId);

          for (const e of snap.events) {
            cursor = e.seq;
            send("log", e);
          }
          send("status", { status: snap.status, phase: snap.phase, progress_pct: snap.progress_pct });
          if (snap.done) {
            send("done", { status: snap.status });
            reply.raw.end();
            return;
          }
        } catch (e: unknown) {
          send("error", { message: e instanceof Error ? e.message : "stream error" });
          reply.raw.end();
          return;
        }
        await new Promise((r) => setTimeout(r, 700));
      }
      reply.raw.end();
    };
    void pump();
  });

  // POST /v1/scans/:id/cancel
  app.post("/scans/:id/cancel", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const { id } = req.params as { id: string };
    const actorId = req.auth!.userId ?? req.auth!.apiKeyId;
    const scan = await cancelScan(scanQueue, orgId, id, actorId);
    return { scan };
  });
}
