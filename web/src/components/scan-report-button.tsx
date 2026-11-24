"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ScanReportButton({
  assetIds,
  disabled,
}: {
  assetIds: string[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "executive",
          asset_ids: assetIds.length > 0 ? assetIds : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message || `Failed to create report (HTTP ${res.status})`);
      }

      const result = await res.json();
      const reportId = result.id || result.report?.id;
      if (reportId) {
        router.push(`/reports/${reportId}`);
      } else {
        router.push("/reports");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative inline-flex flex-col items-end">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating || disabled}
        className="border border-ink bg-ink px-3 py-1.5 font-mono text-xs font-semibold text-canvas transition-colors hover:bg-canvas hover:text-ink disabled:opacity-50"
      >
        {isGenerating ? "GENERATING AUDIT PDF..." : "GENERATE AUDIT REPORT"}
      </button>
      {error ? (
        <span className="absolute -bottom-5 right-0 whitespace-nowrap font-mono text-[10px] text-muted">
          {error}
        </span>
      ) : null}
    </div>
  );
}
