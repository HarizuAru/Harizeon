import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Terms of Service — Harizeon",
  description: "Terms of Service governing the use of Harizeon security scanning infrastructure and API platforms.",
};

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl flex flex-col gap-10">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-muted block mb-2">
              Legal Agreement
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-sans">
              Terms of Service
            </h1>
            <p className="mt-2 text-xs font-mono text-muted">
              Effective Date: September 2026 · Governing Law: Laws of Malaysia
            </p>
          </div>

          <div className="prose prose-neutral max-w-none font-sans text-xs text-muted leading-relaxed flex flex-col gap-6">
            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                1. Authorization & Strict Ownership Verification
              </h2>
              <p>
                Harizeon performs external security testing and vulnerability enumeration exclusively against assets whose administrative control has been verified through cryptographic tokens (DNS TXT or HTTP well-known endpoints).
              </p>
              <p className="font-mono text-ink font-bold">
                You expressly warrant that you own or hold explicit written authority from the owner to test all assets registered in your workspace. Attempting to circumvent or spoof verification is a material breach and results in immediate account termination.
              </p>
            </section>

            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                2. Malaysian Computer Crimes Act 1997 Compliance
              </h2>
              <p>
                Users acknowledge and agree that unauthorized access to computer material or computer misuse is prohibited under the <strong>Malaysian Computer Crimes Act 1997 (Act 563)</strong>. By using Harizeon services, you represent and warrant that your testing activities are lawful, authorized, and compliant with all applicable domestic and international cybersecurity legislation.
              </p>
            </section>

            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                3. Non-Destructive Testing Scope
              </h2>
              <p>
                Harizeon’s default scanning engines are strictly non-destructive: they probe open network ports, analyze public cryptographic handshakes, inspect HTTP response headers, and match banner fingerprints against public CVE vulnerability databases. Harizeon does not execute destructive exploitation payloads or deliberate denial-of-service tests.
              </p>
            </section>

            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                4. Billing, Metering & Taxation
              </h2>
              <p>
                Subscriptions are billed on a monthly recurring basis according to your active tier and monitored asset count. In accordance with the Malaysian Service Tax Act 2018, applicable services provided to Malaysian customers include 8% Sales and Service Tax (SST).
              </p>
            </section>

            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                5. Indemnification & Limitation of Liability
              </h2>
              <p>
                You agree to indemnify, defend, and hold harmless Harizeon Technologies Sdn. Bhd., its directors, employees, and infrastructure providers against any claims, liabilities, damages, or regulatory penalties arising from your unauthorized registration or testing of third-party assets.
              </p>
            </section>
          </div>

          <div className="border-t border-line pt-6 flex justify-between font-mono text-xs">
            <Link href="/legal/privacy" className="text-ink underline">Privacy Policy →</Link>
            <Link href="/legal/acceptable-use" className="text-ink underline">Acceptable Use Policy →</Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
