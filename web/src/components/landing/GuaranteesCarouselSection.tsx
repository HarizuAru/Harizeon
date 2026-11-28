"use client";

import { useState } from "react";
import { GUARANTEES_CONTENT } from "./data";
import { ArrowLeftIcon, ArrowRightIcon, QuoteMarkIcon } from "./icons";

export function GuaranteesCarouselSection() {
  const [index, setIndex] = useState(0);
  const total = GUARANTEES_CONTENT.length;
  const current = GUARANTEES_CONTENT[index];

  const thumbWidthPct = 100 / total;
  const thumbLeftPct = index * thumbWidthPct;

  return (
    <section className="bg-white text-[#171d29] ps-section-py">
      <div className="ps-container">
        {/* Card */}
        <div className="relative bg-[#f5f6f8] rounded-[24px] px-6 py-16 md:px-16 md:py-20 lg:px-24 lg:py-24 overflow-hidden">
          <QuoteMarkIcon className="hidden md:block absolute top-8 left-8 lg:top-10 lg:left-12 w-20 h-20 lg:w-24 lg:h-24 text-[#bcc3c7]" />
          <QuoteMarkIcon className="hidden md:block absolute bottom-8 right-8 lg:bottom-10 lg:right-12 w-20 h-20 lg:w-24 lg:h-24 text-[#bcc3c7] rotate-180" />

          <figure className="relative z-10 max-w-[760px] mx-auto text-center">
            <blockquote className="mb-8">
              <p className="text-[19px] md:text-[24px] lg:text-[26px] font-light leading-[1.4] tracking-[-0.01em] text-[#171d29]">
                {current.quote}
              </p>
            </blockquote>

            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-wrap items-center justify-center gap-2 text-[14px] md:text-[15px] text-[#3e4e53]">
                <span>{current.author}</span>
                <span className="text-[#bcc3c7]">|</span>
                <span>{current.role}</span>
              </div>
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border border-[#dce2e3] font-mono text-xs font-medium text-[#171d29]">
                {current.badge}
              </span>
            </div>
          </figure>
        </div>

        {/* Progress Bar & Prev/Next Controls */}
        <div className="mt-8 flex items-center justify-between gap-6">
          <div className="relative flex-1 h-[2px] bg-[#bcc3c7] rounded-full overflow-hidden">
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-[#02acc5] to-[#2a7ae9] rounded-full transition-[left] duration-200"
              style={{
                width: `${thumbWidthPct}%`,
                left: `${thumbLeftPct}%`,
              }}
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              aria-label="Previous slide"
              className="w-11 h-11 rounded-full border border-[#dce2e3] flex items-center justify-center text-[#171d29] hover:bg-[#171d29] hover:text-white hover:border-[#171d29] disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
              disabled={index === total - 1}
              aria-label="Next slide"
              className="w-11 h-11 rounded-full border border-[#dce2e3] flex items-center justify-center text-[#171d29] hover:bg-[#171d29] hover:text-white hover:border-[#171d29] disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
