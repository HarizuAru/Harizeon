import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "REST API Reference — Harizeon Docs",
  description: "Complete REST API reference for assets, scans, findings, reports, and webhooks HMAC verification.",
};

const ENDPOINTS = [
  {
    method: "POST",
    path: "/v1/assets",
    desc: "Register a target domain, subdomain, or IP for verification.",
    auth: "Bearer Token (assets:write)",
  },
  {
    method: "POST",
    path: "/v1/assets/:id/verify",
    desc: "Execute ownership verification check against public DNS or HTTP endpoints.",
    auth: "Bearer Token (assets:write)",
  },
  {
    method: "GET",
    path: "/v1/assets",
    desc: "List all verified and pending assets with discovery lineage.",
    auth: "Bearer Token (assets:read)",
  },
  {
    method: "POST",
    path: "/v1/scans",
    desc: "Dispatch an asynchronous vulnerability scan job across specified verified assets.",
    auth: "Bearer Token (scans:write)",
  },
  {
    method: "GET",
    path: "/v1/scans/:id",
    desc: "Retrieve real-time scan progress, phase logs, and finding totals.",
    auth: "Bearer Token (scans:read)",
  },
  {
    method: "GET",
    path: "/v1/findings",
    desc: "Query normalized, deduplicated vulnerabilities with CVSS and severity filtering.",
    auth: "Bearer Token (findings:read)",
  },
  {
    method: "POST",
    path: "/v1/reports",
    desc: "Generate print-ready executive, technical, or compliance PDF reports.",
    auth: "Bearer Token (reports:read)",
  },
  {
    method: "GET",
    path: "/v1/usage",
    desc: "Query live quota utilization, asset counts, and 80% threshold warnings.",
    auth: "Bearer Token (assets:read)",
  },
];

export default function ApiReferencePage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl flex flex-col gap-10">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-muted mb-4">
              <Link href="/docs" className="hover:text-ink">Docs</Link>
              <span>/</span>
              <span className="text-ink font-bold">API Reference</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-sans">
              REST API v1 Reference
            </h1>
            <p className="mt-2 text-sm text-muted font-sans leading-relaxed">
              Base URL: <code className="font-mono text-ink bg-subtle px-2 py-0.5 border border-line">https://api.harizeon.com/v1</code>
            </p>
          </div>

          {/* Authentication */}
          <div className="border border-line bg-canvas p-6 font-mono text-xs flex flex-col gap-3">
            <span className="font-bold text-ink uppercase text-sm">Authentication</span>
            <p className="text-muted text-[11px] leading-relaxed font-sans">
              All API requests require a valid Bearer token generated from your <Link href="/settings/api-keys" className="text-ink underline">API Keys console</Link>. Pass the token in the <code className="text-ink">Authorization</code> header:
            </p>
            <pre className="border border-line bg-subtle p-3 text-ink">
Authorization: Bearer hrz_live_9f82ac4017b2...
            </pre>
          </div>

          {/* Endpoints Table */}
          <div className="border border-line bg-canvas">
            <div className="p-4 border-b border-line">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
                Endpoints Directory
              </h2>
            </div>
            <div className="divide-y divide-line font-mono text-xs">
              {ENDPOINTS.map((e) => (
                <div key={e.path + e.method} className="p-4 hover:bg-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="border border-ink bg-ink text-canvas px-1.5 py-0.5 text-[10px] uppercase font-bold">
                        {e.method}
                      </span>
                      <span className="font-bold text-ink">{e.path}</span>
                    </div>
                    <p className="text-muted text-[11px] font-sans mt-1">{e.desc}</p>
                  </div>
                  <span className="text-[10px] text-faint shrink-0 border border-line px-2 py-1 bg-canvas">
                    {e.auth}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Webhook HMAC Verification (§9.2) */}
          <div className="border border-line bg-canvas p-6 font-mono text-xs flex flex-col gap-3">
            <span className="font-bold text-ink uppercase text-sm">Webhook HMAC-SHA256 Signature Verification</span>
            <p className="text-muted text-[11px] leading-relaxed font-sans">
              Verify incoming webhook notifications using your channel secret. Each webhook delivers a timestamped signature in the <code className="text-ink">X-Harizeon-Signature</code> header.
            </p>
            <pre className="border border-line bg-subtle p-4 text-ink overflow-x-auto leading-relaxed">
{`import crypto from "node:crypto";

export function verifyHarizeonWebhook(payload: string, signatureHeader: string, secret: string): boolean {
  // Format: "t=1758280800,v1=9f82a..."
  const parts = Object.fromEntries(signatureHeader.split(",").map(p => p.split("=")));
  const expectedHmac = crypto.createHmac("sha256", secret)
    .update(\`\${parts.t}.\${payload}\`)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expectedHmac));
}`}
            </pre>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
