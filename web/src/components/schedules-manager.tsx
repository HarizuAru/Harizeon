"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { labelClass, inputClass, selectClass } from "@/lib/ui";

export interface ScheduleItem {
  id: string;
  cron: string;
  profile: "quick" | "standard" | "deep";
  timezone: string;
  next_run_at: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

const PRESETS = [
  { label: "Daily (02:00 UTC)", cron: "0 2 * * *", desc: "Nightly automated baseline scan" },
  { label: "Weekly (Sunday 03:00 UTC)", cron: "0 3 * * 0", desc: "Weekly comprehensive assessment" },
  { label: "Monthly (1st of month 04:00 UTC)", cron: "0 4 1 * *", desc: "Monthly regulatory & compliance rescan" },
  { label: "Custom cron expression", cron: "", desc: "Define standard 5-part unix cron" },
];

export function SchedulesManager({ initialSchedules }: { initialSchedules: ScheduleItem[] }) {
  const router = useRouter();
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [presetIndex, setPresetIndex] = useState(0);
  const [customCron, setCustomCron] = useState("0 2 * * *");
  const [profile, setProfile] = useState<"quick" | "standard" | "deep">("standard");
  const [timezone, setTimezone] = useState("Asia/Kuala_Lumpur");
  const [enabled, setEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCount = schedules.filter((s) => s.enabled).length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const cron = presetIndex === 3 ? customCron.trim() : PRESETS[presetIndex].cron;
    if (!cron) {
      setError("Please provide a valid cron expression.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/v1/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cron, profile, timezone, enabled }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? `Could not create the schedule (HTTP ${res.status}).`);
        return;
      }
      const data = await res.json();
      setSchedules([data.schedule, ...schedules]);
      setIsModalOpen(false);
      router.refresh();
    } catch {
      setError("Cannot reach the API. Is it running?");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setSchedules(schedules.map((s) => (s.id === id ? { ...s, enabled: !currentStatus } : s)));

    try {
      const res = await fetch(`/api/v1/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? `Could not update the schedule (HTTP ${res.status}).`);
        router.refresh();
      }
    } catch {
      setError("Cannot reach the API. Is it running?");
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scan schedule?")) return;
    setSchedules(schedules.filter((s) => s.id !== id));

    try {
      const res = await fetch(`/api/v1/schedules/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? `Could not delete the schedule (HTTP ${res.status}).`);
        router.refresh();
      }
    } catch {
      setError("Cannot reach the API. Is it running?");
      router.refresh();
    }
  };

  const formatCron = (cron: string) => {
    if (cron === "0 2 * * *") return "Daily at 02:00";
    if (cron === "0 3 * * 0") return "Weekly on Sunday at 03:00";
    if (cron === "0 4 1 * *") return "Monthly on 1st at 04:00";
    return cron;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top action row */}
      <div className="flex flex-col justify-between gap-4 border border-line bg-canvas p-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-mono text-sm font-bold uppercase tracking-[0.05em] text-ink">
            Automated Rescan Cadence
          </p>
          <p className="text-xs text-muted">
            Recurring scans diff against historical state to surface drift (+new, -resolved) while you sleep.
          </p>
        </div>
        <Button id="btn-create-schedule" onClick={() => setIsModalOpen(true)}>
          New schedule
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="border border-line bg-canvas p-4">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Active schedules</p>
          <p className="mt-2 font-mono text-[2rem] leading-none text-ink">{activeCount}</p>
          <p className="mt-2 font-mono text-xs text-faint">
            {schedules.length} configured in organization
          </p>
        </div>
        <div className="border border-line bg-canvas p-4">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Next execution</p>
          <p className="mt-2 font-mono text-xl font-bold text-ink">
            {schedules.find((s) => s.enabled && s.next_run_at)
              ? new Date(schedules.find((s) => s.enabled && s.next_run_at)!.next_run_at!).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "None pending"}
          </p>
          <p className="mt-2 font-mono text-xs text-faint">Scheduled across verified scope</p>
        </div>
        <div className="border border-line bg-canvas p-4">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Notification channel</p>
          <p className="mt-2 font-mono text-xl font-bold text-ink">Integrated</p>
          <p className="mt-2 font-mono text-xs text-faint">Diff summaries routed to alert channels</p>
        </div>
      </div>

      {/* Schedules list */}
      {schedules.length === 0 ? (
        <EmptyState
          title="No recurring schedules."
          description="Schedule daily, weekly, or monthly automated rescans and receive notifications on new findings or verified fixes."
          action={<Button onClick={() => setIsModalOpen(true)}>Create first schedule</Button>}
        />
      ) : (
        <div className="border border-line bg-canvas">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-subtle font-mono text-xs uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th className="px-4 py-3">Cadence & Cron</th>
                  <th className="px-4 py-3">Scan Profile</th>
                  <th className="px-4 py-3">Timezone</th>
                  <th className="px-4 py-3">Next Run</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono">
                {schedules.map((sch) => (
                  <tr key={sch.id} className="hover:bg-subtle/50 transition-colors">
                    <td className="px-4 py-3 font-sans">
                      <div className="font-mono text-sm font-semibold text-ink">
                        {formatCron(sch.cron)}
                      </div>
                      <div className="font-mono text-xs text-faint">{sch.cron}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block border border-line px-2 py-0.5 text-xs uppercase tracking-[0.05em] text-ink">
                        {sch.profile}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{sch.timezone}</td>
                    <td className="px-4 py-3 text-xs text-ink">
                      {sch.enabled && sch.next_run_at
                        ? new Date(sch.next_run_at).toLocaleString()
                        : "Paused"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(sch.id, sch.enabled)}
                        className="cursor-pointer"
                        title="Click to toggle schedule"
                      >
                        <StatusBadge className={sch.enabled ? "border-ink text-ink font-bold" : "text-muted"}>
                          {sch.enabled ? "ACTIVE" : "PAUSED"}
                        </StatusBadge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggle(sch.id, sch.enabled)}
                          className="border border-line px-2 py-1 text-xs text-ink hover:bg-subtle"
                        >
                          {sch.enabled ? "Pause" : "Resume"}
                        </button>
                        <button
                          onClick={() => handleDelete(sch.id)}
                          className="border border-line px-2 py-1 text-xs text-muted hover:bg-subtle hover:text-ink"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg border border-line bg-canvas p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="font-mono text-base font-bold uppercase tracking-[0.05em] text-ink">
                Create recurring scan schedule
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="font-mono text-sm text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
              {error && (
                <div className="border border-ink bg-subtle p-3 text-xs text-ink">
                  {error}
                </div>
              )}

              <div>
                <label className={labelClass}>Cadence Preset</label>
                <div className="mt-2 flex flex-col gap-2">
                  {PRESETS.map((p, idx) => (
                    <label
                      key={p.label}
                      className={`flex cursor-pointer items-start gap-3 border p-2.5 text-xs transition-colors ${
                        presetIndex === idx ? "border-ink bg-subtle" : "border-line bg-canvas"
                      }`}
                    >
                      <input
                        type="radio"
                        name="preset"
                        checked={presetIndex === idx}
                        onChange={() => setPresetIndex(idx)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-mono font-bold text-ink">{p.label}</p>
                        <p className="text-muted">{p.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {presetIndex === 3 && (
                <div>
                  <label className={labelClass}>Cron expression (minute hour dom month dow)</label>
                  <input
                    type="text"
                    value={customCron}
                    onChange={(e) => setCustomCron(e.target.value)}
                    placeholder="0 2 * * *"
                    className={inputClass}
                    required
                  />
                  <p className="mt-1 font-mono text-[11px] text-faint">
                    Example: 0 2 * * * (Every night at 02:00)
                  </p>
                </div>
              )}

              <div>
                <label className={labelClass}>Scan Profile</label>
                <select
                  value={profile}
                  onChange={(e) => setProfile(e.target.value as "quick" | "standard" | "deep")}
                  className={selectClass}
                >
                  <option value="quick">Quick (~2 min · passive inspection only)</option>
                  <option value="standard">Standard (~10 min · passive + ports + TLS + web checks)</option>
                  <option value="deep">Deep (~45 min · standard + broader port range)</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className={selectClass}
                >
                  <option value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur (UTC+8)</option>
                  <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                </select>
              </div>

              <label className="flex items-center gap-3 text-xs text-ink">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                <span>Enable schedule immediately upon creation</span>
              </label>

              <div className="mt-4 flex items-center justify-end gap-3 border-t border-line pt-4">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Save schedule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
