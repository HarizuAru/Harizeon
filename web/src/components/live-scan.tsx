"use client";

import { useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { cx } from "@/lib/cx";
import { cancelScanAction } from "@/lib/scan-actions";

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

const TERMINAL = new Set(["completed", "failed", "timeout", "cancelled"]);

export function LiveScan({
  scanId,
  initialStatus,
  initialPhase,
  initialProgress,
  initialEvents,
}: {
  scanId: string;
  initialStatus: string;
  initialPhase: string | null;
  initialProgress: number;
  initialEvents: LogEvent[];
}) {
  const [status, setStatus] = useState(initialStatus);
  const [phase, setPhase] = useState<string | null>(initialPhase);
  const [progress, setProgress] = useState(initialProgress);
  const [events, setEvents] = useState<LogEvent[]>(initialEvents);
  const [note, setNote] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const sinceRef = useRef(initialEvents.length > 0 ? initialEvents[initialEvents.length - 1].seq : 0);
  const done = TERMINAL.has(status);

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
      </div>

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
            events.map((e) => (
              <div key={e.seq} className="whitespace-pre-wrap">
                <span className="text-faint">{new Date(e.at).toLocaleTimeString()}</span>{" "}
                <span className="text-muted">{(e.phase ?? "-").padEnd(9)}</span> {e.message}
              </div>
            ))
          )}
        </div>
      </div>

      <p className="font-mono text-xs text-faint">
        W04 pipeline scaffold — the queue, phases and live view are real; scanning
        engines land in W05–W08, so no findings are produced yet.
      </p>
    </div>
  );
}
