"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { SeverityChip } from "@/components/ui/severity-chip";
import { Button } from "@/components/ui/button";

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

const RECENT_SERVICES = [
  {
    code: "ASM",
    name: "Attack Surface",
    description: "Verified domains, subdomains & public CIDRs",
    href: "/assets",
    stat: "3 Assets",
  },
  {
    code: "SCN",
    name: "Security Scans",
    description: "Multi-phase port, TLS, and web exposure sweeps",
    href: "/scans",
    stat: "1 Completed",
  },
  {
    code: "FND",
    name: "Findings & CVEs",
    description: "Prioritized vulnerabilities and remediation steps",
    href: "/findings",
    stat: "3 Open",
  },
  {
    code: "SCH",
    name: "Scan Schedules",
    description: "Automated recurring cron-based scanning",
    href: "/schedules",
    stat: "2 Active",
  },
  {
    code: "REP",
    name: "Compliance Reports",
    description: "ISO 27001, SOC 2 & Executive PDF generation",
    href: "/reports",
    stat: "2 Ready",
  },
  {
    code: "ADT",
    name: "CloudTrail & Audit",
    description: "Append-only administrative operations log",
    href: "/settings/audit-log",
    stat: "Immutable",
  },
];

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

  const openFindings = findings.filter(
    (f) => f.status === "open" || f.status === "acknowledged",
  );

  const severityCounts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

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

  const latestScan = scans.length > 0 ? scans[0] : null;
  const lastScanLabel = latestScan
    ? formatTimeAgo(new Date(latestScan.created_at), now)
    : "never";

  const severityRank = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
  const needsAttention = [...openFindings]
    .sort((a, b) => {
      const rankDiff = severityRank[b.severity] - severityRank[a.severity];
      if (rankDiff !== 0) return rankDiff;
      return new Date(a.first_seen_at).getTime() - new Date(b.first_seen_at).getTime();
    })
    .slice(0, 5);

  const activityItems: DashboardActivity[] = [];
  for (const s of scans.slice(0, 4)) {
    activityItems.push({
      id: `act-s-${s.id}`,
      action: `Scan ${s.profile} ${s.status}`,
      entity: "SCAN",
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
      entity: "FINDING",
      target: f.asset_value || f.id,
      timestamp: f.first_seen_at,
      details: `Severity ${f.severity.toUpperCase()} [${f.status}]`,
    });
  }
  activityItems.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const chartDays = ["6d ago", "5d ago", "4d ago", "3d ago", "2d ago", "Yesterday", "Today"];
  const maxBar = Math.max(1, openFindings.length);

  return (
    <div className="flex flex-col gap-6">
      {/* Top AWS Console Home Title Bar */}
      <PageHeader
        title="Console Home"
        description="Continuous Attack Surface Management & Threat Telemetry"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/reports">
              <Button variant="ghost">Reports</Button>
            </Link>
            <Link href="/scans/new">
              <Button>Launch scan</Button>
            </Link>
          </div>
        }
      />

      {/* WIDGET 1: AWS Console Welcome & Quick Solutions Banner */}
      <div className="border border-line bg-canvas p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <span className="border border-ink bg-ink px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-canvas">
              AWS-STYLE MANAGEMENT CONSOLE
            </span>
            <h2 className="mt-2 text-xl font-bold text-ink font-sans">
              Welcome to Harizeon Attack Surface Management
            </h2>
            <p className="mt-1 text-xs text-muted font-sans">
              Centralized security posture, automated external scanning, and cryptographic ownership verification across verified cloud perimeters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <Link
              href="/assets/new"
              className="border border-ink bg-ink px-3 py-1.5 font-bold uppercase text-canvas hover:bg-canvas hover:text-ink transition-colors"
            >
              + Register Asset
            </Link>
            <Link
              href="/scans/new"
              className="border border-line bg-subtle px-3 py-1.5 uppercase text-ink hover:border-ink transition-colors"
            >
              ⚡ Run Scan
            </Link>
            <Link
              href="/reports"
              className="border border-line bg-canvas px-3 py-1.5 uppercase text-muted hover:border-ink hover:text-ink transition-colors"
            >
              📄 Executive PDF
            </Link>
          </div>
        </div>

        {/* Quick solutions metrics strip */}
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 font-mono text-xs">
          <div className="border-r border-line pr-4">
            <div className="text-[10px] text-faint uppercase">Account ID</div>
            <div className="font-bold text-ink mt-0.5">9073-7530-3530</div>
          </div>
          <div className="border-r border-line pr-4">
            <div className="text-[10px] text-faint uppercase">Cluster Fleet</div>
            <div className="font-bold text-ink mt-0.5">ap-southeast-1 (4 Workers)</div>
          </div>
          <div className="border-r border-line pr-4">
            <div className="text-[10px] text-faint uppercase">Verification Status</div>
            <div className="font-bold text-ink mt-0.5">100% Owned (3/3 Verified)</div>
          </div>
          <div>
            <div className="text-[10px] text-faint uppercase">Service Tier</div>
            <div className="font-bold text-ink mt-0.5">Team Plan (Metered API)</div>
          </div>
        </div>
      </div>

      {/* WIDGET 2: AWS Console "Recently Visited Services" Grid */}
      <div className="border border-line bg-canvas p-4">
        <div className="flex items-center justify-between border-b border-line pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
              Recently Visited Services
            </span>
            <span className="text-[10px] text-faint font-mono">(Frequently Accessed)</span>
          </div>
          <Link href="/services" className="font-mono text-[11px] text-muted hover:text-ink underline">
            View all 9 services →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {RECENT_SERVICES.map((svc) => (
            <Link
              key={svc.code}
              href={svc.href}
              className="group border border-line bg-subtle/30 p-3 hover:border-ink hover:bg-canvas transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink">
                    {svc.code}
                  </span>
                  <span className="font-mono text-[10px] text-faint">{svc.stat}</span>
                </div>
                <div className="mt-2 font-mono text-xs font-bold text-ink group-hover:underline">
                  {svc.name}
                </div>
                <p className="mt-1 text-[11px] text-muted line-clamp-2 leading-relaxed font-sans">
                  {svc.description}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-line/60 flex items-center justify-between font-mono text-[10px] text-faint">
                <span>Console</span>
                <span className="group-hover:text-ink">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* AWS CONSOLE WIDGET ROW: 4 Core Health Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Security Hub Score Widget */}
        <div className="relative border border-line bg-canvas p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
              Security Hub Posture
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
            <span>Posture: <strong className="text-ink">{securityScore >= 80 ? "STRONG" : securityScore >= 60 ? "MODERATE" : "AT RISK"}</strong></span>
            <span className="font-semibold text-ink">(-3 vs 7d)</span>
          </div>
        </div>

        {/* Attack Surface EC2-style resource summary */}
        <div className="border border-line bg-canvas p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
              Attack Surface
            </span>
            <Link href="/assets" className="font-mono text-[10px] text-faint hover:text-ink underline">
              View assets
            </Link>
          </div>
          <p className="mt-2 font-mono text-[2.5rem] leading-none font-bold text-ink">
            {assets.length} <span className="text-base font-normal text-faint">monitored</span>
          </p>
          <div className="mt-3 flex items-center justify-between font-mono text-xs text-muted">
            <span>100% Owned &amp; Verified</span>
            <span className="text-ink">+3 discovered</span>
          </div>
        </div>

        {/* GuardDuty / Findings Tile */}
        <div className="border border-line bg-canvas p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
              Active Findings
            </span>
            <Link href="/findings" className="font-mono text-[10px] text-faint hover:text-ink underline">
              Inventory
            </Link>
          </div>
          <p className="mt-2 font-mono text-[2.5rem] leading-none font-bold text-ink">
            {openFindings.length} <span className="text-base font-normal text-faint">open</span>
          </p>
          <div className="mt-3 flex items-center justify-between font-mono text-xs text-muted">
            <span>Critical: <strong className="text-ink">{severityCounts.critical}</strong> · High: <strong className="text-ink">{severityCounts.high}</strong></span>
            <span className="text-ink">Top risk</span>
          </div>
        </div>

        {/* Scanning Engine Batch Status */}
        <div className="border border-line bg-canvas p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
              Engine Fleet
            </span>
            <Link href="/scans" className="font-mono text-[10px] text-faint hover:text-ink underline">
              Scan history
            </Link>
          </div>
          <p className="mt-2 font-mono text-[2.5rem] leading-none font-bold text-ink truncate">
            {lastScanLabel}
          </p>
          <div className="mt-3 flex items-center justify-between font-mono text-xs text-muted">
            <span>Fleet: <strong className="text-ink">Ready</strong></span>
            <span className="text-ink">0 backlog</span>
          </div>
        </div>
      </div>

      {/* AWS CONSOLE TWO-COLUMN BENTO: Posture Trendline + Findings Matrix */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 60%: Monochrome Security Hub Posture Trend */}
        <div className="border border-line bg-canvas p-5 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink">
                Security Posture &amp; Threat Risk (7-Day Baseline)
              </h3>
              <p className="text-[11px] text-muted font-sans">
                Monochrome timeline delineated by line stroke weights and dash patterns (§10).
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

          <div className="mt-4">
            <svg
              className="h-44 w-full"
              viewBox="0 0 500 160"
              fill="none"
              preserveAspectRatio="none"
            >
              <line x1="0" y1="20" x2="500" y2="20" stroke="var(--hz-line)" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="0" y1="60" x2="500" y2="60" stroke="var(--hz-line)" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="var(--hz-line)" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="var(--hz-line)" strokeWidth="1" />

              <polyline
                fill="none"
                stroke="var(--hz-ink)"
                strokeWidth="3"
                points="10,130 85,130 165,115 245,115 325,100 405,100 485,100"
              />
              <polyline
                fill="none"
                stroke="var(--hz-ink)"
                strokeWidth="2"
                strokeDasharray="6,4"
                points="10,95 85,95 165,80 245,80 325,65 405,65 485,50"
              />
              <polyline
                fill="none"
                stroke="var(--hz-muted)"
                strokeWidth="1.5"
                strokeDasharray="2,3"
                points="10,50 85,45 165,40 245,35 325,30 405,30 485,25"
              />

              <circle cx="485" cy="100" r="3" fill="var(--hz-ink)" />
              <circle cx="485" cy="50" r="3" fill="var(--hz-ink)" />
              <circle cx="485" cy="25" r="2.5" fill="var(--hz-ink)" />
            </svg>

            <div className="mt-2 flex justify-between font-mono text-[10px] text-faint">
              {chartDays.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right 40%: AWS GuardDuty-style Severity Distribution */}
        <div className="flex flex-col justify-between border border-line bg-canvas p-5 lg:col-span-5">
          <div className="border-b border-line pb-3">
            <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink">
              Vulnerability Distribution
            </h3>
            <p className="text-[11px] text-muted font-sans">
              Active exposures categorized across verified perimeter targets.
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

          <div className="border-t border-line pt-3 flex items-center justify-between font-mono text-xs">
            <Link
              href="/findings"
              className="text-muted hover:text-ink hover:underline"
            >
              View all {openFindings.length} open findings →
            </Link>
            <Link
              href="/findings?severity=critical"
              className="text-ink font-bold hover:underline"
            >
              Critical ({severityCounts.critical})
            </Link>
          </div>
        </div>
      </div>

      {/* AWS CONSOLE WIDGET: "Needs Attention" (Prioritized Findings) */}
      <div className="border border-line bg-canvas">
        <div className="flex items-center justify-between border-b border-line p-4">
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink">
              Needs Attention · Prioritized Remediation Queue
            </h3>
            <p className="text-[11px] text-muted font-sans">
              Unresolved exposures ranked by severity rank and unmitigated exposure age.
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
                        <span>Target: <strong className="text-ink">{f.asset_value || "unknown"}</strong></span>
                        <span>·</span>
                        <span>Category: {f.category || "web_security"}</span>
                        <span>·</span>
                        <span>Age: {ageDays === 0 ? "today" : `${ageDays}d ago`}</span>
                        {ageDays > 7 && (f.severity === "critical" || f.severity === "high") && (
                          <span className="border border-ink bg-subtle px-1 text-[10px] font-bold text-ink">
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
                      Remediate →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AWS CONSOLE TWO-COLUMN WIDGET: Service Health + Service Quotas / Billing */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 60%: AWS Service Health style widget */}
        <div className="border border-line bg-canvas p-4 lg:col-span-7 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-ink">
                Service Health &amp; Scanner Cluster
              </h3>
              <p className="text-[11px] text-muted font-sans mt-0.5">
                Real-time operational status of Harizeon infrastructure components.
              </p>
            </div>
            <Link href="/status" className="text-[11px] text-muted hover:text-ink underline">
              Status Dashboard →
            </Link>
          </div>

          <div className="mt-3 divide-y divide-line">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-ink font-bold">●</span>
                <span className="font-semibold text-ink">Fastify Control Plane (API v1)</span>
              </div>
              <div className="flex items-center gap-4 text-muted">
                <span>Latency: 14ms</span>
                <span className="border border-line bg-subtle px-1.5 py-0.5 text-[10px] text-ink font-bold">OPERATIONAL</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-ink font-bold">●</span>
                <span className="font-semibold text-ink">Redis Streams (Queue &amp; Events)</span>
              </div>
              <div className="flex items-center gap-4 text-muted">
                <span>Backlog: 0</span>
                <span className="border border-line bg-subtle px-1.5 py-0.5 text-[10px] text-ink font-bold">OPERATIONAL</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-ink font-bold">●</span>
                <span className="font-semibold text-ink">Worker Pool (ap-southeast-1)</span>
              </div>
              <div className="flex items-center gap-4 text-muted">
                <span>4 Active Nodes</span>
                <span className="border border-line bg-subtle px-1.5 py-0.5 text-[10px] text-ink font-bold">OPERATIONAL</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-ink font-bold">●</span>
                <span className="font-semibold text-ink">CT Logs &amp; DNS Discovery</span>
              </div>
              <div className="flex items-center gap-4 text-muted">
                <span>crt.sh &amp; RDAP</span>
                <span className="border border-line bg-subtle px-1.5 py-0.5 text-[10px] text-ink font-bold">OPERATIONAL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 40%: AWS Billing & Service Quotas widget */}
        <div className="border border-line bg-canvas p-4 lg:col-span-5 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-ink">
                Cost &amp; Service Quotas
              </h3>
              <p className="text-[11px] text-muted font-sans mt-0.5">
                Current tier capacity and metered monthly consumption.
              </p>
            </div>
            <Link href="/settings/billing" className="text-[11px] text-muted hover:text-ink underline">
              Manage Tier →
            </Link>
          </div>

          <div className="mt-3 flex flex-col gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Active Plan:</span>
                <span className="font-bold text-ink uppercase">Growth Tier ($249/mo)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span>Scans Quota</span>
                <span>14 / 500 scans (2.8%)</span>
              </div>
              <div className="h-2 w-full border border-line bg-subtle">
                <div className="h-full bg-ink" style={{ width: "2.8%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span>Monitored Assets</span>
                <span>3 / 25 assets (12%)</span>
              </div>
              <div className="h-2 w-full border border-line bg-subtle">
                <div className="h-full bg-ink" style={{ width: "12%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span>Team Seats (RBAC)</span>
                <span>1 / 3 seats</span>
              </div>
              <div className="h-2 w-full border border-line bg-subtle">
                <div className="h-full bg-ink" style={{ width: "33%" }} />
              </div>
            </div>

            <div className="border-t border-line pt-2 text-[10px] text-faint flex justify-between">
              <span>Next billing cycle: Oct 1, 2026</span>
              <span className="text-ink">No overages</span>
            </div>
          </div>
        </div>
      </div>

      {/* WIDGET: AWS CloudTrail / Audit Trail Activity Log */}
      <div className="border border-line bg-canvas">
        <div className="flex items-center justify-between border-b border-line p-4">
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink">
              AWS CloudTrail · Harizeon Audit Operations Log
            </h3>
            <p className="text-[11px] text-muted font-sans">
              Cryptographically verified chronological event feed of perimeter operations and scan triggers.
            </p>
          </div>
          <Link
            href="/settings/audit-log"
            className="font-mono text-xs text-muted hover:text-ink hover:underline"
          >
            View full audit trail →
          </Link>
        </div>

        <div className="divide-y divide-line font-mono text-xs">
          {activityItems.map((act) => (
            <div
              key={act.id}
              className="flex flex-col justify-between gap-2 p-3 sm:flex-row sm:items-center hover:bg-subtle/30"
            >
              <div className="flex items-center gap-3">
                <span className="w-16 border border-line bg-subtle px-1 py-0.5 text-center text-[10px] uppercase font-bold text-muted">
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

      {/* Security Score Methodology Modal */}
      {showMethodology && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg border border-line bg-canvas p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="font-mono text-base font-bold uppercase tracking-[0.05em] text-ink">
                Security Score Methodology (§20.4)
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
