/**
 * Maps finding categories to compliance controls so a report can double as
 * auditor-facing evidence.
 *
 * This is a *mapping aid*, not an audit opinion. Control references are
 * indicative: ISO/IEC 27001:2022 Annex A and SOC 2 Trust Services Criteria are
 * cited by their published identifiers; BNM RMiT and PDPA are cited at section
 * level rather than inventing paragraph numbers. Extend CONTROL_MAP as new
 * check categories appear — an unmapped category falls through to `_default`
 * so nothing is ever silently dropped.
 */

export interface ComplianceControlRef {
  framework: string;
  control: string;
  title: string;
}

export interface NacsaNciiReportingReference {
  statute: string;
  initial_notification: string;
  prescribed_particulars_hours: number;
  supplementary_report_days: number;
  summary: string;
}

/**
 * Cyber Security Act 2024 (Act 854) / P.U.(A) 220/2024 reporting timeline reference
 * for National Critical Information Infrastructure (NCII) entities.
 */
export const NACSA_NCII_REPORTING_REFERENCE: NacsaNciiReportingReference = {
  statute: "Cyber Security Act 2024 (Act 854) — P.U.(A) 220/2024",
  initial_notification: "Immediate electronic notice upon discovery of a cyber security incident",
  prescribed_particulars_hours: 6,
  supplementary_report_days: 14,
  summary:
    "NCII entities must submit immediate electronic notice upon discovery, prescribed particulars within 6 hours, and a supplementary report within 14 days under P.U.(A) 220/2024.",
};

export const CONTROL_MAP: Record<string, ComplianceControlRef[]> = {
  tls: [
    { framework: "ISO/IEC 27001:2022", control: "A.8.24", title: "Use of cryptography" },
    { framework: "SOC 2", control: "CC6.7", title: "Encryption of data in transit" },
    { framework: "BNM RMiT", control: "Cyber Security", title: "Cryptographic controls and secure protocols" },
    { framework: "PDPA 2024 (Act 709)", control: "s.9", title: "Security Principle" },
  ],
  headers: [
    { framework: "ISO/IEC 27001:2022", control: "A.8.9", title: "Configuration management" },
    { framework: "SOC 2", control: "CC6.6", title: "Boundary protection" },
    { framework: "BNM RMiT", control: "Cyber Security", title: "Secure configuration and hardening" },
  ],
  exposed_service: [
    { framework: "ISO/IEC 27001:2022", control: "A.8.20", title: "Networks security" },
    { framework: "ISO/IEC 27001:2022", control: "A.8.22", title: "Segregation of networks" },
    { framework: "SOC 2", control: "CC6.6", title: "Boundary protection" },
    { framework: "BNM RMiT", control: "Cyber Security", title: "Network perimeter and exposure management" },
    {
      framework: "NACSA NCII (Act 854 / P.U.(A) 220)",
      control: "P.U.(A) 220",
      title: "NCII incident readiness: immediate electronic notice, 6-hour prescribed particulars, 14-day supplementary report",
    },
  ],
  web: [
    { framework: "ISO/IEC 27001:2022", control: "A.8.8", title: "Management of technical vulnerabilities" },
    { framework: "SOC 2", control: "CC7.1", title: "Detection of vulnerabilities" },
    { framework: "BNM RMiT", control: "Cyber Security", title: "Vulnerability assessment and patching" },
    { framework: "PDPA 2024 (Act 709)", control: "s.9 / s.12B", title: "Security Principle & 72h/7d breach notification readiness" },
  ],
  ai_exposure: [
    { framework: "ISO/IEC 27001:2022", control: "A.5.17", title: "Authentication information" },
    { framework: "ISO/IEC 27001:2022", control: "A.8.20", title: "Networks security" },
    { framework: "SOC 2", control: "CC6.1", title: "Logical access security" },
    { framework: "SOC 2", control: "CC7.1", title: "Detection of vulnerabilities" },
    { framework: "BNM RMiT", control: "Cyber Security", title: "Credential management and exposed-service controls" },
    { framework: "PDPA 2024 (Act 709)", control: "s.9 / s.12B", title: "Data Processor Security Principle & breach notification" },
    {
      framework: "NACSA NCII (Act 854 / P.U.(A) 220)",
      control: "P.U.(A) 220",
      title: "NCII incident readiness: immediate electronic notice, 6-hour prescribed particulars, 14-day supplementary report",
    },
  ],
  _default: [
    { framework: "ISO/IEC 27001:2022", control: "A.8.8", title: "Management of technical vulnerabilities" },
    { framework: "SOC 2", control: "CC7.1", title: "Detection of vulnerabilities" },
  ],
};

