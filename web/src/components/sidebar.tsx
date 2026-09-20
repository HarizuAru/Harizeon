"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { cx } from "@/lib/cx";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-canvas">
      <div className="flex h-14 items-center border-b border-line px-4">
        <Link
          href="/dashboard"
          className="font-mono text-sm font-bold uppercase tracking-[0.05em] text-ink"
        >
          Harizeon
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "px-3 py-2 text-sm transition-colors duration-200",
                active
                  ? "bg-accent font-medium text-accent-ink"
                  : "text-muted hover:bg-subtle hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line p-3 font-mono text-xs text-faint">
        v0.1 · W12 (MVP)
      </div>
    </aside>
  );
}
