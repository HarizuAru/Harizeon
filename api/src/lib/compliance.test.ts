import { test } from "node:test";
import assert from "node:assert/strict";
import { mapFindingsToControls, CONTROL_MAP } from "./compliance";

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
