# Scanner engine licence audit (W01 action item)

Master plan §6.5 (supply chain), §19 (risk: "Open-source licence problem"), and
§20.5 (first-week checklist: "Audit the licence of every scanner engine you
intend to use").

**Do the audit in W01, not W12.** Record the verified licence for each engine
BEFORE it ships commercially. Nothing below is a licence assertion — every
`licence` cell must be confirmed from the project's own `LICENSE`/`COPYING` or
its SPDX/REUSE metadata at the version you pin.

## Why it matters

- Some mature security tools are **GPL/AGPL**. Running them **server-side as a
  service** (you operate them, customers never receive the binary) is generally
  the safe pattern and is what Harizeon does. **Distributing** them (CLI shipped
  to users, bundled binaries) can trigger copyleft obligations. AGPL additionally
  reaches network use — treat it with extra care and get legal review.
- Pin engine versions and record them in `scans.engine_versions` so any finding
  is reproducible (§11 supply chain).

## Worksheet

Pick **one** engine per slot. Confirm the licence, then set the status.

| Phase (§6.4)   | Slot                          | Candidate engine (evaluate) | Licence (VERIFY) | Distribution mode | SaaS-safe? | Status |
| -------------- | ----------------------------- | --------------------------- | ---------------- | ----------------- | ---------- | ------ |
| discover       | subdomain enum / passive DNS  | worker `discovery.py` (in-house) | n/a (in-house) | server-side | yes | ✔ cleared W05 |
| discover       | certificate transparency      | crt.sh JSON API (data)      | public data      | queried, server-side | yes | ✔ cleared W05 |
| discover       | WHOIS / DNS records           | RDAP (IETF std) + dnspython 2.8.0 | ISC (via `pip show`, W05) | server-side | yes | ✔ cleared W06 |
| probe          | port scan + service detection | worker `probe.py` (stdlib socket) | n/a (in-house) | server-side | yes | ✔ cleared W06 |
| inspect        | TLS configuration analyzer    | worker `inspect_.py` + `ssl`/`cryptography` 45.0.7 | Apache-2.0 OR BSD-3-Clause (via `pip show`, W06) | server-side | yes | ✔ cleared W06 |
| inspect        | security headers / fingerprint| worker `inspect_.py` + httpx 0.28.1 | BSD-3-Clause (via `pip show`, W06) | server-side | yes | ✔ cleared W06 |
| test           | template-driven web checks    | _TBD_                       | _TBD_            | server-side       | _TBD_      | ☐ todo W08 |
| test           | template repository content   | _TBD_                       | _TBD_            | data, server-side | _TBD_      | ☐ todo W08 |
| (v0.2) code    | container / SBOM vuln scan    | _TBD_                       | _TBD_            | server-side       | _TBD_      | ☐ todo |
| enrichment     | CVE data (NVD feed + cache)   | NVD                         | see NVD terms    | data, server-side | _TBD_      | ☐ todo |
| queue          | Redis Streams client          | redis-py 5.3.1              | MIT (via `pip show`, W06) | server-side | yes | ✔ cleared W06 |

## Rules for filling this in

1. Record the **exact version** you evaluated and the licence **as written** in
   that version's source tree, with a link/commit.
2. Note whether the engine is invoked **server-side only** (safe default) or
   ever **distributed** to customers (CLI/GitHub Action) — the latter changes the
   analysis.
3. Flag any **AGPL** or **GPL** component for explicit legal review before it
   ships.
4. Check the **template/data** licences separately from the engine (community
   template repos often have their own terms).
5. Re-run this audit when you bump a pinned engine version.

**Sign-off:** no engine enters production until its row is `✔ cleared` with a
verified licence and, where required, written legal review (§12.3).
