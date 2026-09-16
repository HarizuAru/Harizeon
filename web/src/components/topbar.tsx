import { ThemeToggle } from "@/components/theme-toggle";

export function TopBar() {
  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-line bg-canvas px-4">
      <div className="flex items-center gap-3">
        <span className="border border-line px-2 py-1 font-mono text-xs text-muted">
          org: local-dev
        </span>
        <label className="sr-only" htmlFor="global-search">
          Search
        </label>
        <input
          id="global-search"
          type="search"
          placeholder="Search  ( / )"
          className="h-8 w-56 border border-line bg-canvas px-2 font-mono text-xs text-ink placeholder:text-faint focus:border-ink sm:w-72"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden font-mono text-xs text-muted sm:inline">
          notifications
        </span>
        <ThemeToggle />
        <span className="border border-line px-2 py-1 font-mono text-xs text-muted">
          you
        </span>
      </div>
    </header>
  );
}
