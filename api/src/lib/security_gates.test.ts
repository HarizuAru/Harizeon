process.env.DATABASE_URL ??= "postgresql://test@localhost:5432/test";

import { test } from "node:test";
import assert from "node:assert/strict";
import { safeEqualHex } from "./tokens";

test("security gate: safeEqualHex rejects malformed, empty, and unequal hex safely", () => {
  const validA = "a".repeat(64);
  const validB = "b".repeat(64);
  assert.equal(safeEqualHex(validA, validA), true);
  assert.equal(safeEqualHex(validA, validB), false);
  assert.equal(safeEqualHex("", ""), false);
  // Odd-length or invalid hex strings must return false rather than throwing RangeError
  assert.equal(safeEqualHex("zzzz", validA.slice(0, 4)), false);
});

test("security gate: withTx rejects non-UUID tenant IDs fail-closed", async () => {
  const { withTx } = await import("../db");
  await assert.rejects(
    async () => {
      await withTx(async () => "nope", "not-a-uuid; DROP TABLE assets;");
    },
    /Invalid tenant orgId/,
  );
});

test("security gate: control-plane enforces HTTP security headers and explicit CORS allowlist", async () => {
  const { buildServer } = await import("../server");
  const app = await buildServer();

  // Disallowed browser origin must be rejected fail-closed with 403
  const badOriginRes = await app.inject({
    method: "GET",
    url: "/healthz",
    headers: { Origin: "https://evil-attacker.example" },
  });
  assert.equal(badOriginRes.statusCode, 403);
  assert.equal(badOriginRes.headers["x-frame-options"], "DENY");
  assert.equal(badOriginRes.headers["x-content-type-options"], "nosniff");
  assert.equal(badOriginRes.headers["referrer-policy"], "no-referrer");

  // Allowlisted origin succeeds with explicit Access-Control-Allow-Origin
  const goodOriginRes = await app.inject({
    method: "GET",
    url: "/healthz",
    headers: { Origin: "http://localhost:3000" },
  });
  assert.notEqual(goodOriginRes.statusCode, 403);
  assert.equal(goodOriginRes.headers["access-control-allow-origin"], "http://localhost:3000");

  // Non-browser CLI / API requests without Origin also work normally
  const cliRes = await app.inject({
    method: "GET",
    url: "/healthz",
  });
  assert.notEqual(cliRes.statusCode, 403);
});

test("security gate: requireRole and requireScope enforce RBAC and API key scopes (SEC-04)", async () => {
  const { requireRole, requireScope } = await import("../plugins/auth");
  const adminOnly = requireRole(["owner", "admin"]);
  const memberWrite = requireRole(["owner", "admin", "member"]);
  const assetsWriteScope = requireScope("assets:write");
  const reply = {} as never;

  // Readonly user blocked from member and admin mutations
  await assert.rejects(
    () => adminOnly({ auth: { orgId: "11111111-1111-1111-1111-111111111111", userId: "u1", actorType: "user", role: "readonly" } } as never, reply),
    (e: unknown) => (e as { statusCode: number; code: string }).statusCode === 403 && (e as { code: string }).code === "insufficient_role",
  );
  await assert.rejects(
    () => memberWrite({ auth: { orgId: "11111111-1111-1111-1111-111111111111", userId: "u1", actorType: "user", role: "readonly" } } as never, reply),
    (e: unknown) => (e as { statusCode: number }).statusCode === 403,
  );

  // Member allowed on asset mutations, blocked on org admin mutations
  await memberWrite({ auth: { orgId: "11111111-1111-1111-1111-111111111111", userId: "u2", actorType: "user", role: "member" } } as never, reply);
  await assert.rejects(
    () => adminOnly({ auth: { orgId: "11111111-1111-1111-1111-111111111111", userId: "u2", actorType: "user", role: "member" } } as never, reply),
    (e: unknown) => (e as { statusCode: number }).statusCode === 403,
  );

  // Read-only API key rejected on write scope; matching write scope succeeds
  await assert.rejects(
    () => assetsWriteScope({ auth: { orgId: "11111111-1111-1111-1111-111111111111", apiKeyId: "k1", actorType: "api_key", scopes: ["read"] } } as never, reply),
    (e: unknown) => (e as { statusCode: number; code: string }).statusCode === 403 && (e as { code: string }).code === "insufficient_scope",
  );
  await assetsWriteScope({ auth: { orgId: "11111111-1111-1111-1111-111111111111", apiKeyId: "k2", actorType: "api_key", scopes: ["assets:write"] } } as never, reply);

  // Org deletion strictly requires owner role and org:write scope (LEG-04)
  const ownerOnly = requireRole(["owner"]);
  const orgWriteScope = requireScope("org:write");
  const orgReadScope = requireScope("org:read");
  await assert.rejects(
    () => ownerOnly({ auth: { orgId: "11111111-1111-1111-1111-111111111111", userId: "u3", actorType: "user", role: "admin" } } as never, reply),
    (e: unknown) => (e as { statusCode: number; code: string }).statusCode === 403 && (e as { code: string }).code === "insufficient_role",
  );
  await ownerOnly({ auth: { orgId: "11111111-1111-1111-1111-111111111111", userId: "u4", actorType: "user", role: "owner" } } as never, reply);
  await orgReadScope({ auth: { orgId: "11111111-1111-1111-1111-111111111111", apiKeyId: "k3", actorType: "api_key", scopes: ["org:read"] } } as never, reply);
  await assert.rejects(
    () => orgWriteScope({ auth: { orgId: "11111111-1111-1111-1111-111111111111", apiKeyId: "k3", actorType: "api_key", scopes: ["org:read"] } } as never, reply),
    (e: unknown) => (e as { statusCode: number; code: string }).statusCode === 403 && (e as { code: string }).code === "insufficient_scope",
  );
});

