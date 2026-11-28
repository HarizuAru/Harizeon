# HARIZEON

**Security infrastructure, provisioned like cloud.**  
Harizeon is an External Attack Surface Management (EASM) and **AI-Armor (AIA)** security control plane for teams without a dedicated security department.

---

## Key Capabilities

- **Ownership-Gated Scanning (Non-Negotiable):** Domains must prove control via DNS `TXT` (`_harizeon-verify.<domain>`) or HTTP file (`/.well-known/harizeon-verification.txt`) before any active scan runs, with periodic re-verification and automatic revocation on lost proof.
- **Multi-Engine Isolated Data Plane (`worker/`):** Runs `subfinder`, `dnsx`, `httpx`, `tlsx`, `nuclei`, and Harizeon's **AI-Armor** / remote **MCP** exposure checks in a read-only, capability-dropped (`cap_drop: ALL`) container with **zero database credentials** and strict SSRF public-IP enforcement.
- **Security & Multi-Tenant Isolation (`api/` + `db/`):**
  - PostgreSQL 16 with `FORCE ROW LEVEL SECURITY`, `AS RESTRICTIVE` tenant policies, and the non-owner `harizeon_app` role.
  - Redis 7 least-privilege ACLs separating `harizeon_api` and `harizeon_worker` streams (`harizeon:scans:jobs` / `harizeon:scans:events`) and `rl:*` atomic rate limiting.
  - Argon2id passwords, DB-backed sessions, TOTP MFA (`POST /v1/auth/mfa/*` + org-level `enforce_mfa`), RBAC role & API key scope enforcement, and Next.js 16 per-request nonce CSP (`web/src/proxy.ts`).
  - Automated worker secret redaction (API keys, GitHub PATs, Slack tokens, JWTs, PEM private keys, credentialed URIs).
- **Compliance, Drift & Governance:**
  - Findings mapped to **PDPA 2024 (Act 709)**, **NACSA NCII (Act 854 / P.U.(A) 220)**, **OWASP Top 10 for LLMs**, and **ISO/IEC 42001**, with CISA KEV risk weighting.
  - Perimeter drift detection, recurring cron schedules, HMAC-signed webhooks, org data export (`POST /v1/org/export`), cascade org deletion (`DELETE /v1/org`), and automated retention purge (`api/src/workers/retention.ts`).
  - Public trust pages (`/trust/[slug]`), embeddable posture badges (`/api/badge/[domain]`), and an in-console Documentation & Status experience.

---

## Architecture & Stack

- **Web / Console (`web/`):** Next.js 16 (App Router, React 19, TypeScript strict, Tailwind CSS v4)
- **Control Plane (`api/`):** Fastify (Node 22, TypeScript strict, Zod validation, `withTx` RLS context)
- **Data Plane (`worker/`):** Python 3.12 + ProjectDiscovery Go binaries (`subfinder`, `dnsx`, `httpx`, `tlsx`, `nuclei`)
- **Storage & Broker:** PostgreSQL 16 (`db/migrations/0001`–`0017`) + Redis 7 (`infra/redis/`)
- **TLS Proxy:** Caddy 2 (`infra/proxy/Caddyfile`)

```text
api/                  Fastify control-plane API, scheduler, reaper, retention purge
worker/               Isolated Python/Go scan worker (Redis Streams only; no DB access)
web/                  Next.js 16 console, marketing site, docs, and public trust pages
db/migrations/        Idempotent PostgreSQL 16 schema + RLS migrations
infra/redis/          Redis 7 ACL template (users.acl.example -> users.acl)
infra/db/             Non-owner harizeon_app role provisioning
infra/proxy/          Caddyfile for automatic Let's Encrypt TLS
docker-compose.yml    Full isolated stack (control_internal, worker_bus, public_egress)
```

---

## Quick Start (Docker Compose)

1. **Create environment and Redis ACL files:**

   ```sh
   cp .env.example .env
   cp infra/redis/users.acl.example infra/redis/users.acl
   ```

   Populate required secrets in `.env`:
   - `HARIZEON_MASTER_KEY` (32+ char hex/random key)
   - `HARIZEON_APP_PASSWORD`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
   - `REDIS_API_PASSWORD` and `REDIS_WORKER_PASSWORD` (must match the passwords you place in `infra/redis/users.acl`; keep `users.acl` free of `#` comments and blank lines for Redis 7)

2. **Build and start the full stack:**

   ```sh
   docker compose up -d --build
   ```

   This starts PostgreSQL 16, Redis 7 (with ACLs), applies all migrations (`0001`–`0017`) and provisions `harizeon_app`, then starts `worker`, `api`, `web`, and `caddy`.

3. **Open the console:**
   - Web & Console: `http://localhost:3000`
   - Sign up at `/signup`, add a domain you own, complete DNS `TXT` or `/.well-known/harizeon-verification.txt` verification, and launch a scan.

> **Demo mode:** `HARIZEON_DEMO_MODE` is strictly opt-in (`HARIZEON_DEMO_MODE=1`) and disabled by default so production never falls back to mock data.

---

## Verification & Test Suites

```sh
# API: typecheck, lint, and unit/contract tests
cd api && npm run typecheck && npm run lint && npm test

# Worker: security gates, redaction, discovery, probe, and v1.1 tests
cd worker && pytest

# Web: typecheck, lint, and production build
cd web && npm run typecheck && npm run lint && npm run build
```
