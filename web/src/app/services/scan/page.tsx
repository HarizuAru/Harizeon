import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Harizeon Scan (SCN) — Autonomous External Vulnerability Scanner",
  description:
    "Non-destructive external vulnerability scanning: port probing, TLS and certificate checks, exposed files and admin panels, AI-exposure checks, and known-CVE matching from service banners.",
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
              An autonomous, non-destructive external vulnerability scanner that continuously inspects your verified perimeter, normalises findings with evidence, and alerts you when something changes.
            </p>
          </div>

          {/* What It Checks (§9.2) — every claim here matches a shipped check */}
          <div className="border border-line bg-canvas p-8">
            <h2 className="font-mono text-base font-bold uppercase tracking-wider text-ink mb-6">
              What Harizeon Scan Probes &amp; Validates
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              <div className="border border-line p-4">
                <span className="font-bold text-ink block mb-1">01. Port &amp; Service Reconnaissance</span>
                <p className="text-muted text-[11px] leading-relaxed">
                  TCP connect probing over a common and an extended port set on verified targets, with banner capture. No exploit payloads are ever sent, and connections are pinned to validated public addresses only.
                </p>
              </div>

              <div className="border border-line p-4">
                <span className="font-bold text-ink block mb-1">02. TLS &amp; Certificate Audit</span>
                <p className="text-muted text-[11px] leading-relaxed">
                  Detects accepted legacy protocols (SSLv2, SSLv3, TLS 1.0, TLS 1.1), flags expired certificates and certificates expiring within 14 days, and checks that HSTS is present.
                </p>
              </div>

              <div className="border border-line p-4">
                <span className="font-bold text-ink block mb-1">03. Exposed Files &amp; Admin Panels</span>
                <p className="text-muted text-[11px] leading-relaxed">
                  Web checks for exposed .git directories, .env files, SQL dumps, phpinfo, Swagger UI and Spring Actuator endpoints, plus missing Content-Security-Policy and related security headers.
                </p>
              </div>

              <div className="border border-line p-4">
                <span className="font-bold text-ink block mb-1">04. AI Exposure (agentic-era surface)</span>
                <p className="text-muted text-[11px] leading-relaxed">
                  Detects unauthenticated Ollama-style model endpoints and live AI provider keys (OpenAI, Anthropic, Hugging Face, Google, Groq) leaked inside your own client-side JavaScript — redacted in evidence, never echoed.
                </p>
              </div>

              <div className="border border-line p-4">
                <span className="font-bold text-ink block mb-1">05. Known-CVE Matching</span>
                <p className="text-muted text-[11px] leading-relaxed">
                  Software versions identified from service banners (OpenSSH, nginx, Apache, OpenSSL, vsFTPD and more) are checked against a curated known-vulnerability set, and the matching CVE ids are recorded on the finding.
                </p>
              </div>

              <div className="border border-line p-4">
                <span className="font-bold text-ink block mb-1">06. Subdomain Discovery &amp; Alerts</span>
                <p className="text-muted text-[11px] leading-relaxed">
                  New subdomains are discovered from Certificate Transparency logs, DNS and naming mutations of known hosts, validated strictly against the verified root domain, held for your review, and alerted on when they appear.
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
                Scan Profile &amp; Quota Limits
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b border-line bg-subtle text-muted uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Profile</th>
                    <th className="px-4 py-3">Coverage</th>
                    <th className="px-4 py-3">What Runs</th>
                    <th className="px-4 py-3">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className="px-4 py-3 font-bold text-ink">Quick</td>
                    <td className="px-4 py-3 text-muted">Passive only — no port probing</td>
                    <td className="px-4 py-3 text-muted">Ownership verify, discovery, resolve, report</td>
                    <td className="px-4 py-3 text-ink">All plans (free tier)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-ink">Standard</td>
                    <td className="px-4 py-3 text-muted">Common port set</td>
                    <td className="px-4 py-3 text-muted">All phases: probing, TLS, headers, web checks, CVE matching</td>
                    <td className="px-4 py-3 text-ink">Starter trial, Starter, Growth, Scale</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-ink">Deep</td>
                    <td className="px-4 py-3 text-muted">Extended port set (adds Telnet, SMB, Docker, VNC, Elasticsearch, MongoDB, K8s)</td>
                    <td className="px-4 py-3 text-muted">Same as Standard over the extended set</td>
                    <td className="px-4 py-3 text-ink">Growth, Scale</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="px-4 py-3 text-[10px] text-muted font-mono border-t border-line">
              Workers heartbeat while running; a stalled scan is retried up to twice and then marked
              timeout. Scans of assets whose ownership proof lapses are cancelled, never retried.
            </p>
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
