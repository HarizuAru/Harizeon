import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

// Capability copy must match the code. Anything not implemented is marked
// roadmap and says so plainly · a security product does not advertise
// capabilities it has not built (§10.8).
const SERVICE_REGISTRY: Record<
  string,
  {
    code: string;
    name: string;
    category: string;
    description: string;
    status: "available" | "roadmap";
    highlights: string[];
    technicalDetails: string;
  }
> = {
  aia: {
    code: "AIA",
    name: "Harizeon AI-Armor",
    category: "Threat & LLM Perimeter Defense",
    description:
      "Specialized attack surface scanning for LLM inference endpoints, vector databases, agentic MCP servers, and leaked AI provider keys.",
    status: "available",
    highlights: [
      "Unauthenticated local & cloud inference server detection (Ollama, vLLM, LocalAI, LM Studio, TGI).",
      "Vector database and RAG store discovery (ChromaDB, Qdrant, Milvus, Weaviate).",
      "Client-side AI provider API key leak detection (OpenAI, Anthropic, Gemini, DeepSeek, Groq, Mistral, Together AI).",
      "Agent tool execution and Model Context Protocol (MCP) server endpoint exposure.",
      "Direct compliance mapping to OWASP Top 10 for LLMs (LLM01, LLM02, LLM06) and ISO/IEC 42001.",
    ],
    technicalDetails:
      "Non-destructive, benign probes execute in <30 seconds per target by querying metadata and version health endpoints. Never dumps vectors or extracts model weights. Leaked keys are cryptographically verified with Shannon entropy and redacted prior to persistence.",
  },
  asm: {
    code: "ASM",
    name: "Harizeon Surface",
    category: "Attack Surface Discovery",
    description:
      "External attack-surface discovery. New subdomains are found from Certificate Transparency logs and DNS, then held for your review before they can be scanned.",
    status: "available",
    highlights: [
      "Discovers subdomains from Certificate Transparency logs (crt.sh) and DNS resolution.",
      "Strict boundary enforcement: only strict subdomains of a verified asset are accepted, so a buggy or compromised scanner cannot inject arbitrary hosts.",
      "Discovered hosts are created out of scope and must be authorised in the console before scanning.",
      "Alerts you when a new subdomain appears.",
      "Ownership is re-verified continuously and revoked if the proof is lost.",
    ],
    technicalDetails:
      "Discovery runs inside the scan worker. Results cross back to the control plane only as a validated `discovered` event, and are re-checked against the tenant's verified assets before any row is created.",
  },
  pro: {
    code: "PRO",
    name: "Harizeon Probe",
    category: "Perimeter Reconnaissance",
    description: "Non-destructive TCP port probing and service banner identification.",
    status: "available",
    highlights: [
      "TCP connect probing across a common and an extended port set.",
      "Banner capture without exploit delivery · no payloads are ever sent.",
      "Flags services that must not face the internet (unauth Redis, Elasticsearch, Telnet, RDP, VNC).",
      "Resolves the target, drops every non-public address, and connects to the validated IP.",
    ],
    technicalDetails:
      "Runs in an isolated worker container with no database credentials. Egress is restricted to globally routable addresses, and the connection is pinned to the validated address rather than the name.",
  },
  ins: {
    code: "INS",
    name: "Harizeon Inspect",
    category: "TLS & Protocol Audit",
    description: "TLS protocol and certificate checks plus HTTP security-header compliance.",
    status: "available",
    highlights: [
      "Detects accepted legacy protocols: SSLv2, SSLv3, TLS 1.0 and TLS 1.1.",
      "Flags expired certificates and certificates expiring within 14 days.",
      "Audits HSTS, Content-Security-Policy, X-Content-Type-Options and X-Frame-Options.",
      "Reports Server banner disclosure.",
    ],
    technicalDetails:
      "Handshakes are performed against the validated public IP with the hostname used for SNI. If the name has no public address, inspection is skipped rather than pointed at internal infrastructure.",
  },
  adt: {
    code: "ADT",
    name: "Harizeon Audit",
    category: "Compliance & Governance",
    description:
      "Executive and technical reports with a security score, a prioritised remediation plan and compliance control mapping.",
    status: "available",
    highlights: [
      "Executive posture score (0–100) with a prioritised remediation plan.",
      "Findings mapped to ISO/IEC 27001:2022, SOC 2, BNM RMiT and PDPA (MY) controls. Mapping is guidance for your auditor, not an audit opinion.",
      "Print / save-as-PDF export directly from the console.",
      "Append-only audit log of administrative actions.",
    ],
    technicalDetails:
      "Reports are generated from the tenant's own findings inside a transaction with row-level security enforced; reserved-open reads are impossible by construction.",
  },
  vlt: {
    code: "VLT",
    name: "Harizeon Vault",
    category: "Credential & Secret Monitoring",
    description:
      "Planned: monitoring of public repositories and paste sites for credentials belonging to your domain.",
    status: "roadmap",
    highlights: [
      "Not yet available · this service is on the roadmap.",
      "Planned scope: public commit and paste monitoring for your domain's secrets.",
      "Planned: alerting through the existing notification channels.",
    ],
    technicalDetails: "Not implemented. There is no code for this capability in the repository.",
  },
  wch: {
    code: "WCH",
    name: "Harizeon Watch",
    category: "Perimeter & DNS Drift Monitoring",
    description:
      "Planned: continuous uptime, DNS change detection, and web defacement monitoring.",
    status: "roadmap",
    highlights: [
      "Not yet available · this service is on the roadmap (v0.2+).",
      "Continuous DNS record diffing and passive BGP route tracking.",
      "Integrity monitoring for unexpected changes in external web surfaces.",
      "Real-time alerting via Webhook and Email when perimeter drift occurs.",
    ],
    technicalDetails: "Not implemented. Planned for post-v0.1 roadmap (§05).",
  },
  shd: {
    code: "SHD",
    name: "Harizeon Shield",
    category: "Edge Protection & Origin Cloaking",
    description:
      "Planned: edge proxy rules, origin IP hiding, and automated perimeter defenses.",
    status: "roadmap",
    highlights: [
      "Not yet available · this service is on the roadmap (v0.2+).",
      "Automated edge firewall recommendations based on discovered open ports.",
      "Origin IP discovery prevention and reverse-proxy cloaking verification.",
      "Pre-configured rate limiting rules for identified sensitive endpoints.",
    ],
    technicalDetails: "Not implemented. Planned for post-v0.1 roadmap (§05).",
  },
  rsp: {
    code: "RSP",
    name: "Harizeon Respond",
    category: "Incident Triage & Playbooks",
    description:
      "Planned: guided containment workflows and incident remediation playbooks.",
    status: "roadmap",
    highlights: [
      "Not yet available · this service is on the roadmap (v0.2+).",
      "One-click triage playbooks for critical findings (e.g. exposed databases or keys).",
      "Incident containment checklists mapped to BNM RMiT and ISO 27001 requirements.",
      "Exportable forensic audit artifacts for technical teams and external reviewers.",
    ],
    technicalDetails: "Not implemented. Planned for post-v0.1 roadmap (§05).",
  },
};

