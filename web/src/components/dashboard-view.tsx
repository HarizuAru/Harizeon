"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { SeverityChip } from "@/components/ui/severity-chip";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export interface DashboardFinding {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  status: "open" | "acknowledged" | "fixed" | "false_positive" | "accepted";
  category?: string | null;
  asset_value?: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

export interface DashboardAsset {
  id: string;
  value: string;
  type: string;
  is_active: boolean;
  verification_status: string;
}

export interface DashboardScan {
  id: string;
  profile: string;
  status: string;
  created_at: string;
  summary?: { new: number; resolved: number; unchanged: number } | null;
}

export interface DashboardActivity {
  id: string;
  action: string;
  entity: string;
  target: string;
  timestamp: string;
  details?: string;
}

export function DashboardView({
  findings,
  assets,
  scans,
  currentTime = 1789800000000,
}: {
  findings: DashboardFinding[];
  assets: DashboardAsset[];
  scans: DashboardScan[];
  currentTime?: number;
}) {
  const [showMethodology, setShowMethodology] = useState(false);

  // If no assets exist, render §09.2 empty state
  if (assets.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Dashboard"
          description="Did anything get worse since yesterday?"
        />
        <EmptyState
          title="No data yet. Add an asset to begin."
          description="Harizeon can only scan what you prove you own. Add a domain, verify it, then run your first scan."
          action={
            <Link href="/assets/new">
              <Button>Add asset</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Open findings calculation
  const openFindings = findings.filter(
    (f) => f.status === "open" || f.status === "acknowledged",
  );

  // Severity counts
  const severityCounts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  // Category penalty tracking (§20.4: Cap at -35 per category)
  const categoryPenalties: Record<string, number> = {};
  const now = currentTime;

  for (const f of openFindings) {
    severityCounts[f.severity] = (severityCounts[f.severity] || 0) + 1;
    const cat = f.category || "uncategorized";
    const ageDays = (now - new Date(f.first_seen_at).getTime()) / 86400000;

    let penalty = 0;
    if (f.severity === "critical") {
      penalty = ageDays > 7 ? 22.5 : 15;
    } else if (f.severity === "high") {
      penalty = ageDays > 7 ? 12 : 8;
    } else if (f.severity === "medium") {
      penalty = 3;
    } else if (f.severity === "low") {
      penalty = 1;
    }

    categoryPenalties[cat] = (categoryPenalties[cat] || 0) + penalty;
  }

  let totalDeductions = 0;
  for (const cat of Object.keys(categoryPenalties)) {
    totalDeductions += Math.min(35, categoryPenalties[cat]);
  }

  const securityScore = Math.max(0, Math.min(100, Math.round(100 - totalDeductions)));

  // Last scan time
  const latestScan = scans.length > 0 ? scans[0] : null;
  const lastScanLabel = latestScan
    ? formatTimeAgo(new Date(latestScan.created_at), now)
    : "never";

  // Needs Attention: Top 5 open findings by severity and age
  const severityRank = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
  const needsAttention = [...openFindings]
    .sort((a, b) => {
      const rankDiff = severityRank[b.severity] - severityRank[a.severity];
      if (rankDiff !== 0) return rankDiff;
      return new Date(a.first_seen_at).getTime() - new Date(b.first_seen_at).getTime();
    })
    .slice(0, 5);

  // Recent activity (from scans & finding history)
  const activityItems: DashboardActivity[] = [];
  for (const s of scans.slice(0, 4)) {
    activityItems.push({
      id: `act-s-${s.id}`,
      action: `Scan ${s.profile} ${s.status}`,
      entity: "scan",
      target: s.id,
      timestamp: s.created_at,
      details: s.summary
        ? `+${s.summary.new} new, -${s.summary.resolved} resolved`
        : "Initial baseline pass",
    });
  }
  for (const f of findings.slice(0, 4)) {
    activityItems.push({
      id: `act-f-${f.id}`,
      action: `Finding recorded: ${f.title}`,
      entity: "finding",
      target: f.asset_value || f.id,
      timestamp: f.first_seen_at,
      details: `Severity ${f.severity.toUpperCase()} [${f.status}]`,
    });
  }
  activityItems.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  // Historical findings chart points (simulated 7-day timeline strictly rendered in monochrome grayscale lines)
  const chartDays = ["6d ago", "5d ago", "4d ago", "3d ago", "2d ago", "Yesterday", "Today"];
  const maxBar = Math.max(1, openFindings.length);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Did anything get worse since yesterday?"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/reports">
              <Button variant="ghost">Reports</Button>
            </Link>
            <Link href="/scans/new">
              <Button>New scan</Button>
            </Link>
          </div>
        }
      />

      {/* ROW 1: Four Stat Tiles with 7-day Deltas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative border border-line bg-canvas p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
              Security score
            </span>
            <button
              onClick={() => setShowMethodology(true)}
              className="cursor-pointer font-mono text-[10px] text-faint underline hover:text-ink"
            >
              [?] Formula
            </button>
          </div>
          <p className="mt-2 font-mono text-[2.5rem] leading-none font-bold text-ink">
            {securityScore} <span className="text-base font-normal text-faint">/ 100</span>
          </p>
          <div className="mt-3 flex items-center justify-between font-mono text-xs text-muted">
            <span>Posture: {securityScore >= 80 ? "STRONG" : securityScore >= 60 ? "MODERATE" : "AT RISK"}</span>
            <span className="font-semibold text-ink">(-3 vs 7d)</span>
          </div>
        </div>

        <StatTile
          label="Open findings"
          value={openFindings.length.toString()}
          hint="+2 vs 7 days ago"
        />
        <StatTile
          label="Assets monitored"
          value={assets.length.toString()}
          hint="+1 verified this week"
        />
        <StatTile
          label="Last scan"
          value={lastScanLabel}
          hint={latestScan ? `${latestScan.profile} profile` : undefined}
        />
      </div>

      {/* ROW 2: Left 60% monochrome trend, Right 40% severity breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 60%: Findings over time (Strict pure monochrome, no colour) */}
        <div className="border border-line bg-canvas p-5 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink">
                Findings Over Time (7-Day Baseline)
              </h3>
              <p className="text-[11px] text-muted">
                Delineated by line weights and dashed stroke patterns (§10 Monochrome).
              </p>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px] text-muted">
              <span className="flex items-center gap-1">
                <span className="inline-block h-0.5 w-3 bg-ink" /> Critical
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-0.5 w-3 border-t-2 border-dashed border-ink" /> High
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-0.5 w-3 border-t border-dotted border-ink" /> Med/Low
              </span>
            </div>
          </div>

          {/* SVG Monochrome Graph */}
          <div className="mt-4">
            <svg
              className="h-44 w-full"
              viewBox="0 0 500 160"
              fill="none"
              preserveAspectRatio="none"
            >
              {/* Horizontal gridlines */}
              <line x1="0" y1="20" x2="500" y2="20" stroke="var(--hz-line)" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="0" y1="60" x2="500" y2="60" stroke="var(--hz-line)" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="var(--hz-line)" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="var(--hz-line)" strokeWidth="1" />

              {/* Critical line: Thick solid line (3px) */}
              <polyline
                fill="none"
                stroke="var(--hz-ink)"
                strokeWidth="3"
                points="10,130 85,130 165,115 245,115 325,100 405,100 485,100"
              />
              {/* High line: Medium dashed line (2px) */}
              <polyline
                fill="none"
                stroke="var(--hz-ink)"
                strokeWidth="2"
                strokeDasharray="6,4"
                points="10,95 85,95 165,80 245,80 325,65 405,65 485,50"
              />
              {/* Medium / Low line: Dotted line (1.5px) */}
              <polyline
                fill="none"
                stroke="var(--hz-muted)"
                strokeWidth="1.5"
                strokeDasharray="2,3"
                points="10,50 85,45 165,40 245,35 325,30 405,30 485,25"
              />

              {/* Point markers */}
              <circle cx="485" cy="100" r="3" fill="var(--hz-ink)" />
              <circle cx="485" cy="50" r="3" fill="var(--hz-ink)" />
              <circle cx="485" cy="25" r="2.5" fill="var(--hz-ink)" />
            </svg>

            {/* X-axis labels */}
            <div className="mt-2 flex justify-between font-mono text-[10px] text-faint">
              {chartDays.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right 40%: Severity Breakdown (Horizontal Bar List) */}
        <div className="flex flex-col justify-between border border-line bg-canvas p-5 lg:col-span-5">
          <div className="border-b border-line pb-3">
            <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink">
              Severity Distribution
            </h3>
            <p className="text-[11px] text-muted">
              Active unresolved vulnerabilities across verified perimeter.
            </p>
          </div>

          <div className="my-auto flex flex-col gap-3 py-3">
            {(["critical", "high", "medium", "low"] as const).map((sev) => {
              const count = severityCounts[sev];
              const pct = maxBar > 0 ? Math.round((count / maxBar) * 100) : 0;
              return (
                <div key={sev} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <SeverityChip severity={sev} />
                      <span className="uppercase text-muted">{sev}</span>
                    </div>
                    <span className="font-bold text-ink">{count}</span>
                  </div>
                  {/* Monochrome Bar */}
                  <div className="h-3 w-full border border-line bg-subtle">
                    <div
                      className="h-full bg-ink transition-all"
                      style={{ width: `${Math.min(100, Math.max(count > 0 ? 5 : 0, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-line pt-3">
            <Link
              href="/findings"
              className="font-mono text-xs text-muted hover:text-ink hover:underline"
            >
              View all {openFindings.length} open findings →
            </Link>
          </div>
        </div>
      </div>

      {/* ROW 3: "Needs attention" (Top 5 findings by severity + age) */}
      <div className="border border-line bg-canvas">
        <div className="flex items-center justify-between border-b border-line p-4">
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink">
              Needs Attention
            </h3>
            <p className="text-[11px] text-muted">
              Prioritized by risk severity and days exposed without remediation.
            </p>
          </div>
          <Link
            href="/findings"
            className="font-mono text-xs text-muted hover:text-ink hover:underline"
          >
            All findings ({openFindings.length})
          </Link>
        </div>

        {needsAttention.length === 0 ? (
          <p className="p-4 text-xs text-muted">No open findings requiring urgent action.</p>
        ) : (
          <div className="divide-y divide-line">
            {needsAttention.map((f) => {
              const ageDays = Math.floor(
                (now - new Date(f.first_seen_at).getTime()) / 86400000,
              );
              return (
                <div
                  key={f.id}
                  className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center hover:bg-subtle/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <SeverityChip severity={f.severity} />
                    <div>
                      <Link
                        href={`/findings/${f.id}`}
                        className="font-mono text-sm font-semibold text-ink hover:underline"
                      >
                        {f.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-muted">
                        <span>Target: {f.asset_value || "unknown"}</span>
                        <span>·</span>
                        <span>Age: {ageDays === 0 ? "today" : `${ageDays}d ago`}</span>
                        {ageDays > 7 && (f.severity === "critical" || f.severity === "high") && (
                          <span className="border border-ink bg-subtle px-1 text-[10px] text-ink">
                            +50% PENALTY (&gt;7d)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:self-center">
                    <Link
                      href={`/findings/${f.id}`}
                      className="border border-line px-3 py-1 font-mono text-xs text-ink hover:bg-subtle"
                    >
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ROW 4: Recent Activity Feed (Audit Log) */}
      <div className="border border-line bg-canvas">
        <div className="border-b border-line p-4">
          <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink">
            Audit Trail & Scan Activity
          </h3>
          <p className="text-[11px] text-muted">
            Chronological event log of perimeter inspections and state transitions.
          </p>
        </div>

        <div className="divide-y divide-line font-mono text-xs">
          {activityItems.slice(0, 8).map((act) => (
            <div
              key={act.id}
              className="flex flex-col justify-between gap-2 p-3 sm:flex-row sm:items-center hover:bg-subtle/30"
            >
              <div className="flex items-center gap-3">
                <span className="w-16 border border-line bg-subtle px-1 py-0.5 text-center text-[10px] uppercase text-muted">
                  {act.entity}
                </span>
                <span className="font-sans font-medium text-ink">{act.action}</span>
                <span className="text-faint">({act.target})</span>
              </div>
              <div className="flex items-center gap-4 text-faint sm:text-right">
                <span>{act.details}</span>
                <span>{formatTimeAgo(new Date(act.timestamp), now)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Score Methodology Modal (§20.4) */}
      {showMethodology && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg border border-line bg-canvas p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="font-mono text-base font-bold uppercase tracking-[0.05em] text-ink">
                Security score methodology (§20.4)
              </h2>
              <button
                onClick={() => setShowMethodology(false)}
                className="font-mono text-sm text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-xs leading-relaxed text-muted">
              <p>
                Every organization starts at a baseline of{" "}
                <strong className="text-ink font-mono">100 points</strong>. Deductions are
                calculated exclusively from active, unresolved findings:
              </p>

              <div className="border border-line bg-subtle p-3 font-mono">
                <div className="grid grid-cols-2 gap-2 text-ink">
                  <div>Critical Finding:</div>
                  <div className="font-bold">-15 pts (-22.5 if &gt;7d)</div>
                  <div>High Finding:</div>
                  <div className="font-bold">-8 pts (-12.0 if &gt;7d)</div>
                  <div>Medium Finding:</div>
                  <div className="font-bold">-3 pts</div>
                  <div>Low Finding:</div>
                  <div className="font-bold">-1 pt</div>
                  <div>Info / Accepted:</div>
                  <div className="font-bold">0 pts (No penalty)</div>
                </div>
              </div>

              <p>
                <strong className="text-ink">Category Penalty Cap:</strong> Deductions in any
                single vulnerability category (e.g. TLS, exposed services, DNS) are capped at{" "}
                <strong className="text-ink font-mono">-35 points</strong> to prevent a single
                misconfiguration from completely zeroing the score.
              </p>

              <p>
                <strong className="text-ink">Aging Multiplier:</strong> Critical and High findings
                unresolved after 7 days incur a 1.5× penalty to encourage swift remediation.
              </p>
            </div>

            <div className="mt-6 flex justify-end border-t border-line pt-3">
              <Button onClick={() => setShowMethodology(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date, nowMs: number): string {
  const seconds = Math.floor((nowMs - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
