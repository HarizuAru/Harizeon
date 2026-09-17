import { test } from "node:test";
import assert from "node:assert/strict";

// Integration test: exercises the real auth flow against Postgres as the
// RLS-restricted app role. Requires DATABASE_URL (point it at harizeon_app).
// Skipped when DATABASE_URL is unset so `npm test` stays DB-free.
const DATABASE_URL = process.env.DATABASE_URL;

// Keep test jobs/events off a running worker's queue.
process.env.HARIZEON_QUEUE_PREFIX = "test:";

test("IAM end-to-end under RLS", { skip: !DATABASE_URL }, async () => {
  const { buildServer } = await import("../src/server");
  const app = await buildServer();

  const stamp = Date.now();
  const email = `user${stamp}@example.com`;
  const password = "correct-horse-battery-99";
  const orgSlug = `org-${stamp}`;

  try {
    // 1) signup creates user + org + membership + project
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email, password, name: "Test User", orgName: "Test Org", orgSlug },
    });
    assert.equal(signup.statusCode, 201, signup.body);
    assert.equal(signup.json().org.slug, orgSlug);

    // 2) duplicate email is rejected
    const dup = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email, password, orgName: "X", orgSlug: `x-${stamp}` },
    });
    assert.equal(dup.statusCode, 409);

    // 3) login sets a session cookie
    const login = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email, password } });
    assert.equal(login.statusCode, 200, login.body);
    const session = login.cookies?.find((c) => c.name === "hz_session");
    assert.ok(session?.value, "expected hz_session cookie");
    const cookie = `hz_session=${session!.value}`;

    // 4) wrong password rejected
    const bad = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email, password: "wrong-password-123" } });
    assert.equal(bad.statusCode, 401);

    // 5) authed org read returns THIS org only (RLS)
    const org = await app.inject({ method: "GET", url: "/v1/org", headers: { cookie } });
    assert.equal(org.statusCode, 200, org.body);
    assert.equal(org.json().org.slug, orgSlug);

    // 6) unauthenticated org read is 401
    const noauth = await app.inject({ method: "GET", url: "/v1/org" });
    assert.equal(noauth.statusCode, 401);

    // 7) create an API key (secret shown once)
    const createKey = await app.inject({
      method: "POST",
      url: "/v1/api-keys",
      headers: { cookie },
      payload: { name: "ci-key", scopes: ["read"],
      },
    });
    assert.equal(createKey.statusCode, 201, createKey.body);
    const apiKey = createKey.json().key as string;
    assert.match(apiKey, /^hrz_live_[A-Za-z0-9_-]{32}$/);

    // 8) API key authenticates programmatic access (pre-auth definer lookup + RLS)
    const viaKey = await app.inject({ method: "GET", url: "/v1/api-keys", headers: { authorization: `Bearer ${apiKey}` } });
    assert.equal(viaKey.statusCode, 200, viaKey.body);
    assert.ok(viaKey.json().keys.length >= 1);

    // 9) garbage API key rejected (falls through to unauthenticated → 401)
    const badKey = await app.inject({ method: "GET", url: "/v1/api-keys", headers: { authorization: "Bearer hrz_live_nope" } });
    assert.equal(badKey.statusCode, 401);
  } finally {
    await app.close();
    await (await import("../src/db")).pool.end();
    (await import("../src/lib/redis")).redis.disconnect();
  }
});
