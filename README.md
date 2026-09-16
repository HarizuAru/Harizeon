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

**Next: W02 — IAM** (signup/login, email verification, password reset, sessions,
orgs, API keys with hashed secrets, audit log on every mutation). See §16.

## Stack (§15)

- **Web/console:** Next.js 16 (App Router) + TypeScript (strict) + Tailwind v4.
- **Data:** PostgreSQL 16 (row-level security) + Redis 7.
- **API:** Node/TypeScript (Fastify) — lands in W02.
- **Workers (data plane):** Python, isolated — lands in W04.
- **Queue:** Redis Streams — W04.

## Layout

```
db/migrations/     SQL schema, applied in filename order by db/migrate.sh
docker-compose.yml Postgres + Redis + one-shot migrator
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

## Verify

- Web build (typegen + typecheck + Turbopack): `cd web && npm run build`
- Web lint: `cd web && npm run lint`
- Schema: CI applies every migration against a real Postgres 16 service and
  asserts the append-only guard.

## Non-negotiables

- **No scanning without cryptographic ownership verification (§12).** There is
  no bypass flag and there never will be.
- **Pure black & white UI (§10).** Severity is encoded with the `[!!!] [!!] [!]
  [-] [i]` markers, type weight, and borders — never colour.
- **Legal review before public launch (§12.3).** Nothing in this repo is legal
  advice.
