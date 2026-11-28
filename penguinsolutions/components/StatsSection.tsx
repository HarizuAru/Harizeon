import { NVIDIA_BANNER, STATS_DATA } from "./data";

export function StatsSection() {
  return (
    <div className="bg-[#f5f6f8] text-[#242b2e]">
      {/* NVIDIA AI Factory Specialized Partner Banner */}
      <section className="pt-[clamp(4.5rem,3.5rem+5vw,8rem)]">
        <div className="ps-container">
          <div className="bg-[#242b2e] text-white rounded-[24px] overflow-hidden border-t-[4px] border-t-[#ffcd30]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center px-6 py-8 md:px-10 md:py-12 lg:px-12 lg:py-14">
              <h2 className="ps-h2 text-white">
                {NVIDIA_BANNER.titleLine1}
                <br />
                {NVIDIA_BANNER.titleLine2}
              </h2>
              <p className="text-[15px] md:text-[16px] leading-[1.5] text-[#dce2e3] font-normal max-w-[460px]">
                {NVIDIA_BANNER.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Global AI Data Centers + 3 Stat Cards */}
      <section className="pt-[clamp(3rem,2.4286rem+2.857vw,5rem)] pb-[clamp(4.5rem,3.5rem+5vw,8rem)]">
        <div className="ps-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-10 lg:mb-12">
            <div className="lg:col-span-6">
              <h2 className="ps-h2 text-[#242b2e] max-w-[580px]">
                {STATS_DATA.heading}
              </h2>
            </div>
            <div className="lg:col-span-6">
              <p className="text-[15px] md:text-[16px] leading-[1.5] text-[#3e4e53] max-w-[580px]">
                {STATS_DATA.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STATS_DATA.cards.map((stat) => (
              <div
                key={stat.value}
                className="bg-white rounded-[24px] border border-[#dce2e3] px-7 py-8 lg:px-9 lg:py-10"
              >
                <h3 className="ps-h2 text-[#242b2e] mb-2">{stat.value}</h3>
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
