import type { Queryable } from "../db";
import { badRequest, notFound } from "../lib/errors";
import { calculateSecurityScore, type SecurityScoreBreakdown } from "../lib/securityScore";
import { mapFindingsToControls, type ComplianceFrameworkResult } from "../lib/compliance";

export type ReportType = "executive" | "technical" | "compliance";

export interface ReportContent {
  id: string;
  org_id: string;
  org_name: string;
  type: ReportType;
  generated_at: string;
  period_start: string | null;
  period_end: string | null;
  security_score: SecurityScoreBreakdown;
  summary: {
    total_findings: number;
    open_findings: number;
    assets_tested: number;
    severity_counts: Record<string, number>;
  };
  top_risks: Array<{
    title: string;
    severity: string;
    asset: string;
    impact: string;
  }>;
  scope: Array<{
    value: string;
    type: string;
    criticality: string;
  }>;
  findings: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    asset: string;
    cvss?: number;
    category?: string;
    cves?: string[];
    age_days?: number;
    what_it_is?: string;
    why_it_matters?: string;
    remediation?: string;
    remediation_effort?: "Low" | "Medium" | "High";
  }>;
  remediation_plan: Array<{
    priority: number;
    title: string;
    asset: string;
    severity: string;
    effort: "Low" | "Medium" | "High";
    age_days: number;
    action: string;
  }>;
  /** Findings grouped by the controls they touch, per framework (§9.2). */
  compliance: ComplianceFrameworkResult[];
  disclaimer: string;
}

