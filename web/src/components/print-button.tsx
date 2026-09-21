"use client";

import { Button } from "@/components/ui/button";

/** Print / Save-as-PDF for a report (§9.2). Uses the browser print engine. */
export function PrintButton({ label = "Print / Save as PDF" }: { label?: string }) {
  return (
    <span className="no-print">
      <Button variant="secondary" size="sm" onClick={() => window.print()}>
        {label}
      </Button>
    </span>
  );
}
