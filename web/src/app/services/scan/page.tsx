import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Harizeon Scan (SCN) — Autonomous External Vulnerability Scanner",
  description:
    "Active and passive vulnerability assessment engine. Non-destructive port probing, TLS verification, CVE matching, and reproducible findings.",
};

export default function ServiceScanPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl flex flex-col gap-12">
          {/* Header & Breadcrumb */}
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-muted mb-4">
              <Link href="/services" className="hover:text-ink">Services</Link>
              <span>/</span>
              <span className="text-ink font-bold">SCN</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="border-2 border-ink px-3 py-1 font-mono text-base font-bold text-ink">
                SCN
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink font-sans">
                Harizeon Scan
              </h1>
            </div>

            <p className="mt-4 text-base text-muted max-w-2xl font-sans leading-relaxed">
              An autonomous, non-destructive external vulnerability scanner that continuously inspects your perimeter, normalizes findings, provides reproduction curl commands, and tracks fixes.
            </p>
          </div>

          {/* What It Checks (§9.2) */}
          <div className="border border-line bg-canvas p-8">
            <h2 className="font-mono text-base font-bold uppercase tracking-wider text-ink mb-6">
              What Harizeon Scan Probes & Validates
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              <div className="border border-line p-4">
                <span className="font-bold text-ink block mb-1">01. Port & Service Reconnaissance</span>
                <p className="text-muted text-[11px] leading-relaxed">
                  Scans top 100 or full 65,535 ports on verified domain targets. Extracts service banners without triggering intrusion prevention throttling.
                </p>
              </div>

              <div className="border border-line p-4">
                <span className="font-bold text-ink block mb-1">02. Cryptographic Protocol & TLS Audit</span>
                <p className="text-muted text-[11px] leading-relaxed">
                  Detects deprecated TLS 1.0/1.1 protocols, export-grade ciphers (RC4, 3DES), certificate expiration, and lack of HSTS preload headers.
                </p>
              </div>

              <div className="border border-line p-4">
                <span className="font-bold text-ink block mb-1">03. HTTP Daemon & Component Fingerprinting</span>
                <p className="text-muted text-[11px] leading-relaxed">
                  Identifies outdated web server versions (Nginx, Apache, IIS), exposed debug endpoints (Git, env files), and missing Content-Security-Policy headers.
                </p>
              </div>

              <div className="border border-line p-4">
                <span className="font-bold text-ink block mb-1">04. Email Security Drift (SPF / DMARC / DKIM)</span>
                <p className="text-muted text-[11px] leading-relaxed">
                  Validates DNS records for spoofing resilience, ensuring strict DMARC rejection policies and preventing domain brand hijacking.
                </p>
              </div>

              <div className="border border-line p-4">
                <span className="font-bold text-ink block mb-1">05. Automated CVE Correlation</span>
                <p className="text-muted text-[11px] leading-relaxed">
                  Direct cross-referencing of extracted version banners with NIST National Vulnerability Database (NVD) and CISA Known Exploited Vulnerabilities (KEV).
                </p>
              </div>

              <div className="border border-line p-4">
                <span className="font-bold text-ink block mb-1">06. Ephemeral Discovery & Subdomain Drift</span>
                <p className="text-muted text-[11px] leading-relaxed">
                  Correlates new subdomains found via Certificate Transparency logs strictly against the verified root domain boundary.
                </p>
              </div>
            </div>
          </div>

          {/* Sample Finding Card (§9.2) */}
          <div className="border border-line bg-canvas p-8">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
                Normalized Finding Specification Example
              </h2>
              <span className="border border-ink bg-ink text-canvas px-2 py-0.5 font-mono text-xs font-bold uppercase">
                [CRITICAL]
              </span>
            </div>

            <div className="font-mono text-xs flex flex-col gap-4">
              <div>
                <span className="text-muted block text-[10px]">VULNERABILITY TITLE:</span>
                <span className="text-base font-bold text-ink">TLS 1.0 and TLS 1.1 Deprecated Protocols Supported</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-line py-3">
                <div>
                  <span className="text-muted block text-[10px]">TARGET:</span>
                  <span className="text-ink">api.example.com:443</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">CVE / CWE:</span>
                  <span className="text-ink">CWE-326</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">FIRST SEEN:</span>
                  <span className="text-ink">2026-09-19 06:05 UTC</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">STATUS:</span>
                  <span className="text-ink font-bold">OPEN</span>
                </div>
              </div>

              <div>
                <span className="text-muted block text-[10px] mb-1">RAW EVIDENCE & REPRODUCTION CURL:</span>
                <pre className="border border-line bg-subtle p-3 text-[11px] text-ink overflow-x-auto leading-relaxed">
{`$ openssl s_client -connect api.example.com:443 -tls1_1
CONNECTED(00000003)
SSL-Session:
    Protocol  : TLSv1.1
    Cipher    : ECDHE-RSA-AES256-SHA
    Verify return code: 0 (ok)`}
                </pre>
              </div>

              <div>
                <span className="text-muted block text-[10px] mb-1">REMEDIATION GUIDANCE:</span>
                <p className="text-muted font-sans text-xs leading-relaxed">
                  Disable TLS 1.0 and TLS 1.1 in your reverse proxy configuration (e.g. Nginx <code className="font-mono text-ink">ssl_protocols TLSv1.2 TLSv1.3;</code>). Only allow TLS 1.2 and TLS 1.3 to comply with PCI DSS v4.0 and ISO 27001 requirements.
                </p>
              </div>
            </div>
          </div>

          {/* API Snippet (§9.2) */}
          <div className="border border-line bg-canvas p-8">
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink mb-4">
              Trigger via REST API
            </h2>
            <pre className="border border-line bg-subtle p-4 font-mono text-xs text-ink overflow-x-auto">
{`# 1. Trigger an on-demand standard scan
$ curl -X POST https://api.harizeon.com/v1/scans \\
    -H "Authorization: Bearer hrz_live_..." \\
    -H "Content-Type: application/json" \\
    -d '{"asset_ids":["ast_01H..."],"profile":"standard"}'

# 2. Poll execution state
$ curl -X GET https://api.harizeon.com/v1/scans/scn_01H... \\
    -H "Authorization: Bearer hrz_live_..."`}
            </pre>
          </div>

          {/* Limits & Quotas Table (§9.2) */}
          <div className="border border-line bg-canvas">
            <div className="p-4 border-b border-line">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
                Scan Profile & Quota Limits
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b border-line bg-subtle text-muted uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Profile</th>
                    <th className="px-4 py-3">Port Scope</th>
                    <th className="px-4 py-3">Inspection Depth</th>
                    <th className="px-4 py-3">Max Runtime</th>
                    <th className="px-4 py-3">Available On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className="px-4 py-3 font-bold text-ink">Quick</td>
                    <td className="px-4 py-3 text-muted">Top 20 ports</td>
                    <td className="px-4 py-3 text-muted">Header check, TLS cert</td>
                    <td className="px-4 py-3 text-muted">3 minutes</td>
                    <td className="px-4 py-3 text-ink">All Plans (Free+)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-ink">Standard</td>
                    <td className="px-4 py-3 text-muted">Top 100 ports</td>
                    <td className="px-4 py-3 text-muted">Full TLS audit, CVE mapping</td>
                    <td className="px-4 py-3 text-muted">15 minutes</td>
                    <td className="px-4 py-3 text-ink">Starter, Growth, Scale</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-ink">Deep</td>
                    <td className="px-4 py-3 text-muted">Top 1,000 + Custom</td>
                    <td className="px-4 py-3 text-muted">Deep probing, historical diffs</td>
                    <td className="px-4 py-3 text-muted">45 minutes</td>
                    <td className="px-4 py-3 text-ink">Growth, Scale</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA Box */}
          <div className="border border-ink bg-ink p-8 text-canvas flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold font-sans">Ready to scan your verified perimeter?</h3>
              <p className="text-xs text-white/80 mt-1 font-sans">
                Set up takes under four minutes. No sales call required.
              </p>
            </div>
            <Link
              href="/signup"
              className="border border-white bg-white text-black px-6 py-3 font-mono text-xs uppercase font-bold hover:bg-black hover:text-white transition-colors shrink-0"
            >
              Start Free Scan →
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
