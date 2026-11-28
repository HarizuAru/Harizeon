"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PRICING_AND_RESOURCES_CONTENT } from "./data";
import { ArrowLeftIcon, ArrowRightIcon } from "./icons";

export function PricingCarouselSection() {
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
    const firstCard = el.querySelector<HTMLElement>("[data-news-card]");
    const step = firstCard ? firstCard.offsetWidth + 24 : el.clientWidth * 0.75;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const thumbWidthPct = 40;
  const thumbLeftPct = progress * (100 - thumbWidthPct);

  return (
    <section className="bg-white text-[#171d29] ps-section-py overflow-hidden">
      <div className="ps-container">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2.5 mb-5">
          <span className="w-2 h-2 rounded-full bg-[#02acc5] shrink-0" />
          <span className="text-[14px] text-[#3e4e53] font-normal">
            {PRICING_AND_RESOURCES_CONTENT.eyebrow}
          </span>
        </div>

        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 lg:mb-12">
          <h2 className="ps-h2 text-[#171d29]">
            {PRICING_AND_RESOURCES_CONTENT.heading}
          </h2>
          <Link
            href="/pricing"
            className="text-sm font-medium text-[#171d29] hover:text-[#02acc5] transition-colors"
          >
            View full pricing calculator →
          </Link>
        </div>

        {/* Carousel Track */}
        <div
          ref={trackRef}
          onScroll={updateScrollState}
          className="flex gap-6 overflow-x-auto ps-no-scrollbar scroll-smooth snap-x snap-mandatory pb-2"
        >
          {PRICING_AND_RESOURCES_CONTENT.items.map((item, idx) => (
            <Link
              key={item.headline}
              data-news-card
              href={item.href}
              className="group snap-start shrink-0 w-[270px] sm:w-[300px] lg:w-[calc((100%-72px)/4)] flex flex-col"
            >
              <div className="aspect-[4/3] rounded-[20px] overflow-hidden bg-[#f5f6f8] mb-4">
                <img
                  src={item.image}
                  alt={item.alt}
                  loading={idx < 8 ? "eager" : "lazy"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="flex items-center justify-between gap-2 text-[12px] text-[#3e4e53] mb-2">
                <span>{item.category}</span>
                <span>{item.badge}</span>
              </div>

              <h3 className="text-[18px] md:text-[20px] font-normal leading-[1.3] text-[#171d29] group-hover:text-[#02acc5] transition-colors mb-1.5">
                {item.headline}
              </h3>

              <p className="text-[13px] text-[#3e4e53] leading-relaxed">
                {item.description}
              </p>
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
