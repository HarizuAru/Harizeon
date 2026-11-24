"use client";

import { useEffect } from "react";

export function ThemeInitializer() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem("hz-theme");
      if (stored === "dark" || stored === "light") {
        document.documentElement.setAttribute("data-theme", stored);
      }
    } catch {
      /* storage unavailable or blocked */
    }
  }, []);

  return null;
}
