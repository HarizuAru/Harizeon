"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

let listeners: Array<() => void> = [];

function currentTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, currentTheme, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("hz-theme", next);
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
    listeners.forEach((l) => l());
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="h-8 border border-line px-2 font-mono text-xs uppercase tracking-[0.08em] text-muted transition-colors duration-200 hover:bg-subtle hover:text-ink"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
