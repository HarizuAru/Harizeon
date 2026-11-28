"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { COMPLIANCE_CAROUSEL_CONTENT } from "./data";
import { ArrowLeftIcon, ArrowRightIcon } from "./icons";

export function ComplianceCarouselSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 1) {
      setProgress(1);
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    const ratio = el.scrollLeft / maxScroll;
    setProgress(Math.min(1, Math.max(0, ratio)));
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(updateScrollState);
    window.addEventListener("resize", updateScrollState);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollByCards = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>("[data-compliance-card]");
    const step = firstCard ? firstCard.offsetWidth + 24 : el.clientWidth * 0.75;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const thumbWidthPct = 33.33;
  const thumbLeftPct = progress * (100 - thumbWidthPct);

  return (
    <section className="bg-white text-[#171d29] ps-section-py overflow-hidden">
      <div className="ps-container">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2.5 mb-5">
          <span className="w-2 h-2 rounded-full bg-[#02acc5] shrink-0" />
          <span className="text-[14px] text-[#3e4e53] font-normal">
            {COMPLIANCE_CAROUSEL_CONTENT.eyebrow}
          </span>
        </div>

        {/* Heading */}
        <h2 className="ps-h2 text-[#171d29] mb-10 lg:mb-12">
          {COMPLIANCE_CAROUSEL_CONTENT.headingLine1}
          <br />
          {COMPLIANCE_CAROUSEL_CONTENT.headingLine2}
        </h2>

        {/* Carousel Track */}
        <div
          ref={trackRef}
          onScroll={updateScrollState}
          className="flex gap-6 overflow-x-auto ps-no-scrollbar scroll-smooth snap-x snap-mandatory pb-2"
        >
          {COMPLIANCE_CAROUSEL_CONTENT.items.map((item) => (
            <Link
              key={item.title}
              data-compliance-card
              href={item.href}
              className="group snap-start shrink-0 w-[260px] sm:w-[290px] lg:w-[calc((100%-72px)/4)] block"
            >
              <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden bg-[#f5f6f8] mb-4">
                <img
                  src={item.image}
                  alt={item.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-24"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(20,25,28,0.75) 100%)",
                  }}
                />
                <span className="absolute left-4 bottom-4 px-3 py-1 rounded-full bg-white/90 text-[#171d29] text-xs font-medium">
                  {item.subtitle}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 text-[16px] lg:text-[18px] font-normal text-[#171d29] group-hover:text-[#02acc5] transition-colors">
                <span>{item.title}</span>
                <ArrowRightIcon className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* Progress Bar & Prev/Next Controls */}
        <div className="mt-8 flex items-center justify-between gap-6">
          <div className="relative flex-1 h-[2px] bg-[#bcc3c7] rounded-full overflow-hidden">
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-[#02acc5] to-[#2a7ae9] rounded-full transition-[left] duration-150"
              style={{
                width: `${thumbWidthPct}%`,
                left: `${thumbLeftPct}%`,
              }}
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              disabled={!canPrev}
              aria-label="Previous slide"
              className="w-11 h-11 rounded-full border border-[#dce2e3] flex items-center justify-center text-[#171d29] hover:bg-[#171d29] hover:text-white hover:border-[#171d29] disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              disabled={!canNext}
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
