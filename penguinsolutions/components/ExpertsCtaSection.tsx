import { EXPERTS_CTA_DATA } from "./data";

export function ExpertsCtaSection() {
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
        <source src={EXPERTS_CTA_DATA.videoSrc} type="video/mp4" />
      </video>

      {/* Left-Aligned Card */}
      <div className="ps-container relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-[24px] p-8 md:p-11 lg:p-12 max-w-[440px] shadow-sm">
          <div className="inline-flex items-center gap-2.5 mb-5">
            <span className="w-2 h-2 rounded-full bg-[#ffcd30] shrink-0" />
            <span className="text-[14px] text-[#3e4e53] font-normal">
              {EXPERTS_CTA_DATA.eyebrow}
            </span>
          </div>

          <h2 className="ps-h2 text-[#242b2e] mb-5">{EXPERTS_CTA_DATA.heading}</h2>

          <div className="space-y-4 mb-7">
            {EXPERTS_CTA_DATA.paragraphs.map((p, idx) => (
              <p
                key={idx}
                className="text-[14px] md:text-[15px] leading-[1.55] text-[#3e4e53]"
              >
                {p}
              </p>
            ))}
          </div>

          <a
            href={EXPERTS_CTA_DATA.ctaHref}
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#ffcd30] border border-[#ffcd30] text-[#242b2e] text-[15px] font-normal hover:bg-[#242b2e] hover:text-white hover:border-[#242b2e] transition-colors duration-150"
          >
            {EXPERTS_CTA_DATA.ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
