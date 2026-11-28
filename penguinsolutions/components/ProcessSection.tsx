"use client";

import { useState } from "react";
import { PROCESS_DATA } from "./data";
import { PlusIcon, ProcessIcon } from "./icons";

export function ProcessSection() {
  const [openId, setOpenId] = useState<string>(PROCESS_DATA.items[0].id);
  const [activeImageId, setActiveImageId] = useState<string>(
    PROCESS_DATA.items[0].id
  );

  const activeProcess =
    PROCESS_DATA.items.find((p) => p.id === activeImageId) ??
    PROCESS_DATA.items[0];

  return (
    <section className="bg-[#242b2e] text-white ps-section-py">
      <div className="ps-container">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2.5 mb-5">
          <span className="w-2 h-2 rounded-full bg-[#ffcd30] shrink-0" />
          <span className="text-[14px] text-[#cccccc] font-normal">
            {PROCESS_DATA.eyebrow}
          </span>
        </div>

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-12 lg:mb-14">
          <div className="lg:col-span-6">
            <h2 className="ps-h2 text-white">
              {PROCESS_DATA.headingLine1}
              <br />
              {PROCESS_DATA.headingLine2}
            </h2>
          </div>
          <div className="lg:col-span-6">
            <p className="text-[15px] md:text-[16px] leading-[1.5] text-[#cccccc] max-w-[540px]">
              {PROCESS_DATA.description}
            </p>
          </div>
        </div>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Near-Black Accordion Card */}
          <div className="lg:col-span-6">
            <div className="bg-[#0a0c0d] rounded-[24px] px-6 py-4 md:px-10 md:py-6">
              <ul className="divide-y divide-white/15">
                {PROCESS_DATA.items.map((item) => {
                  const isOpen = openId === item.id;
                  return (
                    <li key={item.id} className="py-5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveImageId(item.id);
                          setOpenId(isOpen ? "" : item.id);
                        }}
                        aria-expanded={isOpen}
                        className="w-full flex items-center justify-between gap-4 text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <ProcessIcon
                            id={item.id}
                            className="w-10 h-10 md:w-11 md:h-11 shrink-0 text-white"
                          />
                          <span className="text-[20px] md:text-[24px] font-light text-white group-hover:text-[#ffcd30] transition-colors">
                            {item.title}
                          </span>
                        </div>
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
                            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#ffcd30] text-[#242b2e] text-[14px] md:text-[15px] font-normal hover:bg-white transition-colors duration-150"
                          >
                            {item.ctaLabel}
                          </a>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Right Square Photo */}
          <div className="lg:col-span-6">
            <div className="aspect-square rounded-[24px] overflow-hidden bg-[#1b2023]">
              <img
                src={activeProcess.image}
                alt={activeProcess.imageAlt}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
