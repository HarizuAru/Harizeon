"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FindingVerifyButtonProps {
  findingId: string;
  assetValue?: string | null;
  currentStatus?: string;
}

export function FindingVerifyButton({
  findingId,
  assetValue,
}: FindingVerifyButtonProps) {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    status: "fixed" | "still_exposed";
    message: string;
    elapsedMs?: number;
  } | null>(null);

  async function handleVerify() {
    setIsVerifying(true);
    setResult(null);
    const start = Date.now();

    try {
      const res = await fetch(`/api/v1/findings/${findingId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const elapsedMs = Date.now() - start;

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setResult({
          ok: false,
          status: "still_exposed",
          message: data?.error?.message || `Micro-scan verification failed (HTTP ${res.status}).`,
          elapsedMs,
        });
        return;
      }

      const data = await res.json();
      const status = data.status || (data.verified ? "fixed" : "still_exposed");
      setResult({
        ok: true,
        status,
        message:
          status === "fixed"
            ? `Target ${assetValue || "host"} verified clean. Check stopped firing and finding marked FIXED.`
            : `Probe re-fired against ${assetValue || "host"}. Exposure remains active.`,
        elapsedMs: data.duration_ms || elapsedMs,
      });

      // Refresh page data so status chip and event timeline reflect changes
      router.refresh();
    } catch {
      setResult({
        ok: false,
        status: "still_exposed",
        message: "Micro-scan probe network error. Ensure target is reachable from public DNS.",
        elapsedMs: Date.now() - start,
      });
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 font-mono text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isVerifying}
          onClick={handleVerify}
          className="border border-ink bg-ink px-4 py-2 text-xs font-bold uppercase tracking-wider text-canvas transition-colors hover:bg-canvas hover:text-ink disabled:opacity-50"
        >
          {isVerifying ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse bg-canvas" />
              RUNNING MICRO-PROBE (5s)...
            </span>
          ) : (
            "[ VERIFY FIX (5s MICRO-SCAN) ]"
          )}
        </button>

        <span className="text-[11px] text-muted">
          Fast-track verification: runs a single targeted probe against this exact check location.
        </span>
      </div>

      {result && (
        <div
          className={`border p-3 font-mono text-xs ${
            result.status === "fixed"
              ? "border-ink bg-ink text-canvas"
              : "border-ink bg-subtle text-ink"
          }`}
        >
          <div className="flex items-center justify-between font-bold uppercase">
            <span>
              {result.status === "fixed"
                ? "[✓] VERIFICATION PASSED — RESOLVED"
                : "[!] VERIFICATION FAILED — STILL EXPOSED"}
            </span>
            {result.elapsedMs ? <span>{result.elapsedMs}ms</span> : null}
          </div>
          <p className="mt-1 text-[11px] leading-relaxed opacity-90">{result.message}</p>
        </div>
      )}
    </div>
  );
}
