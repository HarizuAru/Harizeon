import type { Metadata } from "next";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Data Processing Addendum (DPA) · Harizeon",
  description: "Enterprise Data Processing Addendum conforming to the Personal Data Protection (Amendment) Act 2024 (Act 709) and ISO/IEC 27001 requirements.",
};

export default function DataProcessingAddendumPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl flex flex-col gap-10">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-muted block mb-2">
              Enterprise Governance
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-sans">
              Data Processing Addendum (DPA)
            </h1>
            <p className="mt-2 text-xs font-mono text-muted">
              Standard Contractual Terms for Customer Personal Data · Mapped to PDPA 2024 (Act 709) &amp; ISO/IEC 27001
            </p>
          </div>

          <div className="font-sans text-xs text-muted leading-relaxed flex flex-col gap-6">
            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                1. Scope &amp; Direct Data Processor Liability
              </h2>
              <p>
                This Data Processing Addendum (&quot;DPA&quot;) supplements the Harizeon Terms of Service and applies to the processing of personal data and security telemetry collected through the operation of Harizeon services (SCN, ASM, AIA, ADT) on behalf of customer organizations (&quot;Customer&quot;).
              </p>
              <p>
                Under the Malaysian <strong>Personal Data Protection (Amendment) Act 2024 (Act 709)</strong>, Customer acts as the <strong>Data Controller</strong>, and Harizeon Technologies operates as a <strong>Data Processor</strong> directly bound by the Section 9 Security Principle (subject to statutory penalties of up to <strong>RM 1,000,000 fine and/or 3 years imprisonment</strong>).
              </p>
            </section>

            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                2. Data Minimization &amp; Scope of Telemetry
              </h2>
              <p>
                Harizeon collects and stores only the minimum operational evidence necessary to confirm external security posture:
              </p>
              <ul className="font-mono text-[11px] list-disc pl-4 flex flex-col gap-1.5 text-ink">
                <li>Cryptographic asset ownership tokens (DNS TXT records, HTTP verification markers).</li>
                <li>Network service headers, TLS certificate details, and open port states.</li>
                <li>Vulnerability evidence strings (sanitized and masked in accordance with confidentiality policies).</li>
                <li>Zero retention of third-party personal payload data: scanning engines do not extract database records or user identity files.</li>
              </ul>
            </section>

            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                3. Security Measures &amp; Confidentiality
              </h2>
              <p>
                Harizeon implements stringent technical and organizational security controls to safeguard customer data:
              </p>
              <ul className="font-mono text-[11px] list-disc pl-4 flex flex-col gap-1.5 text-ink">
                <li><strong>Encryption in Transit:</strong> Strict TLS 1.3 encryption across all public APIs and worker job queues.</li>
                <li><strong>Encryption at Rest:</strong> AES-256-GCM authenticated encryption for stored credentials, webhook secrets, and report artifacts.</li>
                <li><strong>Network Isolation:</strong> Worker scanning fleets are isolated in dedicated subnets with egress RFC1918 internal blocking to eliminate SSRF attack vectors.</li>
                <li><strong>Multi-Tenant Row-Level Security:</strong> PostgreSQL Row-Level Security (RLS) bound to cryptographic organization IDs.</li>
              </ul>
            </section>

            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                4. Sub-Processor Registry
              </h2>
              <p>
                Harizeon engages third-party infrastructure providers that maintain high compliance certifications (ISO 27001, SOC 2 Type II):
              </p>
              <div className="overflow-x-auto border border-line mt-2">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-subtle uppercase border-b border-line text-muted">
                    <tr>
                      <th className="p-2">Sub-Processor</th>
                      <th className="p-2">Role</th>
                      <th className="p-2">Jurisdiction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-ink">
                    <tr>
                      <td className="p-2 font-bold">Hetzner Online GmbH</td>
                      <td className="p-2 text-muted">Core Compute &amp; Container Infrastructure</td>
                      <td className="p-2">Germany / Singapore</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">Cloudflare, Inc.</td>
                      <td className="p-2 text-muted">DNS Resolution, Edge Protection &amp; Artifact Storage</td>
                      <td className="p-2">Global / United States</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">Resend Inc.</td>
                      <td className="p-2 text-muted">Transactional Alert &amp; Verification Delivery</td>
                      <td className="p-2">United States</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border border-line bg-canvas p-6 flex flex-col gap-3">
              <h2 className="font-mono text-sm font-bold uppercase text-ink">
                5. Breach Notification SLAs (Section 12B) &amp; Data Subject Rights
              </h2>
              <p>
                Customers retain ownership over their security telemetry and personal data. In the event of a confirmed personal data breach affecting Customer data:
              </p>
              <ul className="font-mono text-[11px] list-disc pl-4 flex flex-col gap-1.5 text-ink">
                <li><strong>Regulatory Breach Notification (Section 12B):</strong> Harizeon will notify Customer promptly upon breach verification to support notification to the Personal Data Protection Commissioner (JPDP) within <strong>72 hours</strong> and affected data subjects within <strong>7 days</strong>.</li>
                <li><strong>Organization Deletion &amp; Portability:</strong> Owners can export complete organization telemetry in JSON format via <code className="font-mono">POST /v1/org/export</code> or execute irreversible tenant deletion and session/API key revocation at any time.</li>
                <li><strong>Automated Retention Purge:</strong> Scan events, snapshots, and reports exceeding plan retention schedules are purged daily.</li>
              </ul>
              <div className="mt-2 text-muted font-mono text-[11px] border border-line bg-subtle p-3">
                <strong>Section 12A DPO Governance Contact:</strong> <span className="text-ink font-bold">dpo@harizeon.com</span> · Harizeon Technologies Data Protection Officer
              </div>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
