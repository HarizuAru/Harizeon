"use client";

import { useState } from "react";
import Link from "next/link";
import { WORKFLOW_CONTENT } from "./data";
import { PlusIcon, WorkflowStepIcon } from "./icons";

export function WorkflowSection() {
  const [openId, setOpenId] = useState<string>(WORKFLOW_CONTENT.items[0].id);
  const [activeImageId, setActiveImageId] = useState<string>(
    WORKFLOW_CONTENT.items[0].id
  );

  const activeProcess =
    WORKFLOW_CONTENT.items.find((p) => p.id === activeImageId) ??
    WORKFLOW_CONTENT.items[0];

  return (
    <section className="bg-[#171d29] text-white ps-section-py">
      <div className="ps-container">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2.5 mb-5">
          <span className="w-2 h-2 rounded-full bg-[#02acc5] shrink-0" />
          <span className="text-[14px] text-[#cccccc] font-normal">
            {WORKFLOW_CONTENT.eyebrow}
          </span>
        </div>

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-12 lg:mb-14">
          <div className="lg:col-span-6">
            <h2 className="ps-h2 text-white">
              {WORKFLOW_CONTENT.headingLine1}
              <br />
              {WORKFLOW_CONTENT.headingLine2}
            </h2>
          </div>
          <div className="lg:col-span-6">
            <p className="text-[15px] md:text-[16px] leading-[1.5] text-[#cccccc] max-w-[540px]">
              {WORKFLOW_CONTENT.description}
            </p>
          </div>
        </div>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Near-Black Accordion Card */}
          <div className="lg:col-span-6">
            <div className="bg-[#111622] rounded-[24px] px-6 py-4 md:px-10 md:py-6">
              <ul className="divide-y divide-white/15">
                {WORKFLOW_CONTENT.items.map((item) => {
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
                          <WorkflowStepIcon
                            id={item.id}
                            className="w-10 h-10 md:w-11 md:h-11 shrink-0 text-white"
                          />
                          <span className="text-[20px] md:text-[24px] font-light text-white group-hover:text-[#02acc5] transition-colors">
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
                          <Link
                            href={item.href}
                            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#02acc5] to-[#2a7ae9] text-white text-[14px] md:text-[15px] font-medium hover:brightness-110 shadow-sm transition-all duration-150"
                          >
                            {item.ctaLabel}
                          </Link>
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
            <div className="aspect-square rounded-[24px] overflow-hidden bg-[#111622]">
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
