"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export type CsvScanRecord = {
  id: string;
  status: string;
  profile: string;
  phase: string | null;
  progress_pct: number;
  created_at: string;
  finished_at?: string | null;
  completed_at?: string | null;
  ended_at?: string | null;
  updated_at?: string | null;
  error_code?: string | null;
  targets?: { asset_id?: string; type?: string; value?: string }[];
};

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

function calculateDuration(scan: CsvScanRecord): { formatted: string; seconds: number | "" } {
  const isFinished = ["completed", "failed", "timeout", "cancelled"].includes(scan.status);
  if (!isFinished) return { formatted: "—", seconds: "" };

  const completionTimestamp =
    scan.finished_at ?? scan.completed_at ?? scan.ended_at ?? scan.updated_at;
  if (!completionTimestamp || !scan.created_at) return { formatted: "—", seconds: "" };

  const start = new Date(scan.created_at).getTime();
  const end = new Date(completionTimestamp).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return { formatted: "—", seconds: "" };

  const totalSec = Math.floor((end - start) / 1000);
  if (totalSec < 60) {
    return { formatted: `${totalSec}s`, seconds: totalSec };
  }
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins < 60) {
    return {
      formatted: secs > 0 ? `${mins}m ${secs}s` : `${mins}m`,
      seconds: totalSec,
    };
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return {
    formatted: remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`,
    seconds: totalSec,
  };
}

export function DownloadScansCsvButton({
  scans,
  size = "md",
  className,
}: {
  scans: CsvScanRecord[];
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [downloading, setDownloading] = useState(false);

  function exportCsv() {
    if (scans.length === 0) return;
    setDownloading(true);

    try {
      const headers = [
        "Scan ID",
        "Status",
        "Profile",
        "Phase",
        "Progress (%)",
        "Duration",
        "Duration (Seconds)",
        "Started At (ISO)",
        "Started At (Local)",
        "Finished At (ISO)",
        "Error Code",
        "Target Assets",
      ];

      const rows = scans.map((scan) => {
        const { formatted: durationStr, seconds: durationSec } = calculateDuration(scan);
        const startedIso = scan.created_at;
        const startedLocal = scan.created_at ? new Date(scan.created_at).toLocaleString() : "";
        const finishedIso =
          scan.finished_at ?? scan.completed_at ?? scan.ended_at ?? scan.updated_at ?? "";
        const targetValues = scan.targets && scan.targets.length > 0
          ? scan.targets.map((t) => t.value || "").filter(Boolean).join("; ")
          : "";

        return [
          escapeCsv(scan.id),
          escapeCsv(scan.status),
          escapeCsv(scan.profile),
          escapeCsv(scan.phase ?? "—"),
          escapeCsv(scan.progress_pct),
          escapeCsv(durationStr),
          escapeCsv(durationSec),
          escapeCsv(startedIso),
          escapeCsv(startedLocal),
          escapeCsv(finishedIso),
          escapeCsv(scan.error_code ?? ""),
          escapeCsv(targetValues),
        ].join(",");
      });

      // UTF-8 BOM (\uFEFF) ensures correct Unicode encoding when opened in Excel
      const csvContent = "\uFEFF" + [headers.map(escapeCsv).join(","), ...rows].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `harizeon-scans-${timestamp}.csv`;

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setDownloading(false), 500);
    }
  }

  return (
    <Button
      variant="secondary"
      size={size}
      onClick={exportCsv}
      disabled={scans.length === 0 || downloading}
      className={className}
      aria-label="Download scan history as CSV"
      title={scans.length === 0 ? "No scan history to export" : "Export current scan history to CSV"}
    >
      <span className="font-mono text-xs" aria-hidden="true">
        {downloading ? "…" : "↓"}
      </span>
      <span>{downloading ? "Exporting…" : "Download CSV"}</span>
    </Button>
  );
}
