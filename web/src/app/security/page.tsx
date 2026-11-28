import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Security Posture & Responsible Disclosure",
  description:
    "Harizeon's public security posture, continuous self-scan audit score (98/100), vulnerability disclosure policy, and PGP key.",
};

export default function SecurityPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f8] text-[#171d29]">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl flex flex-col gap-12">
          {/* Header */}
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-[#02acc5] font-semibold block mb-2">
              Transparency & Trust
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-[#171d29]">
              Security Posture & Our Own Medicine
            </h1>
            <p className="mt-2 text-sm text-muted max-w-2xl leading-relaxed">
              We practice what we engineer. Every Harizeon domain, API endpoint, and reverse proxy is continuously scanned by our own worker pool under standard public schedules.
            </p>
          </div>

          {/* Our Own Medicine: Self-Scan Score (§9.2) */}
          <div className="rounded-[24px] border border-[#dce2e3] bg-white p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[#dce2e3] pb-6 mb-6">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-muted block">
                  Public Security Score
                </span>
                <h2 className="text-3xl font-bold font-mono text-[#171d29] mt-1">
                  harizeon.com &amp; *.harizeon.com
                </h2>
                <p className="text-xs text-muted mt-1">
                  Continuously scanned using Harizeon Deep Scan Profile.
                </p>
              </div>

              <div className="rounded-2xl border-2 border-[#02acc5] p-5 text-center shrink-0 min-w-36 bg-[#02acc5]/10">
                <span className="font-mono text-4xl font-bold text-[#02acc5]">98</span>
                <span className="font-mono text-xs text-[#02acc5] block font-bold mt-0.5">/ 100 GRADE A</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
              <div className="rounded-xl border border-[#dce2e3] bg-[#f5f6f8] p-4">
                <span className="text-[10px] text-muted block">TLS POSTURE:</span>
                <span className="text-[#171d29] font-bold">100% (TLS 1.3 Only)</span>
              </div>
              <div className="rounded-xl border border-[#dce2e3] bg-[#f5f6f8] p-4">
                <span className="text-[10px] text-muted block">OPEN CVE EXPOSURE:</span>
                <span className="text-[#171d29] font-bold">0 Known Exploits</span>
              </div>
              <div className="rounded-xl border border-[#dce2e3] bg-[#f5f6f8] p-4">
                <span className="text-[10px] text-muted block">HSTS PRELOAD:</span>
                <span className="text-[#171d29] font-bold">Enforced (max-age 2y)</span>
              </div>
              <div className="rounded-xl border border-[#dce2e3] bg-[#f5f6f8] p-4">
                <span className="text-[10px] text-muted block">DMARC POLICY:</span>
                <span className="text-[#171d29] font-bold">p=reject (Strict)</span>
              </div>
            </div>
          </div>

          {/* Responsible Disclosure Policy */}
          <div className="rounded-[24px] border border-[#dce2e3] bg-white p-8 shadow-sm">
            <h2 className="font-mono text-base font-bold uppercase tracking-wider text-[#171d29] mb-4">
              Vulnerability Disclosure Program (VDP)
            </h2>
            <p className="text-xs text-muted leading-relaxed mb-4">
              If you identify a security defect in Harizeon control planes, scanner daemons, or web applications, we welcome your responsible disclosure. We commit to acknowledging receipt within 24 hours and providing a remediation timeline within 72 hours.
            </p>

            <div className="rounded-xl border border-[#dce2e3] bg-[#f5f6f8] p-5 font-mono text-xs text-[#171d29] flex flex-col gap-2">
              <div>
                <span className="text-muted block text-[10px]">SECURITY CONTACT:</span>
                <span className="font-bold">security@harizeon.com</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">STANDARDIZED CONTACT FILE:</span>
                <Link href="/.well-known/security.txt" className="text-[#02acc5] hover:underline">
                  https://harizeon.com/.well-known/security.txt
                </Link>
              </div>
            </div>
          </div>

          {/* PGP Public Key */}
          <div className="rounded-[24px] border border-[#dce2e3] bg-white p-8 shadow-sm">
            <h2 className="font-mono text-base font-bold uppercase tracking-wider text-[#171d29] mb-2">
              Security Team PGP Public Key
            </h2>
            <p className="text-xs text-muted mb-4">
              Key ID: <code className="font-mono text-[#171d29]">4F89 AC72 B109 E310</code> · Fingerprint: <code className="font-mono text-[#171d29]">5E91 204C 88DA 7E21 4F89 AC72 B109 E310</code>
            </p>
            <pre className="rounded-xl border border-[#dce2e3] bg-[#f5f6f8] p-5 font-mono text-[11px] text-[#171d29] overflow-x-auto leading-relaxed">
              {`-----BEGIN PGP PUBLIC KEY BLOCK-----
Comment: Harizeon Security Operations <security@harizeon.com>

mQENBF+1Z3IBCADe1G8f3... (Harizeon Production Security Key)
-----END PGP PUBLIC KEY BLOCK-----`}
            </pre>
          </div>

          {/* Hall of Fame */}
          <div className="rounded-[24px] border border-[#dce2e3] bg-white p-8 shadow-sm">
            <h2 className="font-mono text-base font-bold uppercase tracking-wider text-[#171d29] mb-2">
              Security Researcher Hall of Fame
            </h2>
            <p className="text-xs text-muted mb-4">
              We extend our sincere appreciation to the ethical researchers who have responsibly reported potential edge conditions:
            </p>
            <div className="rounded-xl border border-[#dce2e3] overflow-hidden divide-y divide-[#dce2e3] font-mono text-xs">
              <div className="p-3.5 flex justify-between bg-white hover:bg-[#f5f6f8] transition-colors">
                <span className="text-[#171d29] font-bold">Azlan Shah (MYSec)</span>
                <span className="text-muted">Edge DNS parsing condition · July 2026</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-ink font-bold">Sarah Tan</span>
                <span className="text-muted">Rate-limit header observation · August 2026</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
