import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calculateSecurityScore } from "./securityScore";

function finding(severity: string, over: Partial<{ status: string; category: string; first_seen_at: Date }> = {}) {
  return {
    id: Math.random().toString(36),
    severity,
    status: over.status ?? "open",
    category: over.category ?? "web",
    first_seen_at: over.first_seen_at ?? new Date(),
  };
}

describe("security score (§20.4 — transparent formula)", () => {
  test("a clean asset scores 100", () => {
    assert.equal(calculateSecurityScore([]).score, 100);
  });

  test("severity weights subtract from 100", () => {
    assert.equal(calculateSecurityScore([finding("critical")]).score, 85);
    assert.equal(calculateSecurityScore([finding("high")]).score, 92);
    assert.equal(calculateSecurityScore([finding("medium")]).score, 97);
    assert.equal(calculateSecurityScore([finding("low")]).score, 99);
    assert.equal(calculateSecurityScore([finding("info")]).score, 100);
  });

  test("findings older than 7 days weigh more for critical/high", () => {
    const old = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    assert.equal(calculateSecurityScore([finding("critical", { first_seen_at: old })]).score, 78); // -22.5 -> round
    assert.equal(calculateSecurityScore([finding("high", { first_seen_at: old })]).score, 88); // -12
  });

  test("one noisy category cannot zero the score (per-category cap)", () => {
    const many = Array.from({ length: 10 }, () => finding("critical", { category: "tls" }));
    const result = calculateSecurityScore(many);
    assert.equal(result.penaltiesByCategory.tls, 35); // capped
    assert.equal(result.score, 65);
  });

  test("caps are per category, so distinct categories each count", () => {
    const a = Array.from({ length: 10 }, () => finding("critical", { category: "tls" }));
    const b = Array.from({ length: 10 }, () => finding("critical", { category: "headers" }));
    assert.equal(calculateSecurityScore([...a, ...b]).score, 30); // 100 - 35 - 35
  });

  test("resolved and false-positive findings do not count", () => {
    const closed = [
      finding("critical", { status: "fixed" }),
      finding("critical", { status: "false_positive" }),
      finding("critical", { status: "accepted" }),
    ];
    assert.equal(calculateSecurityScore(closed).score, 100);
  });

  test("score never drops below 0", () => {
    const brutal = ["tls", "headers", "web", "exposed_service"].flatMap((c) =>
      Array.from({ length: 10 }, () => finding("critical", { category: c })),
    );
    assert.equal(calculateSecurityScore(brutal).score, 0);
  });
});
