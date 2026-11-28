/**
 * Exploit-Weighted Posture Scoring (§4.1 / Harizeon v1.1)
 *
 * Upgrades static deductions so actively exploited vulnerabilities (CISA KEV),
 * confirmed AI/database secret exposures, and high-criticality assets dominate
 * the posture score.
 *
 * R_i = B_sev(i) * M_crit(i) * M_exploit(i)
 * S = round(100 * exp(-0.018 / ln(N_assets + e) * sum(R_i)))
 */

export interface ScoreInputFinding {
  severity: "critical" | "high" | "medium" | "low" | "info";
  assetCriticality: "low" | "medium" | "high";
  epssScore?: number | null;
  isKev?: boolean;
  checkId: string;
}

const BASE_WEIGHT: Record<ScoreInputFinding["severity"], number> = {
  critical: 15,
  high: 8,
  medium: 3,
  low: 1,
  info: 0,
};

const CRIT_MULT: Record<ScoreInputFinding["assetCriticality"], number> = {
  low: 0.6,
  medium: 1.0,
  high: 1.5,
};

const CONFIRMED_EXPOSURE_CHECKS = new Set([
  "nuclei:exposed-dotenv-file",
  "nuclei:exposed-llm-inference-daemon",
  "nuclei:exposed-git-config",
  "nuclei:exposed-ai-orchestration-panel",
  "ai_exposure",
  "cloud_storage",
]);

export function calculatePostureScore(
  openFindings: ScoreInputFinding[],
  assetCount: number,
): number {
  if (openFindings.length === 0) {
    return 100;
  }

  let totalRisk = 0;

  for (const f of openFindings) {
    const base = BASE_WEIGHT[f.severity] ?? 0;
    const crit = CRIT_MULT[f.assetCriticality] ?? 1.0;
    let exploit = 1.0;

    if (f.isKev || CONFIRMED_EXPOSURE_CHECKS.has(f.checkId)) {
      exploit = 2.0;
    } else if ((f.epssScore ?? 0) > 0.2) {
      exploit = 1.0 + (f.epssScore ?? 0);
    }

    totalRisk += base * crit * exploit;
  }

  const scale = 0.018 / Math.log(Math.max(1, assetCount) + Math.E);
  const rawScore = 100 * Math.exp(-scale * totalRisk);
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}
