import { test } from "node:test";
import assert from "node:assert/strict";

// W06 findings ingest: fingerprint/dedupe, severity validation, RLS isolation,
// and the §08 findings endpoint. Requires DATABASE_URL + REDIS_URL.
const DATABASE_URL = process.env.DATABASE_URL;

process.env.HARIZEON_QUEUE_PREFIX = "test:";

test("findings ingest + endpoint", { skip: !DATABASE_URL }, async () => {
  const { buildServer } = await import("../src/server");
  const { scanQueue } = await import("../src/services/scanQueue");
  const { runIngestOnce } = await import("../src/workers/ingest");
  const { withTx } = await import("../src/db");

  await scanQueue.ready();
  const app = await buildServer();

  const stamp = Date.now();
  const email = `fnd${stamp}@example.com`;
  const password = "correct-horse-battery-99";
  const orgSlug = `fnd-${stamp}`;
  const domain = `fnd-${stamp}.example.com`;
  let orgId = "";

  try {
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email, password, name: "F", orgName: "F Org", orgSlug },
    });
    assert.equal(signup.statusCode, 201, signup.body);
    const login = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email, password } });
    orgId = login.json().org.id as string;
    const cookie = `hz_session=${login.cookies!.find((c) => c.name === "hz_session")!.value}`;
    const authed = (method: string, url: string, payload?: unknown) =>
      app.inject({ method: method as "GET" | "POST", url, headers: { cookie }, payload: payload as never });

    const asset = await authed("POST", "/v1/assets", { type: "domain", value: domain });
    const assetId = asset.json().asset.id as string;
    await withTx(async (c) => {
      await c.query(
        `INSERT INTO asset_verifications (org_id, asset_id, method, token, status, verified_at, last_checked_at)
         VALUES ($1,$2,'dns_txt','fixture','verified', now(), now())`,
        [orgId, assetId],
      );
    }, orgId);
    const scan = await authed("POST", "/v1/scans", { asset_ids: [assetId], profile: "standard" });
    assert.equal(scan.statusCode, 201, scan.body);
    const scanId = scan.json().scan.id as string;

    const batch = [
      { check_id: "tls.legacy_protocol", location: `${domain}:443`, severity: "high",
        title: "Legacy TLS enabled", description: "negotiates TLSv1", remediation: "Disable TLSv1", category: "tls",
        cve_ids: ["CVE-2023-9999", "not-a-cve"] },
      { check_id: "headers.csp_missing", location: `https://${domain}`, severity: "medium",
        title: "No CSP", category: "headers" },
      { check_id: "probe.exposed_service", location: "1.2.3.4:6379", severity: "critical",
        title: "Exposed redis", category: "exposed_service" },
      { check_id: "junk", location: "x", severity: "banana", title: "invalid severity" },
    ];

    const event = {
      scan_id: scanId, org_id: orgId, kind: "findings",
      parent_asset_id: assetId, findings: JSON.stringify(batch),
    };

    // First batch: 3 valid findings recorded.
    await scanQueue.publish(event);
    for (let i = 0; i < 3; i += 1) await runIngestOnce(scanQueue);

    const list = await authed("GET", "/v1/findings");
    assert.equal(list.statusCode, 200, list.body);
    const rows = list.json().data as { id: string; title: string; severity: string; fingerprint: string; status: string; cve_ids?: string[] }[];
    assert.equal(rows.length, 3, "invalid-severity finding dropped");
    assert.ok(rows.every((r) => r.status === "open"));
    // CVE ids are stored only in CVE format; junk entries are dropped.
    const legacy = rows.find((r) => r.title === "Legacy TLS enabled")!;
    assert.deepEqual(legacy.cve_ids, ["CVE-2023-9999"], "malformed CVE ids are dropped");
    assert.deepEqual(
      rows.find((r) => r.title === "No CSP")!.cve_ids,
      [],
      "findings without CVEs carry an empty list",
    );
    const byTitle = new Map(rows.map((r) => [r.title, r]));

    // Filters.
    const crit = await authed("GET", "/v1/findings?severity=critical");
    assert.equal(crit.json().data.length, 1);
    assert.equal(crit.json().data[0].title, "Exposed redis");
    const none = await authed("GET", "/v1/findings?severity=low");
    assert.equal(none.json().data.length, 0);

    // Second batch with the same checks: same fingerprints -> deduped, updated.
    await scanQueue.publish(event);
    for (let i = 0; i < 3; i += 1) await runIngestOnce(scanQueue);
    const after = await authed("GET", "/v1/findings");
    assert.equal(after.json().data.length, 3, "fingerprint dedupe keeps one finding per check");

    // RLS: a second org sees none of them.
    const s2 = await app.inject({
      method: "POST", url: "/v1/auth/signup",
      payload: { email: `fnd2${stamp}@example.com`, password, orgName: "B", orgSlug: `fnd2-${stamp}` },
    });
    assert.equal(s2.statusCode, 201);
    const l2 = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email: `fnd2${stamp}@example.com`, password } });
    const cookie2 = `hz_session=${l2.cookies!.find((c) => c.name === "hz_session")!.value}`;
    const cross = await app.inject({ method: "GET", url: "/v1/findings", headers: { cookie: cookie2 } });
    assert.equal(cross.statusCode, 200);
    assert.equal(cross.json().data.length, 0, "cross-tenant leak");
    void byTitle;

    // Detail endpoint + 404/401 paths.
    const one = rows[0];
    const detail = await authed("GET", `/v1/findings/${one.id}`);
    assert.equal(detail.statusCode, 200);
    assert.equal(detail.json().finding.title, one.title);
    const missing = await authed("GET", `/v1/findings/00000000-0000-0000-0000-000000000000`);
    assert.equal(missing.statusCode, 404);
    const unauth = await app.inject({ method: "GET", url: "/v1/findings" });
    assert.equal(unauth.statusCode, 401);

    // --- stale-attempt guard (§06.4): a retried scan must ignore its
    // predecessor's late events, or attempt 1 could mutate attempt 2.
    await withTx(async (c) => {
      await c.query(`UPDATE scans SET attempt = 2 WHERE id = $1`, [scanId]);
    }, orgId);
    await scanQueue.publish({
      scan_id: scanId, org_id: orgId, kind: "findings", parent_asset_id: assetId,
      attempt: 1,
      findings: JSON.stringify([{ check_id: "stale.check", location: "x:1", severity: "high", title: "Stale attempt finding" }]),
    });
    for (let i = 0; i < 3; i += 1) await runIngestOnce(scanQueue);
    const staleList = await authed("GET", "/v1/findings");
    assert.equal(
      staleList.json().data.filter((f: { title: string }) => f.title === "Stale attempt finding").length,
      0,
      "an attempt-1 event must not mutate an attempt-2 scan",
    );
    await scanQueue.publish({
      scan_id: scanId, org_id: orgId, kind: "findings", parent_asset_id: assetId,
      attempt: 2,
      findings: JSON.stringify([{ check_id: "stale.check", location: "x:1", severity: "high", title: "Current attempt finding" }]),
    });
    for (let i = 0; i < 3; i += 1) await runIngestOnce(scanQueue);
    const currentList = await authed("GET", "/v1/findings");
    assert.equal(
      currentList.json().data.filter((f: { title: string }) => f.title === "Current attempt finding").length,
      1,
      "the current attempt's events still apply",
    );

    // --- reaper authorization (§12): a scan whose target's ownership lapsed
    // must not be retried; it is cancelled instead.
    const { runReaperOnce } = await import("../src/workers/reaper");
    await withTx(async (c) => {
      await c.query(`UPDATE scans SET attempt = 1 WHERE id = $1`, [scanId]);
      await c.query(`UPDATE scans SET started_at = now() - interval '1 hour' WHERE id = $1`, [scanId]);
      await c.query(`UPDATE asset_verifications SET status = 'revoked' WHERE org_id = $1 AND asset_id = $2`, [orgId, assetId]);
    }, orgId);
    await runReaperOnce(scanQueue, 30_000);
    const scanRow = (await authed("GET", `/v1/scans/${scanId}`)).json().scan as { status: string; error_code?: string | null };
    assert.equal(scanRow.status, "cancelled", "revoked-ownership scan is not retried");
    assert.equal(scanRow.error_code, "asset_not_verified");
  } finally {
    if (orgId) {
      try {
        await withTx(async (c) => {
          await c.query(
            `UPDATE scans SET status='cancelled', finished_at=now(), updated_at=now()
             WHERE org_id=$1 AND status IN ('queued','claimed','running')`,
            [orgId],
          );
        }, orgId);
      } catch {
        /* best effort */
      }
    }
    await app.close();
    await (await import("../src/db")).pool.end();
    (await import("../src/lib/redis")).redis.disconnect();
  }
});
