import { test } from "node:test";
import assert from "node:assert/strict";
import { calculatePostureScore, type ScoreInputFinding } from "./scoring";

test("exploit-weighted posture score", async (t) => {
  await t.test("a clean posture with 0 findings scores 100", () => {
    assert.equal(calculatePostureScore([], 5), 100);
  });

  await t.test("critical finding on high criticality asset reduces score more than low", () => {
    const lowAsset: ScoreInputFinding[] = [
      {
        severity: "critical",
        assetCriticality: "low",
        checkId: "tls-weak-cipher",
      },
    ];
    const highAsset: ScoreInputFinding[] = [
      {
        severity: "critical",
        assetCriticality: "high",
        checkId: "tls-weak-cipher",
      },
    ];
    const scoreLow = calculatePostureScore(lowAsset, 3);
    const scoreHigh = calculatePostureScore(highAsset, 3);
    assert.ok(scoreHigh < scoreLow, `Expected high asset score (${scoreHigh}) < low asset score (${scoreLow})`);
  });

  await t.test("CISA KEV weaponized exploit multiplies risk penalty", () => {
    const regularFinding: ScoreInputFinding[] = [
      {
        severity: "high",
        assetCriticality: "medium",
        checkId: "cve-2023-1234",
        isKev: false,
      },
    ];
    const kevFinding: ScoreInputFinding[] = [
      {
        severity: "high",
        assetCriticality: "medium",
        checkId: "cve-2023-1234",
        isKev: true,
      },
    ];
    const scoreRegular = calculatePostureScore(regularFinding, 1);
    const scoreKev = calculatePostureScore(kevFinding, 1);
    assert.ok(scoreKev < scoreRegular, `Expected KEV score (${scoreKev}) < regular (${scoreRegular})`);
  });

  await t.test("confirmed secret exposure check acts as 2x multiplier", () => {
    const normalFinding: ScoreInputFinding[] = [
      {
        severity: "critical",
        assetCriticality: "medium",
        checkId: "some-regular-check",
      },
    ];
    const dotenvFinding: ScoreInputFinding[] = [
      {
        severity: "critical",
        assetCriticality: "medium",
        checkId: "nuclei:exposed-dotenv-file",
      },
    ];
    const scoreNormal = calculatePostureScore(normalFinding, 1);
    const scoreDotenv = calculatePostureScore(dotenvFinding, 1);
    assert.ok(scoreDotenv < scoreNormal);
  });

  await t.test("score is clamped between 0 and 100", () => {
    const catastrophic: ScoreInputFinding[] = Array(50).fill({
      severity: "critical",
      assetCriticality: "high",
      checkId: "nuclei:exposed-dotenv-file",
      isKev: true,
    });
    const score = calculatePostureScore(catastrophic, 1);
    assert.ok(score >= 0 && score <= 100);
  });
});
