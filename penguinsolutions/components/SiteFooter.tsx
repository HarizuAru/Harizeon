import { FOOTER_DATA, toSourceHref } from "./data";
import {
  LinkedInIcon,
  LocationPinIcon,
  PenguinLogo,
  PhoneIcon,
  XSocialIcon,
  YouTubeIcon,
} from "./icons";

export function SiteFooter() {
  return (
    <footer id="footer" className="bg-[#242b2e] text-white pt-[clamp(4.5rem,3.5rem+5vw,8rem)] pb-10">
      <div className="ps-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-14 lg:pb-16 border-b border-white/15">
          {/* Col 1: Brand & Overview */}
          <div className="lg:col-span-5 pr-0 lg:pr-10">
            <a
              href={toSourceHref("/en-us")}
              aria-label="Penguin Solutions Home"
              className="inline-block mb-6 text-white"
            >
              <PenguinLogo className="w-[152px] h-auto" />
            </a>

            <h2 className="text-[18px] md:text-[20px] font-normal text-white mb-4">
              {FOOTER_DATA.heading}
            </h2>

            <div className="space-y-4 text-[13px] md:text-[14px] leading-[1.55] text-[#bcc3c7] mb-7">
              {FOOTER_DATA.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {FOOTER_DATA.socials.map((soc) => (
                <a
                  key={soc.id}
                  href={soc.href}
                  aria-label={soc.label}
                  className="text-white/85 hover:text-[#ffcd30] transition-colors"
                >
                  {soc.id === "linkedin" && <LinkedInIcon className="w-6 h-6" />}
                  {soc.id === "x" && <XSocialIcon className="w-6 h-6" />}
                  {soc.id === "youtube" && <YouTubeIcon className="w-6 h-6" />}
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Get in touch */}
          <div className="lg:col-span-3">
            <h3 className="text-[16px] font-normal text-white pb-3 mb-4 border-b border-white/20">
              {FOOTER_DATA.getInTouch.heading}
            </h3>

            <div className="space-y-3 text-[13px] md:text-[14px] text-[#dce2e3]">
              <a
                href={FOOTER_DATA.getInTouch.phoneHref}
                className="flex items-center gap-2.5 hover:text-[#ffcd30] transition-colors"
              >
                <PhoneIcon className="w-4 h-4 shrink-0" />
                <span>{FOOTER_DATA.getInTouch.phone}</span>
              </a>

              <a
                href={FOOTER_DATA.getInTouch.addressHref}
                className="flex items-start gap-2.5 hover:text-[#ffcd30] transition-colors"
              >
                <LocationPinIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {FOOTER_DATA.getInTouch.addressLine1}
                  <br />
                  {FOOTER_DATA.getInTouch.addressLine2}
                </span>
              </a>

              <ul className="pt-2 space-y-2.5">
                {FOOTER_DATA.getInTouch.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="hover:text-[#ffcd30] transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Col 3: Partners */}
          <div className="lg:col-span-2">
            <h3 className="text-[16px] font-normal text-white pb-3 mb-4 border-b border-white/20">
              {FOOTER_DATA.partners.heading}
            </h3>
            <ul className="space-y-2.5 text-[13px] md:text-[14px] text-[#dce2e3]">
              {FOOTER_DATA.partners.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="hover:text-[#ffcd30] transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Company */}
          <div className="lg:col-span-2">
            <h3 className="text-[16px] font-normal text-white pb-3 mb-4 border-b border-white/20">
              {FOOTER_DATA.company.heading}
            </h3>
            <ul className="space-y-2.5 text-[13px] md:text-[14px] text-[#dce2e3]">
              {FOOTER_DATA.company.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="hover:text-[#ffcd30] transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Legal Row */}
        <div className="pt-6 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[#bcc3c7]">
          <span>{FOOTER_DATA.legal.copyright}</span>
          {FOOTER_DATA.legal.links.map((l) => (
            <span key={l.label} className="inline-flex items-center gap-2.5">
              <span>|</span>
              <a href={l.href} className="hover:text-white transition-colors">
                {l.label}
              </a>
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
