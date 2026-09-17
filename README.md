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

**Next: W02 tail + W03** — wire console login/signup to the API, then assets +
ownership verification (the non-negotiable gate). See §16.

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
- Email delivery is a dev-logging stub until the W09 notifier lands; the
  console login/signup wiring to the API is the remaining W02 tail.

## Stack (§15)

- **Web/console:** Next.js 16 (App Router) + TypeScript (strict) + Tailwind v4.
- **Data:** PostgreSQL 16 (row-level security) + Redis 7.
- **API:** Node/TypeScript (Fastify) — `api/`, control plane for §08 endpoints.
- **Workers (data plane):** Python, isolated — lands in W04.
- **Queue:** Redis Streams — W04.

## Layout

```
db/migrations/     SQL schema, applied in filename order by db/migrate.sh
db/verify.sql        Security invariants self-check (RLS isolation, append-only)
docker-compose.yml Postgres + Redis + one-shot migrator
api/               Fastify control-plane API (auth, orgs, api-keys)
infra/db/          App-role provisioning (non-owner role + RLS grants)
web/               Next.js console (marketing site arrives in W12)
docs/              legal drafts + scanner engine licence audit
.github/workflows/ CI: web build/lint, migration apply, dependency scan
```

## Run locally

```sh
cp .env.example .env
docker compose up -d          # starts Postgres + Redis and applies migrations
cd web && npm install && npm run dev   # http://localhost:3000  (/login, /dashboard)
```

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
- Schema: CI applies every migration against a real Postgres 16 service and
  asserts the append-only guard.
- API typecheck/lint/unit: `cd api && npm run typecheck && npm run lint && npm test`
- API integration (needs the stack up + app role): `cd api && npm run test:integration`
  with `DATABASE_URL` pointing at the `harizeon_app` role; `db/verify.sql`
  asserts RLS tenant isolation and the append-only audit guard.

## Non-negotiables

- **No scanning without cryptographic ownership verification (§12).** There is
  no bypass flag and there never will be.
- **Pure black & white UI (§10).** Severity is encoded with the `[!!!] [!!] [!]
  [-] [i]` markers, type weight, and borders — never colour.
- **Legal review before public launch (§12.3).** Nothing in this repo is legal
  advice.
