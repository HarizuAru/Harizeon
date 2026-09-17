import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";

// Assets + verification end-to-end (CRUD, initiate/check, RLS, recheck).
// Requires DATABASE_URL (harizeon_app role). Skipped when unset.
const DATABASE_URL = process.env.DATABASE_URL;
process.env.VERIFY_ALLOW_PRIVATE = "true";

test("Assets + verification end-to-end", { skip: !DATABASE_URL }, async () => {
  const { buildServer } = await import("../src/server");
  const { runVerificationRecheckOnce } = await import("../src/lib/recheck");
  const { pool } = await import("../src/db");
  const app = await buildServer();

  async function signupLogin(tag: string) {
    const stamp = `${Date.now()}`;
    const email = `u${tag}${stamp}@example.com`;
    const password = "correct-horse-battery-99";
    const orgSlug = `o-${tag}-${stamp}`;
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email, password, name: `User ${tag}`, orgName: `Org ${tag}`, orgSlug },
    });
    assert.equal(signup.statusCode, 201, signup.body);
    const login = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email, password } });
    assert.equal(login.statusCode, 200, login.body);
    const session = login.cookies?.find((c) => c.name === "hz_session");
    assert.ok(session?.value);
    return { cookie: `hz_session=${session!.value}`, orgId: login.json().org.id as string };
  }

  const A = await signupLogin("a");
  const B = await signupLogin("b");

  const authed = (cookie: string, opts: { method: string; url: string; payload?: unknown }) =>
    app.inject({ method: opts.method as "GET" | "POST" | "PATCH" | "DELETE", url: opts.url, headers: { cookie }, payload: opts.payload });

  try {
    // create (normalises case + trailing dot)
    const create = await authed(A.cookie, {
      method: "POST",
      url: "/v1/assets",
      payload: { type: "domain", value: "Example.COM.", criticality: "high", tags: ["prod"] },
    });
    assert.equal(create.statusCode, 201, create.body);
    assert.strictEqual(create.json().asset.value, "example.com");
    assert.strictEqual(create.json().asset.criticality, "high");
    const assetId = create.json().asset.id as string;

    // duplicate → 409
    const dup = await authed(A.cookie, {
      method: "POST", url: "/v1/assets", payload: { type: "domain", value: "example.com" },
    });
    assert.equal(dup.statusCode, 409);

    // invalid value → 400
    const bad = await authed(A.cookie, {
      method: "POST", url: "/v1/assets", payload: { type: "domain", value: "not a domain!!!" },
    });
    assert.equal(bad.statusCode, 400);

    // list + cursor pagination
    await authed(A.cookie, { method: "POST", url: "/v1/assets", payload: { type: "subdomain", value: "api.example.com" } });
    await authed(A.cookie, { method: "POST", url: "/v1/assets", payload: { type: "subdomain", value: "www.example.com" } });
    const page1 = await authed(A.cookie, { method: "GET", url: "/v1/assets?limit=2" });
    assert.equal(page1.statusCode, 200);
    assert.strictEqual(page1.json().data.length, 2);
    assert.strictEqual(page1.json().has_more, true);
    assert.ok(page1.json().next_cursor);
    const page2 = await authed(A.cookie, {
      method: "GET", url: `/v1/assets?limit=2&cursor=${encodeURIComponent(page1.json().next_cursor)}`,
    });
    assert.equal(page2.statusCode, 200);
    assert.strictEqual(page2.json().data.length, 1);
    assert.strictEqual(page2.json().has_more, false);

    const badCursor = await authed(A.cookie, { method: "GET", url: "/v1/assets?cursor=nope" });
    assert.equal(badCursor.statusCode, 400);

    // detail (no verification yet) + patch
    const detail = await authed(A.cookie, { method: "GET", url: `/v1/assets/${assetId}` });
    assert.equal(detail.statusCode, 200);
    assert.strictEqual(detail.json().verification, null);
    const patch = await authed(A.cookie, {
      method: "PATCH", url: `/v1/assets/${assetId}`, payload: { criticality: "low", tags: ["x"] },
    });
    assert.equal(patch.statusCode, 200);
    assert.strictEqual(patch.json().asset.criticality, "low");

    // RLS: B sees nothing of A's asset
    assert.equal((await authed(B.cookie, { method: "GET", url: `/v1/assets/${assetId}` })).statusCode, 404);
    const bList = await authed(B.cookie, { method: "GET", url: "/v1/assets" });
    assert.ok(!bList.json().data.some((a: { id: string }) => a.id === assetId));
    assert.equal((await authed(B.cookie, {
      method: "POST", url: `/v1/assets/${assetId}/verification`, payload: { method: "dns_txt" },
    })).statusCode, 404);

    // initiate DNS verification
    const init = await authed(A.cookie, {
      method: "POST", url: `/v1/assets/${assetId}/verification`, payload: { method: "dns_txt" },
    });
    assert.equal(init.statusCode, 201, init.body);
    assert.strictEqual(init.json().status, "pending");
    assert.match(init.json().token, /^[0-9a-f]{32}$/);
    assert.strictEqual(init.json().instructions.host, "_harizeon-verify.example.com");
    assert.ok((init.json().instructions.value as string).includes(init.json().token));

    // DNS method rejected for IP assets
    const ipCreate = await authed(A.cookie, {
      method: "POST", url: "/v1/assets", payload: { type: "ip", value: "203.0.113.44" },
    });
    const badMethod = await authed(A.cookie, {
      method: "POST", url: `/v1/assets/${ipCreate.json().asset.id}/verification`, payload: { method: "dns_txt" },
    });
    assert.equal(badMethod.statusCode, 400);

    // DNS check on a non-existent record → stays pending with a reason
    const checkDns = await authed(A.cookie, {
      method: "POST", url: `/v1/assets/${assetId}/verification/check`,
    });
    assert.equal(checkDns.statusCode, 200, checkDns.body);
    assert.strictEqual(checkDns.json().status, "pending");
    assert.ok(checkDns.json().reason);

    // HTTP verification via a local file server (proves the file path end-to-end)
    let servedToken = "";
    const server: Server = createServer((req, res) => {
      if (req.url === "/.well-known/harizeon-verification.txt") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(servedToken);
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = (server.address() as { port: number }).port;
    try {
      const urlAsset = await authed(A.cookie, {
        method: "POST",
        url: "/v1/assets",
        payload: { type: "url", value: `http://127.0.0.1:${port}/some/app` },
      });
      assert.equal(urlAsset.statusCode, 201, urlAsset.body);
      const urlId = urlAsset.json().asset.id as string;

      const initHttp = await authed(A.cookie, {
        method: "POST", url: `/v1/assets/${urlId}/verification`, payload: { method: "http_file" },
      });
      assert.equal(initHttp.statusCode, 201, initHttp.body);
      servedToken = initHttp.json().token as string;
      assert.ok((initHttp.json().instructions.url as string).includes(`127.0.0.1:${port}`));

      const checkHttp = await authed(A.cookie, {
        method: "POST", url: `/v1/assets/${urlId}/verification/check`,
      });
      assert.equal(checkHttp.statusCode, 200, checkHttp.body);
      assert.strictEqual(checkHttp.json().status, "verified");

      const afterVerify = await authed(A.cookie, { method: "GET", url: `/v1/assets/${urlId}` });
      assert.strictEqual(afterVerify.json().verification.status, "verified");
      const verificationId = afterVerify.json().verification.id as string;

      // Recheck: backdate, stop the server, run the pass → revoked
      await new Promise<void>((resolve) => server.close(() => resolve()));
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT set_config('harizeon.org_id', $1, true)", [A.orgId]);
        await client.query(
          `UPDATE asset_verifications SET last_checked_at = now() - interval '30 days', updated_at = now() WHERE id = $1`,
          [verificationId],
        );
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }

      const recheck = await runVerificationRecheckOnce(pool, 7);
      assert.strictEqual(recheck.checked, 1);
      assert.strictEqual(recheck.revoked, 1);

      const afterRecheck = await authed(A.cookie, { method: "GET", url: `/v1/assets/${urlId}` });
      assert.strictEqual(afterRecheck.json().verification.status, "revoked");
    } finally {
      if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    // soft delete hides from list but keeps the record
    assert.equal((await authed(A.cookie, { method: "DELETE", url: `/v1/assets/${assetId}` })).statusCode, 200);
    const afterDel = await authed(A.cookie, { method: "GET", url: `/v1/assets/${assetId}` });
    assert.strictEqual(afterDel.json().asset.is_active, false);
    const listAfterDel = await authed(A.cookie, { method: "GET", url: "/v1/assets" });
    assert.ok(!listAfterDel.json().data.some((a: { id: string }) => a.id === assetId));
  } finally {
    await app.close();
    await pool.end();
  }
});
