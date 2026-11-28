# HARIZEON — Master Platform & Execution Plan
**Security infrastructure, provisioned like cloud.**  
*Version 1.1 Production Milestone — Founder & Engineering Blueprint*

---

## 1. Executive Thesis & Vision

### 1.1 The Market Bet
Amazon Web Services (AWS) won the cloud computing era by transforming capital expenditure and physical procurement into an instantaneous API call (`RunInstances`). 

Cybersecurity for growing teams remains stuck in 2004: 6-figure enterprise minimums, multi-week sales friction, manual penetration testing, and opaque annual contracts. Lean development teams (3–25 engineers) across Southeast Asia and globally have three poor options: enterprise suites they cannot afford (CrowdStrike, Qualys), raw open-source tools they cannot operate, or spreadsheet-driven inaction.

**Harizeon's Core Bet:**  
Package enterprise-grade external attack surface management (EASM), continuous vulnerability posture, and regulatory compliance into a self-serve, metered cloud utility behind **one monochrome console** and **one transparent bill**.

```text
+------------------------------------+------------------------------------+
| Traditional Enterprise Security    | Harizeon Cloud EASM Model          |
+------------------------------------+------------------------------------+
| 6-week enterprise sales calls      | 2-minute self-serve signup         |
| $30,000 - $100,000 annual minimums | MYR 79 - 799 / month (self-serve)  |
| Intrusive endpoint agents          | Pure external perimeter assessment |
| Complex, noisy SOC alerts          | 5-second instant fix verification  |
| US/EU focused; USD only            | Localized: MYR, FPX, PDPA Act 709  |
+------------------------------------+------------------------------------+
```

### 1.2 The One Sentence to Remember
> *"The product is not the scanner. The product is the cryptographic ownership gate, the deduplicated finding, the copy-paste remediation that works, the real-time drift ledger, and the audit report a client will accept."*

---

## 2. Production Service Catalog

```text
                  +-----------------------------------+
                  |   CONTROL PLANE (Fastify 4 API)   |
                  |   IAM · Scans · Findings · Trust  |
                  +-----------------+-----------------+
                                    │
                            Redis Streams Bus
                            harizeon:scans:*
                                    │
              ======================▼====================== (Strict Trust Seam)
                  +-----------------------------------+
                  |   DATA PLANE (Isolated Worker)    |
                  |   Non-root, read-only container   |
                  |   Zero DB access · Go adapters    |
                  +-----------------+-----------------+
                                    │
                        Asset Snapshots & Drift
                                    │
                        Monochrome Next.js 16 Web
```

| Service Code | Product Name | Current Status | Capabilities |
| :--- | :--- | :--- | :--- |
| **IAM** | **Harizeon IAM** | **Production (v1.0)** | Multi-tenant organization workspaces, scoped API keys (`hrz_live_...`), Argon2id auth, append-only audit log. |
| **SCN** | **Harizeon Scan** | **Production (v1.1)** | 8-phase scanning engine (Quick, Standard, Deep, AI) + **5-Second Verify Fix micro-scans**. |
| **ASM** | **Harizeon Surface** | **Production (v1.1)** | Continuous subdomain discovery (`subfinder`), DNS auditing (`dnsx`), TLS tracking (`tlsx`), and **Perimeter Drift Ledger (`/drift`)**. |
| **AIA** | **Harizeon AI-Armor** | **Production (v1.1)** | Remote MCP server scanner, unauthenticated LLM daemon discovery (Ollama/vLLM), vector DB checks, and client-side AI key leak detection. |
| **ADT** | **Harizeon Audit** | **Production (v1.1)** | Regulatory mapping engine for **PDPA 2024 (Act 709)**, **BNM RMiT**, and **ISO 27001:2022** + Executive PDF reports. |
| **TRUST** | **Harizeon Trust** | **Production (v1.1)** | Unauthenticated public security posture certification (`/trust/[slug]`) with tamper-evident SHA-256 seal & embeddable badges. |
| **VLT** | **Harizeon Vault** | *Roadmap (v1.2)* | Encrypted programmatic secrets storage with automated rotation reminders. |
| **WCH** | **Harizeon Watch** | *Roadmap (v1.3)* | SIEM-lite log ingestion (Cloudflare, syslog) and webhook alerting. |
| **SHD** | **Harizeon Shield** | *Roadmap (v2.0)* | Managed Cloudflare WAF rule orchestration. |

---

## 3. Delivered Milestones & Quality Audit

### 3.1 Milestone History
* **v1.0 Foundation (MVP Completed)**: Core loop delivered across 12 sprint checkpoints: IAM, DNS TXT cryptographic verification, SSE live scan telemetry, deduplicated findings schema, scheduled recurring scans, Resend email/Slack webhooks, and metered billing.
* **v1.1 Enterprise & Regulatory Release (Completed & Verified)**:
  1. **5-Second "Verify Fix" Micro-Scans (`[ VERIFY FIX ]`)**: In-place single-check verification eliminating 20-minute re-scan cycles.
  2. **Attack Surface Perimeter Drift Ledger (`/drift`)**: Immutable audit history tracking `NEW_SUBDOMAIN_DETECTED`, `NEW_PORT_EXPOSED`, `TLS_CERT_EXPIRING_SOON`, `FINDING_INTRODUCED`, `FINDING_REGRESSED`, and `FINDING_RESOLVED`.
  3. **Exploit-Weighted Posture Scoring**: Exponential decay formula factoring CVSS, asset criticality, CISA KEV weaponization ($2.5\times$), confirmed secret leaks ($2.0\times$), and EPSS scores.
  4. **Malaysia Regulatory Compliance Dashboard (`/compliance`)**: Dedicated compliance tabs and check mapping for PDPA 2024, BNM RMiT, and ISO 27001.
  5. **Public Trust Certificate & Badge (`/trust/[slug]`)**: Tamper-evident posture certificate and live embeddable SVG badges.
  6. **Hardened Multi-Stage Non-Root Data Plane**: Minimal non-root container (UID 10001 `scanner`), read-only root filesystem, dropped capabilities, and strict 3-network isolation with zero database credentials.

