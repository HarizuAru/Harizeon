"use client";

import { useState } from "react";
import Link from "next/link";

export function BadgeEmbedCard({ domain, isVerified }: { domain: string; isVerified: boolean }) {
  const [badgeType, setBadgeType] = useState<"posture" | "cisa-kev" | "ai-armor" | "act-854">("posture");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const cleanDomain = domain.replace(/[^a-zA-Z0-9.-]/g, "").toLowerCase();
  const badgeUrl = `/api/badge/${cleanDomain}?type=${badgeType}&theme=${theme}`;
  const verifyUrl = `/verify-benchmark/${cleanDomain}`;

  const htmlSnippet = `<a href="https://harizeon.com${verifyUrl}" target="_blank" rel="noopener noreferrer">
  <img src="https://harizeon.com${badgeUrl}" alt="${cleanDomain} Security Benchmark Verified by Harizeon" />
</a>`;

  const mdSnippet = `[![Harizeon Benchmark](https://harizeon.com${badgeUrl})](https://harizeon.com${verifyUrl})`;

  const handleCopy = (format: "html" | "md", text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="border border-line bg-canvas p-5 flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
              Harizeon Benchmark Trust Badge
            </span>
            <span className="border border-line bg-subtle px-1.5 py-0.2 font-mono text-[10px] text-[#02acc5] font-semibold uppercase">
              Certification
            </span>
          </div>
          <p className="text-xs text-muted font-sans mt-0.5">
            Embed this live certification badge on your website or repository to prove security compliance to your users.
          </p>
        </div>
        <Link
          href={verifyUrl}
          target="_blank"
          className="font-mono text-xs text-[#02acc5] hover:underline flex items-center gap-1 shrink-0"
        >
          <span>View Public Verification Page</span>
          <span>→</span>
        </Link>
      </div>

      {!isVerified ? (
        <div className="border border-line bg-subtle p-3 text-xs text-muted font-mono">
          <span className="text-ink font-semibold">Note:</span> Verify domain ownership first before publishing this badge in production.
        </div>
      ) : null}

      {/* Badge Type Selector & Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[11px] text-muted uppercase">Badge Certification Type</label>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => setBadgeType("posture")}
              className={`p-2 border text-left uppercase text-[11px] transition-colors ${
                badgeType === "posture" ? "border-ink bg-subtle font-bold text-ink" : "border-line text-muted hover:border-ink"
              }`}
            >
              Posture A+ (Score)
            </button>
            <button
              type="button"
              onClick={() => setBadgeType("cisa-kev")}
              className={`p-2 border text-left uppercase text-[11px] transition-colors ${
                badgeType === "cisa-kev" ? "border-ink bg-subtle font-bold text-ink" : "border-line text-muted hover:border-ink"
              }`}
            >
              0 Active Exploits
            </button>
            <button
              type="button"
              onClick={() => setBadgeType("ai-armor")}
              className={`p-2 border text-left uppercase text-[11px] transition-colors ${
                badgeType === "ai-armor" ? "border-ink bg-subtle font-bold text-ink" : "border-line text-muted hover:border-ink"
              }`}
            >
              AI-Armor (MCP)
            </button>
            <button
              type="button"
              onClick={() => setBadgeType("act-854")}
              className={`p-2 border text-left uppercase text-[11px] transition-colors ${
                badgeType === "act-854" ? "border-ink bg-subtle font-bold text-ink" : "border-line text-muted hover:border-ink"
              }`}
            >
              Malaysia Act 854
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[11px] text-muted uppercase">Color Theme</label>
          <div className="flex gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex-1 p-2 border text-center uppercase text-[11px] transition-colors ${
                theme === "dark" ? "border-ink bg-subtle font-bold text-ink" : "border-line text-muted hover:border-ink"
              }`}
            >
              Dark Theme
            </button>
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`flex-1 p-2 border text-center uppercase text-[11px] transition-colors ${
                theme === "light" ? "border-ink bg-subtle font-bold text-ink" : "border-line text-muted hover:border-ink"
              }`}
            >
              Light Theme
            </button>
          </div>

          {/* Live Preview Display */}
          <div className="mt-2 border border-line bg-subtle p-3 flex flex-col items-center justify-center gap-1.5 min-h-[50px]">
            <span className="text-[10px] font-mono text-muted uppercase">Live Preview</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badgeUrl} alt="Badge Preview" className="h-7 w-auto" />
          </div>
        </div>
      </div>

      {/* Embed Code Snippets */}
      <div className="flex flex-col gap-3 font-mono text-xs border-t border-line pt-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted uppercase">HTML Embed Snippet</span>
          <button
            type="button"
            onClick={() => handleCopy("html", htmlSnippet)}
            className="border border-line bg-subtle hover:border-ink px-2.5 py-1 text-[11px] text-ink uppercase font-semibold transition-colors"
          >
            {copiedFormat === "html" ? "✓ Copied" : "Copy HTML"}
          </button>
        </div>
        <pre className="border border-line bg-subtle p-2.5 text-[11px] text-ink overflow-x-auto select-all whitespace-pre-wrap">
          {htmlSnippet}
        </pre>

        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-muted uppercase">Markdown Snippet (GitHub / Docs)</span>
          <button
            type="button"
            onClick={() => handleCopy("md", mdSnippet)}
            className="border border-line bg-subtle hover:border-ink px-2.5 py-1 text-[11px] text-ink uppercase font-semibold transition-colors"
          >
            {copiedFormat === "md" ? "✓ Copied" : "Copy Markdown"}
          </button>
        </div>
        <pre className="border border-line bg-subtle p-2.5 text-[11px] text-ink overflow-x-auto select-all whitespace-pre-wrap">
          {mdSnippet}
        </pre>
      </div>
    </div>
  );
}
