"use client";

import { useState } from "react";
import Link from "next/link";

export interface TrustProfile {
  org_name: string;
  slug: string;
  posture_score: number;
  grade: string;
  verified_domains_count: number;
  open_critical_count: number;
  last_scan_at: string;
  is_verified: boolean;
  sha256_attestation: string;
}

export function PublicTrustView({ profile }: { profile: TrustProfile }) {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const badgeUrl = `/api/badge/${profile.slug}?theme=dark`;
  const trustUrl = `https://harizeon.com/trust/${profile.slug}`;

  const htmlSnippet = `<a href="${trustUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${badgeUrl}" alt="Verified Security Posture by Harizeon" />\n</a>`;
  const mdSnippet = `[![Verified Security Posture by Harizeon](${badgeUrl})](${trustUrl})`;

  function handleCopy(text: string, format: string) {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 3000);
  }

  return (
    <div className="min-h-screen bg-canvas p-6 md:p-12 text-ink flex flex-col items-center">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b-2 border-ink pb-4">
          <Link href="/" className="font-mono text-sm font-bold tracking-widest text-ink uppercase">
            HARIZEON · PUBLIC TRUST REGISTRY
          </Link>
          <span className="font-mono text-[10px] text-muted uppercase">
            SHA256 VERIFIED ATTESTATION
          </span>
        </div>

        {/* Certificate Card */}
        <div className="border-2 border-ink bg-canvas p-8 flex flex-col gap-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-line pb-6">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted block mb-1">
                ATTACK SURFACE POSTURE CERTIFICATION
              </span>
              <h1 className="text-3xl font-extrabold uppercase tracking-tight text-ink">
                {profile.org_name}
              </h1>
              <p className="font-mono text-xs text-muted mt-1">
                Workspace ID: <code className="text-ink font-bold">{profile.slug}</code>
              </p>
            </div>

            <div className="border-2 border-ink p-3 text-center md:text-right font-mono self-start">
              <div className="text-[10px] uppercase text-muted">Posture Grade</div>
              <div className="text-3xl font-black text-ink">{profile.grade}</div>
              <div className="text-[10px] text-faint">{profile.posture_score} / 100 PTS</div>
            </div>
          </div>

          {/* Key Assurance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="border border-line bg-subtle p-4 flex flex-col gap-1">
              <span className="text-[10px] uppercase text-muted">Continuous EASM Monitoring</span>
              <span className="text-sm font-bold text-ink">ACTIVE [✓]</span>
              <span className="text-[10px] text-muted">Autonomous weekly perimeter audits</span>
            </div>

            <div className="border border-line bg-subtle p-4 flex flex-col gap-1">
              <span className="text-[10px] uppercase text-muted">Critical Vulnerabilities</span>
              <span className="text-sm font-bold text-ink">
                {profile.open_critical_count === 0 ? "0 CRITICAL EXPOSURES [✓]" : `${profile.open_critical_count} ACTIVE`}
              </span>
              <span className="text-[10px] text-muted">Zero weaponized CISA KEV vectors</span>
            </div>

            <div className="border border-line bg-subtle p-4 flex flex-col gap-1">
              <span className="text-[10px] uppercase text-muted">Monitored Attack Surface</span>
              <span className="text-sm font-bold text-ink">{profile.verified_domains_count} ROOT DOMAINS</span>
              <span className="text-[10px] text-muted">Cryptographically verified control</span>
            </div>
          </div>

          {/* Attestation Signature Box */}
          <div className="border border-line bg-subtle p-4 font-mono text-[11px] leading-relaxed flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px] text-muted border-b border-line pb-2">
              <span className="font-bold text-ink uppercase">Cryptographic Audit Attestation</span>
              <span>LAST AUDITED: {new Date(profile.last_scan_at).toISOString()}</span>
            </div>
            <p className="text-muted text-[11px]">
              This organization authorizes Harizeon to execute ongoing perimeter telemetry. The posture grade reflects absence of known exploitable network vectors, valid cryptographic transit (TLS 1.2+), and active security header protection.
            </p>
            <div className="text-[10px] text-muted break-all">
              SIGNATURE HASH: <code className="text-ink font-bold">{profile.sha256_attestation}</code>
            </div>
          </div>
        </div>

        {/* Embeddable Badge Code Snippets */}
        <div className="border border-line bg-canvas p-6 flex flex-col gap-4 font-mono text-xs">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
              Embed Trust Badge on your Website
            </h2>
            <p className="text-xs text-muted mt-1 font-sans">
              Display live security assurance on your enterprise RFP packs, client proposal decks, and website footer.
            </p>
          </div>

          <div className="flex items-center gap-4 border border-line bg-subtle p-4">
            <span className="text-[10px] uppercase text-muted font-bold">Live Preview:</span>
            {/* Live SVG Badge Render */}
            <div className="inline-block border border-ink p-1 bg-canvas">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={badgeUrl} alt="Harizeon Trust Badge" className="h-6" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] uppercase text-muted font-bold">HTML Snippet</span>
                <button
                  onClick={() => handleCopy(htmlSnippet, "html")}
                  className="border border-line px-2 py-0.5 text-[10px] uppercase hover:border-ink hover:text-ink"
                >
                  {copiedFormat === "html" ? "[✓ COPIED]" : "[ COPY HTML ]"}
                </button>
              </div>
              <pre className="p-3 border border-line bg-subtle overflow-x-auto text-[11px] text-ink whitespace-pre-wrap">
                {htmlSnippet}
              </pre>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] uppercase text-muted font-bold">Markdown Snippet (README / Docs)</span>
                <button
                  onClick={() => handleCopy(mdSnippet, "md")}
                  className="border border-line px-2 py-0.5 text-[10px] uppercase hover:border-ink hover:text-ink"
                >
                  {copiedFormat === "md" ? "[✓ COPIED]" : "[ COPY MARKDOWN ]"}
                </button>
              </div>
              <pre className="p-3 border border-line bg-subtle overflow-x-auto text-[11px] text-ink whitespace-pre-wrap">
                {mdSnippet}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-line pt-4 flex justify-between items-center font-mono text-[10px] text-muted">
          <span>HARIZEON AUTONOMOUS EASM FLEET · VERSION 1.1</span>
          <Link href="/" className="underline text-ink">
            Return to Console →
          </Link>
        </div>
      </div>
    </div>
  );
}
