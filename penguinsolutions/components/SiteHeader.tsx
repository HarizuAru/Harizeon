"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Search, X } from "lucide-react";
import { NAV_DROPDOWNS, UTILITY_NAV, toSourceHref } from "./data";
import type { NavDropdownData } from "./data";
import { ChevronDownIcon, PenguinLogo, PhoneIcon, SupportCircleIcon, ArrowRightIcon } from "./icons";

export function SiteHeader() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("English");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setLangOpen(false);
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    const onClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setLangOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  const currentDropdown: NavDropdownData | undefined = NAV_DROPDOWNS.find(
    (d) => d.id === activeDropdown
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    window.open(
      `https://www.penguinsolutions.com/en-us/search?query=${encodeURIComponent(trimmed)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div
      ref={headerRef}
      className="absolute top-0 inset-x-0 z-50 text-white"
      onMouseLeave={() => setActiveDropdown(null)}
    >
      {/* Top Utility Bar */}
      <div>
        <div className="ps-container h-8 flex items-center justify-end gap-5 text-xs md:text-[13px] text-white/90">
          <a
            href={UTILITY_NAV.phoneHref}
            className="inline-flex items-center gap-1.5 hover:text-[#ffcd30] transition-colors"
          >
            <PhoneIcon className="w-3.5 h-3.5" />
            <span>{UTILITY_NAV.phone}</span>
          </a>
          <a
            href={UTILITY_NAV.supportHref}
            className="inline-flex items-center gap-1.5 hover:text-[#ffcd30] transition-colors"
          >
            <SupportCircleIcon className="w-3.5 h-3.5" />
            <span>{UTILITY_NAV.supportLabel}</span>
          </a>
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 hover:text-[#ffcd30] transition-colors cursor-pointer"
              aria-expanded={langOpen}
            >
              <Globe className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>{selectedLang}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-32 rounded-xl bg-white text-[#242b2e] shadow-lg border border-[#dce2e3] py-1 z-50">
                {UTILITY_NAV.languages.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setSelectedLang(lang);
                      setLangOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#f5f6f8] transition-colors cursor-pointer ${
                      selectedLang === lang ? "font-medium text-[#242b2e]" : "text-[#3e4e53]"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header
        className={`transition-colors duration-150 ${
          activeDropdown ? "bg-[#242b2e]" : "bg-transparent"
        }`}
      >
        <div className="ps-container h-[72px] lg:h-[88px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-8 xl:gap-10">
            <a
              href={toSourceHref("/en-us")}
              aria-label="Home Page"
              className="shrink-0 block text-white"
            >
              <PenguinLogo className="w-[120px] lg:w-[132px] h-auto" />
            </a>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-6" aria-label="Main navigation">
              {NAV_DROPDOWNS.map((item) => {
                const isOpen = activeDropdown === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setActiveDropdown(item.id)}
                    onClick={() => setActiveDropdown(isOpen ? null : item.id)}
                    aria-expanded={isOpen}
                    className={`inline-flex items-center gap-1.5 text-[14px] xl:text-[15px] font-normal py-2 transition-colors cursor-pointer whitespace-nowrap ${
                      isOpen ? "text-[#ffcd30]" : "text-white hover:text-[#ffcd30]"
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
              <a
                href={toSourceHref("/en-us/contact-us")}
                className="text-[14px] xl:text-[15px] font-normal text-white hover:text-[#ffcd30] transition-colors whitespace-nowrap"
              >
                Contact
              </a>
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSearchOpen((v) => !v);
                setActiveDropdown(null);
              }}
              aria-label="Search"
              className="hidden lg:inline-flex items-center justify-center w-9 h-9 rounded-full text-white hover:text-[#ffcd30] transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4 stroke-[1.75]" />
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
                <X className="w-6 h-6" />
              ) : (
                <>
                  <span className="block w-7 h-[1.5px] bg-white" />
                  <span className="block w-7 h-[1.5px] bg-white" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Mega Menu Dropdown */}
        {currentDropdown && (
          <div className="hidden lg:block bg-white text-[#242b2e] border-t border-[#dce2e3] shadow-xl">
            <div className="ps-container py-10">
              <div className="grid grid-cols-12 gap-8">
                {/* Left / Main Columns */}
                <div className="col-span-9">
                  {currentDropdown.richLinks && (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      {currentDropdown.richLinks.map((rl) => (
                        <a
                          key={rl.title}
                          href={rl.href}
                          className="group p-4 rounded-2xl border border-[#dce2e3] hover:border-[#242b2e] hover:bg-[#f5f6f8] transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-base font-medium text-[#242b2e] group-hover:text-[#0e3a90] transition-colors">
                              {rl.title}
                            </span>
                            <ArrowRightIcon className="w-4 h-4 text-[#3e4e53] group-hover:translate-x-1 transition-transform" />
                          </div>
                          <p className="text-xs leading-relaxed text-[#3e4e53] line-clamp-2">
                            {rl.description}
                          </p>
                        </a>
                      ))}
                    </div>
                  )}

                  {currentDropdown.columns && (
                    <div
                      className={`grid gap-6 ${
                        currentDropdown.columns.length >= 4
                          ? "grid-cols-4"
                          : currentDropdown.columns.length === 3
                          ? "grid-cols-3"
                          : "grid-cols-2"
                      }`}
                    >
                      {currentDropdown.columns.map((col) => (
                        <div key={col.heading}>
                          <h4 className="text-xs font-medium uppercase tracking-wider text-[#3e4e53] mb-3 pb-2 border-b border-[#dce2e3]">
                            {col.heading}
                          </h4>
                          <ul className="space-y-2">
                            {col.links.map((link) => (
                              <li key={link.label + link.href}>
                                <a
                                  href={link.href}
                                  className="text-sm text-[#242b2e] hover:text-[#0e3a90] transition-colors block"
                                >
                                  {link.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Featured Post Column */}
                {currentDropdown.featured && (
                  <div className="col-span-3 border-l border-[#dce2e3] pl-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium uppercase tracking-wider text-[#3e4e53]">
                          {currentDropdown.featured.eyebrow}
                        </span>
                        {currentDropdown.seeAllHref && (
                          <a
                            href={currentDropdown.seeAllHref}
                            className="text-xs font-medium text-[#242b2e] hover:text-[#0e3a90] inline-flex items-center gap-1"
                          >
                            <span>{currentDropdown.seeAllLabel}</span>
                            <ArrowRightIcon className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <a
                        href={currentDropdown.featured.href}
                        className="group block"
                      >
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#f5f6f8] mb-3">
                          <img
                            src={currentDropdown.featured.image}
                            alt={currentDropdown.featured.imageAlt}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <p className="text-sm font-medium text-[#242b2e] group-hover:text-[#0e3a90] transition-colors mb-2">
                          {currentDropdown.featured.title}
                        </p>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#242b2e]">
                          <span>{currentDropdown.featured.cta}</span>
                          <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search Bar Overlay */}
        {searchOpen && (
          <div className="hidden lg:block bg-white text-[#242b2e] border-t border-[#dce2e3] shadow-lg">
            <div className="ps-container py-5">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
                <Search className="w-5 h-5 text-[#3e4e53]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Penguin Solutions..."
                  autoFocus
                  className="flex-1 bg-transparent text-base text-[#242b2e] placeholder:text-[#3e4e53]/60 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#ffcd30] text-[#242b2e] text-sm font-medium hover:bg-[#242b2e] hover:text-white transition-colors cursor-pointer"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search"
                  className="p-2 text-[#3e4e53] hover:text-[#242b2e] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-[104px] bg-[#242b2e] text-white z-40 overflow-y-auto px-4 py-6">
          <div className="space-y-2">
            {NAV_DROPDOWNS.map((item) => {
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
                    <div className="pb-4 pl-2 space-y-4">
                      {item.richLinks && (
                        <div className="space-y-2">
                          {item.richLinks.map((rl) => (
                            <a
                              key={rl.title}
                              href={rl.href}
                              className="block py-1.5 text-sm text-white/90 hover:text-[#ffcd30]"
                            >
                              {rl.title}
                            </a>
                          ))}
                        </div>
                      )}
                      {item.columns?.map((col) => (
                        <div key={col.heading}>
                          <p className="text-xs uppercase tracking-wider text-white/50 mb-1.5">
                            {col.heading}
                          </p>
                          <div className="space-y-1.5">
                            {col.links.map((l) => (
                              <a
                                key={l.label + l.href}
                                href={l.href}
                                className="block text-sm text-white/85 hover:text-[#ffcd30]"
                              >
                                {l.label}
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="pt-4">
              <a
                href={toSourceHref("/en-us/contact-us")}
                className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-[#ffcd30] text-[#242b2e] font-medium"
              >
                Let&apos;s Talk
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
