import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Privacy Policy (PDPA) — Harizeon",
  description: "Harizeon Personal Data Protection Act 2010 (PDPA) notice, data retention schedules, and processing policies.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl flex flex-col gap-10">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-muted block mb-2">
              Data Protection & Compliance
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-sans">
              Privacy Policy & PDPA Notice
            </h1>
            <p className="mt-2 text-xs font-mono text-muted">
              In accordance with the Personal Data Protection Act 2010 (PDPA) of Malaysia
            </p>
          </div>

          <div className="font-sans text-xs text-muted leading-relaxed flex flex-col gap-6">
            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                1. Collection of Technical & Contact Data
              </h2>
              <p>
                Harizeon collects your name, corporate email address, encrypted authentication credentials, organization details, and network telemetry metadata (IP addresses, request headers, verified domain names) strictly to deliver vulnerability scanning, security reporting, and audit logging services.
              </p>
            </section>

            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                2. Evidence Retention Policies
              </h2>
              <p>
                Scan logs, raw response banners, and vulnerability evidence records are retained strictly according to your organization plan tier:
              </p>
              <ul className="font-mono text-[11px] list-disc pl-4 flex flex-col gap-1 text-ink">
                <li>Free Tier: 14 calendar days</li>
                <li>Starter Tier: 90 calendar days</li>
                <li>Growth Tier: 365 calendar days (1 year)</li>
                <li>Scale Tier: 730 calendar days (2 years)</li>
              </ul>
              <p>
                Upon expiration or account deletion, raw evidence snapshots are purged from operational databases.
              </p>
            </section>

            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                3. Security & Row-Level Isolation
              </h2>
              <p>
                All customer data is partitioned using PostgreSQL Row-Level Security (RLS) keyed to your unique Organization ID. Scanner workers execute ephemerally in sandboxed runtimes without persistent direct database access.
              </p>
            </section>

            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                4. Data Subject Rights & Contact
              </h2>
              <p>
                Under the PDPA 2010, you hold the right to access, rectify, or request the deletion of your personal data. For privacy inquiries or data subject access requests, contact our Data Protection Officer at <code className="font-mono text-ink">privacy@harizeon.com</code>.
              </p>
            </section>
          </div>

          <div className="border-t border-line pt-6 flex justify-between font-mono text-xs">
            <Link href="/legal/terms" className="text-ink underline">← Terms of Service</Link>
            <Link href="/legal/acceptable-use" className="text-ink underline">Acceptable Use Policy →</Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
