# HARIZEON TECHNOLOGIES
## Investor Business Plan & Confidential Memorandum
**Security infrastructure, provisioned like cloud.**  
*Seed Round | Q4 2026 – Q1 2027*

---

### CONFIDENTIALITY & DISCLAIMER
This document contains confidential and proprietary business information regarding Harizeon Technologies. It is prepared solely for evaluation purposes by prospective qualified angel and institutional investors.

---

## 1. Executive Summary

**Harizeon** is the automated cybersecurity control plane for teams too small to have a dedicated security team.

Just as Amazon Web Services (AWS) eliminated physical data center procurement by transforming servers into instantaneous API calls, Harizeon packages complex enterprise cybersecurity—external attack surface management (ASM), vulnerability scanning (SCN), and compliance reporting (ADT)—into a self-serve, metered cloud utility.

### The Market Vacuum
Over 70 million small-to-medium enterprises (SMEs) across Southeast Asia and hundreds of thousands of agile engineering teams globally are required by clients, enterprise buyers, and new regulatory frameworks (e.g., Malaysia's **Cyber Security Act 2024** and **PDPA**) to prove their infrastructure is secure. 

However, existing security solutions fail them:
- **Legacy Enterprise Suites** (CrowdStrike, Palo Alto, Qualys): $30,000–$100,000+ annual contracts with multi-week sales friction.
- **Open-Source Tools** (Nuclei, ZAP, OpenVAS): Unoperable for lean development teams; high noise, lack of historical tracking, and no client-facing reporting.
- **The Result**: Over 80% of SMEs do nothing until a catastrophic data breach or a lost enterprise deal forces their hand.

### The Harizeon Solution
1. **Self-Serve Onboarding**: Developers sign up, verify domain ownership via DNS TXT or HTTP in under two minutes, and launch automated scans without sales calls.
2. **Proprietary Multi-Engine Normalization**: Orchestrates best-in-class security engines in isolated, ephemeral sandboxes and maps findings into a single deduplicated schema with CVSS scores and verified remediation instructions.
3. **Audit & Client-Ready Reports**: Generates one-click, executive- and compliance-grade PDF reports ready to satisfy enterprise vendor questionnaires and regulatory audits.
4. **Localized Pricing & Payment Rails**: Priced in local currency (starting at MYR 79/month) with local payment methods (FPX, DuitNow, cards) and native PDPA compliance mapping.

---

## 2. Market Problem & Regulatory Drivers

### 2.1 The Small-Team Cybersecurity Dilemma
Technical teams of 3 to 25 engineers (the "single technical decision maker" persona) build web applications, APIs, and cloud services. When an enterprise client or investor asks: *"Are you secure? Where is your audit report?"*, they have no answer.

```
+-----------------------------+------------------------------------+
| Traditional Enterprise      | Harizeon Cloud Model               |
+-----------------------------+------------------------------------+
| 6-week enterprise sales rep | 2-minute self-serve signup         |
| $30k - $100k annual commit  | MYR 79 - 799 / month (cancel anytime)|
| Heavy endpoint agents       | Non-intrusive external attack surface|
| US/EU focused; USD only     | Localized (MYR, FPX, PDPA mapping) |
| Complex SOC dashboards      | Actionable, prioritized findings   |
+-----------------------------+------------------------------------+
```

### 2.2 Regulatory & Industry Catalysts
- **Malaysia Cyber Security Act 2024**: Legally mandates continuous security posture assessments, vulnerability management, and incident readiness for critical and digital service entities.
- **Personal Data Protection Act (PDPA) Enforcement**: Increased penalties for corporate data breaches and mandatory safeguards on digital infrastructure holding consumer records.
- **Supply Chain Security Mandates**: Large enterprises, banks, and public agencies now mandate that third-party vendors and software contractors provide proof of recent vulnerability scans before contracts are awarded.

---

## 3. Product Architecture & Service Catalog

Harizeon is engineered using an AWS-inspired service model:

```
                  +-----------------------------------+
                  |   CONTROL PLANE (API & Console)   |
                  |   Auth, Orgs, Audit Log, Billing  |
                  +-----------------+-----------------+
                                    |
                            Redis Job Queue
                                    |
              ======================v====================== (Trust Boundary)
                  +-----------------------------------+
                  |   DATA PLANE (Isolated Workers)   |
                  |   Ephemeral scanning sandboxes    |
                  |   - Subdomain & DNS Discovery     |
                  |   - Port & Service Fingerprinting |
                  |   - TLS & Security Header Inspect |
                  |   - Web Vulnerability Checks      |
                  +-----------------+-----------------+
                                    |
                         Normalized Findings DB
                                    |
                         PDF Reports & Webhooks
```

### Service Catalog
- **IAM (Harizeon IAM)**: Multi-tenant organization workspaces, RBAC roles, scoped API keys (`hrz_live_...`), and immutable append-only audit logs.
- **ASM (Harizeon Surface)**: Continuous external asset discovery (subdomains, DNS records, WHOIS, expiring TLS certificates, shadow IT).
- **SCN (Harizeon Scan)**: Non-destructive port probing, service fingerprinting, and template-based web vulnerability scanning against verified targets.
- **ADT (Harizeon Audit)**: Compliance posture mapping (PDPA, ISO 27001, SOC2-lite) and one-click PDF report generation.
- **Future Roadmap (v0.2+)**:
  - **VLT (Harizeon Vault)**: Encrypted programmatic secrets storage and rotation tracking.
  - **WCH (Harizeon Watch)**: SIEM-lite log ingestion and alerting.
  - **SHD (Harizeon Shield)**: Managed Cloudflare WAF rule orchestration.

---

## 4. Business Model & Pricing Strategy

Harizeon monetizes through a high-margin B2B SaaS subscription model with metered overage billing:

| Plan | Price (MYR / Month) | Inclusions | Target Customer |
| :--- | :--- | :--- | :--- |
| **FREE** | MYR 0 | 1 verified asset, monthly quick scan, 14-day history | Developers, students, lead generation |
| **STARTER** | MYR 79 / mo | 5 assets, weekly automated scan, 90-day retention, PDF report export | Early-stage startups, single-product teams |
| **GROWTH** | MYR 249 / mo | 25 assets, daily deep scans, 1-year history, API access, Slack alerts, 3 seats | Fast-growing SaaS companies, tech SMEs |
| **SCALE** | MYR 799 / mo | 100 assets, continuous scanning, 2-year audit trail, 10 seats, priority SLA | Digital agencies, MSPs, mid-sized enterprises |

- **Metered Usage Overages**: MYR 8 / additional asset / month; MYR 5 / additional deep scan.
- **Gross Margins**: >85% (cloud compute costs per scan are under MYR 0.40 due to ephemeral container reuse).

---

## 5. Market Opportunity (TAM / SAM / SOM)

- **Total Addressable Market (TAM)**: **$25.8B** global SMB cybersecurity market (14.2% CAGR).
- **Serviceable Addressable Market (SAM)**: **$1.8B** Southeast Asia SME cybersecurity and compliance market (4.5 million digitally active businesses).
- **Serviceable Obtainable Market (SOM)**: **$42M** initial target in Malaysia and Singapore (tech-enabled software firms, digital agencies, and e-commerce platforms).

---

## 6. Go-To-Market (GTM) Strategy

1. **Digital Agency & MSP Partner Program**: 
   - Web development and IT agencies manage 20 to 50 client websites each. By providing white-label compliance reports and reseller margins, onboarding one agency brings 30+ paying assets immediately.
2. **Product-Led Growth (PLG)**:
   - Self-serve verification and immediate security score calculation create organic word-of-mouth among developer networks and tech communities.
3. **Data-Driven Thought Leadership**:
   - Publishing the annual *"State of Web Security in Malaysian SMEs"* (aggregating passive DNS/TLS/header data across 1,000 .my domains) to secure media coverage, SEO authority, and organic inbound leads.
4. **Developer Integration**:
   - CLI and GitHub Actions allowing continuous security checks inside CI/CD pipelines before code is deployed to production.

---

## 7. 3-Year Financial Projections

*(Values in Malaysian Ringgit [MYR]; 1 USD ≈ 4.50 MYR)*

| Metric | Year 1 (2027) | Year 2 (2028) | Year 3 (2029) |
| :--- | :--- | :--- | :--- |
| **Active Paying Accounts** | 160 | 650 | 2,100 |
| **Average Monthly ARPU** | MYR 180 | MYR 210 | MYR 245 |
| **Ending MRR** | MYR 28,800 (~$6.4k USD) | MYR 136,500 (~$30k USD) | MYR 514,500 (~$114k USD) |
| **Annual Recurring Revenue (ARR)** | **MYR 345,600** | **MYR 1,638,000** | **MYR 6,174,000** |
| **Cost of Goods Sold (COGS - 12-14%)** | MYR 48,000 | MYR 196,000 | MYR 680,000 |
| **Gross Profit (86%–89%)** | **MYR 297,600** | **MYR 1,442,000** | **MYR 5,494,000** |
| **Operating Expenses (OPEX)** | MYR 420,000 | MYR 980,000 | MYR 2,450,000 |
| **EBITDA / Operating Profit** | -MYR 122,400 *(R&D Seed)* | **+MYR 462,000** *(Profitable)* | **+MYR 3,044,000** *(49% Margin)* |

---

## 8. The Investment Ask & Use of Funds

### Target Capital Raise: $200,000 USD (~MYR 900,000)
**Structure**: Seed SAFE or Convertible Note with standard discount and valuation cap.

### Allocation of Funds (18-Month Runway):
- **50% (MYR 450,000) – Engineering & Core Infrastructure**: Expanding distributed scanning clusters, building Harizeon Vault (VLT) and Watch (WCH), and optimizing multi-engine normalization.
- **25% (MYR 225,000) – Go-To-Market & Agency Partnerships**: Agency reseller acquisition, developer advocacy, bilingual technical content, and regional digital growth.
- **15% (MYR 135,000) – Legal, Regulatory & Security Assurance**: Cyber liability coverage, legal counsel on computer misuse safeguards, and obtaining ISO 27001 / SOC 2 certification.
- **10% (MYR 90,000) – Operational Working Capital & Contingency**: Buffer ensuring financial resilience.

---

## 9. Key Milestones
- **Month 3**: Full commercial availability with automated FPX and card billing; 25 paying pilot accounts.
- **Month 6**: 80 paying accounts (MYR 16k MRR); release of the automated PDPA Compliance Module.
- **Month 12**: 250 paying accounts (MYR 52k MRR); launch of Harizeon Vault (VLT); geographic expansion into Singapore.
- **Month 18**: 500+ paying accounts (>MYR 110k MRR / $25k USD MRR); cash-flow positive operations positioning for Series A scale.

---

## 10. Management & Contact Information

**Harizeon Technologies Sdn. Bhd.** *(In Formation)*  
- **Founder & Lead Architect**: Hariz Iskandar  
- **Contact Email**: `hariziskandar0504@gmail.com`  
- **Headquarters**: Kuala Lumpur, Malaysia  
- **Console**: [https://console.harizeon.com](https://console.harizeon.com)  
- **Documentation**: [https://docs.harizeon.com](https://docs.harizeon.com)  
