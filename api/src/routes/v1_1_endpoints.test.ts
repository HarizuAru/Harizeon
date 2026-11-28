// Provide a dummy DSN so modules that import db can be imported in unit test mode
process.env.DATABASE_URL ??= "postgresql://test@localhost:5432/test";

import { test } from "node:test";
import assert from "node:assert/strict";

const { computeGrade } = await import("./trust");

test("computeGrade maps scores to standard monochrome security grades", () => {
  assert.equal(computeGrade(100), "A+");
  assert.equal(computeGrade(95), "A+");
  assert.equal(computeGrade(90), "A+");
  assert.equal(computeGrade(89), "A");
  assert.equal(computeGrade(80), "A");
  assert.equal(computeGrade(79), "B");
  assert.equal(computeGrade(70), "B");
  assert.equal(computeGrade(69), "C");
  assert.equal(computeGrade(60), "C");
  assert.equal(computeGrade(59), "D");
  assert.equal(computeGrade(50), "D");
  assert.equal(computeGrade(49), "F");
  assert.equal(computeGrade(0), "F");
});

test("v1.1 endpoints are registered on Fastify server", async () => {
  const { buildServer } = await import("../server");
  const app = await buildServer();

  // 1. GET /v1/drift requires authentication
  const driftRes = await app.inject({
    method: "GET",
    url: "/v1/drift",
  });
  assert.equal(driftRes.statusCode, 401, "GET /v1/drift must require authentication");

  // 2. GET /v1/compliance/summary requires authentication
  const compRes = await app.inject({
    method: "GET",
    url: "/v1/compliance/summary",
  });
  assert.equal(compRes.statusCode, 401, "GET /v1/compliance/summary must require authentication");

  // 3. POST /v1/findings/:id/verify requires authentication
  const verifyRes = await app.inject({
    method: "POST",
    url: "/v1/findings/11111111-1111-1111-1111-111111111111/verify",
  });
  assert.equal(verifyRes.statusCode, 401, "POST /v1/findings/:id/verify must require authentication");

  // 4. GET /v1/threats/emerging requires authentication
  const threatsRes = await app.inject({
    method: "GET",
    url: "/v1/threats/emerging",
  });
  assert.equal(threatsRes.statusCode, 401, "GET /v1/threats/emerging must require authentication");

  // 5. POST /v1/threats/check requires authentication
  const threatsCheckRes = await app.inject({
    method: "POST",
    url: "/v1/threats/check",
  });
  assert.equal(threatsCheckRes.statusCode, 401, "POST /v1/threats/check must require authentication");

  // 6. GET /v1/public/trust/:slug is public (returns 404 or connects, NOT 401)
  const trustRes = await app.inject({
    method: "GET",
    url: "/v1/public/trust/non-existent-slug",
  });
  // Since public trust is public and there is no live DB, it should either fail with DB error / 404 / 500, but NEVER 401 unauthorized!
  assert.notEqual(trustRes.statusCode, 401, "GET /v1/public/trust/:slug must be an unauthenticated public route");
});