export const CHECK_CONTROL_MAP: Record<string, ComplianceControlRef[]> = {
  "web.leaked_ai_credentials": [
    { framework: "OWASP Top 10 for LLMs", control: "LLM02", title: "Sensitive Information Disclosure" },
    { framework: "ISO/IEC 42001:2023", control: "A.6.2", title: "Data protection for AI systems" },
    { framework: "SOC 2", control: "CC6.1", title: "Logical access credentials" },
  ],
  "ai.vector_db_chroma": [
    { framework: "OWASP Top 10 for LLMs", control: "LLM02", title: "Sensitive Information Disclosure" },
    { framework: "ISO/IEC 42001:2023", control: "A.6.2", title: "Data protection for AI systems" },
    { framework: "SOC 2", control: "CC6.6", title: "Boundary protection" },
  ],
  "ai.vector_db_qdrant": [
    { framework: "OWASP Top 10 for LLMs", control: "LLM02", title: "Sensitive Information Disclosure" },
    { framework: "ISO/IEC 42001:2023", control: "A.6.2", title: "Data protection for AI systems" },
    { framework: "SOC 2", control: "CC6.6", title: "Boundary protection" },
  ],
  "ai.vector_db_weaviate": [
    { framework: "OWASP Top 10 for LLMs", control: "LLM02", title: "Sensitive Information Disclosure" },
    { framework: "ISO/IEC 42001:2023", control: "A.6.2", title: "Data protection for AI systems" },
    { framework: "SOC 2", control: "CC6.6", title: "Boundary protection" },
  ],
  "ai.vector_db_milvus": [
    { framework: "OWASP Top 10 for LLMs", control: "LLM02", title: "Sensitive Information Disclosure" },
    { framework: "ISO/IEC 42001:2023", control: "A.6.2", title: "Data protection for AI systems" },
    { framework: "SOC 2", control: "CC6.6", title: "Boundary protection" },
  ],
  "ai.exposed_ollama": [
    { framework: "OWASP Top 10 for LLMs", control: "LLM01", title: "Prompt Injection and Model Abuse" },
    { framework: "ISO/IEC 42001:2023", control: "A.8.4", title: "AI system resource access control" },
    { framework: "ISO/IEC 27001:2022", control: "A.8.20", title: "Networks security" },
  ],
  "ai.exposed_vllm": [
    { framework: "OWASP Top 10 for LLMs", control: "LLM01", title: "Prompt Injection and Model Abuse" },
    { framework: "ISO/IEC 42001:2023", control: "A.8.4", title: "AI system resource access control" },
    { framework: "ISO/IEC 27001:2022", control: "A.8.20", title: "Networks security" },
  ],
  "ai.unauth_agent_endpoint": [
    { framework: "OWASP Top 10 for LLMs", control: "LLM06", title: "Excessive Agency" },
    { framework: "ISO/IEC 42001:2023", control: "A.8.5", title: "AI agent authorization controls" },
    { framework: "SOC 2", control: "CC6.6", title: "Boundary protection" },
  ],
};

export interface ComplianceFindingRef {
  id: string;
  title: string;
  severity: string;
  status: string;
  asset: string;
  category?: string | null;
  check_id?: string | null;
}

export interface ComplianceControlResult {
  control: string;
  title: string;
  /** "attention" = at least one open/acknowledged finding maps here. Absence of
   *  findings is not proof of compliance, so it is worded as such. */
  status: "attention" | "no_findings_detected";
  findings: ComplianceFindingRef[];
}

export interface ComplianceFrameworkResult {
  framework: string;
  controls: ComplianceControlResult[];
  open_findings: number;
}

const isOpen = (status: string) => status === "open" || status === "acknowledged";

export function mapFindingsToControls(findings: ComplianceFindingRef[]): ComplianceFrameworkResult[] {
  const byFramework = new Map<string, Map<string, ComplianceControlResult>>();
  const openIdsByFramework = new Map<string, Set<string>>();

  for (const f of findings) {
    const refs: ComplianceControlRef[] =
      (f.check_id ? CHECK_CONTROL_MAP[f.check_id] : null) ??
      CONTROL_MAP[f.category ?? ""] ??
      CONTROL_MAP._default;
    for (const ref of refs) {
      let controls = byFramework.get(ref.framework);
      if (!controls) {
        controls = new Map();
        byFramework.set(ref.framework, controls);
      }
      let entry = controls.get(ref.control);
      if (!entry) {
        entry = { control: ref.control, title: ref.title, status: "no_findings_detected", findings: [] };
        controls.set(ref.control, entry);
      }
      entry.findings.push(f);
      if (isOpen(f.status)) {
        entry.status = "attention";
        let ids = openIdsByFramework.get(ref.framework);
        if (!ids) {
          ids = new Set();
          openIdsByFramework.set(ref.framework, ids);
        }
        ids.add(f.id);
      }
    }
  }

  return [...byFramework.entries()]
    .map(([framework, controls]) => ({
      framework,
      controls: [...controls.values()],
      open_findings: openIdsByFramework.get(framework)?.size ?? 0,
    }))
    .sort((a, b) => a.framework.localeCompare(b.framework));
}

/** One line for the report body: which frameworks the report speaks to. */
export function frameworksCovered(results: ComplianceFrameworkResult[]): string[] {
  return results.map((r) => r.framework);
}
