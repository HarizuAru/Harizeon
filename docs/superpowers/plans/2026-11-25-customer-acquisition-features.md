# Customer-Acquisition Superpowers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 3 highest-impact features for SME/startup customer acquisition: Executive Compliance PDF Report Generator (`ADT`), Actionable Copy-Paste Remediation Snippets, and Slack/Discord Recurring Alerting.

**Architecture:** Pure black-and-white Next.js 16 console with printable CSS styling, modular interactive remediation engine components with tabbed command blocks, and automated channel status visibility for recurring schedules.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4 (pure B&W §10), Fastify API backend.

**Spec:** `docs/superpowers/specs/2026-11-25-customer-acquisition-features-design.md`

## Global Constraints
- **Pure Black & White (§10):** No arbitrary colors; encode severities and status using typography, monospace data, borders, and `SeverityChip`.
- **Strict TypeScript & ESLint:** `npm --prefix web run build` and `npm --prefix web run lint` must pass with zero errors.
- **Zero-Friction UX:** All snippets must be 1-click copyable; print layouts must format cleanly to multi-page PDF via standard browser print.

## Review Focus
1. Print CSS breaking layout: Ensure `@media print` eliminates UI controls, keeps headers intact, and cleanly paginates sections.
2. Missing finding remediation: Fallback cleanly to generic security recommendations when specific categories have no snippet.
3. Webhook URL format validation: Catch malformed Slack/Discord URLs on the client before submission.
4. Scan report generation: Ensure clicking "Generate Audit Report" from scan details correctly triggers API generation and routes to `/reports/[id]`.
5. Mobile & small screen responsiveness: Ensure tabs and code blocks do not overflow viewport.

---

### Task 1: Actionable Remediation Snippets Component

**Files:**
- Create: `web/src/components/remediation-snippets.tsx`
- Modify: `web/src/app/(console)/findings/[id]/page.tsx`

- [x] **Step 1.1**: Build `web/src/components/remediation-snippets.tsx` with dynamic snippet generation for UFW/iptables, Docker, Web Server (Nginx), and Secrets/Tokens, with 1-click clipboard copy.
- [x] **Step 1.2**: Integrate `RemediationSnippets` into `web/src/app/(console)/findings/[id]/page.tsx` replacing plain text with rich tabbed snippets.
- [x] **Step 1.3**: Validate type-checking and component rendering.

---

### Task 2: Executive Compliance PDF Generator (`ADT`) & Scan Integration

**Files:**
- Modify: `web/src/components/report-document.tsx`
- Create: `web/src/components/scan-report-button.tsx`
- Modify: `web/src/app/(console)/scans/[id]/page.tsx`

- [x] **Step 2.1**: Upgrade `web/src/components/report-document.tsx` with publication-grade print styles: Letter Grade Badge (A-F), formal Auditor Header, Executive Sign-Off signature block, and `@media print` page breaks.
- [x] **Step 2.2**: Create `web/src/components/scan-report-button.tsx` allowing 1-click generation of an executive report directly from any scan.
- [x] **Step 2.3**: Embed `ScanReportButton` into `web/src/app/(console)/scans/[id]/page.tsx`.
- [x] **Step 2.4**: Verify print formatting and report generation flow.

---

### Task 3: Slack & Discord Webhook Presets & Recurring Alerts Visibility

**Files:**
- Modify: `web/src/components/notifications-manager.tsx`
- Modify: `web/src/app/(console)/schedules/page.tsx`

- [x] **Step 3.1**: Enhance `web/src/components/notifications-manager.tsx` with 1-click Slack and Discord channel presets, helper guides, and instant test alert feedback.
- [x] **Step 3.2**: Update `web/src/app/(console)/schedules/page.tsx` to display active notification channel routing so users can confirm their automated scans are connected to alerts.
- [x] **Step 3.3**: Validate channel creation, testing, and schedule overview.

---

### Task 4: End-to-End Build & Lint Verification

- [x] **Step 4.1**: Run `npm --prefix web run build` to verify Next.js Turbopack compilation across all 39+ pages.
- [x] **Step 4.2**: Run `npm --prefix web run lint` to verify zero ESLint errors or warnings.
- [x] **Step 4.3**: Run `npm --prefix api test` to ensure existing API tests remain 100% passing.