test("security gate: org export and delete endpoints require authentication (LEG-04)", async () => {
  const { buildServer } = await import("../server");
  const app = await buildServer();

  const exportRes = await app.inject({ method: "POST", url: "/v1/org/export", payload: {} });
  assert.equal(exportRes.statusCode, 401);

  const deleteRes = await app.inject({
    method: "DELETE",
    url: "/v1/org",
    payload: { confirm_slug: "acme" },
  });
  assert.equal(deleteRes.statusCode, 401);
});

test("security gate: MFA routes require auth and assertLoginMfaSatisfied enforces TOTP policy (ENT-01)", async () => {
  const { buildServer } = await import("../server");
  const { assertLoginMfaSatisfied } = await import("../routes/auth");
  const { generateTotpCode, generateTotpSecret } = await import("./totp");
  const app = await buildServer();

  const setupRes = await app.inject({ method: "POST", url: "/v1/auth/mfa/setup", payload: {} });
  assert.equal(setupRes.statusCode, 401);

  const verifyRes = await app.inject({ method: "POST", url: "/v1/auth/mfa/verify", payload: { code: "123456" } });
  assert.equal(verifyRes.statusCode, 401);

  const secret = generateTotpSecret();
  const validCode = generateTotpCode(secret);

  assert.throws(
    () =>
      assertLoginMfaSatisfied({
        userMfaEnabled: false,
        userMfaSecret: secret,
        orgEnforceMfa: true,
        totpCode: undefined,
      }),
    (e: unknown) => (e as { statusCode: number; code: string }).statusCode === 401 && (e as { code: string }).code === "mfa_required",
  );

  assert.throws(
    () =>
      assertLoginMfaSatisfied({
        userMfaEnabled: true,
        userMfaSecret: secret,
        orgEnforceMfa: false,
        totpCode: "000000",
      }),
    (e: unknown) => (e as { statusCode: number; code: string }).statusCode === 401 && (e as { code: string }).code === "invalid_mfa_code",
  );

  assertLoginMfaSatisfied({
    userMfaEnabled: true,
    userMfaSecret: secret,
    orgEnforceMfa: true,
    totpCode: validCode,
  });
});

test("security gate: channels/reports Zod schemas reject unvalidated fields and strip internal report columns (SEC-06)", async () => {
  const { CreateChannelBody, UpdateChannelBody } = await import("../routes/channels");
  const { CreateReportBody } = await import("../routes/reports");
  const { publicReport } = await import("../repo/reports");

  assert.throws(() => CreateChannelBody.parse({ type: "webhook", config: { url: "not-a-url" } }));
  assert.throws(() =>
    CreateChannelBody.parse({ type: "slack", config: { webhook_url: "https://hooks.slack.com/x", injected: true } }),
  );
  assert.throws(() => UpdateChannelBody.parse({}));

  const validChannel = CreateChannelBody.parse({
    type: "slack",
    config: { webhook_url: "https://hooks.slack.com/services/T0/B0/abc" },
    min_severity: "high",
  });
  assert.equal(validChannel.type, "slack");

  assert.throws(() => CreateReportBody.parse({ type: "executive", extra_field: "drop" }));
  assert.throws(() => CreateReportBody.parse({ type: "executive", asset_ids: ["not-a-uuid"] }));

  const sanitized = publicReport({
    id: "11111111-1111-1111-1111-111111111111",
    org_id: "22222222-2222-2222-2222-222222222222",
    project_id: null,
    type: "executive",
    generated_at: "2026-11-28T00:00:00.000Z",
    period_start: null,
    period_end: null,
    file_ref: "{\"raw\":\"internal\"}",
    generated_by: "33333333-3333-3333-3333-333333333333",
    created_at: "2026-11-28T00:00:00.000Z",
    updated_at: "2026-11-28T00:00:00.000Z",
  });
  assert.equal("file_ref" in sanitized, false);
  assert.equal("generated_by" in sanitized, false);
});
