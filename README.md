# HARIZEON

Security infrastructure, provisioned like cloud. Harizeon is the security
control plane for teams too small to have a security team.

> **Source of truth:** [`harizeon-master-plan.txt`](./harizeon-master-plan.txt).
> This repo implements that plan milestone by milestone (roadmap in §16).

## Status

**W01 — Foundation: done.**

- Repo scaffold + local Postgres 16 / Redis 7 (Docker Compose).
- The §07 data model as migration `db/migrations/0001_init.sql` (enums, tables,
  indexes, `updated_at` triggers, append-only `audit_log`, row-level security).
- The §10 pure black-&-white design system as Tailwind v4 tokens (the default
  colour palette is cleared on purpose).
- An empty console shell — AppShell, Sidebar, TopBar, DataTable, SeverityChip,
  StatusBadge, PageHeader, EmptyState, StatTile — plus `/login` and the seven
  nav routes. Builds and lints clean.

**Next: W06** — probe + inspect (port scan, service fingerprint, TLS, headers)
so scans produce real findings. See §16.

**W05 — Passive discovery: done (real CT + DNS + RDAP, proven live).**

- The worker's discover/resolve phases now do real work: certificate transparency
  (crt.sh) + a DNS wordlist for subdomains, A/AAAA/MX/NS/TXT records for the root,
  and RDAP (registration + registrar). Pure, injected-I/O logic in
  `worker/discovery.py`; network adapters in `worker/adapters.py`.
- Discovered subdomains are auto-created via a new `discovered` worker event,
  **out of scope** (`is_active=false`) and parent-linked to the scanned domain,
  with the source (ct/wordlist) logged. A batch may only add strict subdomains of
  the scanned asset, so a buggy/compromised worker cannot inject arbitrary assets.
- **DISCOVERED tab** on the asset detail page (`GET /v1/assets/:id/discovered`):
  a review queue with Add-to-scope / Ignore (`ignored_at`, migration 0005).
- **Verification inheritance (§9.2 INHERIT):** a subdomain is scannable when an
  ancestor domain is verified — §12 still holds, since proving control of a domain
  proves control of its subdomains; unverified parents are still rejected.
- **Proven:** 17 Python tests; API integration (4 suites) incl. injection
  rejection, parent linkage, review-queue transitions and inheritance; and a real
  containerised worker run against `example.com` that discovered
  `www.example.com` (CT) plus DNS records and RDAP data, auto-created it out of
  scope, and rendered it in the console DISCOVERED tab.

**W04 — Scan job pipeline: done (queue + worker + live view, proven live).**

- **Queue:** Redis Streams (`harizeon:scans:jobs`, consumer group `workers`) behind
  a small `ScanQueue` interface with two adapters — a Redis one for production and
  an in-memory one for tests.
- **State machine (§06.4):** `queued → claimed → running → completed|failed|timeout|cancelled`,
  with `attempt` and max-2 retries; terminal transitions are first-writer-wins (a
  late event cannot resurrect a cancelled scan).
- **Data plane:** an isolated Python worker (`worker/`) with **no database
  credentials** (§06.3) — it reads a job, walks the profile's phases
  (verify…report), heartbeats, honours a cancel flag, and publishes events. It has
  no engines yet, so it reports phases honestly and produces **no findings**.
- **Control plane:** an ingest loop writes `scan_events` + drives `scans`; a reaper
  reclaims scans whose worker stopped heartbeating. Both start from `start()`, not
  `buildServer()`, so tests stay deterministic.
- **API (§08):** `POST /v1/scans` (verified assets only — §12), `GET /v1/scans`,
  `GET /v1/scans/{id}` (with its event log), `GET /v1/scans/{id}/events` (SSE,
  resumable with `?since=<seq>`), `POST /v1/scans/{id}/cancel`.
- **Console:** `/scans`, `/scans/new`, `/scans/{id}` live view (phase rail + streaming
  event log) via a same-origin SSE proxy (`web/src/app/api/scans/[id]/events`).
- **Proven:** api 46 unit tests + 3 integration suites on live Postgres **and Redis**
  (auth, assets, scan pipeline incl. cancel/first-writer-wins/reaper escalation);
  8 Python worker unit tests; and a real containerised worker driving an
  API-created scan to `completed` (9 events) with the SSE stream and console live
  page verified over HTTP.

**W03 — Assets + ownership verification: done (API + console, proven live).**

- Asset registry (§07 `assets`): CRUD with normalised values (hostnames lower-
  cased, URLs canonicalised), criticality/tags, soft delete, cursor pagination.
- **Ownership gate (§12, non-negotiable):** DNS `TXT` (`_harizeon-verify.<domain>`
  = `harizeon-site-verification=<token>`) or an HTTP file at
  `/.well-known/harizeon-verification.txt`; the check is pollable and stays
  `pending` until proven. Creation and scanning of unverified assets is blocked.
  **IP assets are not auto-verifiable** (§12.2): authorizing an IP needs reverse
  DNS + a signed form and a human, so automated verification of an `ip` asset is
  rejected (`verification_manual_review_required`).
- `asset_verifications` lifecycle (pending/verified/failed/revoked) plus an hourly
  re-verification pass (`api/src/lib/recheck.ts` + `0003_recheck.sql`): a lost
  proof auto-revokes ownership and writes to `audit_log`.
- SSRF guard (`isPublicHost`) so the control plane never fetches private/
  loopback/link-local/metadata targets while verifying (relaxable only via
  `VERIFY_ALLOW_PRIVATE`, for dev/tests, never in production).
