# Harizeon Customer-Acquisition Superpowers Design Doc

**Feature Name:** Customer Acquisition & Retention Superpowers (ADT Executive PDF, Actionable Fix Snippets, Slack/Discord Recurring Alerts)  
**Date:** 2026-11-25  
**Author:** Harizeon Core Architecture  
**Status:** Approved  

---

## 1. Executive Summary & Problem Statement

Harizeon's primary ICP is the **lone technical lead / de-facto CTO at a 3–25 person SME or startup**. They do not have a dedicated security operations team. When enterprise clients or auditors ask for proof of security (Vendor Risk Assessment questionnaires, PDPA, ISO 27001), founders face three immediate friction points:
1. **Auditor Deliverable Gap:** The console displays live findings, but procurement and compliance officers demand a formal, downloadable, publication-grade **Executive Security Audit PDF** with a letter grade, scope, methodology, and control mapping.
2. **Remediation Friction:** Findings explain *what* is wrong, but a stressed developer needs the exact **copy-paste commands** (UFW, Docker compose, Nginx headers, API token rotation) to fix it in 30 seconds.
3. **Set-and-Forget Automation:** Founders forget to check dashboards. They require automated recurring weekly scans connected directly to **Slack or Discord** alerts when high or critical issues arise.

---

## 2. Architectural Blueprint

```
+-----------------------------------------------------------------------------------------+
|                                HARIZEON CONSOLE ARCHITECTURE                            |
+-----------------------------------------------------------------------------------------+

   [ Scans Detail ] ──(1-Click "Generate Audit Report")──> [ POST /api/v1/reports ]
          │                                                               │
          ▼                                                               ▼
   [ Scan Finished ]                                             [ Report Generated ]
          │                                                               │
          ▼                                                               ▼
   [ Trigger Slack/Discord ]                                     [ ReportDocument ]
   (Services / Notify)                                            - Letter Grade (A-F)
          │                                                       - PDPA / ISO / OWASP
          ▼                                                       - Executive Sign-Off
   #dev-alerts Channel                                            - Print/Save as PDF
   (High/Critical Pings)
                                                                 [ Finding Detail ]
                                                                        │
                                                                        ▼
                                                          [ RemediationSnippets ]
                                                          - UFW / iptables
                                                          - Docker Compose
                                                          - Nginx Headers
                                                          - Token Rotation
```

---

## 3. Detailed Component Specifications

### 3.1. Executive Compliance PDF Generator (`ADT`)
* **Component:** `web/src/components/report-document.tsx`
* **Enhancements:**
  1. **Print Formatting Rules:** Add dedicated `@media print` CSS utility classes:
     - Clear navigation bars and interactive buttons on print (`print:hidden`).
     - Force page breaks between executive summary, compliance matrix, and technical remediation (`break-before-page`, `break-inside-avoid`).
     - Clean black-and-white print styling ensuring high contrast and sharp monospace borders (§10).
  2. **Formal Certification Header & Letter Grade:**
     - Posture Grade Badge (Grade A: 90-100, Grade B: 75-89, Grade C: 50-74, Grade F: <50).
     - Cryptographic verification signature hash and verification timestamp.
  3. **Executive Sign-off Block:**
     - Auditor declaration and customer acceptance fields for vendor security reviews.
  4. **Scan Detail Integration:**
     - Add a "Generate Audit Report" action button directly in `web/src/app/(console)/scans/[id]/page.tsx` allowing 1-click creation of a report scoped to that scan's asset.

### 3.2. Actionable Remediation Snippets
* **Component:** `web/src/components/remediation-snippets.tsx`
* **Features:**
  1. **Dynamic Engine:** Detects finding type (e.g. exposed port, Ollama/vLLM AI endpoint, missing security header, leaked token, exposed sensitive file).
  2. **Multi-Tab Code Blocks:**
     - **Firewall (UFW / iptables):** e.g. `sudo ufw deny <port>/tcp`.
     - **Docker / Containers:** e.g. binding `127.0.0.1:<port>:<port>` in `docker-compose.yml`.
     - **Web Server (Nginx / Cloudflare):** e.g. strict `add_header` configurations for CSP, HSTS, and Frame options.
     - **Secrets & Remediation:** e.g. revoking compromised credentials and updating `.env`.
  3. **1-Click Copy:** Instant clipboard copy with visual "COPIED" acknowledgment.
  4. **Integration:** Embedded seamlessly into `web/src/app/(console)/findings/[id]/page.tsx` under "How to fix".

### 3.3. Slack & Discord Webhook Recurring Alerting
* **Component:** `web/src/components/notifications-manager.tsx` & `web/src/app/(console)/schedules/page.tsx`
* **Features:**
  1. **1-Click Presets:**
     - Pre-configured setup for Slack Incoming Webhooks (`https://hooks.slack.com/...`) and Discord Webhooks (`https://discord.com/api/webhooks/...`).
     - Guided copy explaining where to get the webhook URL in 30 seconds.
  2. **Instant Test Verification:**
     - One-click "Test Ping" button that triggers `POST /api/v1/channels/:id/test` and displays live delivery status.
  3. **Schedule & Scan Visibility:**
     - Displays active notification channels on the Schedules overview page so users have confidence their automated scans will alert the right team channel on high/critical findings.

---

## 4. Verification & Testing Strategy
* **Web UI Testing:**
  - `npm --prefix web run build` (Turbopack typecheck and page compilation).
  - `npm --prefix web run lint` (ESLint flat config, 0 warnings/errors).
* **API Testing:**
  - `npm --prefix api test` (102/102 test suite verifying channel creation, delivery, and report generation).
* **Worker Testing:**
  - `pytest worker` (141/141 worker tests passing).
