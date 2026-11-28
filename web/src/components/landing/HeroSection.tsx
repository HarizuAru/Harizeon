import Link from "next/link";
import { HERO_CONTENT } from "./data";

export function HeroSection() {
  return (
    <header className="relative min-h-[680px] lg:min-h-[840px] w-full overflow-hidden bg-[#171d29] text-white flex items-center">
      {/* Background Video & Fallback Poster */}
      <div className="absolute inset-0 z-0">
        <img
          src={HERO_CONTENT.posterSrc}
          alt="Security infrastructure perimeter"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={HERO_CONTENT.posterSrc}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={HERO_CONTENT.videoSrc} type="video/mp4" />
        </video>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(16, 22, 26, 0.65) 0%, rgba(16, 22, 26, 0.50) 50%, rgba(16, 22, 26, 0.76) 100%)",
          }}
        />
      </div>

      {/* Hero Foreground */}
      <div className="ps-container relative z-10 pt-36 pb-20 lg:pt-40 lg:pb-24">
        <div className="max-w-[780px]">
          <h1 className="ps-display text-white mb-6">{HERO_CONTENT.title}</h1>

          <p className="text-[18px] lg:text-[20px] leading-[1.4] text-white/95 font-normal mb-7">
            {HERO_CONTENT.subtitle}
          </p>

          <div className="flex flex-wrap gap-3 max-w-[680px] mb-8">
            {HERO_CONTENT.pills.map((pill) => (
              <Link
                key={pill.label}
                href={pill.href}
                className="inline-flex items-center px-5 py-2.5 rounded-full border border-white/55 bg-black/20 backdrop-blur-[2px] text-[14px] lg:text-[15px] text-white hover:bg-white hover:text-[#171d29] hover:border-white transition-colors duration-150"
              >
                {pill.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={HERO_CONTENT.ctaHref}
              className="inline-flex items-center justify-center px-6 py-3.5 bg-[#02acc5] text-white text-[15px] lg:text-[16px] font-medium hover:bg-[#029cb3] transition-colors duration-150"
            >
              {HERO_CONTENT.ctaLabel}
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center px-5 py-3 border border-white/45 text-white text-[15px] lg:text-[16px] font-normal hover:bg-white hover:text-[#171d29] hover:border-white transition-colors duration-150"
            >
              Read Docs
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
