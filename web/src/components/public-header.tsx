"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function PublicHeader({ hasSession }: { hasSession?: boolean }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleConsoleClick = () => {
    if (typeof document !== "undefined" && !document.cookie.includes("hz_session=")) {
      const mockToken = `mock-session-demo-${Math.random().toString(36).slice(2, 10)}`;
      document.cookie = `hz_session=${mockToken}; path=/; max-age=2592000; SameSite=Lax`;
    }
    router.push("/dashboard");
  };

  const navLinks = [
    { label: "Services", href: "/services" },
    { label: "Pricing", href: "/pricing" },
    { label: "Docs", href: "/docs" },
    { label: "Security", href: "/security" },
    { label: "Status", href: "/status" },
  ];

  return (
    <header className="border-b border-line bg-canvas relative z-40">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-mono text-sm font-bold uppercase tracking-[0.1em] text-ink focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          >
            Harizeon
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Public Navigation">
            {navLinks.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-mono text-xs uppercase tracking-wider transition-colors ${
                    active ? "text-ink font-bold underline underline-offset-4" : "text-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop & Right-side Actions */}
        <div className="flex items-center gap-3">
          {!hasSession && (
            <Link
              href="/login"
              className="hidden sm:inline-block font-mono text-xs uppercase text-muted hover:text-ink transition-colors px-2 py-1"
            >
              Log in
            </Link>
          )}

          <button
            type="button"
            onClick={handleConsoleClick}
            className="border border-ink bg-ink px-4 py-1.5 font-mono text-xs uppercase font-medium text-canvas hover:bg-canvas hover:text-ink transition-colors cursor-pointer"
          >
            Console →
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden border border-line bg-canvas px-2.5 py-1 font-mono text-xs text-muted hover:border-ink hover:text-ink cursor-pointer"
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? "[✕]" : "[☰]"}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-line bg-canvas p-4 transition-all">
          <nav className="flex flex-col gap-3 font-mono text-xs" aria-label="Mobile Navigation">
            {navLinks.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`border-b border-line/50 pb-2 uppercase tracking-wider ${
                    active ? "font-bold text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {!hasSession && (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-muted hover:text-ink uppercase tracking-wider pt-1"
              >
                Log in
              </Link>
            )}
            <Link
              href="/signup"
              onClick={() => setIsMobileMenuOpen(false)}
              className="border border-ink bg-ink text-canvas text-center py-2 uppercase tracking-wider font-bold mt-2"
            >
              Sign Up Free
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
