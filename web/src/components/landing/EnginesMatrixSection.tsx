"use client";

import { useState } from "react";
import Link from "next/link";
import { ENGINES_MATRIX_CONTENT } from "./data";

export function EnginesMatrixSection() {
  const [catIdx, setCatIdx] = useState(0);
  const [subIdx, setSubIdx] = useState(0);

  const currentCat = ENGINES_MATRIX_CONTENT.categories[catIdx];
  const currentSub = currentCat.subTabs[subIdx] ?? currentCat.subTabs[0];

  return (
    <section className="bg-[#f5f6f8] text-[#171d29] ps-section-py">
      <div className="ps-container">
        {/* Header + Primary Category Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-8 lg:mb-10">
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2.5 mb-5">
              <span className="w-2 h-2 rounded-full bg-[#02acc5] shrink-0" />
              <span className="text-[14px] text-[#3e4e53] font-normal">
                {ENGINES_MATRIX_CONTENT.eyebrow}
              </span>
            </div>
            <h2 className="ps-h2 text-[#171d29]">
              {ENGINES_MATRIX_CONTENT.headingLine1}
              <br />
              {ENGINES_MATRIX_CONTENT.headingLine2}
            </h2>
          </div>

          <div className="lg:col-span-6">
            <div
              role="tablist"
              aria-label="Engine categories"
              className="grid grid-cols-3 gap-3"
            >
              {ENGINES_MATRIX_CONTENT.categories.map((cat, idx) => {
                const active = idx === catIdx;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setCatIdx(idx);
                      setSubIdx(0);
                    }}
                    className={`px-3 py-3.5 rounded-xl text-[13px] md:text-[15px] font-normal text-center transition-colors duration-150 cursor-pointer ${
                      active
                        ? "bg-[#171d29] text-white shadow-sm"
                        : "bg-white text-[#171d29] hover:bg-[#dce2e3]/60"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Secondary Tabs */}
        <div
          role="tablist"
          aria-label="Engine sub-items"
          className="lg:hidden grid grid-cols-3 border-b border-[#dce2e3] mb-6"
        >
          {currentCat.subTabs.map((sub, idx) => {
            const active = idx === subIdx;
            return (
              <button
                key={sub.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSubIdx(idx)}
                className={`py-3 px-2 text-[13px] text-center transition-colors border-b-2 -mb-px cursor-pointer ${
                  active
                    ? "border-[#02acc5] text-[#02acc5] font-medium"
                    : "border-transparent text-[#3e4e53]"
                }`}
              >
                {sub.tabLabel}
              </button>
            );
          })}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* Left 4:3 Image */}
          <div className="lg:col-span-6">
            <div className="aspect-[4/3] rounded-[24px] overflow-hidden bg-white">
              <img
                src={currentSub.image}
                alt={currentSub.imageAlt}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right Secondary Tabs + White Detail Card */}
          <div className="lg:col-span-6">
            <div
              role="tablist"
              aria-label="Engine sub-items desktop"
              className="hidden lg:grid grid-cols-3 border-b border-[#dce2e3] mb-6"
            >
              {currentCat.subTabs.map((sub, idx) => {
                const active = idx === subIdx;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSubIdx(idx)}
                    className={`py-3.5 px-3 text-[14px] text-center transition-colors border-b-2 -mb-px cursor-pointer ${
                      active
                        ? "border-[#02acc5] text-[#02acc5] font-medium"
                        : "border-transparent text-[#3e4e53] hover:text-[#171d29]"
                    }`}
                  >
                    {sub.tabLabel}
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-[24px] p-7 md:p-10 lg:p-12 border border-[#dce2e3]/60">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="ps-h3 text-[#171d29]">{currentSub.title}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                    currentSub.status === "Available"
                      ? "bg-[#02acc5]/15 text-[#02acc5] border border-[#02acc5]/30"
                      : "bg-[#f5f6f8] border border-[#dce2e3] text-[#3e4e53]"
                  }`}
                >
                  {currentSub.status}
                </span>
              </div>
              <div className="space-y-4 mb-7">
                {currentSub.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className="text-[14px] md:text-[15px] leading-[1.55] text-[#3e4e53]"
                  >
                    {p}
                  </p>
                ))}
              </div>
              <Link
                href={currentSub.href}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-[#171d29] text-[#171d29] text-[14px] md:text-[15px] font-normal hover:bg-[#171d29] hover:text-white transition-colors duration-150"
              >
                {currentSub.ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
