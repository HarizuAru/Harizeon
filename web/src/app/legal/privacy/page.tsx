import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Privacy Policy (PDPA 2024) · Harizeon",
  description: "Harizeon Personal Data Protection (Amendment) Act 2024 (Act 709) notice, direct Data Processor obligations, Section 12B breach notification SLAs, and DPO governance.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl flex flex-col gap-10">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-muted block mb-2">
              Data Protection &amp; Compliance
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-sans">
              Privacy Policy &amp; PDPA 2024 Notice
            </h1>
            <p className="mt-2 text-xs font-mono text-muted">
              In accordance with the Personal Data Protection (Amendment) Act 2024 (Act 709) of Malaysia
            </p>
          </div>

          <div className="font-sans text-xs text-muted leading-relaxed flex flex-col gap-6">
            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                1. Collection of Technical &amp; Contact Data
              </h2>
              <p>
                Harizeon collects your name, corporate email address, encrypted authentication credentials, organization details, and network telemetry metadata (IP addresses, request headers, verified domain names) strictly to deliver automated attack surface posture monitoring, security reporting, and audit logging services.
              </p>
            </section>

            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                2. Direct Data Processor Obligations (Security Principle)
              </h2>
              <p>
                Under the <strong>Personal Data Protection (Amendment) Act 2024 (Act 709)</strong>, Harizeon Technologies operates with direct statutory <strong>Data Processor</strong> obligations under Section 9 (Security Principle), carrying statutory penalties of up to <strong>RM 1,000,000 fine and/or 3 years imprisonment</strong> for non-compliance. We enforce credential redaction before persistence, PostgreSQL Row-Level Security (RLS) tenant isolation, and sandboxed worker execution without database credentials.
              </p>
            </section>

            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                3. Evidence Retention Policies &amp; Automated Purge
              </h2>
              <p>
                Scan logs, raw response banners, asset snapshots, and reports are retained strictly according to your organization plan tier and automatically purged on expiration:
              </p>
              <ul className="font-mono text-[11px] list-disc pl-4 flex flex-col gap-1 text-ink">
                <li>Free Tier: 14 calendar days</li>
                <li>Starter Tier: 90 calendar days</li>
                <li>Growth Tier: 365 calendar days (1 year)</li>
                <li>Scale Tier: 730 calendar days (2 years)</li>
              </ul>
              <p>
                Upon expiration or verified organization deletion, operational evidence and telemetry records are permanently purged.
              </p>
            </section>

            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                4. Mandatory Breach Notification SLAs (Section 12B)
              </h2>
              <p>
                Pursuant to <strong>Section 12B</strong> of the PDPA Amendment Act 2024, where a personal data breach meets statutory notification thresholds:
              </p>
              <ul className="font-mono text-[11px] list-disc pl-4 flex flex-col gap-1 text-ink">
                <li><strong>Personal Data Protection Commissioner (JPDP):</strong> Notified as soon as practicable and no later than <strong>72 hours</strong> upon becoming aware of the breach.</li>
                <li><strong>Affected Data Subjects:</strong> Notified without unnecessary delay and within <strong>7 days</strong> after initial notification to the Commissioner where significant harm is likely.</li>
              </ul>
            </section>

            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                5. Data Subject Rights &amp; Data Protection Officer (Section 12A)
              </h2>
              <p>
                Under the PDPA 2024 (Act 709), you hold the right to access, rectify, export (data portability), or request erasure of your personal data. Pursuant to <strong>Section 12A</strong>, Harizeon designates a dedicated Data Protection Officer (DPO) for governance, breach coordination, and regulatory liaison.
              </p>
              <div className="font-mono text-[11px] text-ink border border-line bg-subtle p-3">
                Data Protection Officer (Section 12A Governance Contact): <code className="font-mono text-ink font-bold">dpo@harizeon.com</code> · General Privacy Requests: <code className="font-mono text-ink">privacy@harizeon.com</code>
              </div>
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
