import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Acceptable Use Policy (AUP) — Harizeon",
  description: "Strict operational boundaries and acceptable use standards for Harizeon scanning infrastructure.",
};

export default function AcceptableUsePage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl flex flex-col gap-10">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-muted block mb-2">
              Operational Standards
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-sans">
              Acceptable Use Policy
            </h1>
            <p className="mt-2 text-xs font-mono text-muted">
              Harizeon Security Infrastructure · Strict Operational Guardrails
            </p>
          </div>

          <div className="font-sans text-xs text-muted leading-relaxed flex flex-col gap-6">
            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                1. Prohibition Against Unverified Scanning
              </h2>
              <p>
                Harizeon is designed solely for defensive, authorized infrastructure reconnaissance. Users may not attempt to target, probe, or scan any asset, IP range, or hostname that has not successfully passed cryptographic ownership verification.
              </p>
            </section>

            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                2. Prohibited Exploitative Activities
              </h2>
              <p>
                You are strictly prohibited from using Harizeon infrastructure to:
              </p>
              <ul className="font-mono text-[11px] list-disc pl-4 flex flex-col gap-1.5 text-ink">
                <li>Deploy denial-of-service (DoS or DDoS) traffic or volumetric flood attacks.</li>
                <li>Transmit destructive binary exploitation payloads, shellcode, or ransomware.</li>
                <li>Conduct brute-force credential stuffing or password spraying attacks against third-party endpoints.</li>
                <li>Scrape, harvest, or exfiltrate private personal data without explicit legal consent.</li>
                <li>Attempt to reverse-engineer, disrupt, or compromise the multi-tenant isolation of the Harizeon cluster.</li>
              </ul>
            </section>

            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                3. Enforcement & Immediate Termination
              </h2>
              <p>
                Violations of this Acceptable Use Policy result in immediate revocation of API keys, suspension of running scans, deletion of active workspaces, and potential referral to relevant cybersecurity and law enforcement authorities where warranted.
              </p>
            </section>
          </div>

          <div className="border-t border-line pt-6 flex justify-between font-mono text-xs">
            <Link href="/legal/terms" className="text-ink underline">← Terms of Service</Link>
            <Link href="/legal/privacy" className="text-ink underline">Privacy Policy →</Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
