import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation & Developer Guides",
  description: "Comprehensive guides for verifying asset ownership, triggering scans via API, and managing findings.",
};

export default function DocsPage() {
  return (
        <div className="mx-auto max-w-5xl flex flex-col gap-12">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-[#02acc5] font-semibold block mb-2">
              Developer Reference
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-[#171d29]">
              Harizeon Documentation
            </h1>
            <p className="mt-2 text-sm text-muted max-w-2xl leading-relaxed">
              Integrate Harizeon into your engineering workflows. Learn how to verify infrastructure control, trigger scheduled scans, and stream findings directly into your SIEM.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              href="/docs/quickstart"
              className="rounded-[24px] border border-[#dce2e3] bg-white p-7 hover:border-[#02acc5] hover:shadow-md transition-all flex flex-col justify-between group shadow-sm"
            >
              <div>
                <span className="font-mono text-xs font-bold uppercase text-[#171d29] block mb-2">
                  01 · Quickstart Guide
                </span>
                <p className="text-xs text-muted leading-relaxed">
                  Go from zero to your first automated vulnerability scan in under 4 minutes.
                </p>
              </div>
              <span className="mt-6 font-mono text-xs text-[#02acc5] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-medium">
                Read Quickstart →
              </span>
            </Link>

            <Link
              href="/docs/services"
              className="rounded-[24px] border border-[#dce2e3] bg-white p-7 hover:border-[#02acc5] hover:shadow-md transition-all flex flex-col justify-between group shadow-sm"
            >
              <div>
                <span className="font-mono text-xs font-bold uppercase text-[#171d29] block mb-2">
                  02 · Services Catalog
                </span>
                <p className="text-xs text-muted leading-relaxed">
                  Full specifications, engine parameters, ARNs, and compliance mappings for all services.
                </p>
              </div>
              <span className="mt-6 font-mono text-xs text-[#02acc5] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-medium">
                Services Specs →
              </span>
            </Link>

            <Link
              href="/docs/api"
              className="rounded-[24px] border border-[#dce2e3] bg-white p-7 hover:border-[#02acc5] hover:shadow-md transition-all flex flex-col justify-between group shadow-sm"
            >
              <div>
                <span className="font-mono text-xs font-bold uppercase text-[#171d29] block mb-2">
                  03 · REST API Reference
                </span>
                <p className="text-xs text-muted leading-relaxed">
                  Authenticate requests, trigger on-demand jobs, and extract machine-readable JSON findings.
                </p>
              </div>
              <span className="mt-6 font-mono text-xs text-[#02acc5] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-medium">
                API Specs →
              </span>
            </Link>

            <Link
              href="/security"
              className="rounded-[24px] border border-[#dce2e3] bg-white p-7 hover:border-[#02acc5] hover:shadow-md transition-all flex flex-col justify-between group shadow-sm"
            >
              <div>
                <span className="font-mono text-xs font-bold uppercase text-[#171d29] block mb-2">
                  04 · Security Posture
                </span>
                <p className="text-xs text-muted leading-relaxed">
                  Responsible disclosure, PGP keys, and our public self-scan security score.
                </p>
              </div>
              <span className="mt-6 font-mono text-xs text-[#02acc5] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-medium">
                Security Posture →
              </span>
            </Link>
          </div>

          {/* Core Architecture Highlights */}
          <div className="rounded-[24px] border border-[#dce2e3] bg-white p-8 shadow-sm">
            <h2 className="font-mono text-base font-bold uppercase tracking-wider text-[#171d29] mb-4">
              Core Principles &amp; System Guardrails
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs text-muted">
              <div className="rounded-xl border border-[#dce2e3] bg-[#f5f6f8] p-5">
                <strong className="text-[#171d29] block mb-1">Cryptographic Ownership Gate</strong>
                <p className="text-[11px] leading-relaxed">
                  No scan ever executes against an unverified target. Verification tokens must be demonstrated via DNS TXT or HTTP well-known endpoints.
                </p>
              </div>
              <div className="rounded-xl border border-[#dce2e3] bg-[#f5f6f8] p-5">
                <strong className="text-[#171d29] block mb-1">Non-Destructive Probing</strong>
                <p className="text-[11px] leading-relaxed">
                  Probes extract service banners and audit cryptographic handshakes without transmitting exploit payloads, preventing downtime on critical systems.
                </p>
              </div>
              <div className="rounded-xl border border-[#dce2e3] bg-[#f5f6f8] p-5">
                <strong className="text-[#171d29] block mb-1">Tamper-Evident Audit Log</strong>
                <p className="text-[11px] leading-relaxed">
                  Every scan request, verification event, and user action is logged to an immutable PostgreSQL append-only ledger for compliance audits.
                </p>
              </div>
              <div className="rounded-xl border border-[#dce2e3] bg-[#f5f6f8] p-5">
                <strong className="text-[#171d29] block mb-1">Webhook HMAC Signing</strong>
                <p className="text-[11px] leading-relaxed">
                  Outbound webhook payloads are signed with HMAC-SHA256 signatures via the <code className="text-[#171d29]">X-Harizeon-Signature</code> header.
                </p>
              </div>
            </div>
          </div>
        </div>
  );
}
