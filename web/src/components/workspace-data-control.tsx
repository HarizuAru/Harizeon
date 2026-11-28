"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function WorkspaceDataControl() {
  const router = useRouter();
  const [mode, setMode] = useState<"clean" | "demo">("demo");
  const [stats, setStats] = useState<{ assets: number; scans: number; findings: number }>({
    assets: 0,
    scans: 0,
    findings: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/workspace/mode")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setMode(data.mode);
          setStats({
            assets: data.assetsCount ?? 0,
            scans: data.scansCount ?? 0,
            findings: data.findingsCount ?? 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleReset = async (targetMode: "clean" | "demo") => {
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/v1/workspace/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: targetMode }),
      });

      if (res.ok) {
        setMode(targetMode);
        setStatusMessage(
          targetMode === "clean"
            ? "Workspace cleared! Demo data removed. You have a clean workspace."
            : "Sample demo dataset restored successfully.",
        );
        router.refresh();
        // Update stats
        fetch("/api/v1/workspace/mode")
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data) {
              setStats({
                assets: data.assetsCount ?? 0,
                scans: data.scansCount ?? 0,
                findings: data.findingsCount ?? 0,
              });
            }
          });
      } else {
        setStatusMessage("Failed to update workspace data mode.");
      }
    } catch {
      setStatusMessage("Cannot reach the API.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-line bg-canvas p-6 flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
              Workspace Data &amp; Demo Mode
            </span>
            <span
              className={`border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                mode === "clean"
                  ? "border-[#02acc5] bg-[#02acc5]/10 text-[#02acc5]"
                  : "border-line bg-subtle text-muted"
              }`}
            >
              {mode === "clean" ? "Clean Workspace (No Demo Data)" : "Demo Mode Active"}
            </span>
          </div>
          <p className="text-xs text-muted font-sans mt-1">
            Choose whether to operate with a clean production slate or explore with preloaded sample data.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-muted text-[11px]">
            {stats.assets} Assets · {stats.scans} Scans · {stats.findings} Findings
          </span>
        </div>
      </div>

      <div className="text-xs text-muted font-sans leading-relaxed">
        {mode === "clean" ? (
          <p>
            Your workspace has <strong>no demo data</strong>. When you add and verify an asset, it can be scanned across all Harizeon services (Harizeon Scan SCN, AI-Armor AIA, Surface ASM, Schedules SCH, and Reports ADT).
          </p>
        ) : (
          <p>
            Currently running with sample demo data (<code className="font-mono text-ink">example.com</code>, sample scans, and mock vulnerabilities). You can clear this anytime to start fresh with your own assets.
          </p>
        )}
      </div>

      {statusMessage ? (
        <div className="border border-[#02acc5]/40 bg-[#02acc5]/10 p-3 font-mono text-xs text-ink">
          {statusMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => handleReset("clean")}
          disabled={isLoading || mode === "clean"}
          className={`border px-4 py-2 font-mono text-xs uppercase font-bold tracking-wider transition-colors cursor-pointer ${
            mode === "clean"
              ? "border-line bg-subtle text-muted cursor-not-allowed"
              : "border-ink bg-ink text-canvas hover:bg-canvas hover:text-ink"
          }`}
        >
          {isLoading ? "Updating..." : "Clear Demo Data (Start Clean)"}
        </button>

        <button
          type="button"
          onClick={() => handleReset("demo")}
          disabled={isLoading || mode === "demo"}
          className={`border px-4 py-2 font-mono text-xs uppercase font-bold tracking-wider transition-colors cursor-pointer ${
            mode === "demo"
              ? "border-line bg-subtle text-muted cursor-not-allowed"
              : "border-line bg-canvas text-ink hover:border-ink hover:bg-subtle"
          }`}
        >
          {isLoading ? "Updating..." : "Load Sample Demo Data"}
        </button>
      </div>
    </div>
  );
}