- Console wired to the API: `/login`, `/signup`, `/assets`, `/assets/new`,
  `/assets/{id}`, `/assets/{id}/verify` via server-side `apiFetch` (forwards the
  `hz_session` cookie), server actions, and an auth gate in the console layout.
  The assets list has the §9.2 filter bar (search / type / criticality /
  verified), a Verified column, and cursor pagination.
- **Proven:** `api/test/assets.test.ts` (CRUD + pagination + RLS isolation + HTTP
  verification via a local server + recheck revoke) green against Postgres 16 as
  the RLS-restricted app role; 33 unit tests; and the console flow rendered live
  across the Next → API → DB path (filter bar, `type`/`q` filtering, and the IP
  manual-review notice all confirmed via HTTP).

**W02 — IAM: done (control-plane API + proven auth flow).**

- Fastify API (`api/`) implementing the §08 auth/org/api-key surface: signup
  (user + org + owner membership + default project), login/logout with opaque
  DB-backed sessions, email verification + password reset via single-use hashed
  tokens, API keys (`hrz_live_…`, hash at rest, shown once), and `audit_log`
  writes on every mutation.
- Auth connects as the non-owner `harizeon_app` role and sets the
  `harizeon.org_id` GUC per request; pre-auth lookups (session/API-key/org
  resolution) go through `SECURITY DEFINER` functions. Proven by
  `api/test/integration.test.ts`: signup → login → authed reads → API-key
  auth, all green against real Postgres 16 under forced RLS, plus
  `db/verify.sql` (cross-tenant isolation + append-only audit assertions).
- Passwords are Argon2id (12-char minimum); session cookies are HttpOnly,
  Secure (in production), SameSite=Lax.
- Email delivery is a dev-logging stub until the W09 notifier lands.

## Stack (§15)

- **Web/console:** Next.js 16 (App Router) + TypeScript (strict) + Tailwind v4.
- **Data:** PostgreSQL 16 (row-level security) + Redis 7.
- **API:** Node/TypeScript (Fastify) — `api/`, control plane for §08 endpoints.
- **Workers (data plane):** Python, isolated (queue + job payload only) — `worker/`.
- **Queue:** Redis Streams (`harizeon:scans:jobs` / `:events`).

## Layout

```
db/migrations/     SQL schema, applied in filename order by db/migrate.sh
db/verify.sql        Security invariants self-check (RLS isolation, append-only)
docker-compose.yml Postgres + Redis + one-shot migrator
api/               Fastify control-plane API (auth, orgs, api-keys, assets, scans)
worker/            Python data-plane worker (queue consumer + discovery; no DB creds)
infra/db/          App-role provisioning (non-owner role + RLS grants)
web/               Next.js console (marketing site arrives in W12)
docs/              legal drafts + scanner engine licence audit
.github/workflows/ CI: web build/lint, migration apply, dependency scan
```

## Run locally

```sh
cp .env.example .env
docker compose up -d          # starts Postgres + Redis and applies migrations
# API (control plane) — connects as the RLS app role:
cd api && npm install
DATABASE_URL=postgresql://harizeon_app:<pw>@localhost:5432/harizeon npm start
# Console:
cp web/.env.example web/.env.local   # HARIZEON_API_BASE (default http://localhost:8080)
cd web && npm install && npm run dev   # http://localhost:3000  (/login, /signup, /assets)
```

The app role is provisioned once after migrations:
`DATABASE_URL=postgresql://harizeon:harizeon@localhost:5432/harizeon HARIZEON_APP_PASSWORD='<strong secret>' sh infra/db/create-app-role.sh`.

Migrations are idempotent. To apply them without Docker:
`DATABASE_URL=postgresql://... sh db/migrate.sh`.

Windows note: if a local PostgreSQL (e.g. the EDB installer service) already
holds port 5432, host-side tools will reach IT instead of the container — the
symptom is `password authentication failed` with correct credentials. Either
stop the local service, or remap once:
`POSTGRES_PORT=5433 REDIS_PORT=6380 docker compose up -d`
(then point host-side `DATABASE_URL` at `localhost:5433`). Container-to-container
traffic always uses the internal ports and is unaffected.

## Verify

- Web build (typegen + typecheck + Turbopack): `cd web && npm run build`
- Web lint: `cd web && npm run lint`
- Console end-to-end: with the API up, `curl -H "Cookie: hz_session=<token>" localhost:3000/assets`
  renders assets fetched from the API/DB (and unauthenticated `/dashboard` lands on `/login`).
- Schema: CI applies every migration against a real Postgres 16 service and
  asserts the append-only guard.
- API typecheck/lint/unit: `cd api && npm run typecheck && npm run lint && npm test`
- Worker unit tests: `cd worker && python -m unittest -v test_worker discovery_test`
- API integration (needs the stack up + app role): `cd api && npm run test:integration`
  with `DATABASE_URL` pointing at the `harizeon_app` role and `REDIS_URL` set;
  `db/verify.sql` asserts RLS tenant isolation and the append-only audit guard.
- Live scan: `docker compose up -d --build` (db + redis + worker), run the API,
  create a scan, and watch it through the console or
  `curl -N "…/v1/scans/<id>/events"`.

## Non-negotiables

- **No scanning without cryptographic ownership verification (§12).** There is
  no bypass flag and there never will be.
- **Pure black & white UI (§10).** Severity is encoded with the `[!!!] [!!] [!]
  [-] [i]` markers, type weight, and borders — never colour.
- **Legal review before public launch (§12.3).** Nothing in this repo is legal
  advice.
