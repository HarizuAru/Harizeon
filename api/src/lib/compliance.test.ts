import { test } from "node:test";
import assert from "node:assert/strict";
import { mapFindingsToControls, CONTROL_MAP, NACSA_NCII_REPORTING_REFERENCE } from "./compliance";

const f = (over: Partial<Parameters<typeof mapFindingsToControls>[0][number]> = {}) => ({
  id: "fnd-1",
  title: "Legacy TLS enabled",
  severity: "high",
  status: "open",
  asset: "example.com",
  category: "tls",
  ...over,
});

test("compliance: open finding marks its controls as attention", () => {
  const results = mapFindingsToControls([f()]);
  const iso = results.find((r) => r.framework === "ISO/IEC 27001:2022")!;
  const crypto = iso.controls.find((c) => c.control === "A.8.24")!;
  assert.equal(crypto.status, "attention");
  assert.equal(crypto.findings.length, 1);
  assert.equal(iso.open_findings, 1);
});

test("compliance: resolved findings are listed but do not raise attention", () => {
  const results = mapFindingsToControls([f({ status: "fixed" })]);
  const iso = results.find((r) => r.framework === "ISO/IEC 27001:2022")!;
  assert.equal(iso.controls.find((c) => c.control === "A.8.24")!.status, "no_findings_detected");
  assert.equal(iso.open_findings, 0);
});

test("compliance: a finding mapped to several controls counts once per framework", () => {
  // exposed_service maps to two ISO controls (A.8.20, A.8.22).
  const results = mapFindingsToControls([f({ category: "exposed_service" })]);
  const iso = results.find((r) => r.framework === "ISO/IEC 27001:2022")!;
  assert.equal(iso.controls.length, 2);
  assert.equal(iso.open_findings, 1, "not double counted");
});

test("compliance: unknown categories fall through instead of being dropped", () => {
  const results = mapFindingsToControls([f({ category: "brand_new_check" })]);
  const iso = results.find((r) => r.framework === "ISO/IEC 27001:2022")!;
  assert.equal(iso.controls.find((c) => c.control === "A.8.8")!.status, "attention");
});

test("compliance: ai_exposure findings map to credential/access controls", () => {
  const results = mapFindingsToControls([f({ category: "ai_exposure", title: "AI key leaked" })]);
  const iso = results.find((r) => r.framework === "ISO/IEC 27001:2022")!;
  assert.equal(iso.controls.find((c) => c.control === "A.5.17")!.status, "attention");
  const soc2 = results.find((r) => r.framework === "SOC 2")!;
  assert.equal(soc2.controls.find((c) => c.control === "CC6.1")!.status, "attention");
});

test("compliance: every mapped category has a framework and a title", () => {
  for (const [category, refs] of Object.entries(CONTROL_MAP)) {
    for (const ref of refs) {
      assert.ok(ref.framework.length > 0, `${category} missing framework`);
      assert.ok(ref.control.length > 0, `${category} missing control id`);
      assert.ok(ref.title.length > 0, `${category} missing title`);
    }
  }
});

test("compliance: maps specific checkId to OWASP Top 10 for LLMs and ISO 42001", () => {
  const results = mapFindingsToControls([
    f({
      id: "fnd-vector",
      category: "ai_exposure",
      check_id: "ai.vector_db_chroma",
      title: "ChromaDB Exposed",
    }),
    f({
      id: "fnd-agent",
      category: "ai_exposure",
      check_id: "ai.unauth_agent_endpoint",
      title: "Flowise Exposed",
    }),
  ]);
  const owasp = results.find((r) => r.framework === "OWASP Top 10 for LLMs");
  assert.ok(owasp, "OWASP framework present");
  const llm02 = owasp.controls.find((c) => c.control === "LLM02");
  assert.ok(llm02, "LLM02 present for vector db");
  assert.equal(llm02.status, "attention");
  const llm06 = owasp.controls.find((c) => c.control === "LLM06");
  assert.ok(llm06, "LLM06 present for agent endpoint");
  assert.equal(llm06.status, "attention");

  const iso42001 = results.find((r) => r.framework === "ISO/IEC 42001:2023");
  assert.ok(iso42001, "ISO 42001 present");
});

test("compliance: references PDPA 2024 (Act 709) and NACSA P.U.(A) 220 timelines accurately", () => {
  const results = mapFindingsToControls([f(), f({ id: "fnd-exp", category: "exposed_service" })]);
  assert.equal(results.some((r) => r.framework.includes("PDPA 2010")), false);
  const pdpa = results.find((r) => r.framework === "PDPA 2024 (Act 709)");
  assert.ok(pdpa, "PDPA 2024 (Act 709) framework present");

  const nacsa = results.find((r) => r.framework === "NACSA NCII (Act 854 / P.U.(A) 220)");
  assert.ok(nacsa, "NACSA NCII framework present");
  assert.equal(NACSA_NCII_REPORTING_REFERENCE.prescribed_particulars_hours, 6);
  assert.equal(NACSA_NCII_REPORTING_REFERENCE.supplementary_report_days, 14);
  assert.match(NACSA_NCII_REPORTING_REFERENCE.initial_notification, /Immediate electronic notice/i);
});
