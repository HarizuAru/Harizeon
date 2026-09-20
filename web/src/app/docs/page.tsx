import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Documentation & Developer Guides — Harizeon",
  description: "Comprehensive guides for verifying asset ownership, triggering scans via API, and managing findings.",
};

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl flex flex-col gap-12">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-muted block mb-2">
              Developer Reference
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-ink font-sans">
              Harizeon Documentation
            </h1>
            <p className="mt-2 text-sm text-muted max-w-2xl font-sans leading-relaxed">
              Integrate Harizeon into your engineering workflows. Learn how to verify infrastructure control, trigger scheduled scans, and stream findings directly into your SIEM.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/docs/quickstart"
              className="border border-line bg-canvas p-6 hover:border-ink transition-colors flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-xs font-bold uppercase text-ink block mb-2">
                  01 · Quickstart Guide
                </span>
                <p className="text-xs text-muted font-sans leading-relaxed">
                  Go from zero to your first automated vulnerability scan in under 4 minutes.
                </p>
              </div>
              <span className="mt-6 font-mono text-xs text-ink underline">Read Quickstart →</span>
            </Link>

            <Link
              href="/docs/api"
              className="border border-line bg-canvas p-6 hover:border-ink transition-colors flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-xs font-bold uppercase text-ink block mb-2">
                  02 · REST API Reference
                </span>
                <p className="text-xs text-muted font-sans leading-relaxed">
                  Authenticate requests, trigger on-demand jobs, and extract machine-readable JSON findings.
                </p>
              </div>
              <span className="mt-6 font-mono text-xs text-ink underline">API Specs →</span>
            </Link>

            <Link
              href="/security"
              className="border border-line bg-canvas p-6 hover:border-ink transition-colors flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-xs font-bold uppercase text-ink block mb-2">
                  03 · Security Posture
                </span>
                <p className="text-xs text-muted font-sans leading-relaxed">
                  Responsible disclosure, PGP keys, and our public self-scan security score.
                </p>
              </div>
              <span className="mt-6 font-mono text-xs text-ink underline">Security Posture →</span>
            </Link>
          </div>

          {/* Core Architecture Highlights */}
          <div className="border border-line bg-canvas p-8">
            <h2 className="font-mono text-base font-bold uppercase tracking-wider text-ink mb-4">
              Core Principles & System Guardrails
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs text-muted">
              <div className="border border-line p-4">
                <strong className="text-ink block mb-1">Cryptographic Ownership Gate</strong>
                <p className="text-[11px] leading-relaxed">
                  No scan ever executes against an unverified target. Verification tokens must be demonstrated via DNS TXT or HTTP well-known endpoints.
                </p>
              </div>
              <div className="border border-line p-4">
                <strong className="text-ink block mb-1">Non-Destructive Probing</strong>
                <p className="text-[11px] leading-relaxed">
                  Probes extract service banners and audit cryptographic handshakes without transmitting exploit payloads, preventing downtime on critical systems.
                </p>
              </div>
              <div className="border border-line p-4">
                <strong className="text-ink block mb-1">Tamper-Evident Audit Log</strong>
                <p className="text-[11px] leading-relaxed">
                  Every scan request, verification event, and user action is logged to an immutable PostgreSQL append-only ledger for compliance audits.
                </p>
              </div>
              <div className="border border-line p-4">
                <strong className="text-ink block mb-1">Webhook HMAC Signing</strong>
                <p className="text-[11px] leading-relaxed">
                  Outbound webhook payloads are signed with HMAC-SHA256 signatures via the <code className="text-ink">X-Harizeon-Signature</code> header.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
