// Dependency-free load test: closed-loop workers hitting the real API.
//
//   node scripts/loadtest.mjs [baseUrl] [concurrency] [seconds]
//   e.g. node scripts/loadtest.mjs http://localhost:8080 50 15
//
// Signs up a throwaway org (or logs in), then measures three paths that matter:
// health (baseline), login (argon2 + DB), and an authenticated read (pool + RLS).

import { performance } from "node:perf_hooks";

const BASE = (process.argv[2] ?? "http://localhost:8080").replace(/\/+$/, "");
const CONCURRENCY = Number(process.argv[3] ?? 25);
const SECONDS = Number(process.argv[4] ?? 10);

const stamp = Date.now();
const EMAIL = process.env.LOADTEST_EMAIL ?? `loadtest-${stamp}@harizeon.test`;
const PASSWORD = process.env.LOADTEST_PASSWORD ?? "loadtest-password-1234";

async function post(path, body, cookie) {
  return fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  });
}

async function ensureUser() {
  await post("/v1/auth/signup", {
    email: EMAIL,
    password: PASSWORD,
    orgName: "Load Test",
    orgSlug: `loadtest-${stamp}`,
  }).catch(() => {});
  const res = await post("/v1/auth/login", { email: EMAIL, password: PASSWORD });
  if (!res.ok) throw new Error(`login failed: HTTP ${res.status}`);
  const raw = res.headers.get("set-cookie") ?? "";
  const cookie = raw.split(";")[0];
  if (!cookie.startsWith("hz_session=")) throw new Error("no session cookie issued");
  return cookie;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

async function scenario(name, fn) {
  const latencies = [];
  let errors = 0;
  let non2xx = 0;
  const deadline = Date.now() + SECONDS * 1000;

  async function worker() {
    while (Date.now() < deadline) {
      const t0 = performance.now();
      try {
        const res = await fn();
        if (res.status >= 400) non2xx++;
      } catch {
        errors++;
      }
      latencies.push(performance.now() - t0);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  latencies.sort((a, b) => a - b);
  const rps = latencies.length / SECONDS;
  console.log(
    `${name.padEnd(10)} reqs=${String(latencies.length).padEnd(6)} rps=${rps.toFixed(0).padEnd(6)} ` +
      `p50=${percentile(latencies, 50).toFixed(1)}ms p95=${percentile(latencies, 95).toFixed(1)}ms ` +
      `p99=${percentile(latencies, 99).toFixed(1)}ms max=${latencies[latencies.length - 1]?.toFixed(1) ?? 0}ms ` +
      `non2xx=${non2xx} errors=${errors}`,
  );
}

const cookie = await ensureUser();
console.log(`target=${BASE} concurrency=${CONCURRENCY} seconds=${SECONDS} user=${EMAIL}\n`);

await scenario("health", () => fetch(`${BASE}/health`));
await scenario("assets", () => fetch(`${BASE}/v1/assets?limit=50`, { headers: { Cookie: cookie } }));
await scenario("login", () => post("/v1/auth/login", { email: EMAIL, password: PASSWORD }));
