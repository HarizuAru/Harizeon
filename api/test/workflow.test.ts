import { test } from "node:test";
import assert from "node:assert/strict";

// W07 findings core: status workflow (open → ack → fixed → reopen), finding_events
// audit trail, severity counts, invalid transitions rejected, RLS isolation.
const DATABASE_URL = process.env.DATABASE_URL;

process.env.HARIZEON_QUEUE_PREFIX = "test:";

test("findings status workflow", { skip: !DATABASE_URL }, async () => {
  const { buildServer } = await import("../src/server");
  const { scanQueue } = await import("../src/services/scanQueue");
  const { runIngestOnce } = await import("../src/workers/ingest");
  const { withTx } = await import("../src/db");

  await scanQueue.ready();
  const app = await buildServer();

  const stamp = Date.now();
  const email = `w07${stamp}@example.com`;
  const password = "correct-horse-battery-99";
  const orgSlug = `w07-${stamp}`;
  const domain = `w07-${stamp}.example.com`;
  let orgId = "";

  try {
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email, password, name: "W07User", orgName: "W07 Org", orgSlug },
    });
    assert.equal(signup.statusCode, 201, signup.body);
    const login = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email, password } });
    orgId = login.json().org.id as string;
    const cookie = `hz_session=${login.cookies!.find((c) => c.name === "hz_session")!.value}`;
    const authed = (method: string, url: string, payload?: unknown) =>
      app.inject({ method: method as "GET" | "POST" | "PATCH", url, headers: { cookie }, payload: payload as never });

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
    const scanId = scan.json().scan.id as string;

    // Seed two findings.
    await scanQueue.publish({
      scan_id: scanId, org_id: orgId, kind: "findings", parent_asset_id: assetId,
      findings: JSON.stringify([
        { check_id: "check.a", location: `${domain}:443`, severity: "high", title: "Finding A", category: "tls" },
        { check_id: "check.b", location: `https://${domain}`, severity: "medium", title: "Finding B", category: "headers" },
      ]),
    });
    for (let i = 0; i < 3; i += 1) await runIngestOnce(scanQueue);

    const list = await authed("GET", "/v1/findings");
    const rows = list.json().data as { id: string; title: string }[];
    assert.equal(rows.length, 2);
    const a = rows.find((r) => r.title.startsWith("Legacy") || r.title.includes("Finding"))!;

    // Unknown status rejected.
    const bad = await authed("PATCH", `/v1/findings/${a.id}`, { status: "banana" });
    assert.equal(bad.statusCode, 400);

    // open -> acknowledged
    const ack = await authed("PATCH", `/v1/findings/${a.id}`, { status: "acknowledged", status_reason: "risk accepted by owner" });
    assert.equal(ack.statusCode, 200, ack.body);
    assert.equal(ack.json().finding.status, "acknowledged");
    assert.equal(ack.json().changed, true);

    // acknowledged -> fixed sets resolved_at
    const fixed = await authed("PATCH", `/v1/findings/${a.id}`, { status: "fixed", status_reason: "upgraded TLS" });
    assert.equal(fixed.statusCode, 200);
    assert.ok(fixed.json().finding.resolved_at, "fixed sets resolved_at");

    // fixed -> open clears resolved_at (reopened)
    const reopened = await authed("PATCH", `/v1/findings/${a.id}`, { status: "open" });
    assert.equal(reopened.statusCode, 200);
    assert.equal(reopened.json().finding.resolved_at, null, "reopen clears resolved_at");

    // No-op transition -> changed=false, no duplicate event
    const noop = await authed("PATCH", `/v1/findings/${a.id}`, { status: "open" });
    assert.equal(noop.json().changed, false);

    // finding_events trail + audit written for real transitions
    const detail = await authed("GET", `/v1/findings/${a.id}`);
    const events = detail.json().events as { to_status: string; from_status: string | null }[];
    assert.ok(events.length >= 2, "status transitions recorded");
    assert.ok(events.some((e) => e.to_status === "acknowledged" && e.from_status === "open"));

    // Severity counts: both findings are open again (A was reopened, B untouched)
    const counts = await authed("GET", "/v1/findings/counts");
    assert.equal(counts.json().medium, 1);
    assert.equal(counts.json().high, 1);

    // Diff summary on the scan
    const d = await authed("GET", `/v1/scans/${scanId}`);
    const summary = d.json().summary;
    assert.ok(summary, "scan summary present");
    assert.equal(summary.new, 2, "both findings are new from this scan");
    assert.equal(summary.resolved, 0);

    // RLS: cross-org access rejected
    const s2 = await app.inject({
      method: "POST", url: "/v1/auth/signup",
      payload: { email: `w07b${stamp}@example.com`, password, orgName: "B Org", orgSlug: `w07b-${stamp}` },
    });
    assert.equal(s2.statusCode, 201);
    const l2 = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email: `w07b${stamp}@example.com`, password } });
    const cookie2 = `hz_session=${l2.cookies!.find((c) => c.name === "hz_session")!.value}`;
    const cross = await app.inject({ method: "PATCH", url: `/v1/findings/${a.id}`, headers: { cookie: cookie2 }, payload: { status: "acknowledged" } });
    assert.equal(cross.statusCode, 404, "cross-tenant PATCH must 404");
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
