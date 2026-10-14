"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { retryScanAction } from "@/lib/scan-actions";
import { cx } from "@/lib/cx";

export function RetryScanButton({
  scanId,
  status,
  profile,
  targets,
  className,
}: {
  scanId: string;
  status: string;
  profile?: string;
  targets?: { asset_id?: string; type?: string; value?: string }[];
  className?: string;
}) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only failed or timed-out scans can be retried
  const isEligible = status === "failed" || status === "timeout";
  if (!isEligible) {
    return <span className="text-faint">—</span>;
  }

  async function handleRetry(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (retrying) return;
    setRetrying(true);
    setError(null);

    try {
      const assetIds = targets
        ? (targets.map((t) => t.asset_id).filter(Boolean) as string[])
        : [];

      const res = await retryScanAction(scanId, assetIds, profile);
      if (res.ok && res.scanId) {
        // Direct to the newly triggered scan's live view
        router.push(`/scans/${res.scanId}`);
      } else {
        setError(res.error ?? "Failed to retry scan");
        setRetrying(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Retry request failed");
      setRetrying(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleRetry}
        disabled={retrying}
        title={error ?? `Retry scan ${scanId.slice(0, 8)} with profile ${profile ?? "standard"}`}
        aria-label={`Retry scan ${scanId.slice(0, 8)} with same configuration`}
        className={cx(
          "inline-flex items-center gap-1.5 border border-ink bg-canvas px-2.5 py-1 font-mono text-xs uppercase tracking-[0.08em] text-ink transition-colors",
          "hover:bg-ink hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-canvas disabled:hover:text-ink",
          className,
        )}
      >
        <span aria-hidden="true" className={cx(retrying && "animate-spin")}>
          ↻
        </span>
        <span>{retrying ? "Retrying…" : "Retry"}</span>
      </button>
      {error && (
        <span className="font-mono text-[10px] text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
