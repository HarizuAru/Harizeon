"use client";

import { useState } from "react";
import { PRODUCTS_DATA } from "./data";

export function ProductsSection() {
  const [catIdx, setCatIdx] = useState(0);
  const [subIdx, setSubIdx] = useState(0);

  const currentCat = PRODUCTS_DATA.categories[catIdx];
  const currentSub = currentCat.subTabs[subIdx] ?? currentCat.subTabs[0];

  return (
    <section className="bg-[#f5f6f8] text-[#242b2e] ps-section-py">
      <div className="ps-container">
        {/* Header + Primary Category Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-8 lg:mb-10">
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2.5 mb-5">
              <span className="w-2 h-2 rounded-full bg-[#ffcd30] shrink-0" />
              <span className="text-[14px] text-[#3e4e53] font-normal">
                {PRODUCTS_DATA.eyebrow}
              </span>
            </div>
            <h2 className="ps-h2 text-[#242b2e]">
              {PRODUCTS_DATA.headingLine1}
              <br />
              {PRODUCTS_DATA.headingLine2}
            </h2>
          </div>

          {/* Primary Tabs */}
          <div className="lg:col-span-6">
            <div
              role="tablist"
              aria-label="Product categories"
              className="grid grid-cols-3 gap-3"
            >
              {PRODUCTS_DATA.categories.map((cat, idx) => {
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
                        ? "bg-[#242b2e] text-white"
                        : "bg-white text-[#242b2e] hover:bg-[#dce2e3]/60"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Secondary Tabs (above image) */}
        <div
          role="tablist"
          aria-label="Product sub-items"
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
                    ? "border-[#ffcd30] text-[#242b2e] font-medium"
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
              aria-label="Product sub-items desktop"
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
                        ? "border-[#ffcd30] text-[#242b2e] font-medium"
                        : "border-transparent text-[#3e4e53] hover:text-[#242b2e]"
                    }`}
                  >
                    {sub.tabLabel}
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-[24px] p-7 md:p-10 lg:p-12 border border-[#dce2e3]/60">
              <h3 className="ps-h3 text-[#242b2e] mb-5">{currentSub.title}</h3>
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
              <a
                href={currentSub.href}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-[#242b2e] text-[#242b2e] text-[14px] md:text-[15px] font-normal hover:bg-[#242b2e] hover:text-white transition-colors duration-150"
              >
                {currentSub.ctaLabel}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