export type ReportRow = {
  id: string;
  org_id: string;
  project_id: string | null;
  type: ReportType;
  generated_at: Date | string;
  period_start: Date | string | null;
  period_end: Date | string | null;
  file_ref: string | null;
  generated_by: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

const DISCLAIMER =
  "Automated testing only; not a substitute for a manual penetration test. Findings reflect detected state at the time of scan execution. Harizeon provides vulnerability identification and telemetry but does not certify immune status. Compliance control references are indicative mappings for guidance only and are not an audit opinion or a statement of certification.";

export async function listReports(db: Queryable, orgId: string): Promise<ReportRow[]> {
  const res = await db.query<ReportRow>(
    `SELECT id, org_id, project_id, type, generated_at, period_start, period_end, file_ref, generated_by, created_at, updated_at
     FROM reports
     WHERE org_id = $1
     ORDER BY generated_at DESC`,
    [orgId],
  );
  return res.rows;
}

export async function getReport(
  db: Queryable,
  orgId: string,
  id: string,
): Promise<{ report: ReportRow; content: ReportContent | null }> {
  const res = await db.query<ReportRow>(
    `SELECT id, org_id, project_id, type, generated_at, period_start, period_end, file_ref, generated_by, created_at, updated_at
     FROM reports
     WHERE org_id = $1 AND id = $2`,
    [orgId, id],
  );
  const report = res.rows[0];
  if (!report) throw notFound("report_not_found", "Report not found");

  let content: ReportContent | null = null;
  if (report.file_ref) {
    try {
      content = JSON.parse(report.file_ref);
    } catch {
      content = null;
    }
  }

  return { report, content };
}

export async function createReport(
  db: Queryable,
  orgId: string,
  userId: string | null,
  input: {
    type: ReportType;
    period_start?: string | null;
    period_end?: string | null;
    asset_ids?: string[];
    include_resolved?: boolean;
  },
): Promise<{ report: ReportRow; content: ReportContent }> {
  const validTypes: ReportType[] = ["executive", "technical", "compliance"];
  if (!validTypes.includes(input.type)) {
    throw badRequest("invalid_report_type", `Type must be one of: ${validTypes.join(", ")}`);
  }

  // Fetch org name
  const orgRes = await db.query<{ name: string }>(`SELECT name FROM orgs WHERE id = $1`, [orgId]);
  const orgName = orgRes.rows[0]?.name ?? "Organization";

  // Fetch assets in scope
  const assetRes = await db.query<{ id: string; value: string; type: string; criticality: string }>(
    `SELECT id, value, type, criticality FROM assets WHERE org_id = $1 AND is_active = true`,
    [orgId],
  );
  const assets = assetRes.rows;

  // Fetch findings
  const findingsRes = await db.query<{
    id: string;
    title: string;
    severity: string;
    status: string;
    asset_id: string;
    cwe_id: string | null;
    category: string | null;
    cve_ids: string[] | null;
    first_seen_at: Date | string;
    description: string | null;
    remediation: string | null;
  }>(
    `SELECT id, title, severity, status, asset_id, cwe_id, category, cve_ids, first_seen_at, description, remediation
     FROM findings
     WHERE org_id = $1
     ORDER BY CASE severity
       WHEN 'critical' THEN 1
       WHEN 'high' THEN 2
       WHEN 'medium' THEN 3
       WHEN 'low' THEN 4
       ELSE 5
     END`,
    [orgId],
  );

  const assetMap = new Map<string, string>();
  for (const a of assets) assetMap.set(a.id, a.value);

  const generatedAt = new Date();
  const ageDays = (seen: Date | string): number =>
    Math.max(0, Math.floor((generatedAt.getTime() - new Date(seen).getTime()) / 86_400_000));

  const severityCounts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  const findingsList = findingsRes.rows.map((f) => {
    severityCounts[f.severity] = (severityCounts[f.severity] || 0) + 1;
    const effort: "Low" | "Medium" | "High" =
      f.severity === "critical" ? "High" : f.severity === "high" ? "Medium" : "Low";
    return {
      id: f.id,
      title: f.title,
      severity: f.severity,
      status: f.status,
      asset: assetMap.get(f.asset_id) ?? "unknown",
      cvss: f.severity === "critical" ? 9.2 : f.severity === "high" ? 7.5 : f.severity === "medium" ? 5.3 : 2.0,
      category: f.category ?? f.cwe_id ?? undefined,
      cves: f.cve_ids ?? [],
      age_days: ageDays(f.first_seen_at),
      what_it_is: f.description || `Detected ${f.title} on target asset.`,
      why_it_matters: `Presents security risk allowing unauthorized reconnaissance or manipulation.`,
      remediation: f.remediation || `Follow security guidelines and apply vendor patches.`,
      remediation_effort: effort,
    };
  });

  const securityScore = calculateSecurityScore(findingsRes.rows);

  const topRisks = findingsList
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .slice(0, 3)
    .map((f) => ({
      title: f.title,
      severity: f.severity,
      asset: f.asset,
      impact: f.why_it_matters ?? "Exposes asset to exploitation",
    }));

  // Prioritise by severity first, then by exposure age: an agent goes after the
  // oldest unprotected exposure, so age is a real risk signal (§09.2).
  const SEV_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  const remediationPlan = findingsList
    .filter((f) => f.status === "open" || f.status === "acknowledged")
    .sort(
      (a, b) =>
        (SEV_RANK[a.severity] ?? 9) - (SEV_RANK[b.severity] ?? 9) ||
        b.age_days - a.age_days,
    )
    .map((f, i) => ({
      priority: i + 1,
      title: f.title,
      asset: f.asset,
      severity: f.severity,
      effort: f.remediation_effort ?? "Medium",
      age_days: f.age_days,
      action: f.remediation ?? "Apply configuration fix",
    }));

  const content: ReportContent = {
    id: "",
    org_id: orgId,
    org_name: orgName,
    type: input.type,
    generated_at: generatedAt.toISOString(),
    period_start: input.period_start || null,
    period_end: input.period_end || generatedAt.toISOString(),
    security_score: securityScore,
    summary: {
      total_findings: findingsList.length,
      open_findings: securityScore.openFindingsCount,
      assets_tested: assets.length,
      severity_counts: severityCounts,
    },
    top_risks: topRisks,
    scope: assets.map((a) => ({
      value: a.value,
      type: a.type,
      criticality: a.criticality,
    })),
    findings: findingsList,
    remediation_plan: remediationPlan,
    compliance: mapFindingsToControls(findingsList),
    disclaimer: DISCLAIMER,
  };

  const serialized = JSON.stringify(content);

  const res = await db.query<ReportRow>(
    `INSERT INTO reports (org_id, type, generated_at, period_start, period_end, file_ref, generated_by)
     VALUES ($1, $2, now(), $3, $4, $5, $6)
     RETURNING id, org_id, project_id, type, generated_at, period_start, period_end, file_ref, generated_by, created_at, updated_at`,
    [orgId, input.type, input.period_start ?? null, input.period_end ?? null, serialized, userId],
  );

  const report = res.rows[0];
  content.id = report.id;

  return { report, content };
}
