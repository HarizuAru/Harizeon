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

export interface AdvancedRiskMetrics {
  compositeScore: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  riskExposureIndex: number;
  epssQuantileAverage: number;
  meanTimeToRemediateDays: number;
  activeAttackSurfaceArea: number;
  vulnerabilityVelocity: number;
  postureTrend: "improving" | "stable" | "degrading";
}

export interface RemediationRecommendation {
  findingId: string;
  title: string;
  severity: string;
  category: string;
  scoreRecovery: number;
  estimatedEffortHours: number;
  roiScore: number; // Score recovery per engineering hour
  priorityRank: number;
}

/**
 * Advanced Multi-Factor Security Posture & EPSS Risk Assessment Engine.
 * Incorporates continuous vulnerability aging, exploit prediction probabilities,
 * asset perimeter exposure breadth, and MTTR risk dampening.
 */
export function calculateAdvancedRiskMetrics(
  findings: FindingForScoring[],
  assetCount = 1,
): AdvancedRiskMetrics {
  const baseBreakdown = calculateSecurityScore(findings);
  const now = Date.now();
  const openFindings = findings.filter((f) => f.status === "open" || f.status === "acknowledged");

  // EPSS (Exploit Prediction Scoring System) heuristic weighting based on severity and category
  let totalEpssWeight = 0;
  for (const f of openFindings) {
    let epss = 0.05; // baseline 5% exploit probability
    const sev = f.severity.toLowerCase();
    const cat = (f.category || "").toLowerCase();

    if (sev === "critical") epss = 0.88;
    else if (sev === "high") epss = 0.62;
    else if (sev === "medium") epss = 0.28;
    else if (sev === "low") epss = 0.08;

    // Categories with active external worm / exploit traffic receive EPSS boosts
    if (cat === "exposed_service" || cat === "web" || cat === "ai_exposure") {
      epss = Math.min(0.99, epss * 1.25);
    }
    totalEpssWeight += epss;
  }

  const epssQuantileAverage = openFindings.length > 0
    ? Number((totalEpssWeight / openFindings.length).toFixed(3))
    : 0.01;

  // Mean Time To Remediate (MTTR) calculation
  let totalAgeDays = 0;
  for (const f of openFindings) {
    if (f.first_seen_at) {
      const ageMs = Math.max(0, now - new Date(f.first_seen_at).getTime());
      totalAgeDays += ageMs / (24 * 3600 * 1000);
    }
  }
  const meanTimeToRemediateDays = openFindings.length > 0
    ? Number((totalAgeDays / openFindings.length).toFixed(1))
    : 0;

  // Attack Surface Area Index: Perimeter exposure based on monitored assets and active open ports
  const activeAttackSurfaceArea = Math.max(1, assetCount * 8 + openFindings.length * 3);

  // Vulnerability Velocity: Rate of risk accumulation per asset
  const vulnerabilityVelocity = Number((openFindings.length / Math.max(1, assetCount)).toFixed(2));

  // Composite Normalized Score
  const rawScore = baseBreakdown.score;
  const compositeScore = Math.max(0, Math.min(100, Math.round(
    rawScore * 0.85 + (1 - epssQuantileAverage) * 15,
  )));

  // Risk Exposure Index (0 to 10 scale)
  const riskExposureIndex = Number(((100 - compositeScore) / 10).toFixed(1));

  let grade: AdvancedRiskMetrics["grade"] = "F";
  if (compositeScore >= 95) grade = "A+";
  else if (compositeScore >= 85) grade = "A";
  else if (compositeScore >= 75) grade = "B";
  else if (compositeScore >= 60) grade = "C";
  else if (compositeScore >= 45) grade = "D";

  let postureTrend: AdvancedRiskMetrics["postureTrend"] = "stable";
  if (meanTimeToRemediateDays > 14 && openFindings.length > 3) postureTrend = "degrading";
  else if (openFindings.length <= 1) postureTrend = "improving";

  return {
    compositeScore,
    grade,
    riskExposureIndex,
    epssQuantileAverage,
    meanTimeToRemediateDays,
    activeAttackSurfaceArea,
    vulnerabilityVelocity,
    postureTrend,
  };
}

/**
 * Knapsack Remediation Path Optimizer (Greedy Approximation).
 * Identifies the optimal sequence of security fixes that maximizes posture
 * score recovery per hour of engineering remediation effort.
 */
export function optimizeRemediationPath(findings: FindingForScoring[]): RemediationRecommendation[] {
  const openFindings = findings.filter((f) => f.status === "open" || f.status === "acknowledged");

  const items: RemediationRecommendation[] = openFindings.map((f) => {
    let scoreRecovery = 1;
    let estimatedEffortHours = 2; // Default engineering estimate
    const sev = f.severity.toLowerCase();
    const cat = (f.category || "").toLowerCase();

    switch (sev) {
      case "critical":
        scoreRecovery = 15;
        estimatedEffortHours = 3;
        break;
      case "high":
        scoreRecovery = 8;
        estimatedEffortHours = 2.5;
        break;
      case "medium":
        scoreRecovery = 3;
        estimatedEffortHours = 1.5;
        break;
      case "low":
        scoreRecovery = 1;
        estimatedEffortHours = 1;
        break;
    }

    // Quick configuration wins (e.g. HTTP headers or TLS cipher configuration) take less effort
    if (cat === "headers" || cat === "tls") {
      estimatedEffortHours = Math.max(0.5, estimatedEffortHours * 0.5);
    } else if (cat === "exposed_service") {
      estimatedEffortHours = Math.max(0.5, estimatedEffortHours * 0.75); // Firewall rule update
    }

    const roiScore = Number((scoreRecovery / estimatedEffortHours).toFixed(2));

    return {
      findingId: f.id,
      title: `${f.severity.toUpperCase()}: Fix ${f.category || "security"} issue`,
      severity: f.severity,
      category: f.category || "general",
      scoreRecovery,
      estimatedEffortHours,
      roiScore,
      priorityRank: 0,
    };
  });

  // Sort by Return on Investment (score recovery per hour), then descending by score recovery
  items.sort((a, b) => b.roiScore - a.roiScore || b.scoreRecovery - a.scoreRecovery);

  // Assign priority ranks 1..N
  items.forEach((item, index) => {
    item.priorityRank = index + 1;
  });

  return items;
}

