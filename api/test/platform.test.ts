import { test } from "node:test";
import assert from "node:assert/strict";

// Integration coverage for the platform routes that were RLS-dead before this
// pass: schedules, notification channels (sealed/redacted/test), reports and
// billing. Requires DATABASE_URL + REDIS_URL.
const DATABASE_URL = process.env.DATABASE_URL;

process.env.HARIZEON_QUEUE_PREFIX = "test:";
process.env.HARIZEON_MASTER_KEY = "platform-test-master-key-long-enough-01";

test("platform routes work under RLS", { skip: !DATABASE_URL }, async () => {
  const { buildServer } = await import("../src/server");
  const { withTx } = await import("../src/db");

  const app = await buildServer();
  const stamp = Date.now();
  const email = `plat${stamp}@example.com`;
  const password = "correct-horse-battery-99";
  let orgId = "";

  try {
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email, password, name: "P", orgName: "P Org", orgSlug: `plat-${stamp}` },
    });
    assert.equal(signup.statusCode, 201, signup.body);
    const login = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email, password } });
    orgId = login.json().org.id as string;
    const cookie = `hz_session=${login.cookies!.find((c) => c.name === "hz_session")!.value}`;
    const authed = (method: string, url: string, payload?: unknown) =>
      app.inject({ method: method as "GET" | "POST" | "PATCH" | "DELETE", url, headers: { cookie }, payload: payload as never });

    // A verified asset so reports/scans have data.
    const asset = await authed("POST", "/v1/assets", { type: "domain", value: `plat-${stamp}.example.com` });
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
    await withTx(async (c) => {
      await c.query(
        `INSERT INTO findings (org_id, asset_id, scan_id, fingerprint, title, severity, status, category)
         VALUES ($1,$2,$3,'plat-fp','Exposed admin panel','high','open','web')`,
        [orgId, assetId, scanId],
      );
    }, orgId);

    // --- schedules (RLS-insert + validation) --------------------------------
    const badCron = await authed("POST", "/v1/schedules", { cron: "*/5 * * * *" });
    assert.equal(badCron.statusCode, 400);
    assert.equal(badCron.json().error.code, "unsupported_cron");

    const created = await authed("POST", "/v1/schedules", { cron: "weekly", profile: "standard" });
    assert.equal(created.statusCode, 201, created.body);
    assert.equal(created.json().schedule.cron, "weekly");
    assert.ok(created.json().schedule.next_run_at, "next_run_at computed");
    const scheduleId = created.json().schedule.id as string;

    const list = await authed("GET", "/v1/schedules");
    assert.equal(list.statusCode, 200);
    assert.equal(list.json().data.length, 1, "schedules visible (RLS read works)");

    const paused = await authed("PATCH", `/v1/schedules/${scheduleId}`, { enabled: false });
    assert.equal(paused.json().schedule.enabled, false);

    // --- channels: sealed at rest, redacted in responses -------------------
    const channel = await authed("POST", "/v1/channels", {
      type: "slack",
      config: { webhook_url: "https://hooks.slack.com/services/T000/B000/abcdef" },
      min_severity: "critical",
    });
    assert.equal(channel.statusCode, 201, channel.body);
    assert.equal(channel.json().channel.config.webhook_url, "••••••••", "response redacted");
    assert.equal(channel.json().channel.verified_at, null, "not verified until a test succeeds");
    const channelId = channel.json().channel.id as string;

    const stored = await withTx(
      async (c) =>
        (
          await c.query<{ config: { webhook_url: string } }>(
            `SELECT config FROM notification_channels WHERE id = $1`,
            [channelId],
          )
        ).rows[0].config.webhook_url,
      orgId,
    );
    assert.match(stored, /^v1\./, "stored value is a sealed envelope");

    // A loopback destination is refused at delivery time (SSRF guard, §11) and
    // the test endpoint reports the failure honestly.
    const loopback = await authed("POST", "/v1/channels", {
      type: "webhook",
      config: { url: "http://127.0.0.1:9/hook" },
    });
    const testResult = await authed("POST", `/v1/channels/${loopback.json().channel.id}/test`);
    assert.equal(testResult.json().ok, false);
    assert.match(testResult.json().message, /public host/);

    // --- reports ------------------------------------------------------------
    const report = await authed("POST", "/v1/reports", { type: "executive" });
    assert.equal(report.statusCode, 201, report.body);
    assert.equal(report.json().content.type, "executive");
    assert.equal(typeof report.json().content.security_score.score, "number");
    const reportId = report.json().report.id as string;

    const one = await authed("GET", `/v1/reports/${reportId}`);
    assert.equal(one.statusCode, 200);
    assert.equal(one.json().content.org_name, "P Org");

    const all = await authed("GET", "/v1/reports");
    assert.equal(all.json().data.length, 1);

    // --- billing: real usage, and NO fabricated invoices --------------------
    const sub = await authed("GET", "/v1/billing/subscription");
    assert.equal(sub.statusCode, 200);
    assert.ok(sub.json().plan.code, "plan resolved");
    assert.equal(typeof sub.json().usage.assets_monitored, "number");

    const invoices = await authed("GET", "/v1/billing/invoices");
    assert.equal(invoices.statusCode, 200);
    assert.deepEqual(invoices.json().invoices, [], "no fake invoice is fabricated");

    // --- RLS: another org cannot see any of it -----------------------------
    const s2 = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email: `plat2${stamp}@example.com`, password, orgName: "B", orgSlug: `plat2-${stamp}` },
    });
    assert.equal(s2.statusCode, 201);
    const l2 = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email: `plat2${stamp}@example.com`, password } });
    const cookie2 = `hz_session=${l2.cookies!.find((c) => c.name === "hz_session")!.value}`;
    const crossSchedules = await app.inject({ method: "GET", url: "/v1/schedules", headers: { cookie: cookie2 } });
    assert.equal(crossSchedules.json().data.length, 0);
    const crossReport = await app.inject({ method: "GET", url: `/v1/reports/${reportId}`, headers: { cookie: cookie2 } });
    assert.equal(crossReport.statusCode, 404);
    const crossChannels = await app.inject({ method: "GET", url: "/v1/channels", headers: { cookie: cookie2 } });
    assert.equal(crossChannels.json().data.length, 0);
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
