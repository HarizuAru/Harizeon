import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { withTx } from "../db";
import { getOrgPlanAndUsage, listInvoices, switchPlan } from "../repo/billing";
import { writeAudit } from "../lib/audit";

const CheckoutSessionBody = z.object({
  plan_code: z.enum(["free", "starter", "growth", "scale", "enterprise"]),
});

export async function billingRoutes(app: FastifyInstance) {
  // GET /v1/usage
  app.get("/usage", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    return withTx(async (client) => {
      const { plan, usage } = await getOrgPlanAndUsage(client, orgId);
      return { plan, usage };
    }, orgId);
  });

  // GET /v1/billing/subscription
  app.get("/billing/subscription", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    return withTx(async (client) => {
      const { plan, subscription, usage } = await getOrgPlanAndUsage(client, orgId);
      return {
        plan,
        subscription,
        usage,
        tax_treatment: "Malaysian SST (8%) applicable to local entities under Service Tax Act 2018",
        payment_methods: [
          { type: "fpx", name: "FPX Online Banking (Maybank2u, CIMB Clicks, Public Bank, etc.)" },
          { type: "card", name: "Visa / Mastercard" },
        ],
      };
    }, orgId);
  });

  // POST /v1/billing/checkout-session
  app.post("/billing/checkout-session", {
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const orgId = req.auth!.orgId;
      const body = CheckoutSessionBody.parse(req.body);

      const result = await withTx(async (client) => {
        const switched = await switchPlan(client, orgId, body.plan_code);
        await writeAudit(client, {
          orgId,
          actorType: req.auth!.actorType,
          actorId: req.auth!.userId ?? req.auth!.apiKeyId,
          action: "billing.plan_change",
          targetType: "plan",
          targetId: switched.plan.id,
          metadata: { plan_code: body.plan_code, price: switched.plan.price_myr_month },
        });
        return switched;
      }, orgId);

      return reply.status(200).send({
        success: true,
        plan: result.plan,
        subscription: result.subscription,
        message: `Successfully switched to ${result.plan.code.toUpperCase()} plan.`,
      });
    },
  });

  // GET /v1/billing/invoices
  app.get("/billing/invoices", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    return withTx(async (client) => {
      const invoices = await listInvoices(client, orgId);
      return { invoices };
    }, orgId);
  });
}
