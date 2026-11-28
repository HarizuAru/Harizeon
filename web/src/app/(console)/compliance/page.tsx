import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ComplianceDashboard, type FrameworkData } from "@/components/compliance-dashboard";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Compliance Readiness" };

const defaultFrameworks: FrameworkData[] = [
  {
    framework_code: "pdpa_2024",
    framework_name: "PDPA 2024 (Malaysia)",
    authority: "Personal Data Protection Commissioner (JPDP)",
    jurisdiction: "Malaysia · Act 709 (2024 Amendment)",
    controls: [
      {
        control_code: "PDPA-S9",
        control_title: "Security Principle (Section 9)",
        description: "Mandates practical steps to protect personal data from loss, misuse, modification, unauthorized access, or accidental disclosure.",
        mapped_findings_count: 2,
        open_findings_count: 0,
        status: "pass",
      },
      {
        control_code: "PDPA-BREACH",
        control_title: "Mandatory Data Breach Prevention",
        description: "Enforces continuous perimeter oversight to prevent exposure of databases, secrets, and customer PII triggering statutory 72-hour breach notification.",
        mapped_findings_count: 3,
        open_findings_count: 1,
        status: "attention_required",
        sample_finding_title: "Client-Side AI API Token Disclosed in JavaScript Bundle",
      },
      {
        control_code: "PDPA-ENCRYPT",
        control_title: "Cryptographic Transit Standards",
        description: "Ensures all public communications and authentication tokens are encrypted using non-deprecated TLS protocols.",
        mapped_findings_count: 4,
        open_findings_count: 0,
        status: "pass",
      },
      {
        control_code: "PDPA-ACCESS",
        control_title: "Perimeter Access Controls",
        description: "Ensures internal administrative endpoints and database listener ports are never exposed to the public internet.",
        mapped_findings_count: 1,
        open_findings_count: 0,
        status: "pass",
      },
    ],
  },
  {
    framework_code: "bnm_rmit",
    framework_name: "BNM RMiT (Financial Services)",
    authority: "Bank Negara Malaysia (BNM)",
    jurisdiction: "Malaysia · Financial Institutions & Fintechs",
    controls: [
      {
        control_code: "RMiT-10.39",
        control_title: "System & Perimeter Hardening",
        description: "Institutions must implement secure baseline configurations, disable unnecessary services/ports, and enforce strong TLS parameters.",
        mapped_findings_count: 4,
        open_findings_count: 1,
        status: "attention_required",
        sample_finding_title: "Missing Strict-Transport-Security Header",
      },
      {
        control_code: "RMiT-10.56",
        control_title: "Continuous Vulnerability Monitoring",
        description: "Mandates ongoing automated scanning and asset discovery to identify and remediate perimeter weaknesses on internet-facing systems.",
        mapped_findings_count: 5,
        open_findings_count: 0,
        status: "pass",
      },
      {
        control_code: "RMiT-11.12",
        control_title: "Third-Party & API Exposure",
        description: "Prohibits unauthenticated API schema introspection and leaked service tokens on public endpoints.",
        mapped_findings_count: 2,
        open_findings_count: 0,
        status: "pass",
      },
      {
        control_code: "RMiT-12.04",
        control_title: "DNS & Email Domain Integrity",
        description: "Requires protective DNS controls, DMARC/SPF email spoofing defense, and monitoring for dangling DNS takeover vectors.",
        mapped_findings_count: 1,
        open_findings_count: 0,
        status: "pass",
      },
    ],
  },
  {
    framework_code: "iso_27001",
    framework_name: "ISO / IEC 27001:2022",
    authority: "International Organization for Standardization",
    jurisdiction: "Global · Enterprise Information Security",
    controls: [
      {
        control_code: "A.8.9",
        control_title: "Configuration Management",
        description: "Security configurations for hardware, software, services and networks must be established, documented, implemented, and monitored.",
        mapped_findings_count: 5,
        open_findings_count: 1,
        status: "attention_required",
        sample_finding_title: "Missing Strict-Transport-Security Header",
      },
      {
        control_code: "A.8.20",
        control_title: "Networks Security",
        description: "Networks must be secured, managed, and controlled to protect information in systems and applications.",
        mapped_findings_count: 3,
        open_findings_count: 0,
        status: "pass",
      },
      {
        control_code: "A.8.24",
        control_title: "Use of Cryptography",
        description: "Rules for the effective use of cryptography, including cryptographic key management and modern cipher suites, must be defined and applied.",
        mapped_findings_count: 4,
        open_findings_count: 0,
        status: "pass",
      },
      {
        control_code: "A.8.8",
        control_title: "Management of Technical Vulnerabilities",
        description: "Information about technical vulnerabilities of information systems being used must be obtained in a timely fashion.",
        mapped_findings_count: 6,
        open_findings_count: 0,
        status: "pass",
      },
    ],
  },
];

export default async function CompliancePage() {
  let frameworks = defaultFrameworks;

  try {
    const res = await apiFetch<{ frameworks: FrameworkData[] }>("/compliance/summary");
    if (res.frameworks && res.frameworks.length > 0) {
      frameworks = res.frameworks;
    }
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login");
    }
  }

  return <ComplianceDashboard initialFrameworks={frameworks} />;
}
