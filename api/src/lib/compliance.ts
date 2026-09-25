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

export const CONTROL_MAP: Record<string, ComplianceControlRef[]> = {
  tls: [
    { framework: "ISO/IEC 27001:2022", control: "A.8.24", title: "Use of cryptography" },
    { framework: "SOC 2", control: "CC6.7", title: "Encryption of data in transit" },
    { framework: "BNM RMiT", control: "Cyber Security", title: "Cryptographic controls and secure protocols" },
    { framework: "PDPA 2010 (MY)", control: "s.9", title: "Security Principle" },
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
  ],
  web: [
    { framework: "ISO/IEC 27001:2022", control: "A.8.8", title: "Management of technical vulnerabilities" },
    { framework: "SOC 2", control: "CC7.1", title: "Detection of vulnerabilities" },
    { framework: "BNM RMiT", control: "Cyber Security", title: "Vulnerability assessment and patching" },
  ],
  ai_exposure: [
    { framework: "ISO/IEC 27001:2022", control: "A.5.17", title: "Authentication information" },
    { framework: "ISO/IEC 27001:2022", control: "A.8.20", title: "Networks security" },
    { framework: "SOC 2", control: "CC6.1", title: "Logical access security" },
    { framework: "SOC 2", control: "CC7.1", title: "Detection of vulnerabilities" },
    { framework: "BNM RMiT", control: "Cyber Security", title: "Credential management and exposed-service controls" },
  ],
  _default: [
    { framework: "ISO/IEC 27001:2022", control: "A.8.8", title: "Management of technical vulnerabilities" },
    { framework: "SOC 2", control: "CC7.1", title: "Detection of vulnerabilities" },
  ],
};

export interface ComplianceFindingRef {
  id: string;
  title: string;
  severity: string;
  status: string;
  asset: string;
  category?: string | null;
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
    const refs = CONTROL_MAP[f.category ?? ""] ?? CONTROL_MAP._default;
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
