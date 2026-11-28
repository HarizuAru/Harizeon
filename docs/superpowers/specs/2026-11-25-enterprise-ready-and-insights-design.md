# Enterprise Readiness, Legal Defense & Scanner Telemetry Intelligence Design Doc

**Feature Name:** Enterprise Readiness, Legal Shields & Scanner Telemetry Insights  
**Date:** 2026-11-25  
**Author:** Harizeon Core Architecture  
**Status:** Approved  

---

## 1. Problem Statement

To take Harizeon to the commercial market and attract paying SME and enterprise accounts, two operational gaps must be resolved:
1. **Legal & Compliance Defense:** Under the Malaysian *Computer Crimes Act 1997* and enterprise procurement policies, active reconnaissance without explicit authorization is illegal. Harizeon requires a mandatory authorization warranty on scan launch, protected domain guards (blocking government/banking TLDs like `.gov.my`), and a formal Data Processing Addendum (DPA) addressing the Personal Data Protection Act (PDPA 2010).
2. **Scanner Telemetry & Adaptive Speed:** The scanner executes sequentially. When a host is offline, packet-dropped, or firewalled, running heavy webchecks and Nuclei templates wastes minutes and worker resources. Furthermore, the valuable security data collected by the scanner must be synthesized into **Executive Insights & Fleet Telemetry** (Mean Time to Remediate, exposure vector breakdown, and drift velocity).

---

## 2. Technical Architecture

```
+-----------------------------------------------------------------------------------------+
|                                    LEGAL DEFENSE SHIELD                                 |
+-----------------------------------------------------------------------------------------+
  [ User Starts Scan ] ───> Checks "[x] I warrant authorization..." (Required)
         │                                       │
         ▼                                       ▼
  [ API /scans /assets ] ───> Rejects .gov, .gov.my, .mil, .bank without manual review
         │
         ▼
  [ Legal / DPA ] ──────────> Published Data Processing Addendum (§12.6 PDPA 2010)

+-----------------------------------------------------------------------------------------+
|                        SCANNER ADAPTIVE SPEED & FLEET INSIGHTS                          |
+-----------------------------------------------------------------------------------------+
  [ Probe Phase ]
         │
         ├─(100% Ports Closed / Dead Host)──> Fast Bail-out: Skip Inspect, Webchecks, Nuclei
         │                                   (Reduces dead scan time from 5 min to 15s)
         │
         └─(AI Ports 11434/8000 Open)───────> Prioritize AI-Armor Evaluation
                                             (Delivers critical findings immediately)
         ▼
  [ Telemetry Collector & Insights Component ]
         - Posture Trajectory (Security Score Delta over 30 days)
         - Threat Vector Distribution (AI Infrastructure vs Web Headers vs TLS vs Ports)
         - Fleet Scan Duration & Bottleneck Breakdown
```

---

## 3. Detailed Component Specifications

### 3.1. Mandatory Authorization Warranty
* **Component:** `web/src/components/new-scan-form.tsx`
* **Changes:**
  - Add a required checkbox: `[ ] I certify that I own or hold written authorization to scan these assets under the Computer Crimes Act 1997 / applicable law.`
  - Disable the "Start scan" button until the checkbox is checked.
  - Submit `authorized: true` in the scan request payload.

### 3.2. High-Risk / Protected TLD Guard
* **Files:** `api/src/lib/verify.ts`, `api/src/routes/assets.ts`
* **Logic:**
  - Block or require elevated confirmation for assets ending in `.gov`, `.gov.my`, `.mil`, `.police.uk`, `.bank`, `.centralbank`.
  - Returns clear error code `restricted_target`: *"Government, military, and critical infrastructure domains require manual enterprise authorization."*

### 3.3. Enterprise Data Processing Addendum (DPA)
* **File:** `web/src/app/legal/dpa/page.tsx`
* **Contents:**
  - Data Processing Agreement per Malaysian Personal Data Protection Act 2010 (PDPA) & GDPR standards.
  - Data processor vs data controller commitments, data minimization, sub-processor registry, and encryption standards.
  - Linked in footer navigation.

### 3.4. Adaptive Fast-Bailout Scanner Engine
* **File:** `worker/worker.py`
* **Logic:**
  - After `probe` phase completes:
    - If `len(open_ports) == 0` and `web_entries` are unreachable:
      - Log: `"[adaptive] 0 open ports detected on target; skipping heavy web & template checks to optimize worker throughput."`
      - Skip Nuclei, WhatWeb, testssl, and ZAP, completing the scan cleanly in under 20 seconds.
    - If AI ports (`11434`, `8000`, `6333`, `19530`) are detected, flag `ai_priority: true`.

### 3.5. Security Insights & Telemetry Component
* **File:** `web/src/components/security-insights.tsx`
* **Contents:**
  - Metric 1: **Mean Time to Remediate (MTTR)** (Average days to fix critical vs high issues).
  - Metric 2: **Exposure Vector Breakdown** (Distribution of vulnerabilities across AI Infrastructure, TLS, Security Headers, Exposed Services).
  - Metric 3: **Scan Fleet Performance** (Average scan execution time by profile: Quick ~2m, AI-Armor ~30s, Standard ~8m).
  - Metric 4: **Attack Surface Drift** (+New subdomains, -Fixed findings).
* **Integration:** Embedded into `web/src/app/(console)/dashboard/page.tsx`.

---

## 4. Verification Plan
* `npm --prefix web run build`: Verify Next.js compilation across all 40+ pages.
* `npm --prefix web run lint`: Ensure 0 warnings/errors.
* `npm --prefix api test`: Verify API TLD guards and scan service tests (102+ tests passing).
* `py -3 -m pytest worker`: Verify worker adaptive bailout and 150+ worker tests.