### 3.2 Verification & Quality Gate Results
* **Frontend Web Console (`web/`)**:
  * `npm run typecheck` — **0 errors** (strict mode clean).
  * `npm run lint` — **0 errors**.
  * `npm run build` — **43/43 production routes compiled cleanly** via Turbopack.
* **Control Plane API (`api/`)**:
  * `npm run typecheck` — **0 errors** (strict mode clean).
  * `npm test` — **115/115 tests passed** across 22 suites (0 failures).
* **Data Plane Worker (`worker/`)**:
  * `pytest worker/v1_1_test.py` — **21/21 passed**.
  * `pytest worker/test_v1_1_security.py` — **5/5 passed** (SSRF defenses, ownership gates, secret redaction, container hardening, cross-tenant RLS).

---

## 4. Operational Runbook

### 4.1 Local Development Commands
```bash
# 1. Start core infrastructure (PostgreSQL & Redis)
docker compose up -d db redis

# 2. Run database migrations
cd db && npm run migrate

# 3. Start Control Plane Fastify API (runs on port 8080)
cd api && npm run dev

# 4. Start Next.js 16 Web Console (runs on port 3000)
cd web && npm run dev

# 5. Start Data Plane Scan Worker
cd worker && python -m worker.main
```

### 4.2 Automated Test & Gate Suite
```bash
# Complete repo verification run
cd api && npm test && npm run typecheck
cd ../web && npm run typecheck && npm run lint && npm run build
cd .. && py -3.12 -m pytest worker/
```

### 4.3 Production Docker Orchestration
```bash
# Production multi-stage build and hardened start
docker compose up -d --build
```

---

## 5. Malaysia Market & Commercialization Playbook

### 5.1 Legal & Regulatory Positioning
* **Cyber Security Act 2024 (Act 854)**: Harizeon is positioned strictly as **automated continuous External Attack Surface Management (EASM) and hygiene software**—never "licensed penetration testing" or "managed SOC monitoring" until a formal NACSA Cybersecurity Service Provider (CSSP) license is secured.
* **Personal Data Protection Act 2024 (Act 709)**: Harizeon's compliance dashboard maps directly to Section 9 (Security Principle) and the statutory 72-hour mandatory data breach notification threshold.

### 5.2 Self-Serve Pricing Tiers (MYR / Month)
* **Free (MYR 0)**: 1 verified domain, 1 standard scan/month, 30-day finding retention.
* **Starter (MYR 79/month)**: 3 verified domains, weekly automated scans, basic PDF audit report.
* **Growth (MYR 249/month)**: 10 verified domains, daily automated scans, AI-Armor checks, Slack/Discord alerts, public trust badge.
* **Scale (MYR 799/month)**: 30 verified domains, continuous drift monitoring, PDPA/BNM compliance reports, API access, 5 team members.

### 5.3 Customer Acquisition Strategy (First 50 Customers)
1. **Web Agencies & Dev Shops**: Offer agency white-label reports with a 30% recurring margin. Managing 10 client sites under one Harizeon dashboard solves their client audit headaches.
2. **Passive State of Malaysian Web Security Report**: Conduct passive-only scans (headers, TLS, DNS) of 500 public `.my` websites; publish aggregated vulnerability statistics and offer private remediation briefings.
3. **University & Developer Grassroots**: Leverage UiTM and local tech communities with student tiers and developer-first documentation.

---

## 6. Post-v1.1 Engineering Roadmap

```text
2026 Q4 (Completed)     2027 Q1 (v1.2)           2027 Q2 (v1.3)           2027 Q3 (v2.0)
────────────────────    ────────────────────     ────────────────────     ────────────────────
[v1.0] Core Loop        [v1.2] Team & Vault      [v1.3] Audit & Watch     [v2.0] Active Edge
· IAM & Auth            · Multi-User RBAC        · Formal Audit Packet    · Cloudflare WAF Orches.
· DNS Verification      · Harizeon Vault (VLT)   · Harizeon Watch (WCH)   · Harizeon Shield (SHD)
· 8-Phase Scanning      · Jira/Linear Integr.    · Syslog Ingestion       · Dynamic Rate-Limiting
[v1.1] Production Rel.  · GitHub Actions CI/CD   · SIEM-Lite Webhooks     · Enterprise SAML SSO
· Verify Fix (5s)
· Drift Ledger
· Malaysia Compliance
· Public Trust Badge
· Hardened Isolation
```

---
*Harizeon Technologies · Confidential Master Platform Specification*
