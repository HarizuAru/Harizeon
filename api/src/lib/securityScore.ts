export interface FindingForScoring {
  id: string;
  severity: string;
  status: string;
  category?: string | null;
  first_seen_at?: Date | string;
}

export interface SecurityScoreBreakdown {
  score: number;
  totalPenalties: number;
  openFindingsCount: number;
  weights: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  ageMultiplier: {
    criticalOver7Days: number;
    highOver7Days: number;
  };
  categoryCap: number;
  penaltiesByCategory: Record<string, number>;
}

/**
 * Harizeon Security Score Algorithm (§20.4):
 * - Starts at 100.
 * - Deducts points for open findings:
 *     - Critical: -15 (-22.5 if older than 7 days)
 *     - High: -8 (-12 if older than 7 days)
 *     - Medium: -3
 *     - Low: -1
 *     - Info: 0
 * - Category cap: maximum -35 penalty per category to prevent a single noisy check from zeroing the score.
 * - Clamped between 0 and 100.
 */
export function calculateSecurityScore(findings: FindingForScoring[]): SecurityScoreBreakdown {
  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const CATEGORY_CAP = 35;

  const weights = {
    critical: 15,
    high: 8,
    medium: 3,
    low: 1,
    info: 0,
  };

  const ageMultiplier = {
    criticalOver7Days: 1.5,
    highOver7Days: 1.5,
  };

  const openFindings = findings.filter((f) => f.status === "open" || f.status === "acknowledged");
  const penaltiesByCategory: Record<string, number> = {};

  for (const f of openFindings) {
    const cat = f.category || "general";
    let penalty = 0;
    const isOld = f.first_seen_at
      ? now - new Date(f.first_seen_at).getTime() > SEVEN_DAYS_MS
      : false;

    switch (f.severity.toLowerCase()) {
      case "critical":
        penalty = isOld ? weights.critical * ageMultiplier.criticalOver7Days : weights.critical;
        break;
      case "high":
        penalty = isOld ? weights.high * ageMultiplier.highOver7Days : weights.high;
        break;
      case "medium":
        penalty = weights.medium;
        break;
      case "low":
        penalty = weights.low;
        break;
      default:
        penalty = 0;
        break;
    }

    penaltiesByCategory[cat] = (penaltiesByCategory[cat] || 0) + penalty;
  }

  let totalDeductions = 0;
  for (const cat of Object.keys(penaltiesByCategory)) {
    const raw = penaltiesByCategory[cat];
    const capped = Math.min(raw, CATEGORY_CAP);
    penaltiesByCategory[cat] = capped;
    totalDeductions += capped;
  }

  const score = Math.max(0, Math.min(100, Math.round(100 - totalDeductions)));

  return {
    score,
    totalPenalties: totalDeductions,
    openFindingsCount: openFindings.length,
    weights,
    ageMultiplier,
    categoryCap: CATEGORY_CAP,
    penaltiesByCategory,
  };
}
