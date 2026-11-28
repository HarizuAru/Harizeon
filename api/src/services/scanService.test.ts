import { test } from "node:test";
import assert from "node:assert/strict";

// scanService pulls in config/db, which validate env at import. A dummy DSN
// satisfies the schema; the Pool never connects because parseFindings is pure.
process.env.DATABASE_URL ??= "postgresql://test@localhost:5432/test";
const { parseFindings } = await import("./scanService");

// Queue-boundary validation: whatever the worker sends must come out shaped
// like WorkerFinding or be dropped. Network-free, no DB.

test("valid finding passes through with caps applied", () => {
  const [f] = parseFindings(
    JSON.stringify([
      {
        check_id: "nuclei.cve-2014-0160-heartbleed",
        location: "https://example.com:443",
        severity: "Critical",
        title: "Heartbleed",
        description: "TLS heartbeat overread.",
        remediation: "Upgrade OpenSSL.",
        cwe_id: "CWE-119",
        category: "tls",
        evidence: "matched",
        cve_ids: ["cve-2014-0160", "not-a-cve"],
      },
    ]),
  );
  assert.equal(f.checkId, "nuclei.cve-2014-0160-heartbleed");
  assert.equal(f.severity, "critical");
  assert.deepEqual(f.cveIds, ["CVE-2014-0160"]);
  assert.equal(f.knownExploited, false);
});

test("known_exploited only survives when strictly true", () => {
  const on = parseFindings(JSON.stringify([{ title: "a", severity: "low", known_exploited: true }]));
  const off = parseFindings(JSON.stringify([{ title: "a", severity: "low", known_exploited: "true" }]));
  assert.equal(on[0].knownExploited, true);
  assert.equal(off[0].knownExploited, false);
});

test("invalid rows are dropped, valid rows kept", () => {
  const out = parseFindings(
    JSON.stringify([
      { title: "", severity: "high" },
      { title: "no severity", severity: "banana" },
      { title: "kept", severity: "info" },
    ]),
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].title, "kept");
});

test("garbage input yields empty array", () => {
  assert.deepEqual(parseFindings(undefined), []);
  assert.deepEqual(parseFindings("not json"), []);
  assert.deepEqual(parseFindings('"a string"'), []);
});

test("SCAN_PROFILES includes 'ai' and 'api' profiles", async () => {
  const { SCAN_PROFILES } = await import("./scanService");
  assert.ok((SCAN_PROFILES as readonly string[]).includes("ai"));
  assert.ok((SCAN_PROFILES as readonly string[]).includes("api"));
});

test("v1.1 fields parse correctly in parseFindings", () => {
  const [f] = parseFindings(
    JSON.stringify([
      {
        check_id: "nuclei:exposed-dotenv-file",
        location: "https://example.com/.env",
        severity: "critical",
        title: "Exposed Environment File",
        source_tool: "nuclei",
        evidence: "AWS_SECRET_ACCESS_KEY=[REDACTED]",
        remediation_snippets: { nginx: "location ~ /\\.env { deny all; }" },
        epss_score: 0.852,
        epss_percentile: 0.985,
        is_kev: true,
      },
    ]),
  );
  assert.equal(f.checkId, "nuclei:exposed-dotenv-file");
  assert.equal(f.sourceTool, "nuclei");
  assert.equal(f.evidence, "AWS_SECRET_ACCESS_KEY=[REDACTED]");
  assert.deepEqual(f.remediationSnippets, { nginx: "location ~ /\\.env { deny all; }" });
  assert.equal(f.epssScore, 0.852);
  assert.equal(f.isKev, true);
});
