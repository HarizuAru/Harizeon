import { test } from "node:test";
import assert from "node:assert/strict";

// W05 discovery ingest: auto-created subdomains, parent linkage, the review
// queue, inheritance, and injection rejection. Requires DATABASE_URL + REDIS_URL.
const DATABASE_URL = process.env.DATABASE_URL;

test("discovery ingest + inheritance", { skip: !DATABASE_URL }, async () => {
  const { buildServer } = await import("../src/server");
  const { scanQueue } = await import("../src/services/scanQueue");
  const { runIngestOnce } = await import("../src/workers/ingest");
  const { withTx } = await import("../src/db");

  await scanQueue.ready();
  const app = await buildServer();

  const stamp = Date.now();
  const email = `disc${stamp}@example.com`;
  const password = "correct-horse-battery-99";
  const orgSlug = `disc-${stamp}`;
  const domain = `disc-${stamp}.example.com`;

  try {
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email, password, name: "Disc", orgName: "Disc Org", orgSlug },
    });
    assert.equal(signup.statusCode, 201, signup.body);
    const login = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email, password } });
    const orgId = login.json().org.id as string;
    const cookie = `hz_session=${login.cookies!.find((c) => c.name === "hz_session")!.value}`;
    const authed = (method: string, url: string, payload?: unknown) =>
      app.inject({ method: method as "GET" | "POST" | "PATCH", url, headers: { cookie }, payload: payload as never });

    // Parent domain, verified via fixture.
    const parent = await authed("POST", "/v1/assets", { type: "domain", value: domain });
    assert.equal(parent.statusCode, 201, parent.body);
    const parentId = parent.json().asset.id as string;
    await withTx(async (c) => {
      await c.query(
        `INSERT INTO asset_verifications (org_id, asset_id, method, token, status, verified_at, last_checked_at)
         VALUES ($1,$2,'dns_txt','fixture','verified', now(), now())`,
        [orgId, parentId],
      );
    }, orgId);

    // A scan to attach the discovery to.
    const scan = await authed("POST", "/v1/scans", { asset_ids: [parentId], profile: "quick" });
    assert.equal(scan.statusCode, 201, scan.body);
    const scanId = scan.json().scan.id as string;

    // Worker publishes a discovery batch (incl. a non-subdomain injection attempt).
    await scanQueue.publish({
      scan_id: scanId,
      org_id: orgId,
      kind: "discovered",
      parent_asset_id: parentId,
      discovered: JSON.stringify([
        { fqdn: `www.${domain}`, ips: ["1.2.3.4"], source: "ct" },
        { fqdn: `api.${domain}`, ips: ["5.6.7.8"], source: "wordlist" },
        { fqdn: "evil.example.net", ips: ["9.9.9.9"], source: "ct" },
        { fqdn: "not a host", ips: [], source: "ct" },
      ]),
    });
    for (let i = 0; i < 3; i += 1) await runIngestOnce(scanQueue);

    // Review queue: only real subdomains, out of scope.
    const disc = await authed("GET", `/v1/assets/${parentId}/discovered`);
    assert.equal(disc.statusCode, 200, disc.body);
    const items = disc.json().data as { id: string; fqdn: string; is_active: boolean }[];
    const names = items.map((d) => d.fqdn);
    assert.deepEqual(names.sort(), [`api.${domain}`, `www.${domain}`].sort());
    assert.ok(items.every((d) => d.is_active === false), "discovered assets start out of scope");

    // Not in the main list until added to scope.
    const beforeAdd = await authed("GET", "/v1/assets?q=www");
    assert.equal(beforeAdd.json().data.length, 0);

    // Add to scope -> appears; ignore -> drops from the review queue.
    const www = items.find((d) => d.fqdn === `www.${domain}`)!;
    const api = items.find((d) => d.fqdn === `api.${domain}`)!;
    assert.equal((await authed("PATCH", `/v1/assets/${www.id}`, { is_active: true })).statusCode, 200);
    assert.equal((await authed("PATCH", `/v1/assets/${api.id}`, { ignored: true })).statusCode, 200);
    const afterAdd = await authed("GET", "/v1/assets?q=www");
    assert.equal(afterAdd.json().data.length, 1);
    const afterIgnore = await authed("GET", `/v1/assets/${parentId}/discovered`);
    assert.deepEqual(afterIgnore.json().data.map((d: { fqdn: string }) => d.fqdn), [`www.${domain}`]);

    // Inheritance: the unverified subdomain is scannable because its parent is verified.
    const inheritedScan = await authed("POST", "/v1/scans", { asset_ids: [www.id], profile: "quick" });
    assert.equal(inheritedScan.statusCode, 201, inheritedScan.body);

    // A subdomain of an UNVERIFIED domain is still rejected.
    const orphan = await authed("POST", "/v1/assets", { type: "domain", value: `unverified-${stamp}.example.com` });
    const orphanSub = await authed("POST", "/v1/assets", { type: "subdomain", value: `x.unverified-${stamp}.example.com` });
    await withTx(async (c) => {
      await c.query(
        `UPDATE assets SET parent_asset_id = $3 WHERE org_id = $1 AND id = $2`,
        [orgId, orphanSub.json().asset.id, orphan.json().asset.id],
      );
    }, orgId);
    const rejected = await authed("POST", "/v1/scans", { asset_ids: [orphanSub.json().asset.id], profile: "quick" });
    assert.equal(rejected.statusCode, 400);
    assert.equal(rejected.json().error.code, "asset_not_verified");
  } finally {
    await app.close();
    await (await import("../src/db")).pool.end();
    (await import("../src/lib/redis")).redis.disconnect();
  }
});
