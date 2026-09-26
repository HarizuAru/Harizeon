/**
 * End-to-end demo against a RUNNING api + worker (not the test harness).
 *
 *   API_BASE=http://harizeon-api-live:8080 \
 *   DATABASE_URL=postgresql://harizeon_app:<pw>@db:5432/harizeon \
 *   DOMAIN=sandbox \
 *   node scripts/e2e-demo.mjs
 *
 * Creates an account, a verified asset (DB fixture), a scan, then waits for the
 * real worker to finish and prints the discovery result. Useful for a manual
 * "watch it work" pass and for smoke-testing a deploy.
 *
 * Defaults to DOMAIN=sandbox.test, the intentionally-vulnerable target started
 * with `docker compose --profile sandbox up -d` and allowlisted in the worker
 * via HARIZEON_SANDBOX_HOSTS=sandbox.test. The DB verification fixture is a
 * demo-only shortcut: it fabricates ownership, which is safe *only* because the
 * target is our own allowlisted container. Never point this at a host you do
 * not own.
 */
import { Pool } from "pg";

const API = process.env.API_BASE ?? "http://localhost:8080";
const DATABASE_URL = process.env.DATABASE_URL;
const DOMAIN = process.env.DOMAIN ?? "sandbox.test";
const TERMINAL = ["completed", "failed", "timeout", "cancelled"];

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function post(path, body, cookie) {
  const res = await fetch(API + path, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${JSON.stringify(json)}`);
  return { json, res };
}

async function get(path, cookie) {
  const res = await fetch(API + path, { headers: cookie ? { cookie } : {} });
  return res.json();
}

async function main() {
  const stamp = Date.now();
  const email = `e2e${stamp}@example.com`;
  const password = "correct-horse-battery-99";

  await post("/v1/auth/signup", {
    email,
    password,
    name: "E2E",
    orgName: "E2E Org",
    orgSlug: `e2e-${stamp}`,
  });

  const login = await post("/v1/auth/login", { email, password });
  const cookie = login.res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  const orgId = login.json.org.id;

  const asset = (await post("/v1/assets", { type: "domain", value: DOMAIN }, cookie)).json.asset;
  console.log(`asset: ${asset.value} (${asset.id.slice(0, 8)})`);
  // Deterministic demo credentials so the meeting can log in as this tenant.
  console.log(`demo login: ${EMAIL} / ${password}`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('harizeon.org_id', $1, true)", [orgId]);
    await client.query(
      `INSERT INTO asset_verifications (org_id, asset_id, method, token, status, verified_at, last_checked_at)
       VALUES ($1,$2,'dns_txt','e2e','verified', now(), now())`,
      [orgId, asset.id],
    );
    await client.query("COMMIT");
  } finally {
    client.release();
  }

  const scan = (await post("/v1/scans", { asset_ids: [asset.id], profile: "standard" }, cookie)).json.scan;
  console.log(`scan: ${scan.id} (${scan.status})`);

  for (let i = 0; i < 60; i += 1) {
    await new Promise((r) => setTimeout(r, 2000));
    const detail = await get(`/v1/scans/${scan.id}`, cookie);
    if (TERMINAL.includes(detail.scan.status)) {
      console.log(`\nstatus: ${detail.scan.status} (${detail.scan.progress_pct}%)`);
      for (const e of detail.events) console.log(`  [${e.phase ?? "-"}] ${e.message}`);
      const discovered = await get(`/v1/assets/${asset.id}/discovered`, cookie);
      console.log(`\ndiscovered (review queue): ${discovered.data.length}`);
      for (const d of discovered.data) console.log(`  ${d.fqdn} (active=${d.is_active})`);
      await pool.end();
      return;
    }
  }
  console.log("timed out waiting for the scan");
  await pool.end();
  process.exit(1);
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
