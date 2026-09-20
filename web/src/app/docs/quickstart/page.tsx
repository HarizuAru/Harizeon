import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Quickstart Guide — Harizeon Docs",
  description: "Verify your domain, trigger your first automated vulnerability scan, and extract normalized findings in four minutes.",
};

export default function QuickstartPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl flex flex-col gap-10">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-muted mb-4">
              <Link href="/docs" className="hover:text-ink">Docs</Link>
              <span>/</span>
              <span className="text-ink font-bold">Quickstart</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-sans">
              Quickstart Guide: From Zero to First Scan
            </h1>
            <p className="mt-2 text-sm text-muted font-sans leading-relaxed">
              Follow this step-by-step walk-through to register an asset, prove control, and trigger an automated assessment.
            </p>
          </div>

          {/* Step 1 */}
          <div className="border border-line bg-canvas p-6 flex flex-col gap-3 font-mono text-xs">
            <span className="font-bold text-ink text-sm">Step 1: Add your Root Domain</span>
            <p className="text-muted text-[11px] leading-relaxed font-sans">
              Log into your Harizeon Console or use the REST API to register your target root domain:
            </p>
            <pre className="border border-line bg-subtle p-3 text-ink overflow-x-auto">
{`$ curl -X POST https://api.harizeon.com/v1/assets \\
  -H "Authorization: Bearer hrz_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"type": "domain", "value": "example.com"}'

{
  "id": "ast_01H89K2P00",
  "value": "example.com",
  "status": "pending",
  "token": "harizeon-site-verification=hzv_live_4f89ac72b109e"
}`}
            </pre>
          </div>

          {/* Step 2 */}
          <div className="border border-line bg-canvas p-6 flex flex-col gap-3 font-mono text-xs">
            <span className="font-bold text-ink text-sm">Step 2: Add the DNS Verification Record</span>
            <p className="text-muted text-[11px] leading-relaxed font-sans">
              Add a DNS TXT record at your DNS provider matching the token returned in Step 1:
            </p>
            <div className="border border-line bg-subtle p-3 flex flex-col gap-1 text-[11px]">
              <div><strong className="text-ink">Record Type:</strong> TXT</div>
              <div><strong className="text-ink">Host Name:</strong> _harizeon-verify.example.com</div>
              <div><strong className="text-ink">Record Value:</strong> harizeon-site-verification=hzv_live_4f89ac72b109e</div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="border border-line bg-canvas p-6 flex flex-col gap-3 font-mono text-xs">
            <span className="font-bold text-ink text-sm">Step 3: Trigger the Verification Check</span>
            <p className="text-muted text-[11px] leading-relaxed font-sans">
              Instruct the Harizeon control plane to resolve your DNS TXT record across global public DNS root resolvers:
            </p>
            <pre className="border border-line bg-subtle p-3 text-ink overflow-x-auto">
{`$ curl -X POST https://api.harizeon.com/v1/assets/ast_01H89K2P00/verify \\
  -H "Authorization: Bearer hrz_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"method": "dns_txt"}'

{
  "status": "verified",
  "verified_at": "2026-09-19T06:01:12.000Z"
}`}
            </pre>
          </div>

          {/* Step 4 */}
          <div className="border border-line bg-canvas p-6 flex flex-col gap-3 font-mono text-xs">
            <span className="font-bold text-ink text-sm">Step 4: Launch Your First Scan</span>
            <p className="text-muted text-[11px] leading-relaxed font-sans">
              Now that your asset has cryptographically proven ownership, you can dispatch an on-demand scan:
            </p>
            <pre className="border border-line bg-subtle p-3 text-ink overflow-x-auto">
{`$ curl -X POST https://api.harizeon.com/v1/scans \\
  -H "Authorization: Bearer hrz_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"asset_ids": ["ast_01H89K2P00"], "profile": "standard"}'

{
  "id": "scn_01H89K2P99",
  "status": "queued",
  "profile": "standard"
}`}
            </pre>
          </div>

          <div className="flex justify-between items-center border-t border-line pt-6">
            <Link href="/docs" className="border border-line px-4 py-2 font-mono text-xs uppercase hover:border-ink">
              ← Back to Docs
            </Link>
            <Link href="/docs/api" className="border border-ink bg-ink text-canvas px-6 py-2 font-mono text-xs uppercase font-bold hover:bg-canvas hover:text-ink transition-colors">
              Continue to REST API Reference →
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
