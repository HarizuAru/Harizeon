import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  SCAN_PHASES,
  TERMINAL_STATUSES,
  isTerminal,
  phaseIndex,
  progressForPhase,
  retryDecision,
  type ScanStatus,
} from "./scan-state";

describe("scan phase plan (§06.4)", () => {
  test("phases are exactly the documented order", () => {
    assert.deepEqual(
      [...SCAN_PHASES],
      ["verify", "discover", "resolve", "probe", "inspect", "test", "normalize", "report"],
    );
  });

  test("phaseIndex maps known phases to their order, unknown to -1", () => {
    assert.strictEqual(phaseIndex("verify"), 0);
    assert.strictEqual(phaseIndex("report"), SCAN_PHASES.length - 1);
    for (let i = 0; i < SCAN_PHASES.length; i += 1) {
      assert.strictEqual(phaseIndex(SCAN_PHASES[i]), i);
    }
    assert.strictEqual(phaseIndex(null), -1);
    assert.strictEqual(phaseIndex(undefined), -1);
    assert.strictEqual(phaseIndex("nonsense" as never), -1);
  });

  test("progress is bounded 0..100 and strictly increasing across phases", () => {
    let prev = -1;
    for (const p of SCAN_PHASES) {
      const v = progressForPhase(p);
      assert.ok(v >= 0 && v <= 100, `${p} => ${v}`);
      assert.ok(v > prev, `${p} must advance progress`);
      prev = v;
    }
    assert.ok(progressForPhase("report") >= 90, "report should be near-complete");
  });
});

describe("scan status transitions", () => {
  test("terminal statuses", () => {
    for (const s of ["completed", "failed", "timeout", "cancelled"] as ScanStatus[]) {
      assert.strictEqual(isTerminal(s), true, s);
    }
    for (const s of ["queued", "claimed", "running"] as ScanStatus[]) {
      assert.strictEqual(isTerminal(s), false, s);
    }
    assert.deepEqual(
      [...TERMINAL_STATUSES].sort(),
      ["cancelled", "completed", "failed", "timeout"],
    );
  });

  test("retry at most twice (§06.4)", () => {
    assert.deepEqual(retryDecision(0), { retry: true, nextAttempt: 1 });
    assert.deepEqual(retryDecision(1), { retry: true, nextAttempt: 2 });
    assert.deepEqual(retryDecision(2), { retry: false, nextAttempt: 2 });
    assert.deepEqual(retryDecision(5), { retry: false, nextAttempt: 5 });
  });
});
