import type { FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";
import { randomUUID } from "node:crypto";

/**
 * Attach a request ID to every response for tracing.
 */
export function requestIdHook(req: FastifyRequest, _reply: FastifyReply, done: () => void) {
  req.id = req.headers["x-request-id"] as string ?? randomUUID();
  done();
}

/**
 * Error shape per §08.
 */
export interface HarizeonError {
  code: string;
  message: string;
  doc_url: string;
  request_id: string;
}

export function errorHandler(error: Error, req: FastifyRequest, reply: FastifyReply) {
  const reqId = (req as FastifyRequest & { id?: string }).id ?? "unknown";
  reply.header("X-Request-Id", reqId);

  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: {
        code: "validation_error",
        message: error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; "),
        doc_url: "/docs/errors/validation_error",
        request_id: reqId,
      },
    });
  }

  if (error instanceof FastifyError) {
    return reply.status(error.statusCode).send({
      error: { code: error.code, message: error.message, doc_url: error.docUrl, request_id: reqId },
    });
  }

  // Framework errors (e.g. FST_ERR_CTP_INVALID_MEDIA_TYPE for a missing
  // Content-Type) carry their own statusCode — return it, don't 500.
  const statusCode = (error as { statusCode?: unknown }).statusCode;
  const code = (error as { code?: unknown }).code;
  if (typeof statusCode === "number" && statusCode >= 400 && statusCode < 600) {
    return reply.status(statusCode).send({
      error: {
        code: typeof code === "string" ? code : "request_error",
        message: error.message,
        doc_url: "/docs/errors/request_error",
        request_id: reqId,
      },
    });
  }

  req.log.error({ err: error }, "unhandled error");
  return reply.status(500).send({
    error: { code: "internal_error", message: "Internal server error", doc_url: "/docs/errors/internal_error", request_id: reqId },
  });
}

export class FastifyError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly docUrl: string;

  constructor(statusCode: number, code: string, message: string, docUrl: string) {
    super(message);
    this.name = "FastifyError";
    this.statusCode = statusCode;
    this.code = code;
    this.docUrl = docUrl;
  }
}

export function badRequest(code: string, message: string): FastifyError {
  return new FastifyError(400, code, message, `/docs/errors/${code}`);
}

export function unauthorized(code: string, message: string): FastifyError {
  return new FastifyError(401, code, message, `/docs/errors/${code}`);
}

export function forbidden(code: string, message: string): FastifyError {
  return new FastifyError(403, code, message, `/docs/errors/${code}`);
}

export function notFound(code: string, message: string): FastifyError {
  return new FastifyError(404, code, message, `/docs/errors/${code}`);
}

export function conflict(code: string, message: string): FastifyError {
  return new FastifyError(409, code, message, `/docs/errors/${code}`);
}