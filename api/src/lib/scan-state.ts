export type ScanPhase =
  | "verify"
  | "discover"
  | "resolve"
  | "probe"
  | "inspect"
  | "test"
  | "normalize"
  | "report";

export type ScanStatus =
  | "queued"
  | "claimed"
  | "running"
  | "completed"
  | "failed"
  | "timeout"
  | "cancelled";

/** The eight phases of a scan, in the order the UI shows them (§06.4). */
export const SCAN_PHASES: readonly ScanPhase[] = [
  "verify",
  "discover",
  "resolve",
  "probe",
  "inspect",
  "test",
  "normalize",
  "report",
] as const;

const PHASE_PROGRESS: Record<ScanPhase, number> = {
  verify: 5,
  discover: 20,
  resolve: 35,
  probe: 50,
  inspect: 62,
  test: 78,
  normalize: 90,
  report: 98,
};

export const TERMINAL_STATUSES: readonly ScanStatus[] = [
  "completed",
  "failed",
  "timeout",
  "cancelled",
] as const;

export function isTerminal(status: ScanStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** Position of a phase in the plan, or -1 for null/unknown. */
export function phaseIndex(phase: ScanPhase | null | undefined): number {
  if (!phase) return -1;
  return SCAN_PHASES.indexOf(phase);
}

/** Percentage to show while a phase is running (monotonic across phases). */
export function progressForPhase(phase: ScanPhase): number {
  return PHASE_PROGRESS[phase] ?? 0;
}

/** §06.4: a job retries at most twice before it is marked timeout/failed. */
export const MAX_SCAN_ATTEMPTS = 2;

export function retryDecision(attempt: number): { retry: boolean; nextAttempt: number } {
  if (attempt < MAX_SCAN_ATTEMPTS) return { retry: true, nextAttempt: attempt + 1 };
  return { retry: false, nextAttempt: attempt };
}
