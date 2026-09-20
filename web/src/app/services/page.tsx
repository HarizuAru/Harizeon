import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Services Matrix — Harizeon",
  description: "Comprehensive catalog of Harizeon external security, attack surface monitoring, and compliance services.",
};

const ALL_SERVICES = [
  {
    code: "SCN",
    name: "Harizeon Scan",
    description: "Multi-phase active/passive vulnerability scanner. Non-destructive port probing, TLS cipher suite audit, web server fingerprinting, and automated CVE correlation.",
    status: "available",
    href: "/services/scan",
    features: [
      "Top 100 & Full port inspection",
      "TLS 1.0/1.1 deprecation & weak cipher discovery",
      "Template-driven web checks (actuator, swagger, git, env)",
      "Automated CVE mapping from NIST NVD feeds",
      "Deduplicated findings with reproduction cURL",
    ],
  },
  {
    code: "ASM",
    name: "Harizeon Surface",
    description: "Continuous external attack surface management. Automated subdomain discovery across Certificate Transparency logs and DNS zone enumeration.",
    status: "available",
    href: "/services/scan",
    features: [
      "CT log monitoring (crt.sh & Google CT logs)",
      "Strict subdomain boundary enforcement",
      "DNS record drift & orphan record alerts",
      "CNAME takeover vulnerability detection",
      "Asset criticality labeling",
    ],
  },
  {
    code: "PRO",
    name: "Harizeon Probe",
    description: "Lightweight, highly optimized port reconnaissance engine designed for fast boundary probing without triggering IDS rate limits.",
    status: "available",
    href: "/services/scan",
    features: [
      "SYN and TCP connect probes",
      "Dynamic rate limiting & backoff",
      "Ephemeral worker execution",
      "Banner extraction without exploit delivery",
    ],
  },
  {
    code: "INS",
    name: "Harizeon Inspect",
    description: "Deep cryptographic protocol analysis. Audit TLS certificates, CAA records, HSTS preload, and Content-Security-Policy configurations.",
    status: "available",
    href: "/services/scan",
    features: [
      "Certificate chain & root trust validation",
      "SSLv2, SSLv3, TLS 1.0, and TLS 1.1 deprecation checks",
      "HSTS preload and CSP header validation",
      "Automated expiry alert thresholds (30d / 7d)",
    ],
  },
  {
    code: "VLT",
    name: "Harizeon Vault",
    description: "Automated reconnaissance of public GitHub repositories, Pastebin dumps, and compromised credential feeds for your company domain.",
    status: "beta",
    href: "/services/scan",
    features: [
      "Monitors public repository and paste dumps",
      "High-precision token pattern detection",
      "Company domain & identity correlation",
      "Automated exposure alerting",
    ],
  },
  {
    code: "ADT",
    name: "Harizeon Audit",
    description: "Generate boardroom-ready executive security summaries and technical compliance annexes for ISO 27001, SOC 2, and Malaysian CCA audits.",
    status: "available",
    href: "/services/scan",
    features: [
      "Executive posture scorecards (0–100)",
      "ISO 27001 & SOC 2 compliance mapping",
      "Malaysian Cyber Security Act (CCA) annexes",
      "Immutable, cryptographically verifiable logs",
    ],
  },
  {
    code: "WCH",
    name: "Harizeon Watch",
    description: "Real-time external telemetry streaming and automated alert generation for unauthorized DNS shifts or newly exposed services.",
    status: "coming soon",
    href: "/services/scan",
  },
  {
    code: "SHD",
    name: "Harizeon Shield",
    description: "Virtual patching recommendations and automated WAF rule exports (Cloudflare, AWS WAF, ModSecurity) directly from confirmed scan findings.",
    status: "coming soon",
    href: "/services/scan",
  },
  {
    code: "GRD",
    name: "Harizeon Guard",
    description: "CI/CD pull-request security gates and automated deployment policy compliance preventing exposed assets from hitting production.",
    status: "coming soon",
    href: "/services/scan",
  },
];

export default function ServicesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="border-b border-line pb-8 mb-12">
            <span className="font-mono text-xs uppercase tracking-wider text-muted block mb-2">
              Catalog & Capabilities
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-ink font-sans">
              Services & Infrastructure
            </h1>
            <p className="mt-2 text-sm text-muted max-w-2xl font-sans leading-relaxed">
              Every Harizeon service operates strictly on verified perimeter assets. Inspect our specialized security capabilities below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ALL_SERVICES.map((s) => (
              <div
                key={s.code}
                className="border border-line bg-canvas p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="border border-ink px-2.5 py-0.5 font-mono text-xs font-bold text-ink">
                      {s.code}
                    </span>
                    <span className="border border-line px-2 py-0.5 font-mono text-[10px] uppercase text-muted">
                      {s.status}
                    </span>
                  </div>

                  <h2 className="mt-4 font-mono text-lg font-bold text-ink">
                    {s.name}
                  </h2>
                  <p className="mt-2 text-xs text-muted font-sans leading-relaxed">
                    {s.description}
                  </p>

                  {s.features && (
                    <ul className="mt-4 pt-4 border-t border-line flex flex-col gap-1.5 font-mono text-[11px] text-muted">
                      {s.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <span className="text-ink">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-line">
                  <Link
                    href={s.href}
                    className="inline-block border border-ink bg-canvas px-4 py-2 font-mono text-xs uppercase text-ink hover:bg-ink hover:text-canvas transition-colors"
                  >
                    View Specifications →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
