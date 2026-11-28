# Enterprise Readiness, Legal Defense & Scanner Telemetry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement legal compliance shields (authorization warranty, government TLD blocklist, enterprise DPA) and scanner data intelligence (adaptive fast bailout and security telemetry insights).

**Architecture:** Client-side & server-side legal gatekeeping, worker-level adaptive dead-host bailout, and unified dashboard intelligence synthesizing vulnerability and performance telemetry.

**Tech Stack:** Next.js 16, TypeScript, Fastify API, Python 3.12 scanner worker, Tailwind CSS v4 (§10 B&W).

**Spec:** `docs/superpowers/specs/2026-11-25-enterprise-ready-and-insights-design.md`

## Global Constraints
- **Pure Black & White (§10):** No arbitrary colors; severity and posture encoded via typography, borders, and `SeverityChip`.
- **Zero Bypass of Asset Verification (§12):** Strict authorization warranty and TLD restrictions.
- **Strict Lint & Test Compliance:** Zero ESLint errors, zero TypeScript errors, 100% test pass rate.

## Review Focus
1. Authorization checkbox state: Ensure scan cannot be submitted without actively checking the legal warranty.
2. TLD guard regex: Accurately catch `.gov`, `.gov.my`, `.mil`, `.bank`, `.centralbank` while permitting valid company domains.
3. Fast bailout boundary: Ensure active scans with real open ports are never prematurely aborted.
4. Telemetry math: Handle zero-finding and zero-scan edge cases gracefully without NaN or division-by-zero errors.
5. Responsive design: Verify insights metrics grid stacks cleanly on mobile screens.

---

### Task 1: Legal Shields & Authorization Warranty

**Files:**
- Modify: `web/src/components/new-scan-form.tsx`
- Modify: `api/src/lib/verify.ts`
- Modify: `api/src/routes/assets.ts`
- Create: `web/src/app/legal/dpa/page.tsx`
- Modify: `web/src/components/public-footer.tsx`

- [x] **Step 1.1**: Add mandatory legal authorization warranty checkbox to `web/src/components/new-scan-form.tsx`.
- [x] **Step 1.2**: Implement `isRestrictedTld` in `api/src/lib/verify.ts` and guard in `api/src/routes/assets.ts`.
- [x] **Step 1.3**: Add unit test for restricted TLD guard in `api/src/lib/verify.test.ts`.
- [x] **Step 1.4**: Create Enterprise Data Processing Addendum page `web/src/app/legal/dpa/page.tsx` and link in footer.

---

### Task 2: Adaptive Fast-Bailout in Scanner Worker

**Files:**
- Modify: `worker/worker.py`
- Test: `worker/test_worker.py`

- [x] **Step 2.1**: Implement adaptive probe check in `worker/worker.py` to detect dead/closed hosts and fast-bail out of heavy web/template phases.
- [x] **Step 2.2**: Add test in `worker/test_worker.py` verifying fast-bailout behavior when probe returns 0 open ports.
- [x] **Step 2.3**: Verify worker test suite with `py -3 -m pytest worker`.

---

### Task 3: Security Insights & Telemetry Dashboard Component

**Files:**
- Create: `web/src/components/security-insights.tsx`
- Modify: `web/src/app/(console)/dashboard/page.tsx`

- [x] **Step 3.1**: Create `web/src/components/security-insights.tsx` computing Mean Time to Remediate (MTTR), threat vector distribution, and scanner fleet efficiency.
- [x] **Step 3.2**: Embed `SecurityInsights` into `web/src/app/(console)/dashboard/page.tsx`.
- [x] **Step 3.3**: Verify responsive rendering and typography.

---

### Task 4: End-to-End Build & Test Verification

- [x] **Step 4.1**: Run `npm --prefix api test` to verify API tests with TLD guard.
- [x] **Step 4.2**: Run `py -3 -m pytest worker` to verify worker tests.
- [x] **Step 4.3**: Run `npm --prefix web run build` to verify Next.js compilation across all routes.
- [x] **Step 4.4**: Run `npm --prefix web run lint` to verify zero ESLint errors.
