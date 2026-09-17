import { test } from "node:test";
import assert from "node:assert/strict";

// Scan job pipeline end-to-end (queue + state machine + API). Requires
// DATABASE_URL (harizeon_app) and REDIS_URL. Skipped when DATABASE_URL is unset.
const DATABASE_URL = process.env.DATABASE_URL;
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
process.env.VERIFY_ALLOW_PRIVATE = "true";
process.env.HARIZEON_QUEUE_PREFIX = "test:";

test("scan job pipeline end-to-end", { skip: !DATABASE_URL }, async () => {
  const { buildServer } = await import("../src/server");
  const { scanQueue } = await import("../src/services/scanQueue");
  const { runIngestOnce } = await import("../src/workers/ingest");
  const { runReaperOnce } = await import("../src/workers/reaper");
  const { withTx } = await import("../src/db");

  assert.ok(REDIS_URL, "REDIS_URL must be set");
  await scanQueue.ready();
  const app = await buildServer();

  const stamp = Date.now();
  const email = `scan${stamp}@example.com`;
  const password = "correct-horse-battery-99";
  const orgSlug = `scan-${stamp}`;
  let orgId = "";

  try {
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email, password, name: "Scan", orgName: "Scan Org", orgSlug },
    });
    assert.equal(signup.statusCode, 201, signup.body);
    const login = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email, password } });
    assert.equal(login.statusCode, 200, login.body);
    const orgId0 = login.json().org.id as string;
    orgId = orgId0;
    const cookie = `hz_session=${login.cookies!.find((c) => c.name === "hz_session")!.value}`;

    const authed = (method: string, url: string, payload?: unknown) =>
      app.inject({
        method: method as "GET" | "POST" | "PATCH" | "DELETE",
        url,
        headers: { cookie },
        payload: payload as never,
      });

    // Two assets: one verified (fixture row), one not.
    const verified = await authed("POST", "/v1/assets", { type: "domain", value: `a-${stamp}.example.com` });
    const unverified = await authed("POST", "/v1/assets", { type: "domain", value: `b-${stamp}.example.com` });
    assert.equal(verified.statusCode, 201, verified.body);
    assert.equal(unverified.statusCode, 201, unverified.body);
    const verifiedId = verified.json().asset.id as string;
    const unverifiedId = unverified.json().asset.id as string;
    const verifiedValue = verified.json().asset.value as string;

    await withTx(async (c) => {
      await c.query(
        `INSERT INTO asset_verifications (org_id, asset_id, method, token, status, verified_at, last_checked_at)
         VALUES ($1,$2,'dns_txt','fixture','verified', now(), now())`,
        [orgId, verifiedId],
      );
    }, orgId);

    // §12 gate: an unverified asset cannot be scanned.
    const gate = await authed("POST", "/v1/scans", { asset_ids: [unverifiedId], profile: "quick" });
    assert.equal(gate.statusCode, 400, gate.body);
    assert.equal(gate.json().error.code, "asset_not_verified");

    // Create a real scan and prove the job landed on the queue.
    const created = await authed("POST", "/v1/scans", { asset_ids: [verifiedId], profile: "standard" });
    assert.equal(created.statusCode, 201, created.body);
    assert.equal(created.json().scan.status, "queued");
    const scanId = created.json().scan.id as string;

    const claimed = await scanQueue.claimJobs(`t-${stamp}`, 200);
    const mine = claimed.find((c) => c.job.scan_id === scanId);
    assert.ok(mine, "job should be enqueued");
    assert.deepEqual(mine!.job.targets.map((t) => t.value), [verifiedValue]);
    for (const c of claimed) await scanQueue.ackJob(c.id);

    // Simulate the worker's event stream, then pump the ingester.
    await scanQueue.publish({ scan_id: scanId, org_id: orgId, kind: "status", status: "claimed", attempt: 0 });
    await scanQueue.publish({ scan_id: scanId, org_id: orgId, kind: "status", status: "running", phase: "discover", progress_pct: 20 });
    await scanQueue.publish({ scan_id: scanId, org_id: orgId, kind: "event", phase: "discover", level: "info", message: "resolved api.example.com -> 203.0.113.44" });
    await scanQueue.publish({ scan_id: scanId, org_id: orgId, kind: "terminal", status: "completed", phase: "report" });
    for (let i = 0; i < 3; i += 1) await runIngestOnce(scanQueue);

    const done = await authed("GET", `/v1/scans/${scanId}`);
    assert.equal(done.statusCode, 200, done.body);
    assert.equal(done.json().scan.status, "completed");
    assert.equal(done.json().scan.progress_pct, 100);
    assert.ok(done.json().scan.finished_at, "finished_at set");
    assert.ok(
      done.json().events.some((e: { message: string }) => e.message.includes("resolved api.example.com")),
      "scan_events recorded",
    );

    // Cancel is first-writer-wins: a late terminal must not resurrect the scan.
    const s2 = await authed("POST", "/v1/scans", { asset_ids: [verifiedId], profile: "quick" });
    const s2id = s2.json().scan.id as string;
    const cancel = await authed("POST", `/v1/scans/${s2id}/cancel`);
    assert.equal(cancel.statusCode, 200, cancel.body);
    assert.equal(cancel.json().scan.status, "cancelled");
    assert.strictEqual(await scanQueue.isCancelled(s2id), true, "cancel flag set for the worker");
    await scanQueue.publish({ scan_id: s2id, org_id: orgId, kind: "terminal", status: "completed", phase: "report" });
    for (let i = 0; i < 3; i += 1) await runIngestOnce(scanQueue);
    const s2after = await authed("GET", `/v1/scans/${s2id}`);
    assert.equal(s2after.json().scan.status, "cancelled", "late terminal ignored");

    // Reaper: a live worker (heartbeat) is left alone.
    const s3 = await authed("POST", "/v1/scans", { asset_ids: [verifiedId], profile: "quick" });
    const s3id = s3.json().scan.id as string;
    await scanQueue.setHeartbeat(s3id, 60);
    await runReaperOnce(scanQueue, 0);
    const s3alive = await authed("GET", `/v1/scans/${s3id}`);
    assert.equal(s3alive.json().scan.status, "queued", "alive scan untouched");
    assert.equal(s3alive.json().scan.attempt, 0);

    // Reaper: a dead worker retries (max 2) then times out.
    const s4 = await authed("POST", "/v1/scans", { asset_ids: [verifiedId], profile: "quick" });
    const s4id = s4.json().scan.id as string;
    await runReaperOnce(scanQueue, 0);
    const a1 = await authed("GET", `/v1/scans/${s4id}`);
    assert.equal(a1.json().scan.status, "queued");
    assert.equal(a1.json().scan.attempt, 1);
    await runReaperOnce(scanQueue, 0);
    const a2 = await authed("GET", `/v1/scans/${s4id}`);
    assert.equal(a2.json().scan.attempt, 2);
    await runReaperOnce(scanQueue, 0);
    const a3 = await authed("GET", `/v1/scans/${s4id}`);
    assert.equal(a3.json().scan.status, "timeout");
    assert.equal(a3.json().scan.error_code, "worker_timeout");

    // An event for a scan that does not exist is ignored, not an FK poison.
    await scanQueue.publish({
      scan_id: "00000000-0000-0000-0000-000000000000",
      org_id: orgId,
      kind: "event",
      phase: "probe",
      level: "info",
      message: "ghost",
    });
    let threw = false;
    try {
      await runIngestOnce(scanQueue);
    } catch {
      threw = true;
    }
    assert.equal(threw, false, "a missing-scan event must not throw");
  } finally {
    // Leave no in-flight scans, or the dev reaper would requeue them into the
    // production stream (tests share the database with a running API).
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
