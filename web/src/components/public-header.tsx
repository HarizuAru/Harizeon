"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LANDING_NAV_DROPDOWNS,
  type NavMegaItem,
} from "./landing/data";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  HarizeonBrandWordmark,
  ShieldOutlineIcon,
  StatusPulseIcon,
} from "./landing/icons";

interface PublicHeaderProps {
  hasSession?: boolean;
  variant?: "solid" | "transparent";
}

export function PublicHeader({
  hasSession = false,
  variant = "solid",
}: PublicHeaderProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const router = useRouter();

  const handleConsoleClick = () => {
    if (typeof document !== "undefined" && !document.cookie.includes("hz_session=")) {
      const mockToken = `mock-session-demo-${Math.random().toString(36).slice(2, 10)}`;
      document.cookie = `hz_session=${mockToken}; path=/; max-age=2592000; SameSite=Lax`;
    }
    router.push("/dashboard");
  };

  const currentDropdown: NavMegaItem | undefined = LANDING_NAV_DROPDOWNS.find(
    (d) => d.id === activeDropdown
  );

  const directLinks = [
    { label: "Pricing", href: "/pricing" },
    { label: "Docs", href: "/docs" },
    { label: "Security", href: "/security" },
    { label: "Status", href: "/status" },
  ];

  const isSolid = variant === "solid";

  return (
    <div
      className={`${
        isSolid
          ? "sticky top-0 inset-x-0 z-50 bg-[#171d29] text-white border-b border-white/10 shadow-md"
          : "absolute top-0 inset-x-0 z-50 text-white"
      }`}
      onMouseLeave={() => setActiveDropdown(null)}
    >
      {/* Top Utility Bar */}
      <div className="border-b border-white/10">
        <div className="ps-container h-8 flex items-center justify-end gap-5 text-xs md:text-[13px] text-white/90">
          <Link
            href="/security"
            className="inline-flex items-center gap-1.5 hover:text-[#02acc5] transition-colors"
          >
            <ShieldOutlineIcon className="w-3.5 h-3.5" />
            <span>98/100 Grade A</span>
          </Link>
          <Link
            href="/status"
            className="inline-flex items-center gap-1.5 hover:text-[#02acc5] transition-colors"
          >
            <StatusPulseIcon className="w-3.5 h-3.5" />
            <span>Status</span>
          </Link>
          <Link
            href="/docs/api"
            className="hover:text-[#02acc5] transition-colors"
          >
            API v1
          </Link>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header
        className={`transition-colors duration-150 ${
          activeDropdown ? "bg-[#171d29]" : isSolid ? "bg-[#171d29]" : "bg-transparent"
        }`}
      >
        <div className="ps-container h-[72px] lg:h-[84px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-8 xl:gap-10">
            <Link href="/" aria-label="Harizeon Home" className="shrink-0 block text-white">
              <HarizeonBrandWordmark />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-6" aria-label="Main navigation">
              {LANDING_NAV_DROPDOWNS.map((item) => {
                const isOpen = activeDropdown === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setActiveDropdown(item.id)}
                    onClick={() => setActiveDropdown(isOpen ? null : item.id)}
                    aria-expanded={isOpen}
                    className={`inline-flex items-center gap-1.5 text-[14px] xl:text-[15px] font-normal py-2 transition-colors cursor-pointer whitespace-nowrap ${
                      isOpen ? "text-[#02acc5]" : "text-white hover:text-[#02acc5]"
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronDownIcon
                      className={`w-2.5 h-2.5 transition-transform duration-150 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                );
              })}
              {directLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => setActiveDropdown(null)}
                  className="text-[14px] xl:text-[15px] font-normal text-white hover:text-[#02acc5] transition-colors whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {!hasSession && (
              <Link
                href="/login"
                className="hidden sm:inline-block text-[14px] text-white/90 hover:text-[#02acc5] transition-colors"
              >
                Log in
              </Link>
            )}
            <button
              type="button"
              onClick={handleConsoleClick}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-[#02acc5] text-white text-[14px] font-medium hover:bg-[#029cb3] transition-colors cursor-pointer"
            >
              <span>Console</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="menu"
              aria-expanded={mobileOpen}
              className="lg:hidden inline-flex flex-col items-center justify-center w-10 h-10 gap-2 text-white cursor-pointer"
            >
              {mobileOpen ? (
                <span className="text-xl leading-none">✕</span>
              ) : (
                <>
                  <span className="block w-7 h-[1.5px] bg-white" />
                  <span className="block w-7 h-[1.5px] bg-white" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Mega Menu */}
        {currentDropdown && (
          <div className="hidden lg:block bg-white text-[#171d29] border-t border-[#dce2e3] shadow-2xl">
            <div className="ps-container py-10">
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-9">
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {currentDropdown.richCards.map((rl) => (
                      <Link
                        key={rl.title}
                        href={rl.href}
                        onClick={() => setActiveDropdown(null)}
                        className="group p-4 rounded-2xl border border-[#dce2e3] hover:border-[#02acc5] hover:bg-[#f5f6f8] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-base font-medium text-[#171d29] group-hover:text-[#02acc5] transition-colors">
                            {rl.title}
                          </span>
                          <ArrowRightIcon className="w-4 h-4 text-[#3e4e53] group-hover:translate-x-1 group-hover:text-[#02acc5] transition-all" />
                        </div>
                        <p className="text-xs leading-relaxed text-[#3e4e53] line-clamp-2">
                          {rl.description}
                        </p>
                      </Link>
                    ))}
                  </div>

                  <div
                    className={`grid gap-6 ${
                      currentDropdown.columns.length > 1 ? "grid-cols-2" : "grid-cols-1"
                    }`}
                  >
                    {currentDropdown.columns.map((col) => (
                      <div key={col.heading}>
                        <h4 className="text-xs font-medium uppercase tracking-wider text-[#3e4e53] mb-3 pb-2 border-b border-[#dce2e3]">
                          {col.heading}
                        </h4>
                        <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
                          {col.links.map((link) => (
                            <li key={link.label + link.href}>
                              <Link
                                href={link.href}
                                onClick={() => setActiveDropdown(null)}
                                className="inline-flex items-center gap-2 text-sm text-[#171d29] hover:text-[#02acc5] transition-colors"
                              >
                                <span>{link.label}</span>
                                {link.badge && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-[#f5f6f8] border border-[#dce2e3] text-[10px] text-[#3e4e53]">
                                    {link.badge}
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Featured Column */}
                <div className="col-span-3 border-l border-[#dce2e3] pl-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium uppercase tracking-wider text-[#3e4e53]">
                        {currentDropdown.featured.eyebrow}
                      </span>
                      {currentDropdown.seeAllHref && (
                        <Link
                          href={currentDropdown.seeAllHref}
                          onClick={() => setActiveDropdown(null)}
                          className="text-xs font-medium text-[#171d29] hover:text-[#02acc5] inline-flex items-center gap-1"
                        >
                          <span>{currentDropdown.seeAllLabel}</span>
                          <ArrowRightIcon className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                    <Link
                      href={currentDropdown.featured.href}
                      onClick={() => setActiveDropdown(null)}
                      className="group block"
                    >
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#f5f6f8] mb-3">
                        <img
                          src={currentDropdown.featured.image}
                          alt={currentDropdown.featured.imageAlt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <p className="text-sm font-medium text-[#171d29] group-hover:text-[#02acc5] transition-colors mb-2">
                        {currentDropdown.featured.title}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#171d29] group-hover:text-[#02acc5] transition-colors">
                        <span>{currentDropdown.featured.cta}</span>
                        <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-[104px] bg-[#171d29] text-white z-40 overflow-y-auto px-4 py-6">
          <div className="space-y-2">
            {LANDING_NAV_DROPDOWNS.map((item) => {
              const expanded = mobileExpanded === item.id;
              return (
                <div key={item.id} className="border-b border-white/15 pb-2">
                  <button
                    type="button"
                    onClick={() => setMobileExpanded(expanded ? null : item.id)}
                    className="w-full flex items-center justify-between py-3 text-lg font-light text-left cursor-pointer"
                  >
                    <span>{item.label}</span>
                    <ChevronDownIcon
                      className={`w-3.5 h-3.5 transition-transform ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expanded && (
                    <div className="pb-4 pl-2 space-y-2">
                      {item.richCards.map((c) => (
                        <Link
                          key={c.title}
                          href={c.href}
                          onClick={() => setMobileOpen(false)}
                          className="block py-1.5 text-sm text-white/90 hover:text-[#02acc5]"
                        >
                          {c.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="pt-2 space-y-2">
              {directLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2.5 border-b border-white/15 text-base text-white/90 hover:text-[#02acc5]"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="pt-4 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  handleConsoleClick();
                }}
                className="inline-flex items-center justify-center w-full py-3 bg-[#02acc5] text-white font-medium cursor-pointer hover:bg-[#029cb3] transition-colors"
              >
                Open Console →
              </button>
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center w-full py-3 border border-white/35 text-white font-normal hover:bg-white hover:text-[#171d29] transition-colors"
              >
                Start free
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
