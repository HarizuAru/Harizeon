import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { normaliseCron, nextAfter } from "./cron";

describe("cron normalisation", () => {
  test("accepts cadence words and cron spellings", () => {
    assert.equal(normaliseCron("daily"), "daily");
    assert.equal(normaliseCron("@weekly"), "weekly");
    assert.equal(normaliseCron("0 0 1 * *"), "monthly");
    assert.equal(normaliseCron("0 2 * * *"), "daily");
    assert.equal(normaliseCron("DAILY"), "daily");
  });

  test("rejects anything else rather than guessing", () => {
    assert.equal(normaliseCron("*/5 * * * *"), null);
    assert.equal(normaliseCron("hourly"), null);
    assert.equal(normaliseCron(""), null);
  });
});

describe("nextAfter", () => {
  const thursday = new Date("2026-09-17T15:30:00Z");

  test("daily advances to next midnight UTC", () => {
    assert.equal(nextAfter("daily", thursday).toISOString(), "2026-09-18T00:00:00.000Z");
  });

  test("weekly advances to next Monday", () => {
    const next = nextAfter("weekly", thursday);
    assert.equal(next.toISOString(), "2026-09-21T00:00:00.000Z");
    assert.equal(next.getUTCDay(), 1);
  });

  test("monthly advances to the 1st, rolling the year", () => {
    assert.equal(nextAfter("monthly", thursday).toISOString(), "2026-10-01T00:00:00.000Z");
    assert.equal(
      nextAfter("monthly", new Date("2026-12-17T10:00:00Z")).toISOString(),
      "2027-01-01T00:00:00.000Z",
    );
  });

  test("always strictly after the input", () => {
    for (const cron of ["daily", "weekly", "monthly"] as const) {
      assert.ok(nextAfter(cron, thursday).getTime() > thursday.getTime());
    }
  });
});
