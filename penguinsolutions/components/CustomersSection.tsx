"use client";

import { useState } from "react";
import { CUSTOMER_STORIES_DATA } from "./data";
import { ArrowRightIcon, PlusIcon } from "./icons";

export function CustomersSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeImageId, setActiveImageId] = useState<string>(
    CUSTOMER_STORIES_DATA.items[0].id
  );

  const activeCustomer =
    CUSTOMER_STORIES_DATA.items.find((c) => c.id === activeImageId) ??
    CUSTOMER_STORIES_DATA.items[0];

  return (
    <section className="bg-[#f5f6f8] text-[#242b2e] ps-section-py">
      <div className="ps-container">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2.5 mb-5">
          <span className="w-2 h-2 rounded-full bg-[#ffcd30] shrink-0" />
          <span className="text-[14px] text-[#3e4e53] font-normal">
            {CUSTOMER_STORIES_DATA.eyebrow}
          </span>
        </div>

        {/* Heading */}
        <h2 className="ps-h2 text-[#242b2e] mb-12 lg:mb-14">
          {CUSTOMER_STORIES_DATA.headingLine1}
          <br />
          {CUSTOMER_STORIES_DATA.headingLine2}
        </h2>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left White Accordion Card */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-[24px] px-6 py-3 md:px-10 md:py-5 border border-[#dce2e3]/60">
              <ul className="divide-y divide-[#dce2e3]">
                {CUSTOMER_STORIES_DATA.items.map((item) => {
                  const isOpen = openId === item.id;
                  return (
                    <li key={item.id} className="py-4 md:py-5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveImageId(item.id);
                          setOpenId(isOpen ? null : item.id);
                        }}
                        aria-expanded={isOpen}
                        className="w-full flex items-center justify-between gap-4 text-left cursor-pointer group"
                      >
                        <img
                          src={item.logo}
                          alt={item.name}
                          className="h-12 md:h-14 w-auto object-contain"
                        />
                        <PlusIcon
                          className={`w-6 h-6 shrink-0 text-[#242b2e] transition-transform duration-200 ${
                            isOpen ? "rotate-45" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="pt-4 pr-2 space-y-4">
                          <p className="text-[14px] md:text-[15px] leading-[1.55] text-[#3e4e53]">
                            {item.summary}
                          </p>
                          <a
                            href={item.href}
                            className="group inline-flex items-center gap-2 text-[14px] md:text-[15px] font-medium text-[#242b2e] hover:text-[#0e3a90] transition-colors"
                          >
                            <span>Read full story</span>
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

          {/* Right Square Photo */}
          <div className="lg:col-span-6">
            <div className="aspect-square rounded-[24px] overflow-hidden bg-[#dce2e3]">
              <img
                src={activeCustomer.image}
                alt={activeCustomer.imageAlt}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
