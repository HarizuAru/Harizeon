import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Scanner Identity & Allowlist",
  description:
    "Official Harizeon EASM scanner User-Agent, reverse DNS identity, authorized-only scanning policy, and abuse/opt-out contact.",
};

export default function ScannerPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f8] text-[#171d29]">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl flex flex-col gap-8">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-[#02acc5] font-semibold block mb-2">
              Harizeon Egress Telemetry &amp; Abuse Desk
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#171d29]">
              Harizeon Scanner Identity &amp; Allowlist
            </h1>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Harizeon performs automated external attack surface telemetry strictly against domains and IP perimeters whose owners have completed cryptographic DNS TXT or HTTP file verification.
            </p>
          </div>

          <section className="rounded-[24px] border border-[#dce2e3] bg-white p-6 sm:p-8 shadow-sm flex flex-col gap-4">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#171d29]">
              HTTP User-Agent &amp; Egress Verification
            </h2>
            <div className="border border-line bg-subtle p-4 font-mono text-xs text-ink flex flex-col gap-2">
              <div>
                <span className="text-muted">User-Agent:</span>{" "}
                <strong>HarizeonScanner/1.1 (+https://harizeon.com/scanner)</strong>
              </div>
              <div>
                <span className="text-muted">Verification Agent:</span>{" "}
                <strong>HarizeonVerifier/1.1</strong>
              </div>
              <div>
                <span className="text-muted">Reverse DNS Pattern (PTR):</span>{" "}
                <strong>scanner-my-01.harizeon.com</strong>
              </div>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Every active probe honors rate limits (capped below 40 req/sec per edge cluster) and blocks private, loopback, link-local, CGNAT, and cloud metadata IP ranges fail-closed prior to socket connection.
            </p>
          </section>

          <section className="rounded-[24px] border border-[#dce2e3] bg-white p-6 sm:p-8 shadow-sm flex flex-col gap-3">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#171d29]">
              Authorized-Only Scope &amp; Abuse Contact
            </h2>
            <p className="text-xs text-muted leading-relaxed">
              Unauthorized scanning violates Harizeon&apos;s Terms of Service, Malaysia&apos;s Computer Crimes Act 1997, and Cyber Security Act 2024 hygiene guidelines. If you observe unexpected traffic carrying the Harizeon User-Agent, verify DNS TXT records for <code>_harizeon-verify.&lt;yourdomain&gt;</code> or contact our security operations desk immediately:
            </p>
            <div className="font-mono text-xs text-ink pt-1">
              Abuse &amp; Blocklist Desk:{" "}
              <a href="mailto:security@harizeon.com" className="underline text-[#02acc5]">
                security@harizeon.com
              </a>{" "}
              ·{" "}
              <Link href="/security" className="underline">
                View Disclosure Policy →
              </Link>
            </div>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
