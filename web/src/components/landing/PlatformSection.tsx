"use client";

import { useState } from "react";
import Link from "next/link";
import { PLATFORM_CONTENT } from "./data";
import { ArrowRightIcon, HarizeonBrandWordmark, PlusIcon } from "./icons";

const HARIZEON_STACK_BLOCKS = [
  {
    id: "adt",
    num: "5",
    label: "Governance & Compliance (ADT)",
    kind: "harizeon" as const,
    sub: "0–100 Score · ISO 27001 · SOC 2 · BNM RMiT · PDPA",
  },
  {
    id: "aia",
    num: "1",
    label: "Harizeon AI-Armor (AIA)",
    kind: "harizeon" as const,
    sub: "Ollama · vLLM · Qdrant · Milvus · MCP · JS Key Entropy",
  },
  {
    id: "scn",
    num: "3",
    label: "Vulnerability & Threat Sweeps (SCN)",
    kind: "harizeon" as const,
    sub: ".git / .env · Curated Banner CVEs · Web Checks",
  },
  {
    id: "pro-ins",
    num: "4",
    label: "Probe & Inspect (PRO · INS)",
    kind: "infra" as const,
    sub: "TCP Banner Recon | SNI TLS 1.3 | Security Headers",
  },
  {
    id: "asm",
    num: "2",
    label: "Verified Perimeter & Data Plane (ASM)",
    kind: "infra" as const,
    sub: "crt.sh + DNS | Redis Streams | Isolated Python Worker",
  },
];

export function PlatformSection() {
  const [openId, setOpenId] = useState<string>(PLATFORM_CONTENT.items[0].id);

  return (
    <section className="bg-[#171d29] text-white ps-section-py">
      <div className="ps-container">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2.5 mb-5">
          <span className="w-2 h-2 rounded-full bg-[#02acc5] shrink-0" />
          <span className="text-[14px] text-[#cccccc] font-normal">
            {PLATFORM_CONTENT.eyebrow}
          </span>
        </div>

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-12 lg:mb-14">
          <div className="lg:col-span-6">
            <h2 className="ps-h2 text-white max-w-[480px]">
              {PLATFORM_CONTENT.heading}
            </h2>
          </div>
          <div className="lg:col-span-6">
            <p className="text-[15px] md:text-[16px] leading-[1.5] text-[#cccccc]">
              {PLATFORM_CONTENT.description}
            </p>
          </div>
        </div>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Layered Platform Stack Graphic */}
          <div className="lg:col-span-6">
            <div className="aspect-square rounded-[24px] bg-[#111622] p-6 md:p-10 flex flex-col justify-between border border-white/10">
              <div className="space-y-3 my-auto">
                {HARIZEON_STACK_BLOCKS.map((block) => {
                  const isSelected = openId === block.id;
                  const isHarizeonIp = block.kind === "harizeon";
                  return (
                    <button
                      key={block.id}
                      type="button"
                      onClick={() => setOpenId(block.id)}
                      className={`w-full text-left rounded-2xl px-5 py-4 transition-all duration-150 cursor-pointer border ${
                        isHarizeonIp
                          ? isSelected
                            ? "bg-gradient-to-r from-[#02acc5] to-[#2a7ae9] text-white border-transparent shadow-lg shadow-[#02acc5]/25 scale-[1.01]"
                            : "bg-[#02acc5]/90 text-[#171d29] border-[#02acc5]/70 hover:bg-[#02acc5]"
                          : isSelected
                          ? "bg-[#1f2b40] text-white border-[#02acc5] shadow-lg scale-[1.01]"
                          : "bg-[#182133] text-white/90 border-white/10 hover:bg-[#1f2b40]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-md text-xs font-medium inline-flex items-center justify-center shrink-0 ${
                              isHarizeonIp
                                ? "bg-[#171d29] text-white"
                                : "bg-[#111622] text-[#02acc5]"
                            }`}
                          >
                            {block.num}
                          </span>
                          <span className="text-[15px] md:text-[17px] font-medium">
                            {block.label}
                          </span>
                        </div>
                      </div>
                      <p
                        className={`mt-1.5 pl-9 text-xs ${
                          isHarizeonIp
                            ? isSelected
                              ? "text-white/90"
                              : "text-[#171d29]/80"
                            : "text-[#dce2e3]/85"
                        }`}
                      >
                        {block.sub}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Brand & Legend Bar */}
              <div className="pt-5 mt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-5 text-xs text-[#dce2e3]">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-[#02acc5] inline-block" />
                    <span>Harizeon Engines</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-[#1f2b40] inline-block" />
                    <span>Isolated Data Plane</span>
                  </span>
                </div>
                <HarizeonBrandWordmark className="text-white scale-75 origin-right" />
              </div>
            </div>
          </div>

          {/* Right Dark Accordion Card */}
          <div className="lg:col-span-6">
            <div className="bg-[#1e2638] rounded-[24px] px-6 py-4 md:px-10 md:py-6">
              <ul className="divide-y divide-white/15">
                {PLATFORM_CONTENT.items.map((item) => {
                  const isOpen = openId === item.id;
                  return (
                    <li key={item.id} className="py-5">
                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? "" : item.id)}
                        aria-expanded={isOpen}
                        className="w-full flex items-center justify-between gap-4 text-left cursor-pointer group"
                      >
                        <span className="text-[18px] md:text-[20px] font-normal text-white group-hover:text-[#02acc5] transition-colors">
                          {item.title}
                        </span>
                        <PlusIcon
                          className={`w-6 h-6 shrink-0 text-white/80 transition-transform duration-200 ${
                            isOpen ? "rotate-45" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="pt-4 pr-2 space-y-5">
                          <p className="text-[14px] md:text-[15px] leading-[1.5] text-[#dce2e3]">
                            {item.description}
                          </p>
                          <Link
                            href={item.href}
                            className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl border border-white/35 text-[14px] md:text-[15px] text-white hover:bg-white hover:text-[#171d29] hover:border-white transition-colors duration-150"
                          >
                            <span>{item.ctaLabel}</span>
                            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