export async function generateMetadata(props: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await props.params;
  const normalized = code.toLowerCase();
  if (normalized === "scan" || normalized === "scn") {
    return {
      title: "Harizeon Scan (SCN) · Autonomous External Vulnerability Scanner",
      description:
        "Non-destructive external vulnerability scanning: port probing, TLS and certificate checks, exposed files and admin panels, AI-exposure checks, and known-CVE matching.",
    };
  }
  const service = SERVICE_REGISTRY[normalized];
  if (!service) {
    return { title: "Service Specification" };
  }
  return {
    title: `${service.name} (${service.code}) · Harizeon Specification`,
    description: service.description,
  };
}

export default async function ServiceDetailPage(props: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await props.params;
  const normalized = code.toLowerCase();
  if (normalized === "scan" || normalized === "scn") {
    redirect("/services/scan");
  }

  const service = SERVICE_REGISTRY[normalized];

  if (!service) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl flex flex-col gap-10">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-muted mb-4">
              <Link href="/services" className="hover:text-ink">Services</Link>
              <span>/</span>
              <span className="text-ink font-bold">{service.code}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="border-2 border-ink px-3 py-1 font-mono text-base font-bold text-ink">
                {service.code}
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink font-sans">
                {service.name}
              </h1>
              <span
                className={`px-2 py-0.5 font-mono text-[10px] uppercase ${
                  service.status === "available"
                    ? "border border-ink bg-ink text-canvas font-bold"
                    : "border border-line text-muted"
                }`}
              >
                {service.status}
              </span>
            </div>

            <p className="mt-4 text-base text-muted max-w-2xl font-sans leading-relaxed">
              {service.description}
            </p>

            {service.status !== "available" && (
              <div className="mt-6 border border-ink bg-subtle p-4">
                <p className="font-mono text-xs text-ink leading-relaxed">
                  <span className="font-bold">NOT YET AVAILABLE.</span> This service is planned and
                  has no implementation in the product. Nothing on this page is shipped today.
                </p>
              </div>
            )}
          </div>

          <div className="border border-line bg-canvas p-8">
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink mb-4">
              Key Capabilities & Guardrails
            </h2>
            <ul className="flex flex-col gap-3 font-mono text-xs text-muted">
              {service.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <span className="text-ink font-bold">•</span>
                  <span className="leading-relaxed">{h}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-6 border-t border-line">
              <span className="font-mono text-xs font-bold uppercase text-ink block mb-1">
                Technical Architecture:
              </span>
              <p className="font-mono text-xs text-muted leading-relaxed">
                {service.technicalDetails}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-line pt-6">
            <Link
              href="/services"
              className="border border-line px-4 py-2 font-mono text-xs uppercase hover:border-ink"
            >
              ← Back to Services Matrix
            </Link>
            {service.status === "available" ? (
              <Link
                href="/signup"
                className="border border-ink bg-ink text-canvas px-6 py-2 font-mono text-xs uppercase font-bold hover:bg-canvas hover:text-ink transition-colors"
              >
                Start Free Trial →
              </Link>
            ) : (
              <span className="border border-line px-6 py-2 font-mono text-xs uppercase text-muted">
                Roadmap · not yet available
              </span>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
