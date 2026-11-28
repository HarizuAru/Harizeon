"use client";

import { useState } from "react";
import Link from "next/link";
import { THREAT_VECTORS_CONTENT } from "./data";
import { ArrowRightIcon, PlusIcon } from "./icons";

export function ThreatVectorsSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeImageId, setActiveImageId] = useState<string>(
    THREAT_VECTORS_CONTENT.items[0].id
  );

  const activeVector =
    THREAT_VECTORS_CONTENT.items.find((v) => v.id === activeImageId) ??
    THREAT_VECTORS_CONTENT.items[0];

  return (
    <section className="bg-[#f5f6f8] text-[#171d29] ps-section-py">
      <div className="ps-container">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2.5 mb-5">
          <span className="w-2 h-2 rounded-full bg-[#02acc5] shrink-0" />
          <span className="text-[14px] text-[#3e4e53] font-normal">
            {THREAT_VECTORS_CONTENT.eyebrow}
          </span>
        </div>

        {/* Heading */}
        <h2 className="ps-h2 text-[#171d29] mb-12 lg:mb-14">
          {THREAT_VECTORS_CONTENT.headingLine1}
          <br />
          {THREAT_VECTORS_CONTENT.headingLine2}
        </h2>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left White Accordion Card */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-[24px] px-6 py-3 md:px-10 md:py-5 border border-[#dce2e3]/60">
              <ul className="divide-y divide-[#dce2e3]">
                {THREAT_VECTORS_CONTENT.items.map((item) => {
                  const isOpen = openId === item.id;
                  return (
                    <li key={item.id} className="py-4 md:py-5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveImageId(item.id);
                          setOpenId(isOpen ? null : item.id);
                        }}
                        aria-expanded={isOpen}
                        className="w-full flex items-center justify-between gap-4 text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="px-2.5 py-1 rounded-full bg-[#171d29] text-white text-[11px] font-medium shrink-0">
                            {item.severity}
                          </span>
                          <span className="text-[18px] md:text-[20px] font-normal text-[#171d29] group-hover:text-[#02acc5] transition-colors truncate">
                            {item.title}
                          </span>
                        </div>
                        <PlusIcon
                          className={`w-6 h-6 shrink-0 text-[#171d29] transition-transform duration-200 ${
                            isOpen ? "rotate-45" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="pt-4 pr-2 space-y-4">
                          <p className="text-[12px] font-mono text-[#3e4e53]">
                            {item.ports}
                          </p>
                          <p className="text-[14px] md:text-[15px] leading-[1.55] text-[#3e4e53]">
                            {item.summary}
                          </p>
                          <Link
                            href={item.href}
                            className="group inline-flex items-center gap-2 text-[14px] md:text-[15px] font-medium text-[#171d29] hover:text-[#02acc5] transition-colors"
                          >
                            <span>Inspect check spec</span>
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

          {/* Right Square Photo with Overlaid Specimen Badge */}
          <div className="lg:col-span-6">
            <div className="relative aspect-square rounded-[24px] overflow-hidden bg-[#171d29]">
              <img
                src={activeVector.image}
                alt={activeVector.imageAlt}
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(16, 22, 26, 0.12) 0%, rgba(16, 22, 26, 0.86) 100%)",
                }}
              />
              <div className="absolute inset-x-6 bottom-6 md:inset-x-8 md:bottom-8 bg-[#171d29]/95 border border-white/15 rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs text-[#02acc5]">
                    {activeVector.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-mono">
                    {activeVector.severity} · NON-DESTRUCTIVE
                  </span>
                </div>
                <p className="font-mono text-xs text-[#dce2e3] mb-1.5">
                  {activeVector.probeSignature}
                </p>
                <p className="font-mono text-[11px] text-white/80 truncate">
                  {activeVector.evidenceSample}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
