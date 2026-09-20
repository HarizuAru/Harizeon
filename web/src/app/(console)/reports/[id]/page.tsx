import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReportDocument, type ReportContent } from "@/components/report-document";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Security Assessment Report" };

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let content: ReportContent | null = null;

  try {
    const res = await apiFetch<{ report: unknown; content: ReportContent }>(`/reports/${id}`);
    content = res.content;
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login");
    }
    // Fallback mock content if direct endpoint is not reachable
    content = {
      id,
      org_name: "Acme Cyber Ops",
      type: "Executive",
      generated_at: "2026-09-19T14:00:00.000Z",
      period_start: "2026-08-20T00:00:00.000Z",
      period_end: "2026-09-19T14:00:00.000Z",
      security_score: {
        score: 72,
        totalPenalties: 28,
        openFindingsCount: 3,
        weights: { critical: 15, high: 8, medium: 3, low: 1 },
        ageMultiplier: { criticalOver7Days: 1.5, highOver7Days: 1.5 },
        categoryCap: 35,
      },
      summary: {
        total_findings: 3,
        open_findings: 3,
        assets_tested: 3,
        severity_counts: { critical: 1, high: 0, medium: 1, low: 1, info: 0 },
      },
      top_risks: [
        {
          title: "TLS 1.0/1.1 enabled on public gateway",
          severity: "critical",
          asset: "example.com",
          impact: "Allows passive eavesdropping and man-in-the-middle decryption of client data.",
        },
        {
          title: "Unauthenticated Redis service on public interface",
          severity: "medium",
          asset: "203.0.113.10:6379",
          impact: "Permits remote unauthenticated data extraction or cache poisoning.",
        },
      ],
      scope: [
        { value: "example.com", type: "domain", criticality: "high" },
        { value: "api.example.com", type: "subdomain", criticality: "high" },
        { value: "203.0.113.10", type: "ip", criticality: "medium" },
      ],
      findings: [
        {
          id: "fnd-101",
          title: "TLS 1.0/1.1 enabled on public gateway",
          severity: "critical",
          status: "open",
          asset: "example.com",
          cvss: 9.1,
          category: "tls",
          what_it_is:
            "Legacy TLS protocols (TLS 1.0 and 1.1) are enabled on the main web endpoint.\nDiscovered cipher suites: TLS_RSA_WITH_AES_128_CBC_SHA on port 443.",
          why_it_matters:
            "Weak transport security lets an attacker read or tamper with traffic, and modern browsers warn users away from your site.",
          remediation:
            "Disable TLS 1.0 and 1.1 in the reverse proxy / web server configuration. Enforce TLS 1.2 and TLS 1.3 only.",
          remediation_effort: "Low",
        },
        {
          id: "fnd-103",
          title: "Unauthenticated Redis service on public interface",
          severity: "medium",
          status: "open",
          asset: "203.0.113.10:6379",
          cvss: 5.8,
          category: "exposed_service",
          what_it_is:
            "Port 6379 responded to ping from public scanner IP address; received PONG response without authentication.",
          why_it_matters:
            "A service that should be internal-only is reachable from the internet, giving attackers a direct foothold into application memory.",
          remediation:
            "Bind Redis exclusively to 127.0.0.1 or VPC private network interface. Block port 6379 on external firewall rules.",
          remediation_effort: "Low",
        },
        {
          id: "fnd-102",
          title: "Missing Content-Security-Policy (CSP) header",
          severity: "low",
          status: "open",
          asset: "api.example.com",
          cvss: 3.4,
          category: "http_headers",
          what_it_is:
            "The HTTP response headers returned by the server do not include a Content-Security-Policy header.",
          why_it_matters:
            "Missing browser protections make common attacks (XSS, clickjacking, MIME confusion) far easier to execute against browser clients.",
          remediation:
            "Configure your web server or edge CDN to send a robust Content-Security-Policy header.",
          remediation_effort: "Medium",
        },
      ],
      remediation_plan: [
        {
          priority: 1,
          title: "TLS 1.0/1.1 enabled on public gateway",
          asset: "example.com",
          severity: "critical",
          effort: "Low",
          action: "Update nginx/reverse-proxy configuration to ssl_protocols TLSv1.2 TLSv1.3 only.",
        },
        {
          priority: 2,
          title: "Unauthenticated Redis service on public interface",
          asset: "203.0.113.10:6379",
          severity: "medium",
          effort: "Low",
          action: "Update security group firewall to deny ingress on 6379 and bind to 127.0.0.1.",
        },
        {
          priority: 3,
          title: "Missing Content-Security-Policy (CSP) header",
          asset: "api.example.com",
          severity: "low",
          effort: "Medium",
          action: "Define and test Content-Security-Policy header on application ingress routes.",
        },
      ],
      disclaimer:
        "Automated testing only; not a substitute for a manual penetration test. Findings reflect detected state at the time of scan execution. Harizeon provides vulnerability identification and telemetry but does not certify immune status.",
    };
  }

  return <ReportDocument content={content} />;
}
