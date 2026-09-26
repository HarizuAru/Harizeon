"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { cx } from "@/lib/cx";
import { cancelScanAction, retryScanAction } from "@/lib/scan-actions";

const PHASES = [
  "verify",
  "discover",
  "resolve",
  "probe",
  "inspect",
  "test",
  "normalize",
  "report",
] as const;

type Phase = (typeof PHASES)[number];
type LogEvent = { seq: number; phase: string | null; level: string; message: string; at: string };
type Target = { asset_id: string; type: string; value: string };

const TERMINAL = new Set(["completed", "failed", "timeout", "cancelled"]);

export function LiveScan({
  scanId,
  initialStatus,
  initialPhase,
  initialProgress,
  initialEvents,
  initialSummary,
  profile = "standard",
  targets = [],
  errorCode,
  errorMessage,
}: {
  scanId: string;
  initialStatus: string;
  initialPhase: string | null;
  initialProgress: number;
  initialEvents: LogEvent[];
  initialSummary?: { new: number; resolved: number; unchanged: number } | null;
  profile?: string;
  targets?: Target[];
  errorCode?: string;
  errorMessage?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [phase, setPhase] = useState<string | null>(initialPhase);
  const [progress, setProgress] = useState(initialProgress);
  const [events, setEvents] = useState<LogEvent[]>(initialEvents);
  const [note, setNote] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const sinceRef = useRef(initialEvents.length > 0 ? initialEvents[initialEvents.length - 1].seq : 0);
  const done = TERMINAL.has(status);
  const isFailed = status === "failed" || status === "timeout";

  useEffect(() => {
    if (done) return;
    const es = new EventSource(`/api/scans/${scanId}/events?since=${sinceRef.current}`);
    es.addEventListener("log", (e) => {
      const ev = JSON.parse((e as MessageEvent).data) as LogEvent;
      sinceRef.current = Math.max(sinceRef.current, ev.seq);
      setEvents((prev) => [...prev, ev]);
    });
    es.addEventListener("status", (e) => {
      const s = JSON.parse((e as MessageEvent).data) as {
        status: string;
        phase: string | null;
        progress_pct: number;
      };
      setStatus(s.status);
      setPhase(s.phase);
      setProgress(s.progress_pct);
    });
    es.addEventListener("done", (e) => {
      const s = JSON.parse((e as MessageEvent).data) as { status: string };
      setStatus(s.status);
      es.close();
    });
    es.addEventListener("error", () => {
      setNote("Live stream disconnected. Reload the page to resume.");
      es.close();
    });
    return () => es.close();
  }, [scanId, done]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [events]);

  const currentIndex = phase ? PHASES.indexOf(phase as Phase) : -1;

  async function cancel() {
    const r = await cancelScanAction(scanId);
    if (!r.ok) setNote(r.error ?? "Cancel failed");
  }

  async function handleRetry() {
    if (retrying) return;
    setRetrying(true);
    setNote(null);
    try {
      const assetIds = targets.map((t) => t.asset_id);
      const r = await retryScanAction(scanId, assetIds, profile);
      if (r.ok && r.scanId) {
        setNote(`New scan job triggered for ${targets.length > 0 ? `${targets.length} target(s)` : "target configuration"} (${r.scanId.slice(0, 8)}…). Redirecting…`);
        router.push(`/scans/${r.scanId}`);
      } else {
        setNote(`Retry failed: ${r.error ?? "Unknown error"}`);
        setRetrying(false);
      }
    } catch (err: unknown) {
      setNote(err instanceof Error ? err.message : "Failed to retry scan");
      setRetrying(false);
    }
  }

  // Derive root failure message from events if explicit message is missing
  const lastErrorMsg = errorMessage ?? [...events].reverse().find((e) => e.level === "error" || e.level === "fatal")?.message;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4 border border-line bg-canvas p-3">
        <StatusBadge>{status}</StatusBadge>
        <span className="font-mono text-xs text-muted">
          phase: {phase ?? "—"} · {progress}%
        </span>
        <div className="h-1 flex-1 min-w-32 border border-line bg-subtle">
          <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
        {!done ? (
          <Button variant="secondary" size="sm" onClick={() => void cancel()}>
            Cancel scan
          </Button>
        ) : null}
        {isFailed ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleRetry()}
            disabled={retrying}
            className="flex items-center gap-1.5"
          >
            {retrying ? (
              <>
                <span className="inline-block animate-spin font-mono text-[10px]">◒</span>
                <span>Retrying…</span>
              </>
            ) : (
              <>
                <span className="font-mono text-[11px]">↻</span>
                <span>Retry scan</span>
              </>
            )}
          </Button>
        ) : null}
      </div>

      {isFailed ? (
        <div className="border border-line bg-canvas p-4 font-mono">
          <div className="flex flex-col gap-3.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="border border-ink bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase text-canvas">
                  [!] Scan Terminated
                </span>
                <span className="text-xs font-bold text-ink">
                  Failed during phase: <span className="uppercase">{phase ?? "unknown"}</span>
                </span>
                {errorCode ? (
                  <span className="border border-line bg-subtle px-1.5 py-0.5 text-[10px] text-muted">
                    {errorCode}
                  </span>
                ) : null}
              </div>
              <p className="text-xs leading-relaxed text-muted">
                {lastErrorMsg ??
                  "The scan pipeline terminated before completing all analysis phases. Retrying will dispatch a new scan job for the identical target asset configuration."}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-faint">
                <span>
                  <strong className="text-ink">Target Assets:</strong>{" "}
                  {targets.map((t) => t.value).join(", ") || "—"} ({targets.length})
                </span>
                <span>·</span>
                <span>
                  <strong className="text-ink">Profile:</strong> {profile}
                </span>
                <span>·</span>
                <span>
                  <strong className="text-ink">Status:</strong> {status}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 pt-1 sm:pt-0">
              <Link
                href="/dashboard#system-health"
                className="border border-line bg-canvas px-3 py-1.5 text-xs text-ink hover:bg-subtle"
              >
                Diagnose in System Health →
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={() => void handleRetry()}
                disabled={retrying}
                className="flex items-center gap-1.5"
              >
                {retrying ? (
                  <>
                    <span className="inline-block animate-spin font-mono text-[10px]">◒</span>
                    <span>Retrying…</span>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-[11px]">↻</span>
                    <span>Retry scan now</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {note ? (
        <p role="alert" className="font-mono text-xs text-muted">
          {note}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[16rem_1fr]">
        <ol className="border border-line bg-canvas">
          {PHASES.map((p, i) => {
            const state = done || (currentIndex >= 0 && i < currentIndex)
              ? "done"
              : i === currentIndex
                ? "running"
                : "pending";
            return (
              <li
                key={p}
                className={cx(
                  "flex items-center gap-2 border-b border-line px-3 py-2 font-mono text-xs last:border-0",
                  state === "done" && "text-muted",
                  state === "running" && "bg-accent text-accent-ink font-bold",
                  state === "pending" && "text-faint",
                )}
              >
                <span className="w-6">{String(i + 1).padStart(2, "0")}</span>
                <span className="uppercase tracking-[0.08em]">{p}</span>
                <span className="ml-auto">
                  {state === "done" ? "[x]" : state === "running" ? "[>]" : "[ ]"}
                </span>
              </li>
            );
          })}
        </ol>

        <div
          ref={logRef}
          className="max-h-96 overflow-y-auto border border-line bg-canvas p-3 font-mono text-xs leading-relaxed"
          aria-live="polite"
        >
          {events.length === 0 ? (
            <p className="text-faint">Waiting for the worker…</p>
          ) : (
            events.map((e) => {
              const isError = e.level === "error" || e.level === "fatal";
              return (
                <div
                  key={e.seq}
                  className={cx(
                    "whitespace-pre-wrap py-0.5",
                    isError && "bg-subtle pl-1 font-bold text-ink border-l border-ink",
                  )}
                >
                  <span className="text-faint">{new Date(e.at).toLocaleTimeString()}</span>{" "}
                  <span className={cx("text-muted", isError && "text-ink")}>{(e.phase ?? "-").padEnd(9)}</span>{" "}
                  {isError && (
                    <span className="mr-1 border border-ink bg-ink px-1 text-[10px] font-bold uppercase text-canvas">
                      ERR
                    </span>
                  )}
                  {e.message}
                </div>
              );
            })
          )}
        </div>
      </div>

      {done && initialSummary && (initialSummary.new > 0 || initialSummary.resolved > 0) ? (
        <div className="border border-line bg-canvas p-3 font-mono text-sm text-ink">
          <span className="font-bold">+{initialSummary.new} new</span>{" "}
          <span className="mx-2 text-faint">|</span>
          <span className="font-bold">−{initialSummary.resolved} resolved</span>
          <span className="mx-2 text-faint">|</span>
          <span className="text-muted">{initialSummary.unchanged} unchanged</span>
          <Link href="/findings" className="ml-3 underline">
            View findings
          </Link>
        </div>
      ) : null}

      <p className="font-mono text-xs text-faint">
        Pipeline + discovery + probe/inspect engines are live; template-based web
        checks land in W08.
      </p>
    </div>
  );
}
