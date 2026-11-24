"use client";

import { useEffect, useRef } from "react";

export function TableKeyNav() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isEditable = (e.target as HTMLElement)?.isContentEditable;
      if (tag === "input" || tag === "textarea" || tag === "select" || isEditable) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const parent = containerRef.current?.parentElement;
      if (!parent) return;

      const rows = Array.from(parent.querySelectorAll<HTMLTableRowElement>("tbody tr[data-table-row]"));
      if (rows.length === 0) return;

      const activeEl = document.activeElement;
      const currentIndex = rows.findIndex((r) => r === activeEl || r.contains(activeEl));

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = currentIndex < rows.length - 1 ? currentIndex + 1 : 0;
        const targetRow = rows[nextIndex];
        targetRow.focus();
        targetRow.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : rows.length - 1;
        const targetRow = rows[prevIndex];
        targetRow.focus();
        targetRow.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } else if (e.key === "Enter" && currentIndex >= 0) {
        const targetRow = rows[currentIndex];
        const link = targetRow.querySelector<HTMLAnchorElement>("a");
        if (link) {
          e.preventDefault();
          link.click();
        }
      } else if (e.key === "x" && currentIndex >= 0) {
        const targetRow = rows[currentIndex];
        const checkbox = targetRow.querySelector<HTMLInputElement>("input[type='checkbox']");
        if (checkbox) {
          e.preventDefault();
          checkbox.click();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return <div ref={containerRef} className="sr-only" aria-hidden="true" />;
}
