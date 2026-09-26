import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Services Matrix — Harizeon",
  description:
    "Harizeon external attack-surface, scanning, and compliance services — only shipped capabilities are listed here.",
};

// This catalog lists ONLY capabilities that exist in the code today. Planned
// capabilities are not advertised until they are implemented (§10.8: a security
// product does not advertise what it cannot do). Descriptions must match the
// shipped check set.
const ALL_SERVICES = [
  {
    code: "SCN",
    name: "Harizeon Scan",
    href: "/services/scan",
    description:
      "Non-destructive, multi-phase external scanner. Port and service probing, TLS inspection, security-header review and template-driven web checks.",
    features: [
      "TCP connect port probing with banner capture (no exploit payloads)",
      "TLS protocol acceptance (SSLv2/3, TLS 1.0/1.1) and certificate expiry",
      "Web checks: .git, .env, SQL dumps, phpinfo, Swagger UI, Actuator",
      "AI exposure: unauthenticated model endpoints and provider keys leaked in client-side JavaScript",
      "Known-CVE matching for software versions identified from service banners (curated set)",
      "Deduplicated findings with evidence, remediation and status workflow",
    ],
  },
  {
    code: "ASM",
    name: "Harizeon Surface",
    href: "/services/asm",
    description:
      "External attack-surface discovery. New subdomains are found from Certificate Transparency logs and DNS, then held for your review before they are scanned.",
    features: [
      "Subdomain discovery from Certificate Transparency logs (crt.sh) and DNS",
      "Strict boundary enforcement: only strict subdomains of a verified asset are accepted",
      "Discovered hosts start out of scope and need explicit authorisation",
      "Alert when a new subdomain appears",
      "Ownership re-verified continuously; revoked on loss",
    ],
  },
  {
    code: "PRO",
    name: "Harizeon Probe",
    href: "/services/pro",
    description:
      "Non-destructive TCP port probing and service banner identification across a common and an extended port set.",
    features: [
      "TCP connect probing (common + extended port sets)",
      "Banner capture without exploit delivery",
      "Flags services that must not face the internet (unauth Redis, Elasticsearch, Telnet, RDP, VNC)",
      "Connects only to validated public addresses",
      "Isolated workers with no database access",
    ],
  },
  {
    code: "INS",
    name: "Harizeon Inspect",
    href: "/services/ins",
    description: "TLS protocol and certificate checks plus HTTP security-header compliance.",
    features: [
      "Legacy protocol detection (SSLv2/SSLv3, TLS 1.0, TLS 1.1)",
      "Certificate expiry (expired, or expiring within 14 days)",
      "Header audit: HSTS, Content-Security-Policy, X-Content-Type-Options, X-Frame-Options",
      "Server banner disclosure",
    ],
  },
  {
    code: "ADT",
    name: "Harizeon Audit",
    href: "/services/adt",
    description:
      "Executive and technical reports with a security score, prioritised remediation plan and compliance control mapping.",
    features: [
      "Executive posture score (0–100) and remediation plan",
      "Findings mapped to ISO/IEC 27001:2022, SOC 2, BNM RMiT and PDPA (MY) controls",
      "Print / save-as-PDF export",
      "Append-only audit log",
    ],
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
              Catalog &amp; Capabilities
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-ink font-sans">
              Services &amp; Infrastructure
            </h1>
            <p className="mt-2 text-sm text-muted max-w-2xl font-sans leading-relaxed">
              Every Harizeon service operates strictly on verified perimeter assets — only an asset
              you have proven you own can be scanned. Everything listed here is available today.
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
                    <span className="border border-ink bg-ink px-2 py-0.5 font-mono text-[10px] uppercase text-canvas font-bold">
                      available
                    </span>
                  </div>

                  <h2 className="mt-4 font-mono text-lg font-bold text-ink">
                    {s.name}
                  </h2>
                  <p className="mt-2 text-xs text-muted font-sans leading-relaxed">
                    {s.description}
                  </p>

                  <ul className="mt-4 pt-4 border-t border-line flex flex-col gap-1.5 font-mono text-[11px] text-muted">
                    {s.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="text-ink">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
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
