import Link from "next/link";
import { BOTTOM_CTA_CONTENT } from "./data";

export function BottomCtaSection() {
  return (
    <section className="relative min-h-[540px] lg:min-h-[624px] w-full overflow-hidden flex items-center py-14 lg:py-20 bg-[#dce2e3]">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={BOTTOM_CTA_CONTENT.videoSrc} type="video/mp4" />
      </video>

      {/* Left-Aligned Frosted White Card */}
      <div className="ps-container relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-[24px] p-8 md:p-11 lg:p-12 max-w-[440px] shadow-sm">
          <div className="inline-flex items-center gap-2.5 mb-5">
            <span className="w-2 h-2 rounded-full bg-[#02acc5] shrink-0" />
            <span className="text-[14px] text-[#3e4e53] font-normal">
              {BOTTOM_CTA_CONTENT.eyebrow}
            </span>
          </div>

          <h2 className="ps-h2 text-[#171d29] mb-5">{BOTTOM_CTA_CONTENT.heading}</h2>

          <div className="space-y-4 mb-7">
            {BOTTOM_CTA_CONTENT.paragraphs.map((p, idx) => (
              <p
                key={idx}
                className="text-[14px] md:text-[15px] leading-[1.55] text-[#3e4e53]"
              >
                {p}
              </p>
            ))}
          </div>

          <Link
            href={BOTTOM_CTA_CONTENT.ctaHref}
            className="inline-flex items-center justify-center px-6 py-3.5 bg-[#02acc5] text-white text-[15px] font-medium hover:bg-[#029cb3] transition-colors duration-150"
          >
            {BOTTOM_CTA_CONTENT.ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
