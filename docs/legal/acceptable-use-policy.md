# Harizeon Acceptable Use Policy (AUP)

**STATUS: DRAFT — NOT LEGAL ADVICE.** This document must be reviewed by a
Malaysian-qualified lawyer before public launch (master plan §12.3). It encodes
the clauses the plan requires (§12.4) so legal review starts from substance, not
a blank page.

---

## 1. Purpose

Harizeon provides self-serve security scanning and monitoring. Active testing
touches systems you do not control unless you are authorized. This policy exists
to keep that activity lawful and to protect customers, third parties, and
Harizeon.

Unauthorized access to computer material is a criminal offence in Malaysia under
the **Computer Crimes Act 1997**, and may violate equivalent laws in other
jurisdictions where a scanned asset or its hosting infrastructure is located.
Handling of personal data is governed by the **Personal Data Protection Act
2010** (as amended). You are responsible for compliance in every jurisdiction
your use touches.

## 2. Ownership verification is mandatory

- Harizeon performs **active** testing only against assets whose control you have
  cryptographically demonstrated (DNS TXT record, `/.well-known/` file, or meta
  tag), or IP ranges authorized through the manual process described in §12.2 of
  the master plan.
- There is **no bypass**. Verification cannot be waived for demos, trusted
  users, enterprise deals, or any other reason.
- Verification is re-checked periodically (at least weekly). If re-verification
  fails — for example a domain changes hands — scanning pauses automatically and
  you are notified.

## 3. Your warranty and responsibility

By adding an asset and requesting a scan, you represent and warrant that:

1. You **own**, or are **contractually authorized** to test, every asset you add
   and every host a scan reaches through it.
2. Your authorization is current and covers the type of testing performed.
3. You will not add assets you know or should know belong to a third party
   without that party's permission.
4. You will not use Harizeon output, credentials, or access to attack, probe, or
   otherwise harm any system.

You **indemnify** Harizeon against claims arising from assets you added or scans
you requested that violate this policy or applicable law.

## 4. Prohibited use

You must not use Harizeon to:

- Target government, financial, critical-infrastructure, or other sensitive
  systems without explicit written authorization (such targets are flagged for
  manual review before any active phase runs).
- Scan assets you do not control, including to enumerate or profile a third
  party.
- Conduct denial-of-service, brute-force, exploitation, or any activity beyond
  the documented scope of a Harizeon scan profile.
- Circumvent rate limits, concurrency caps, or the ownership-verification gate.
- Resell raw scan capability as an attack tool or to facilitate one.

## 5. Enforcement

- Harizeon **may suspend or terminate** access without prior notice on suspected
  unauthorized targeting or abuse.
- Harizeon maintains an internal blocklist of assets that must never be scanned.
- Harizeon runs abuse detection (e.g. many unrelated domains added quickly, high
  failed-verification rates, sensitive-TLD targeting).
- **All scan activity is logged.** Harizeon will cooperate with lawful requests
  and may disclose logs as required by law.

## 6. Abuse and disclosure contacts

- Abuse: `abuse@harizeon.com` — monitored, answered within 24 hours.
- Security disclosures: see `/.well-known/security.txt` and the `/security` page
  (responsible disclosure, published response SLA, hall of fame).

## 7. Data protection

Scan evidence may incidentally contain personal data. Harizeon minimizes what it
stores, masks sensitive values by default in the UI, encrypts at rest, deletes on
the published retention schedule, honours deletion requests within 30 days, and
maintains a register of sub-processors (hosting, email, payment providers). A
Data Processing Addendum is available on request.

## 8. Scope note

Automated scanning is **not** a substitute for a manual penetration test. Reports
state this plainly. Nothing here is legal advice; obtain your own.

---

_To review: authorization warranty (§3), indemnity (§3), liability cap (in the
Terms of Service), suspension rights (§5), cross-border scanning advice, and
PDPA obligations as a data processor/controller (§7)._
