# HARIZEON — client demo runbook

Everything below runs against the **sandbox** target: an intentionally
vulnerable container you own. Nothing in this walkthrough ever touches a host
you do not control.

## 0. One-time setup

- Docker Desktop running
- `.env` copied from `.env.example`, with `DATABASE_URL`, `REDIS_URL`,
  `HARIZEON_MASTER_KEY`, and optionally `HARIZEON_EMAIL_API_KEY` filled in.

## 1. Start the stack (before the meeting)

Terminal 1 — data stores, migrator, scanner, sandbox target:

```powershell
$env:HARIZEON_SANDBOX_HOSTS = "sandbox.test"
docker compose --profile sandbox up -d --build
```

Terminal 2 — control plane on port 8099 (8080 is occupied on dev machines):

```powershell
cd api
$env:PORT = "8099"
npm run dev
```

Terminal 3 — console (this is the link you open for the client):

```powershell
cd web
$env:HARIZEON_API_BASE = "http://localhost:8099"
npm run dev
# then open http://localhost:3000/signup  →  onboarding → dashboard
```

**Console links to use in the meeting** (all on the console origin, http://localhost:3000):

- Signup: http://localhost:3000/signup
- Login: http://localhost:3000/login
- Dashboard: http://localhost:3000/dashboard
- Onboarding: http://localhost:3000/onboarding
- Assets: http://localhost:3000/assets
- Register a domain: http://localhost:3000/assets/new
- Start + watch a scan: http://localhost:3000/scans/new → http://localhost:3000/scans/<scan-id>
- Findings: http://localhost:3000/findings
- Reports: http://localhost:3000/reports
- Schedules: http://localhost:3000/schedules
- Settings: http://localhost:3000/settings
- API: http://localhost:8099/v1/* (docs: http://localhost:3000/docs/api)

Pre-seed the demo tenant and a completed scan (up to ~2 minutes, real worker).
The API container below doubles as the containerized-API alternative to
Terminal 2 — pick one API or the other, never both (both bind 8099):

```powershell
docker commit harizeon-api-test hz-api-img
docker run -d --name hz-demo-api --network harizeon_default -p 8099:8080 `
  -e DATABASE_URL=postgresql://harizeon_app:<pw>@db:5432/harizeon `
  -e REDIS_URL=redis://redis:6379 `
  -e HARIZEON_MASTER_KEY=<32+ chars> `
  -e PORT=8080 hz-api-img sh -c "cd /app && node --import tsx src/server.ts"
docker exec hz-demo-api node scripts/e2e-demo.mjs
# prints: "demo login: <email> / correct-horse-battery-99"
```

## 2. The 5-minute client walkthrough (in order)

1. **Signup** — open http://localhost:3000/signup, create the account. Point
   out the verification email flow.
2. **Register a domain** — Assets → new domain `sandbox.test`. Show the exact
   DNS TXT record the product asks for (§12 gate working as designed).
3. **Run a scan** — start a *Standard* scan on `sandbox.test`. Watch it live:
   verify → discover → probe → inspect → test.
4. **Findings** — show the sandbox's planted issues: exposed `.git`/`.env`,
   public SQL dump, Swagger UI, the unauthenticated Ollama endpoint, and the
   AI key leaked in the bundle (redacted in evidence — point that out, it
   sells trust).
5. **Report** — Reports → the executive report: score, remediation plan
   ordered by severity then exposure age, compliance mapping. Click
   **Print / Save as PDF**.
6. **Alerts** — mention that a new subdomain appearing would email/Slack them
   while they sleep (the schedule + notifier).

## 3. Talk track (the three defensible lines)

- Agentless external attack-surface monitoring.
- No scan without proof of ownership.
- Built in Malaysia, in Ringgit, for companies that can't buy CrowdStrike.

## Troubleshooting

| Symptom | Cause |
|---|---|
| Signup returns 404 HTML | Nothing is listening on the API port (8080 is an unrelated service on dev machines) — use `PORT=8099` |
| `password authentication failed for user "harizeon_app"` | You hit the host's native Postgres on 5432 — point scripts at the container (`@db:5432`) or run inside the API container |
| Scan never leaves `queued` | The worker isn't running (`docker compose up -d worker`), or its `HARIZEON_QUEUE_PREFIX` differs from the API's |
| Scan cancelled with `asset_not_verified` | §12 working correctly — the sandbox allowlist must include the host (`HARIZEON_SANDBOX_HOSTS=sandbox.test`) |
