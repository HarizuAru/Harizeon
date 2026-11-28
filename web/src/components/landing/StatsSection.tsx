import Link from "next/link";
import { HIGHLIGHT_BANNER, STATS_CONTENT } from "./data";

export function StatsSection() {
  return (
    <div className="bg-[#f5f6f8] text-[#171d29]">
      {/* Highlight Banner with Favicon Cyan Top Accent */}
      <section className="pt-[clamp(4.5rem,3.5rem+5vw,8rem)]">
        <div className="ps-container">
          <Link
            href={HIGHLIGHT_BANNER.href}
            className="block bg-[#171d29] text-white rounded-[24px] overflow-hidden border-t-[4px] border-t-[#02acc5] hover:bg-[#1d2434] transition-colors shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center px-6 py-8 md:px-10 md:py-12 lg:px-12 lg:py-14">
              <h2 className="ps-h2 text-white">
                {HIGHLIGHT_BANNER.titleLine1}
                <br />
                {HIGHLIGHT_BANNER.titleLine2}
              </h2>
              <p className="text-[15px] md:text-[16px] leading-[1.5] text-[#dce2e3] font-normal max-w-[460px]">
                {HIGHLIGHT_BANNER.description}
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Global Security Posture + 3 Stat Cards */}
      <section className="pt-[clamp(3rem,2.4286rem+2.857vw,5rem)] pb-[clamp(4.5rem,3.5rem+5vw,8rem)]">
        <div className="ps-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-10 lg:mb-12">
            <div className="lg:col-span-6">
              <h2 className="ps-h2 text-[#171d29] max-w-[580px]">
                {STATS_CONTENT.heading}
              </h2>
            </div>
            <div className="lg:col-span-6">
              <p className="text-[15px] md:text-[16px] leading-[1.5] text-[#3e4e53] max-w-[580px]">
                {STATS_CONTENT.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STATS_CONTENT.cards.map((stat) => (
              <div
                key={stat.value}
                className="bg-white rounded-[24px] border border-[#dce2e3] px-7 py-8 lg:px-9 lg:py-10"
              >
                <h3 className="ps-h2 text-[#171d29] mb-2">{stat.value}</h3>
                <p className="text-[14px] md:text-[15px] text-[#3e4e53] font-normal">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
