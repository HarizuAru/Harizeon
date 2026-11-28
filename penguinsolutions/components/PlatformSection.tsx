"use client";

import { useState } from "react";
import { PLATFORM_DATA } from "./data";
import { ArrowRightIcon, PlusIcon } from "./icons";

export function PlatformSection() {
  const [openId, setOpenId] = useState<string>(PLATFORM_DATA.items[0].id);

  return (
    <section className="bg-[#242b2e] text-white ps-section-py">
      <div className="ps-container">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2.5 mb-5">
          <span className="w-2 h-2 rounded-full bg-[#ffcd30] shrink-0" />
          <span className="text-[14px] text-[#cccccc] font-normal">{PLATFORM_DATA.eyebrow}</span>
        </div>

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-12 lg:mb-14">
          <div className="lg:col-span-6">
            <h2 className="ps-h2 text-white max-w-[460px]">{PLATFORM_DATA.heading}</h2>
          </div>
          <div className="lg:col-span-6">
            <p className="text-[15px] md:text-[16px] leading-[1.5] text-[#cccccc]">
              {PLATFORM_DATA.description}
            </p>
          </div>
        </div>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Diagram */}
          <div className="lg:col-span-6">
            <div className="aspect-square rounded-[24px] overflow-hidden bg-[#1b2023]">
              <img
                src={PLATFORM_DATA.image}
                alt={PLATFORM_DATA.imageAlt}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Accordion Card */}
          <div className="lg:col-span-6">
            <div className="bg-[#343c40] rounded-[24px] px-6 py-4 md:px-10 md:py-6">
              <ul className="divide-y divide-white/15">
                {PLATFORM_DATA.items.map((item) => {
                  const isOpen = openId === item.id;
                  return (
                    <li key={item.id} className="py-5">
                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? "" : item.id)}
                        aria-expanded={isOpen}
                        className="w-full flex items-center justify-between gap-4 text-left cursor-pointer group"
                      >
                        <span className="text-[18px] md:text-[20px] font-normal text-white group-hover:text-[#ffcd30] transition-colors">
                          {item.title}
                        </span>
                        <PlusIcon
                          className={`w-6 h-6 shrink-0 text-white/80 transition-transform duration-200 ${
                            isOpen ? "rotate-45" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="pt-4 pr-2 space-y-5">
                          <p className="text-[14px] md:text-[15px] leading-[1.5] text-[#dce2e3]">
                            {item.description}
                          </p>
                          <a
                            href={item.href}
                            className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl border border-white/35 text-[14px] md:text-[15px] text-white hover:bg-white hover:text-[#242b2e] hover:border-white transition-colors duration-150"
                          >
                            <span>{item.ctaLabel}</span>
                            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </a>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
