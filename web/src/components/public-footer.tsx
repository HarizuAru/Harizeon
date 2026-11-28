"use client";

import { useState } from "react";
import Link from "next/link";
import { HarizeonBrandWordmark } from "./landing/icons";

export function PublicFooter() {
  const [locale, setLocale] = useState<"en" | "ms">("en");

  return (
    <footer className="bg-[#171d29] text-white pt-[clamp(4.5rem,3.5rem+5vw,8rem)] pb-10 mt-auto border-t border-white/10">
      <div className="ps-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-14 lg:pb-16 border-b border-white/15">
          {/* Col 1: Brand & Overview */}
          <div className="lg:col-span-5 pr-0 lg:pr-10">
            <Link href="/" aria-label="Harizeon Home" className="inline-block mb-6 text-white">
              <HarizeonBrandWordmark />
            </Link>

            <h2 className="text-[18px] md:text-[20px] font-normal text-white mb-4">
              Security Infrastructure, Provisioned Like Cloud
            </h2>

            <div className="space-y-4 text-[13px] md:text-[14px] leading-[1.55] text-[#bcc3c7] mb-6">
              <p>
                Harizeon continuously discovers, scans, and audits verified external perimeters for modern software teams, AI startups, and enterprises.
              </p>
              <p>
                Harizeon Technologies Sdn. Bhd. · Kuala Lumpur, Malaysia
              </p>
            </div>
          </div>

          {/* Col 2: Services */}
          <div className="lg:col-span-3">
            <h3 className="text-[16px] font-normal text-white pb-3 mb-4 border-b border-white/20">
              Services
            </h3>
            <ul className="space-y-2.5 text-[13px] md:text-[14px] text-[#dce2e3]">
              <li>
                <Link href="/services/aia" className="hover:text-[#02acc5] transition-colors">
                  AIA · Harizeon AI-Armor
                </Link>
              </li>
              <li>
                <Link href="/services/scan" className="hover:text-[#02acc5] transition-colors">
                  SCN · Harizeon Scan
                </Link>
              </li>
              <li>
                <Link href="/services/asm" className="hover:text-[#02acc5] transition-colors">
                  ASM · Harizeon Surface
                </Link>
              </li>
              <li>
                <Link href="/services/pro" className="hover:text-[#02acc5] transition-colors">
                  PRO · Harizeon Probe
                </Link>
              </li>
              <li>
                <Link href="/services/ins" className="hover:text-[#02acc5] transition-colors">
                  INS · Harizeon Inspect
                </Link>
              </li>
              <li>
                <Link href="/services/adt" className="hover:text-[#02acc5] transition-colors">
                  ADT · Harizeon Audit
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources & Security */}
          <div className="lg:col-span-2">
            <h3 className="text-[16px] font-normal text-white pb-3 mb-4 border-b border-white/20">
              Resources
            </h3>
            <ul className="space-y-2.5 text-[13px] md:text-[14px] text-[#dce2e3]">
              <li>
                <Link href="/docs" className="hover:text-[#02acc5] transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/docs/api" className="hover:text-[#02acc5] transition-colors">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#02acc5] transition-colors">
                  Pricing &amp; Quotas
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-[#02acc5] transition-colors">
                  Security Posture
                </Link>
              </li>
              <li>
                <Link href="/status" className="hover:text-[#02acc5] transition-colors">
                  System Status
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Trust */}
          <div className="lg:col-span-2">
            <h3 className="text-[16px] font-normal text-white pb-3 mb-4 border-b border-white/20">
              Legal &amp; Trust
            </h3>
            <ul className="space-y-2.5 text-[13px] md:text-[14px] text-[#dce2e3]">
              <li>
                <Link href="/legal/terms" className="hover:text-[#02acc5] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-[#02acc5] transition-colors">
                  Privacy Policy (PDPA)
                </Link>
              </li>
              <li>
                <Link href="/legal/dpa" className="hover:text-[#02acc5] transition-colors">
                  Data Processing (DPA)
                </Link>
              </li>
              <li>
                <Link href="/legal/acceptable-use" className="hover:text-[#02acc5] transition-colors">
                  Acceptable Use
                </Link>
              </li>
              <li>
                <Link href="/.well-known/security.txt" className="hover:text-[#02acc5] transition-colors">
                  security.txt
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Row */}
        <div className="pt-6 flex flex-wrap items-center justify-between gap-4 text-[12px] text-[#bcc3c7]">
          <span>
            © {new Date().getFullYear()} Harizeon Technologies. All rights reserved.
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[#bcc3c7]">Language:</span>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`px-2.5 py-1 rounded-md text-[11px] uppercase cursor-pointer transition-colors ${
                locale === "en"
                  ? "bg-gradient-to-r from-[#02acc5] to-[#2a7ae9] text-white font-medium"
                  : "border border-white/20 text-[#dce2e3] hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLocale("ms")}
              className={`px-2.5 py-1 rounded-md text-[11px] uppercase cursor-pointer transition-colors ${
                locale === "ms"
                  ? "bg-gradient-to-r from-[#02acc5] to-[#2a7ae9] text-white font-medium"
                  : "border border-white/20 text-[#dce2e3] hover:text-white"
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
