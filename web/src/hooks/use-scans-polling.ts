"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Scan } from "@/components/scans-list-table";

export interface UseScansPollingOptions {
  initialScans: Scan[];
  activeIntervalMs?: number; // 3000ms by default for running/queued scans
  idleIntervalMs?: number; // 30000ms by default when all scans are terminal
  autoStart?: boolean;
}

export interface UseScansPollingReturn {
  scans: Scan[];
  activeScans: Scan[];
  hasActiveScans: boolean;
  isPolling: boolean;
  isRefreshing: boolean;
  lastPolledAt: Date;
  secondsSincePoll: number;
  pollingEnabled: boolean;
  setPollingEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  refreshNow: () => Promise<void>;
  error: string | null;
}

export function useScansPolling({
  initialScans,
  activeIntervalMs = 3000,
  idleIntervalMs = 30000,
  autoStart = true,
}: UseScansPollingOptions): UseScansPollingReturn {
  const [prevInitialScans, setPrevInitialScans] = useState(initialScans);
  const [scans, setScans] = useState<Scan[]>(initialScans);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastPolledAt, setLastPolledAt] = useState<Date>(new Date());
  const [secondsSincePoll, setSecondsSincePoll] = useState(0);
  const [pollingEnabled, setPollingEnabled] = useState(autoStart);
  const [error, setError] = useState<string | null>(null);

  // Sync state if initialScans prop changes from SSR
  if (prevInitialScans !== initialScans) {
    setPrevInitialScans(initialScans);
    setScans(initialScans);
  }

  // Identify scans in active non-terminal state
  const activeScans = useMemo(() => {
    return scans.filter(
      (s) => s.status?.toLowerCase() === "running" || s.status?.toLowerCase() === "queued",
    );
  }, [scans]);

  const hasActiveScans = activeScans.length > 0;

  // Single fetch execution
  const fetchScans = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch("/api/scans", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const json = (await res.json()) as { ok: boolean; data?: Scan[]; error?: string };
      if (json.ok && Array.isArray(json.data)) {
        setScans(json.data);
        setLastPolledAt(new Date());
        setSecondsSincePoll(0);
        setError(null);
      } else if (json.error) {
        setError(json.error);
      }
    } catch (err: unknown) {
      // Retain existing scans on transient network glitch
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message || "Failed to poll scan status");
      }
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  // Tick seconds counter for user visibility
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsSincePoll((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Ref to hold latest fetchScans to avoid effect churn
  const fetchRef = useRef(fetchScans);
  useEffect(() => {
    fetchRef.current = fetchScans;
  }, [fetchScans]);

  // Adaptive polling loop:
  // - Polls every 3s when scans are in 'running' or 'queued' state
  // - Idles (or slows to 30s) when all scans reach terminal state
  useEffect(() => {
    if (!pollingEnabled) return;

    // Determine current interval: active interval when running/queued scans exist
    const intervalMs = hasActiveScans ? activeIntervalMs : idleIntervalMs;
    if (intervalMs <= 0) return;

    const timer = setInterval(() => {
      // Pause polling if user minimized or switched tab to save battery/bandwidth
      if (typeof document !== "undefined" && document.hidden) return;
      void fetchRef.current(false);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [hasActiveScans, pollingEnabled, activeIntervalMs, idleIntervalMs]);

  // Immediately refresh when tab regains focus if active scans exist
  useEffect(() => {
    if (!pollingEnabled || !hasActiveScans) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void fetchRef.current(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [hasActiveScans, pollingEnabled]);

  const refreshNow = useCallback(async () => {
    await fetchScans(true);
  }, [fetchScans]);

  return {
    scans,
    activeScans,
    hasActiveScans,
    isPolling: pollingEnabled && hasActiveScans,
    isRefreshing,
    lastPolledAt,
    secondsSincePoll,
    pollingEnabled,
    setPollingEnabled,
    refreshNow,
    error,
  };
}
