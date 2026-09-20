import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

const SERVICE_REGISTRY: Record<
  string,
  {
    code: string;
    name: string;
    category: string;
    description: string;
    status: string;
    highlights: string[];
    technicalDetails: string;
  }
> = {
  asm: {
    code: "ASM",
    name: "Harizeon Surface",
    category: "Attack Surface Discovery",
    description:
      "Continuous external attack surface management. Tracks subdomains, DNS records, and orphan infrastructure without blind spots.",
    status: "available",
    highlights: [
      "Monitors Certificate Transparency logs globally in near-real-time.",
      "Strict subdomain validation: prevents scope creep outside verified root domains.",
      "Detects DNS dangling CNAME records susceptible to subdomain takeover.",
      "Automatic correlation with Harizeon Scan to trigger scans on newly discovered endpoints.",
    ],
    technicalDetails:
      "Worker queries crt.sh and Google CT API streams. Any discovered host is matched against verified tenant assets before insertion.",
  },
  pro: {
    code: "PRO",
    name: "Harizeon Probe",
    category: "Perimeter Reconnaissance",
    description:
      "Fast, non-destructive network port probing and service banner identification.",
    status: "available",
    highlights: [
      "SYN and TCP Connect scan modes with graceful rate backoff.",
      "No exploit payloads sent: 100% non-destructive banner discovery.",
      "Identifies unencrypted management services (Telnet, RDP, VNC, unauth Redis/Elasticsearch).",
    ],
    technicalDetails:
      "Ephemeral containerized workers dispatched via Redis Streams. Output normalized into standard service records.",
  },
  ins: {
    code: "INS",
    name: "Harizeon Inspect",
    category: "Cryptographic & Protocol Audit",
    description:
      "Cryptographic posture evaluation, TLS certificate verification, and modern HTTP header compliance.",
    status: "available",
    highlights: [
      "Evaluates TLS cipher suites against NIST SP 800-52r2 guidelines.",
      "Monitors certificate validity, revocation status (OCSP/CRL), and automated renewal failures.",
      "Audits CSP, HSTS, X-Content-Type-Options, and Referrer-Policy headers.",
    ],
    technicalDetails:
      "Deep handshake inspection across TLS 1.0, 1.1, 1.2, and 1.3 protocol variants.",
  },
  vlt: {
    code: "VLT",
    name: "Harizeon Vault",
    category: "Credential & Secret Monitoring",
    description:
      "Continuous scanning of public repositories, pasties, and data leaks for exposed credentials.",
    status: "beta",
    highlights: [
      "Searches public GitHub commits and gists for leaked domain secrets and API keys.",
      "Monitors public breach indexes for compromised corporate email credentials.",
      "Immediate alert dispatch via Webhooks and Slack upon detected compromise.",
    ],
    technicalDetails:
      "High-frequency ingestion of public commit streams filtered through high-entropy regex patterns.",
  },
  adt: {
    code: "ADT",
    name: "Harizeon Audit",
    category: "Compliance & Governance",
    description:
      "Print-optimized executive compliance summaries and technical audit trail exports.",
    status: "available",
    highlights: [
      "Generates board-ready Executive Security Summaries with overall security posture scores.",
      "Technical finding registers categorized by CVSS v3.1 score and remediation urgency.",
      "Pre-mapped against ISO/IEC 27001:2022 Control A.8.8 and PCI DSS v4.0 Requirement 11.3.",
    ],
    technicalDetails:
      "Native HTML print-engine with custom page numbering, black & white high-contrast styling, and verified cryptographic signatures.",
  },
};

export async function generateMetadata(props: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await props.params;
  const service = SERVICE_REGISTRY[code.toLowerCase()];
  if (!service) {
    return { title: "Service Specification" };
  }
  return {
    title: `${service.name} (${service.code}) — Harizeon Specification`,
    description: service.description,
  };
}

export default async function ServiceDetailPage(props: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await props.params;
  const service = SERVICE_REGISTRY[code.toLowerCase()];

  if (!service) {
    if (code.toLowerCase() === "scan") {
      // Handled by /services/scan
    }
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

            <div className="flex items-center gap-3">
              <span className="border-2 border-ink px-3 py-1 font-mono text-base font-bold text-ink">
                {service.code}
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink font-sans">
                {service.name}
              </h1>
            </div>

            <p className="mt-4 text-base text-muted max-w-2xl font-sans leading-relaxed">
              {service.description}
            </p>
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
            <Link
              href="/signup"
              className="border border-ink bg-ink text-canvas px-6 py-2 font-mono text-xs uppercase font-bold hover:bg-canvas hover:text-ink transition-colors"
            >
              Start Free Trial →
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
