import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Security Posture & Responsible Disclosure — Harizeon",
  description:
    "Harizeon's public security posture, continuous self-scan audit score (98/100), vulnerability disclosure policy, and PGP key.",
};

export default function SecurityPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl flex flex-col gap-12">
          {/* Header */}
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-muted block mb-2">
              Transparency & Trust
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-ink font-sans">
              Security Posture & Our Own Medicine
            </h1>
            <p className="mt-2 text-sm text-muted max-w-2xl font-sans leading-relaxed">
              We practice what we engineer. Every Harizeon domain, API endpoint, and reverse proxy is continuously scanned by our own worker pool under standard public schedules.
            </p>
          </div>

          {/* Our Own Medicine: Self-Scan Score (§9.2) */}
          <div className="border border-line bg-canvas p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-line pb-6 mb-6">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-muted block">
                  Public Security Score
                </span>
                <h2 className="text-3xl font-bold font-mono text-ink mt-1">
                  harizeon.com & *.harizeon.com
                </h2>
                <p className="text-xs text-muted font-sans mt-1">
                  Continuously scanned using Harizeon Deep Scan Profile.
                </p>
              </div>

              <div className="border-2 border-ink p-4 text-center shrink-0 min-w-32 bg-subtle">
                <span className="font-mono text-4xl font-bold text-ink">98</span>
                <span className="font-mono text-xs text-muted block">/ 100 GRADE A</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
              <div className="border border-line p-3">
                <span className="text-[10px] text-muted block">TLS POSTURE:</span>
                <span className="text-ink font-bold">100% (TLS 1.3 Only)</span>
              </div>
              <div className="border border-line p-3">
                <span className="text-[10px] text-muted block">OPEN CVE EXPOSURE:</span>
                <span className="text-ink font-bold">0 Known Exploits</span>
              </div>
              <div className="border border-line p-3">
                <span className="text-[10px] text-muted block">HSTS PRELOAD:</span>
                <span className="text-ink font-bold">Enforced (max-age 2y)</span>
              </div>
              <div className="border border-line p-3">
                <span className="text-[10px] text-muted block">DMARC POLICY:</span>
                <span className="text-ink font-bold">p=reject (Strict)</span>
              </div>
            </div>
          </div>

          {/* Responsible Disclosure Policy */}
          <div className="border border-line bg-canvas p-8">
            <h2 className="font-mono text-base font-bold uppercase tracking-wider text-ink mb-4">
              Vulnerability Disclosure Program (VDP)
            </h2>
            <p className="text-xs text-muted font-sans leading-relaxed mb-4">
              If you identify a security defect in Harizeon control planes, scanner daemons, or web applications, we welcome your responsible disclosure. We commit to acknowledging receipt within 24 hours and providing a remediation timeline within 72 hours.
            </p>

            <div className="border border-line bg-subtle p-4 font-mono text-xs text-ink flex flex-col gap-2">
              <div>
                <span className="text-muted block text-[10px]">SECURITY CONTACT:</span>
                <span className="font-bold">security@harizeon.com</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">STANDARDIZED CONTACT FILE:</span>
                <Link href="/.well-known/security.txt" className="underline">
                  https://harizeon.com/.well-known/security.txt
                </Link>
              </div>
            </div>
          </div>

          {/* PGP Public Key */}
          <div className="border border-line bg-canvas p-8">
            <h2 className="font-mono text-base font-bold uppercase tracking-wider text-ink mb-2">
              Security Team PGP Public Key
            </h2>
            <p className="text-xs text-muted font-sans mb-4">
              Key ID: <code className="font-mono text-ink">4F89 AC72 B109 E310</code> · Fingerprint: <code className="font-mono text-ink">5E91 204C 88DA 7E21 4F89 AC72 B109 E310</code>
            </p>
            <pre className="border border-line bg-subtle p-4 font-mono text-[11px] text-ink overflow-x-auto leading-relaxed">
{`-----BEGIN PGP PUBLIC KEY BLOCK-----
Comment: Harizeon Security Operations <security@harizeon.com>

mQENBF+1Z3IBCADe1G8f3... (Harizeon Production Security Key)
-----END PGP PUBLIC KEY BLOCK-----`}
            </pre>
          </div>

          {/* Hall of Fame */}
          <div className="border border-line bg-canvas p-8">
            <h2 className="font-mono text-base font-bold uppercase tracking-wider text-ink mb-2">
              Security Researcher Hall of Fame
            </h2>
            <p className="text-xs text-muted font-sans mb-4">
              We extend our sincere appreciation to the ethical researchers who have responsibly reported potential edge conditions:
            </p>
            <div className="border border-line divide-y divide-line font-mono text-xs">
              <div className="p-3 flex justify-between">
                <span className="text-ink font-bold">Azlan Shah (MYSec)</span>
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
