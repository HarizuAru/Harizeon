import { HERO_DATA } from "./data";

export function HeroSection() {
  return (
    <header className="relative min-h-[680px] lg:min-h-[840px] w-full overflow-hidden bg-[#242b2e] text-white flex items-center">
      {/* Background Video & Fallback Poster */}
      <div className="absolute inset-0 z-0">
        <img
          src={HERO_DATA.posterSrc}
          alt="Managing AI infrastructure"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={HERO_DATA.posterSrc}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={HERO_DATA.videoSrc} type="video/mp4" />
        </video>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(16, 22, 26, 0.62) 0%, rgba(16, 22, 26, 0.48) 50%, rgba(16, 22, 26, 0.72) 100%)",
          }}
        />
      </div>

      {/* Hero Foreground */}
      <div className="ps-container relative z-10 pt-36 pb-20 lg:pt-40 lg:pb-24">
        <div className="max-w-[780px]">
          <h1 className="ps-display text-white mb-6">{HERO_DATA.title}</h1>

          <p className="text-[18px] lg:text-[20px] leading-[1.4] text-white/95 font-normal mb-7">
            {HERO_DATA.subtitle}
          </p>

          <div className="flex flex-wrap gap-3 max-w-[660px] mb-8">
            {HERO_DATA.pills.map((pill) => (
              <a
                key={pill.label}
                href={pill.href}
                className="inline-flex items-center px-5 py-2.5 rounded-full border border-white/55 bg-black/20 backdrop-blur-[2px] text-[14px] lg:text-[15px] text-white hover:bg-white hover:text-[#242b2e] hover:border-white transition-colors duration-150"
              >
                {pill.label}
              </a>
            ))}
          </div>

          <div>
            <a
              href={HERO_DATA.ctaHref}
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#ffcd30] border border-[#ffcd30] text-[#242b2e] text-[15px] lg:text-[16px] font-normal hover:bg-[#242b2e] hover:text-white hover:border-white transition-colors duration-150"
            >
              {HERO_DATA.ctaLabel}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
