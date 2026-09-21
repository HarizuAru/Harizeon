/**
 * Scheduled-scan cadences. The plan's frequencies are daily/weekly/monthly
 * (§13.2), so those (plus their standard cron spellings) are supported and
 * validated at creation — anything else is rejected, not guessed.
 */
export const SUPPORTED_CRONS = ["daily", "weekly", "monthly"] as const;
export type Cron = (typeof SUPPORTED_CRONS)[number];

const ALIASES: Record<string, Cron> = {
  daily: "daily", "@daily": "daily", "0 0 * * *": "daily", "0 2 * * *": "daily",
  weekly: "weekly", "@weekly": "weekly", "0 0 * * 0": "weekly", "0 2 * * 0": "weekly",
  monthly: "monthly", "@monthly": "monthly", "0 0 1 * *": "monthly", "0 2 1 * *": "monthly",
};

export function normaliseCron(value: string): Cron | null {
  return ALIASES[(value ?? "").trim().toLowerCase()] ?? null;
}

/** Next run strictly after `after` (UTC). */
export function nextAfter(cron: Cron, after: Date): Date {
  const midnight = (d: Date): Date =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));

  if (cron === "daily") return new Date(midnight(after).getTime() + 24 * 3600 * 1000);
  if (cron === "weekly") {
    const base = midnight(after);
    const daysAhead = ((1 - base.getUTCDay()) + 7) % 7 || 7;
    return new Date(base.getTime() + daysAhead * 24 * 3600 * 1000);
  }
  const y = after.getUTCFullYear();
  const m = after.getUTCMonth();
  return m === 11 ? new Date(Date.UTC(y + 1, 0, 1)) : new Date(Date.UTC(y, m + 1, 1));
}
