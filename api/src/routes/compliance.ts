import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { withTx, type Queryable } from "../db";

export interface ControlSummary {
  control_code: string;
  control_title: string;
  description: string;
  mapped_findings_count: number;
  open_findings_count: number;
  status: "pass" | "attention_required";
  sample_finding_title?: string;
}

export interface FrameworkData {
  framework_code: "pdpa_2024" | "bnm_rmit" | "iso_27001";
  framework_name: string;
  authority: string;
  jurisdiction: string;
  controls: ControlSummary[];
}

const FRAMEWORK_META: Record<
  "pdpa_2024" | "bnm_rmit" | "iso_27001",
  { framework_name: string; authority: string; jurisdiction: string }
> = {
  pdpa_2024: {
    framework_name: "PDPA 2024 (Malaysia)",
    authority: "Personal Data Protection Commissioner (JPDP)",
    jurisdiction: "Malaysia · Act 709 (2024 Amendment)",
  },
  bnm_rmit: {
    framework_name: "BNM RMiT (Financial Services)",
    authority: "Bank Negara Malaysia (BNM)",
    jurisdiction: "Malaysia · Financial Institutions & Fintechs",
  },
  iso_27001: {
    framework_name: "ISO / IEC 27001:2022",
    authority: "International Organization for Standardization",
    jurisdiction: "Global · Enterprise Information Security",
  },
};

export async function getComplianceSummary(db: Queryable, orgId: string): Promise<{ frameworks: FrameworkData[] }> {
  const rows = await db.query<{
    framework: "pdpa_2024" | "bnm_rmit" | "iso_27001";
    control_code: string;
    control_title: string;
    description: string;
    mapped_findings_count: string | number;
    open_findings_count: string | number;
    sample_finding_title: string | null;
  }>(
    `SELECT
       c.framework,
       c.control_code,
       c.control_title,
       c.description,
       COALESCE(COUNT(DISTINCT f.id), 0)::int AS mapped_findings_count,
       COALESCE(COUNT(DISTINCT CASE WHEN f.status = 'open' THEN f.id END), 0)::int AS open_findings_count,
       MAX(CASE WHEN f.status = 'open' THEN f.title END) AS sample_finding_title
     FROM compliance_controls c
     LEFT JOIN check_control_mappings m ON m.control_id = c.id
     LEFT JOIN findings f ON f.org_id = $1 AND (f.check_id = m.check_id OR f.category = m.check_id)
     GROUP BY c.id, c.framework, c.control_code, c.control_title, c.description
     ORDER BY c.framework, c.control_code`,
    [orgId],
  );

  const byFramework: Record<string, ControlSummary[]> = {
    pdpa_2024: [],
    bnm_rmit: [],
    iso_27001: [],
  };

  for (const r of rows.rows) {
    const openCount = Number(r.open_findings_count);
    const mappedCount = Number(r.mapped_findings_count);
    const ctrl: ControlSummary = {
      control_code: r.control_code,
      control_title: r.control_title,
      description: r.description,
      mapped_findings_count: mappedCount,
      open_findings_count: openCount,
      status: openCount > 0 ? "attention_required" : "pass",
    };
    if (r.sample_finding_title && openCount > 0) {
      ctrl.sample_finding_title = r.sample_finding_title;
    }
    if (byFramework[r.framework]) {
      byFramework[r.framework].push(ctrl);
    }
  }

  const frameworks: FrameworkData[] = (["pdpa_2024", "bnm_rmit", "iso_27001"] as const).map((code) => ({
    framework_code: code,
    framework_name: FRAMEWORK_META[code].framework_name,
    authority: FRAMEWORK_META[code].authority,
    jurisdiction: FRAMEWORK_META[code].jurisdiction,
    controls: byFramework[code] ?? [],
  }));

  return { frameworks };
}

export async function complianceRoutes(app: FastifyInstance) {
  // GET /v1/compliance/summary — evaluate regulatory controls vs open findings
  app.get("/compliance/summary", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    return withTx((c) => getComplianceSummary(c, orgId), orgId);
  });
}
