import "fastify";
import type { Pool } from "pg";

export type OrgRole = "owner" | "admin" | "member" | "readonly";

declare module "fastify" {
  interface FastifyInstance {
    pg: Pool;
  }
  interface FastifyRequest {
    auth?: {
      orgId: string;
      userId?: string;
      apiKeyId?: string;
      actorType: "user" | "api_key";
      role?: OrgRole;
      scopes?: string[];
    };
  }
}
