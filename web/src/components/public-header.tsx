"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function PublicHeader({ hasSession }: { hasSession?: boolean }) {
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
    <header className="border-b border-line bg-canvas">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-mono text-sm font-bold uppercase tracking-[0.1em] text-ink"
          >
            Harizeon
          </Link>

          <nav className="hidden md:flex items-center gap-6" aria-label="Public Navigation">
            {navLinks.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-mono text-xs uppercase tracking-wider transition-colors ${
                    active ? "text-ink font-bold underline" : "text-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {!hasSession && (
            <Link
              href="/login"
              className="font-mono text-xs uppercase text-muted hover:text-ink transition-colors px-2 py-1"
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
        </div>
      </div>
    </header>
  );
}


