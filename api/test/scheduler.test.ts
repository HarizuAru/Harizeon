import { test } from "node:test";
import assert from "node:assert/strict";

// W09 scheduler: schedule→scan linkage and change-aware pacing (0007).
// Requires DATABASE_URL + REDIS_URL.
const DATABASE_URL = process.env.DATABASE_URL;

process.env.HARIZEON_QUEUE_PREFIX = "test:";
process.env.HARIZEON_MASTER_KEY = "platform-test-master-key-long-enough-01";

type ScanRowLite = { id: string; schedule_id?: string | null; status: string };
type ScheduleRowLite = { id: string; next_run_at: string | null };

test("scheduler links scans and stretches quiet schedules", { skip: !DATABASE_URL }, async () => {
  const { buildServer } = await import("../src/server");
  const { scanQueue } = await import("../src/services/scanQueue");
  const { runIngestOnce } = await import("../src/workers/ingest");
  const { runSchedulerOnce } = await import("../src/workers/scheduler");
  const { withTx } = await import("../src/db");

  await scanQueue.ready();
  const app = await buildServer();

  const stamp = Date.now();
  const email = `sched${stamp}@example.com`;
  const password = "correct-horse-battery-99";
  const domain = `sched-${stamp}.example.com`;
  let orgId = "";
  let scheduleId = "";

  try {
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email, password, name: "S", orgName: "Sched Org", orgSlug: `sched-${stamp}` },
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

    const created = await authed("POST", "/v1/schedules", { cron: "daily", profile: "quick" });
    assert.equal(created.statusCode, 201, created.body);
    scheduleId = created.json().schedule.id as string;

    const dueNow = () =>
      withTx(async (c) => {
        await c.query(`UPDATE schedules SET next_run_at = now() WHERE org_id = $1 AND id = $2`, [orgId, scheduleId]);
      }, orgId);
    const scheduleRow = async (): Promise<ScheduleRowLite> => {
      const rows = (await authed("GET", "/v1/schedules")).json().data as ScheduleRowLite[];
      return rows.find((s) => s.id === scheduleId)!;
    };
    const daysUntil = async (): Promise<number> => {
      const row = await scheduleRow();
      return (new Date(row.next_run_at ?? 0).getTime() - Date.now()) / 86_400_000;
    };

    // Run 1: no completed scheduled scan yet -> scan created, no verdict.
    await dueNow();
    const outcome = await runSchedulerOnce(new Date());
    assert.equal(outcome.created, 1, "due schedule raises a scan");
    const scans1 = (await authed("GET", "/v1/scans?limit=5")).json().data as ScanRowLite[];
    assert.equal(scans1[0]?.schedule_id ?? null, scheduleId, "scan is linked to its schedule");

    // Complete run 1 WITH new findings.
    const s1 = scans1[0];
    await scanQueue.publish({
      scan_id: s1.id, org_id: orgId, kind: "findings",
      parent_asset_id: assetId,
      findings: JSON.stringify([
        { check_id: "tls.legacy_protocol", location: `${domain}:443`, severity: "high", title: "Legacy TLS enabled", category: "tls" },
      ]),
    });
    await scanQueue.publish({ scan_id: s1.id, org_id: orgId, kind: "terminal", status: "completed" });
    for (let i = 0; i < 3; i += 1) await runIngestOnce(scanQueue);

    // Run 2: the previous run had new findings -> cadence unchanged.
    await dueNow();
    await runSchedulerOnce(new Date());
    const days2 = await daysUntil();

    // Complete run 2 with NO findings -> run 3 must stretch the interval.
    const scans2 = (await authed("GET", "/v1/scans?limit=5")).json().data as ScanRowLite[];
    const s2 = scans2.find((s) => s.id !== s1.id && s.status === "completed") ??
      scans2.find((s) => s.id !== s1.id)!;
    await scanQueue.publish({ scan_id: s2.id, org_id: orgId, kind: "terminal", status: "completed" });
    for (let i = 0; i < 3; i += 1) await runIngestOnce(scanQueue);

    await dueNow();
    await runSchedulerOnce(new Date());
    const days3 = await daysUntil();
    assert.ok(days3 > days2 * 1.5, `a quiet run stretches the cadence (${days3.toFixed(2)}d vs ${days2.toFixed(2)}d)`);
    assert.ok(days3 < days2 * 4 + 0.5, `capped at 4x (${days3.toFixed(2)}d vs ${days2.toFixed(2)}d)`);
    assert.ok(days2 > 0.25, `run 2 kept the cron cadence (${days2.toFixed(2)}d)`);
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
