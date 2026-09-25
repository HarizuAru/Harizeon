import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Services Matrix — Harizeon",
  description:
    "Harizeon external attack-surface, scanning, and compliance services. Only capabilities marked available are shipped today.",
};

// Descriptions here must match the code that actually exists. If a capability
// is not implemented, it belongs in the roadmap section — never in a feature
// list (§10.8: a security product does not advertise what it cannot do).
const ALL_SERVICES = [
  {
    code: "SCN",
    name: "Harizeon Scan",
    status: "available",
    href: "/services/scan",
    description:
      "Non-destructive, multi-phase external scanner. Port and service probing, TLS inspection, security-header review and template-driven web checks.",
    features: [
      "TCP connect port probing with banner capture (no exploit payloads)",
      "TLS protocol acceptance (SSLv2/3, TLS 1.0/1.1) and certificate expiry",
      "Web checks: .git, .env, SQL dumps, phpinfo, Swagger UI, Actuator",
      "AI exposure: unauthenticated model endpoints and provider keys leaked in client-side JavaScript",
      "Deduplicated findings with evidence, remediation and status workflow",
    ],
  },
  {
    code: "ASM",
    name: "Harizeon Surface",
    status: "available",
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
    status: "available",
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
    status: "available",
    href: "/services/ins",
    description:
      "TLS protocol and certificate checks plus HTTP security-header compliance.",
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
    status: "available",
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
  {
    code: "VLT",
    name: "Harizeon Vault",
    status: "roadmap",
    description:
      "Planned: monitoring of public repositories and paste sites for credentials belonging to your domain.",
  },
  {
    code: "WCH",
    name: "Harizeon Watch",
    status: "roadmap",
    description:
      "Planned: streaming external telemetry and alerting beyond new-subdomain notifications.",
  },
  {
    code: "SHD",
    name: "Harizeon Shield",
    status: "roadmap",
    description:
      "Planned: virtual-patching and WAF rule exports (Cloudflare, AWS WAF, ModSecurity) from confirmed findings.",
  },
  {
    code: "GRD",
    name: "Harizeon Guard",
    status: "roadmap",
    description:
      "Planned: CI/CD pull-request checks that prevent exposed assets reaching production.",
  },
];

export default function ServicesPage() {
  const available = ALL_SERVICES.filter((s) => s.status === "available").length;

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="border-b border-line pb-8 mb-8">
            <span className="font-mono text-xs uppercase tracking-wider text-muted block mb-2">
              Catalog &amp; Capabilities
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-ink font-sans">
              Services &amp; Infrastructure
            </h1>
            <p className="mt-2 text-sm text-muted max-w-2xl font-sans leading-relaxed">
              Every Harizeon service operates strictly on verified perimeter assets. Only an asset
              you have proven you own can be scanned.
            </p>
          </div>

          <div className="border border-ink bg-subtle p-4 mb-10">
            <p className="font-mono text-xs text-ink leading-relaxed">
              <span className="font-bold">STATUS DISCLOSURE:</span> {available} of {ALL_SERVICES.length}{" "}
              services are available today. Items marked{" "}
              <span className="border border-ink px-1.5 py-0.5 font-bold">ROADMAP</span> are planned
              and have no implementation in the product yet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ALL_SERVICES.map((s) => {
              const isAvailable = s.status === "available";
              return (
                <div
                  key={s.code}
                  className={`border bg-canvas p-6 flex flex-col justify-between ${
                    isAvailable ? "border-line" : "border-line border-dashed"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`border px-2.5 py-0.5 font-mono text-xs font-bold ${
                          isAvailable ? "border-ink text-ink" : "border-line text-muted"
                        }`}
                      >
                        {s.code}
                      </span>
                      <span
                        className={`px-2 py-0.5 font-mono text-[10px] uppercase ${
                          isAvailable
                            ? "border border-ink bg-ink text-canvas font-bold"
                            : "border border-line text-muted"
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>

                    <h2 className={`mt-4 font-mono text-lg font-bold ${isAvailable ? "text-ink" : "text-muted"}`}>
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
                    {isAvailable && s.href ? (
                      <Link
                        href={s.href}
                        className="inline-block border border-ink bg-canvas px-4 py-2 font-mono text-xs uppercase text-ink hover:bg-ink hover:text-canvas transition-colors"
                      >
                        View Specifications →
                      </Link>
                    ) : (
                      <span className="inline-block border border-line px-4 py-2 font-mono text-xs uppercase text-muted">
                        Not yet available
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
