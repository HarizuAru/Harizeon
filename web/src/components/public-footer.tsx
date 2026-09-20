"use client";

import { useState } from "react";
import Link from "next/link";

export function PublicFooter() {
  const [locale, setLocale] = useState<"en" | "ms">("en");

  return (
    <footer className="border-t border-line bg-canvas mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand & Purpose */}
          <div className="col-span-2 flex flex-col gap-3">
            <span className="font-mono text-sm font-bold uppercase tracking-[0.1em] text-ink">
              Harizeon
            </span>
            <p className="text-xs text-muted max-w-sm leading-relaxed font-sans">
              Security infrastructure, provisioned like cloud. Scan, monitor, and prove the security posture of verified assets with strict ownership verification.
            </p>
            <p className="text-[11px] font-mono text-faint mt-2">
              Harizeon Technologies Sdn. Bhd. · Kuala Lumpur, Malaysia
            </p>
          </div>

          {/* Services Column */}
          <div className="flex flex-col gap-2 font-mono text-xs">
            <span className="font-bold text-ink uppercase tracking-wider text-[11px] mb-1">
              Services
            </span>
            <Link href="/services/scan" className="text-muted hover:text-ink">SCN · Scan</Link>
            <Link href="/services" className="text-muted hover:text-ink">ASM · Surface</Link>
            <Link href="/services" className="text-muted hover:text-ink">PRO · Probe</Link>
            <Link href="/services" className="text-muted hover:text-ink">INS · Inspect</Link>
            <Link href="/services" className="text-muted hover:text-ink">ADT · Audit</Link>
          </div>

          {/* Resources & Security */}
          <div className="flex flex-col gap-2 font-mono text-xs">
            <span className="font-bold text-ink uppercase tracking-wider text-[11px] mb-1">
              Resources
            </span>
            <Link href="/docs" className="text-muted hover:text-ink">Documentation</Link>
            <Link href="/docs/api" className="text-muted hover:text-ink">API Reference</Link>
            <Link href="/pricing" className="text-muted hover:text-ink">Pricing & Quotas</Link>
            <Link href="/security" className="text-muted hover:text-ink">Security Posture</Link>
            <Link href="/status" className="text-muted hover:text-ink">System Status</Link>
          </div>

          {/* Legal & Trust */}
          <div className="flex flex-col gap-2 font-mono text-xs">
            <span className="font-bold text-ink uppercase tracking-wider text-[11px] mb-1">
              Legal & Trust
            </span>
            <Link href="/legal/terms" className="text-muted hover:text-ink">Terms of Service</Link>
            <Link href="/legal/privacy" className="text-muted hover:text-ink">Privacy Policy (PDPA)</Link>
            <Link href="/legal/acceptable-use" className="text-muted hover:text-ink">Acceptable Use</Link>
            <Link href="/.well-known/security.txt" className="text-muted hover:text-ink">security.txt</Link>
          </div>
        </div>

        {/* Bottom Bar with Language Toggle & Notice */}
        <div className="mt-12 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          <p className="text-faint text-[11px]">
            © {new Date().getFullYear()} Harizeon Technologies. Built with constraint: pure black & white.
          </p>

          <div className="flex items-center gap-3">
            <span className="text-muted text-[11px]">Language:</span>
            <button
              onClick={() => setLocale("en")}
              className={`border px-2 py-0.5 text-[10px] uppercase ${
                locale === "en" ? "border-ink bg-ink text-canvas font-bold" : "border-line text-muted hover:text-ink"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLocale("ms")}
              className={`border px-2 py-0.5 text-[10px] uppercase ${
                locale === "ms" ? "border-ink bg-ink text-canvas font-bold" : "border-line text-muted hover:text-ink"
              }`}
            >
              BM
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
