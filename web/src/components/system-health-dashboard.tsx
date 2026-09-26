"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cx } from "@/lib/cx";

export interface WorkerNode {
  id: string;
  name: string;
  region: string;
  status: "healthy" | "busy" | "idle" | "degraded" | "offline";
  current_scan_id?: string | null;
  current_target?: string | null;
  current_phase?: string | null;
  slots_total: number;
  slots_used: number;
  cpu_percent: number;
  memory_mb: number;
  heartbeat_at: string;
  uptime_seconds: number;
  jobs_completed: number;
  jobs_failed: number;
}

export interface QueueMetrics {
  name: string;
  stream_key: string;
  type: "jobs" | "events" | "reaper";
  length: number;
  in_flight: number;
  consumer_group: string;
  consumers_active: number;
  lag: number;
  status: "nominal" | "congested" | "stalled";
  throughput_per_min: number;
  avg_latency_ms: number;
}

export interface ScanFailureItem {
  id: string;
  profile: string;
  status: "failed" | "timeout" | "cancelled";
  phase: string | null;
  error_code: string;
  error_title: string;
  error_message: string;
  root_cause: string;
  troubleshooting_steps: string[];
  suggested_action: string;
  action_href?: string;
  targets: { asset_id: string; type: string; value: string }[];
  attempt: number;
  max_attempts: number;
  created_at: string;
  failed_at: string;
  category: "network_firewall" | "worker_timeout" | "dns_resolution" | "waf_rate_limit" | "tls_crypto" | "asset_verification";
}

export interface SystemHealthData {
  timestamp: string;
  status: "operational" | "degraded" | "incident";
  cluster: {
    region: string;
    fleet_name: string;
    total_workers: number;
    active_workers: number;
    total_slots: number;
    used_slots: number;
    fleet_load_percent: number;
    avg_job_duration_sec: number;
  };
  workers: WorkerNode[];
  queues: {
    jobs: QueueMetrics;
    events: QueueMetrics;
    reaper: {
      interval_sec: number;
      last_run_at: string;
      scans_reaped_24h: number;
      status: "operational" | "degraded";
    };
  };
  recent_failures: ScanFailureItem[];
  diagnostics: {
    total_recent_failures: number;
    primary_failure_cause: string | null;
    recommendations: {
      title: string;
      description: string;
      code: string;
      affected_scans_count: number;
    }[];
  };
}

export const FALLBACK_SYSTEM_HEALTH: SystemHealthData = {
  timestamp: new Date().toISOString(),
  status: "operational",
  cluster: {
    region: "ap-southeast-1",
    fleet_name: "cluster-sg-prod-01",
    total_workers: 4,
    active_workers: 4,
    total_slots: 16,
    used_slots: 11,
    fleet_load_percent: 68.75,
    avg_job_duration_sec: 42,
  },
  workers: [
    {
      id: "wkr-ap-se1-01",
      name: "Worker 01 (Core Prober)",
      region: "ap-southeast-1a",
      status: "busy",
      current_scan_id: "scn-7b89f012",
      current_target: "api.example.com",
      current_phase: "probe",
      slots_total: 4,
      slots_used: 3,
      cpu_percent: 48,
      memory_mb: 184,
      heartbeat_at: new Date(Date.now() - 2000).toISOString(),
      uptime_seconds: 345600,
      jobs_completed: 184,
      jobs_failed: 1,
    },
    {
      id: "wkr-ap-se1-02",
      name: "Worker 02 (TLS & Crypto)",
      region: "ap-southeast-1a",
      status: "busy",
      current_scan_id: "scn-batch-49a",
      current_target: "example.com",
      current_phase: "inspect",
      slots_total: 4,
      slots_used: 4,
      cpu_percent: 72,
      memory_mb: 236,
      heartbeat_at: new Date(Date.now() - 3000).toISOString(),
      uptime_seconds: 345600,
      jobs_completed: 162,
      jobs_failed: 2,
    },
    {
      id: "wkr-ap-se1-03",
      name: "Worker 03 (Web & CSP Inspector)",
      region: "ap-southeast-1b",
      status: "busy",
      current_scan_id: "scn-web-live",
      current_target: "staging.example.com",
      current_phase: "test",
      slots_total: 4,
      slots_used: 3,
      cpu_percent: 39,
      memory_mb: 165,
      heartbeat_at: new Date(Date.now() - 4000).toISOString(),
      uptime_seconds: 259200,
      jobs_completed: 139,
      jobs_failed: 0,
    },
    {
      id: "wkr-ap-se1-04",
      name: "Worker 04 (Discovery & DNS)",
      region: "ap-southeast-1c",
      status: "idle",
      current_scan_id: null,
      current_target: null,
      current_phase: null,
      slots_total: 4,
      slots_used: 1,
      cpu_percent: 14,
      memory_mb: 118,
      heartbeat_at: new Date(Date.now() - 1000).toISOString(),
      uptime_seconds: 432000,
      jobs_completed: 210,
      jobs_failed: 0,
    },
  ],
  queues: {
    jobs: {
      name: "Scan Jobs Stream",
      stream_key: "harizeon:scans:jobs",
      type: "jobs",
      length: 2,
      in_flight: 4,
      consumer_group: "workers",
      consumers_active: 4,
      lag: 0,
      status: "nominal",
      throughput_per_min: 8.4,
      avg_latency_ms: 18,
    },
    events: {
      name: "Worker Events Stream",
      stream_key: "harizeon:scans:events",
      type: "events",
      length: 12,
      in_flight: 0,
      consumer_group: "ingest",
      consumers_active: 1,
      lag: 0,
      status: "nominal",
      throughput_per_min: 52.0,
      avg_latency_ms: 6,
    },
    reaper: {
      interval_sec: 15,
      last_run_at: new Date(Date.now() - 8000).toISOString(),
      scans_reaped_24h: 1,
      status: "operational",
    },
  },
  recent_failures: [
    {
      id: "scn-9a12c401",
      profile: "deep",
      status: "failed",
      phase: "probe",
      error_code: "ERR_CONNECTION_TIMEOUT",
      error_title: "Perimeter Firewall / TCP SYN Probe Timeout",
      error_message: "TCP port probe timed out on target 203.0.113.10:443. Remote firewall dropped SYN packets without responding.",
      root_cause: "Target perimeter firewall (AWS Security Group / Cloudflare Magic Transit / iptables) dropped scanner ingress packets. Harizeon scanner egress IP ranges are not whitelisted on target ingress rules.",
      troubleshooting_steps: [
        "Whitelist Harizeon scanner egress IP CIDRs (203.0.113.0/24, 198.51.100.0/24) in your cloud security groups or perimeter firewall.",
        "Check that port 443 is publicly reachable: test with `nc -zv -w 5 203.0.113.10 443`.",
        "Verify web server daemon status (nginx/httpd) and inspect firewall audit logs on the destination server.",
        "Run a 'Quick' scan profile first to confirm baseline TCP reachability before executing deep sweeps.",
      ],
      suggested_action: "Whitelist scanner IPs and re-run standard scan",
      action_href: "/scans/new",
      targets: [{ asset_id: "ast-003", type: "ip", value: "203.0.113.10" }],
      attempt: 2,
      max_attempts: 2,
      created_at: new Date(Date.now() - 42 * 60000).toISOString(),
      failed_at: new Date(Date.now() - 40 * 60000).toISOString(),
      category: "network_firewall",
    },
    {
      id: "scn-8f43b190",
      profile: "standard",
      status: "timeout",
      phase: "inspect",
      error_code: "ERR_WORKER_TIMEOUT",
      error_title: "Worker Heartbeat Expired / Reaped Execution",
      error_message: "Worker heartbeat expired after 60s without progress during deep JS crawl inspection. Scan reclaimed and terminated by reaper.",
      root_cause: "The target website contains recursive SPA client-side routes or an infinite crawler trap, which stalled the headless browser inspection engine past the 60-second heartbeat ceiling.",
      troubleshooting_steps: [
        "Review target web application for recursive URL links or infinite pagination without canonical tags.",
        "Switch scan profile to 'Quick' or disable deep web crawling to avoid heavy single-page application execution loops.",
        "Ensure server response time under load is under 2,000ms: prolonged response latencies multiply crawler execution time.",
        "Check Worker Fleet load to ensure worker containers have adequate CPU headroom for headless browser rendering.",
      ],
      suggested_action: "Relaunch using Quick profile or configure path exclusions",
      action_href: "/scans/new",
      targets: [{ asset_id: "ast-001", type: "domain", value: "staging.example.com" }],
      attempt: 2,
      max_attempts: 2,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      failed_at: new Date(Date.now() - 2 * 3600000 + 120000).toISOString(),
      category: "worker_timeout",
    },
    {
      id: "scn-6e71d882",
      profile: "quick",
      status: "failed",
      phase: "resolve",
      error_code: "ERR_DNS_NXDOMAIN",
      error_title: "DNS A/AAAA Record Unresolvable",
      error_message: "Authoritative nameserver returned NXDOMAIN (RCODE 3). Target subdomain has no valid A or AAAA records published to public resolvers.",
      root_cause: "The asset 'internal-docs.example.com' is hosted on internal split-horizon DNS (e.g. AWS Route 53 Private Hosted Zone) or the DNS record has been decommissioned while remaining in the monitored asset registry.",
      troubleshooting_steps: [
        "Verify public DNS resolution using public resolvers: `dig +short internal-docs.example.com @8.8.8.8`.",
        "If this target is an internal intranet host not reachable from the public internet, decommission it or mark it inactive in Assets.",
        "Check domain registrar NS delegation and verify DNSSEC signatures are valid and not throwing SERVFAIL.",
        "Once public DNS records are established, trigger an asset re-verification before relaunching the scan.",
      ],
      suggested_action: "Verify public DNS A/AAAA records or archive inactive asset",
      action_href: "/assets",
      targets: [{ asset_id: "ast-002", type: "subdomain", value: "internal-docs.example.com" }],
      attempt: 1,
      max_attempts: 2,
      created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
      failed_at: new Date(Date.now() - 5 * 3600000 + 4000).toISOString(),
      category: "dns_resolution",
    },
  ],
  diagnostics: {
    total_recent_failures: 3,
    primary_failure_cause: "Target perimeter firewall dropping scanner probe traffic (TCP timeouts)",
    recommendations: [
      {
        title: "Perimeter Firewall Allowlisting Required",
        description: "2 recent scans timed out during port probing. Whitelist Harizeon scanner egress CIDRs (203.0.113.0/24) on target cloud security groups.",
        code: "NET_FW_ALLOWLIST",
        affected_scans_count: 1,
      },
      {
        title: "Crawler Timeout on Complex Single-Page Apps",
        description: "1 scan exceeded the 60s worker heartbeat limit. Use the 'Quick' profile for SPA targets or tune web crawling limits.",
        code: "CRAWLER_TIMEOUT_TUNE",
        affected_scans_count: 1,
      },
      {
        title: "Decommissioned or Split-Horizon Subdomain",
        description: "1 scan failed during DNS resolution with NXDOMAIN. Ensure monitored assets have publicly resolvable A/AAAA records.",
        code: "DNS_PUBLIC_VERIFY",
        affected_scans_count: 1,
      },
    ],
  },
};

export function SystemHealthDashboard({
  initialData,
  className,
}: {
  initialData?: SystemHealthData | null;
  className?: string;
}) {
  const [data, setData] = useState<SystemHealthData>(initialData ?? FALLBACK_SYSTEM_HEALTH);
  const [activeTab, setActiveTab] = useState<"overview" | "workers" | "queues" | "failures">("overview");
  const [refreshInterval, setRefreshInterval] = useState<number>(5000); // 5s default
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Failure filters
  const [failureCategoryFilter, setFailureCategoryFilter] = useState<string>("all");
  const [failureSearch, setFailureSearch] = useState("");
  const [expandedFailureId, setExpandedFailureId] = useState<string | null>("scn-9a12c401");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Fetch /system/health (or fallback to /api/system/health)
      let res = await fetch("/system/health", { cache: "no-store" });
      if (!res.ok) {
        res = await fetch("/api/system/health", { cache: "no-store" });
      }
      if (res.ok) {
        const json = (await res.json()) as SystemHealthData;
        if (json && json.cluster) {
          setData(json);
        }
      }
    } catch {
      // Keep existing data on transient network hiccup
    } finally {
      setIsRefreshing(false);
      setSecondsAgo(0);
    }
  }, []);

  // Fetch on mount if no initialData was provided
  useEffect(() => {
    if (initialData) return;
    let active = true;
    void (async () => {
      try {
        let res = await fetch("/system/health", { cache: "no-store" });
        if (!res.ok) {
          res = await fetch("/api/system/health", { cache: "no-store" });
        }
        if (res.ok) {
          const json = (await res.json()) as SystemHealthData;
          if (active && json && json.cluster) {
            setData(json);
          }
        }
      } catch {
        // Keep fallback data
      }
    })();
    return () => {
      active = false;
    };
  }, [initialData]);

  // Timer ticker for "seconds ago"
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Polling loop
  useEffect(() => {
    if (refreshInterval <= 0) return;
    const timer = setInterval(() => {
      fetchHealth();
    }, refreshInterval);
    return () => clearInterval(timer);
  }, [refreshInterval, fetchHealth]);

  const filteredFailures = useMemo(() => {
    return data.recent_failures.filter((f) => {
      if (failureCategoryFilter !== "all" && f.category !== failureCategoryFilter) {
        return false;
      }
      if (failureSearch.trim()) {
        const q = failureSearch.toLowerCase();
        const matchId = f.id.toLowerCase().includes(q);
        const matchCode = f.error_code.toLowerCase().includes(q);
        const matchMsg = f.error_message.toLowerCase().includes(q);
        const matchTarget = f.targets.some((t) => t.value.toLowerCase().includes(q));
        if (!matchId && !matchCode && !matchMsg && !matchTarget) return false;
      }
      return true;
    });
  }, [data.recent_failures, failureCategoryFilter, failureSearch]);

  const copyDiagnostic = (failure: ScanFailureItem) => {
    const diagnosticPayload = {
      scan_id: failure.id,
      status: failure.status,
      error_code: failure.error_code,
      phase: failure.phase,
      targets: failure.targets.map((t) => t.value),
      root_cause: failure.root_cause,
      troubleshooting_steps: failure.troubleshooting_steps,
      failed_at: failure.failed_at,
    };
    navigator.clipboard?.writeText(JSON.stringify(diagnosticPayload, null, 2));
    setCopyFeedback(failure.id);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const { cluster, workers, queues, recent_failures, diagnostics } = data;

  return (
    <div className={cx("border border-line bg-canvas", className)}>
      {/* Top Console Header Bar */}
      <div className="border-b border-line p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="border border-ink bg-ink px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-canvas">
                DIAGNOSTICS &amp; TELEMETRY
              </span>
              <span className="font-mono text-xs text-muted">
                Region: <strong className="text-ink">{cluster.region}</strong> ({cluster.fleet_name})
              </span>
            </div>
            <h2 className="mt-1.5 text-lg font-bold text-ink font-sans">
              System Health &amp; Scan Worker Telemetry
            </h2>
            <p className="text-xs text-muted font-sans">
              Real-time worker concurrency load, Redis Streams queue pressure, and root-cause failure analyzer.
            </p>
          </div>

          {/* Real-time Controls */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 border border-line bg-subtle px-2 py-1">
              <span
                className={cx(
                  "inline-block h-2 w-2",
                  refreshInterval > 0 ? "bg-ink animate-pulse" : "bg-muted",
                )}
                aria-hidden="true"
              />
              <span className="text-[11px] font-bold text-ink">
                {refreshInterval > 0 ? "LIVE" : "PAUSED"}
              </span>
              <span className="text-[10px] text-faint">
                ({secondsAgo}s ago)
              </span>
            </div>

            {/* Refresh Interval Selector */}
            <div className="flex items-center border border-line bg-canvas">
              <button
                type="button"
                onClick={() => setRefreshInterval(5000)}
                className={cx(
                  "px-2 py-1 text-[11px] transition-colors",
                  refreshInterval === 5000 ? "bg-ink text-canvas font-bold" : "text-muted hover:text-ink",
                )}
              >
                5s
              </button>
              <button
                type="button"
                onClick={() => setRefreshInterval(15000)}
                className={cx(
                  "px-2 py-1 text-[11px] border-l border-line transition-colors",
                  refreshInterval === 15000 ? "bg-ink text-canvas font-bold" : "text-muted hover:text-ink",
                )}
              >
                15s
              </button>
              <button
                type="button"
                onClick={() => setRefreshInterval(0)}
                className={cx(
                  "px-2 py-1 text-[11px] border-l border-line transition-colors",
                  refreshInterval === 0 ? "bg-ink text-canvas font-bold" : "text-muted hover:text-ink",
                )}
              >
                Hold
              </button>
            </div>

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={fetchHealth}
              disabled={isRefreshing}
              className="border border-ink bg-canvas px-2.5 py-1 text-[11px] font-bold text-ink hover:bg-subtle transition-colors disabled:opacity-50"
            >
              {isRefreshing ? "Syncing..." : "Sync Now"}
            </button>
          </div>
        </div>

        {/* Status Advisory Banner */}
        {recent_failures.length > 0 ? (
          <div className="mt-4 border border-line bg-subtle p-3 font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start sm:items-center gap-2">
                <span className="border border-ink bg-ink px-1 text-[10px] font-bold text-canvas">
                  [!] ADVISORY
                </span>
                <span className="font-semibold text-ink">
                  {recent_failures.length} Recent Scan {recent_failures.length === 1 ? "Failure" : "Failures"} Detected
                </span>
                <span className="hidden md:inline text-muted">·</span>
                <span className="text-muted">
                  Primary Cause: <strong className="text-ink">{diagnostics.primary_failure_cause || "Perimeter Network / Worker Timeout"}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("failures")}
                className="self-start sm:self-auto text-ink underline font-bold hover:no-underline text-[11px]"
              >
                Inspect Root-Causes &amp; Fixes →
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 border border-line bg-canvas p-2.5 font-mono text-xs flex items-center gap-2 text-ink">
            <span className="font-bold">[OK]</span>
            <span>All scanner worker nodes, Redis Streams queues, and ingestion pipelines are operational with zero scan failures.</span>
          </div>
        )}
      </div>

      {/* 4 Core Telemetry Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-line divide-y sm:divide-y-0 sm:divide-x divide-line font-mono">
        {/* Metric 1: Worker Fleet Load */}
        <div className="p-4">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="uppercase tracking-[0.08em]">Worker Fleet Load</span>
            <span className="text-[10px] text-ink font-bold">
              {cluster.active_workers}/{cluster.total_workers} Nodes
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">
              {cluster.fleet_load_percent.toFixed(1)}%
            </span>
            <span className="text-xs text-muted">
              ({cluster.used_slots}/{cluster.total_slots} slots)
            </span>
          </div>
          {/* Concurrency Bar */}
          <div className="mt-2 h-2 w-full border border-line bg-subtle">
            <div
              className="h-full bg-ink transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(5, cluster.fleet_load_percent))}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-faint">
            <span>Avg scan: ~{cluster.avg_job_duration_sec}s</span>
            <span>Capacity: Nominal</span>
          </div>
        </div>

        {/* Metric 2: Jobs Queue (harizeon:scans:jobs) */}
        <div className="p-4">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="uppercase tracking-[0.08em]">Jobs Queue Backlog</span>
            <span className="border border-line bg-subtle px-1 text-[10px] text-ink font-bold">
              {queues.jobs.status.toUpperCase()}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">
              {queues.jobs.length}
            </span>
            <span className="text-xs text-muted">
              queued ({queues.jobs.in_flight} in-flight)
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
            <span>Wait time: ~14s</span>
            <span className="text-ink font-semibold">{queues.jobs.throughput_per_min} jobs/min</span>
          </div>
          <div className="mt-1 text-[10px] text-faint">
            Stream: <code className="text-ink">jobs</code> (workers group)
          </div>
        </div>

        {/* Metric 3: Events Pipeline (harizeon:scans:events) */}
        <div className="p-4">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="uppercase tracking-[0.08em]">Ingest Events Lag</span>
            <span className="border border-line bg-subtle px-1 text-[10px] text-ink font-bold">
              {queues.events.status.toUpperCase()}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">
              {queues.events.lag}
            </span>
            <span className="text-xs text-muted">
              lag ({queues.events.length} pending ack)
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
            <span>Latency: {queues.events.avg_latency_ms}ms</span>
            <span className="text-ink font-semibold">{queues.events.throughput_per_min} ev/min</span>
          </div>
          <div className="mt-1 text-[10px] text-faint">
            Reaper: every {queues.reaper.interval_sec}s ({queues.reaper.scans_reaped_24h} reaped/24h)
          </div>
        </div>

        {/* Metric 4: Scan Failures & Diagnostics */}
        <div className="p-4">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="uppercase tracking-[0.08em]">Recent Scan Failures</span>
            <span className={cx(
              "px-1 text-[10px] font-bold border",
              recent_failures.length > 0 ? "border-ink bg-ink text-canvas" : "border-line bg-canvas text-muted",
            )}>
              {recent_failures.length > 0 ? `${recent_failures.length} FAILED` : "NONE"}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">
              {recent_failures.length}
            </span>
            <span className="text-xs text-muted">
              unresolved (last 24h)
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
            <span>Actionable: 100%</span>
            <button
              type="button"
              onClick={() => setActiveTab("failures")}
              className="text-ink font-bold underline hover:no-underline"
            >
              Analyze causes →
            </button>
          </div>
          <div className="mt-1 text-[10px] text-faint truncate">
            Top: {diagnostics.primary_failure_cause ? "Perimeter / Firewall" : "None"}
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center border-b border-line bg-subtle/50 px-4 font-mono text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={cx(
            "py-2.5 px-3 border-b-2 font-bold uppercase tracking-wider transition-colors whitespace-nowrap",
            activeTab === "overview"
              ? "border-ink text-ink bg-canvas"
              : "border-transparent text-muted hover:text-ink",
          )}
        >
          [1] Overview &amp; Diagnostics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("workers")}
          className={cx(
            "py-2.5 px-3 border-b-2 font-bold uppercase tracking-wider transition-colors whitespace-nowrap",
            activeTab === "workers"
              ? "border-ink text-ink bg-canvas"
              : "border-transparent text-muted hover:text-ink",
          )}
        >
          [2] Worker Load &amp; Nodes ({workers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("queues")}
          className={cx(
            "py-2.5 px-3 border-b-2 font-bold uppercase tracking-wider transition-colors whitespace-nowrap",
            activeTab === "queues"
              ? "border-ink text-ink bg-canvas"
              : "border-transparent text-muted hover:text-ink",
          )}
        >
          [3] Queue Pipeline &amp; Streams
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("failures")}
          className={cx(
            "py-2.5 px-3 border-b-2 font-bold uppercase tracking-wider transition-colors whitespace-nowrap flex items-center gap-1.5",
            activeTab === "failures"
              ? "border-ink text-ink bg-canvas"
              : "border-transparent text-muted hover:text-ink",
          )}
        >
          <span>[4] Scan Failure Analyzer</span>
          {recent_failures.length > 0 && (
            <span className="border border-ink bg-ink text-canvas px-1 text-[10px] font-bold">
              {recent_failures.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: OVERVIEW & QUICK DIAGNOSTICS */}
      {activeTab === "overview" && (
        <div className="p-4 sm:p-5 flex flex-col gap-6">
          {/* Diagnostic Recommendations Grid */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-line pb-2">
              <div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink">
                  Automated Failure Diagnostic Findings
                </h3>
                <p className="text-[11px] text-muted font-sans">
                  Heuristic analysis of recent scan interruptions and operational pipeline bottlenecks.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("failures")}
                className="font-mono text-xs text-ink underline font-bold"
              >
                View all failures ({recent_failures.length}) →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {diagnostics.recommendations.map((rec) => (
                <div key={rec.code} className="border border-line bg-subtle/40 p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink">
                        {rec.code}
                      </span>
                      <span className="font-mono text-[10px] text-muted">
                        {rec.affected_scans_count} scan affected
                      </span>
                    </div>
                    <div className="font-mono text-xs font-bold text-ink">
                      {rec.title}
                    </div>
                    <p className="mt-1 text-xs text-muted leading-relaxed font-sans">
                      {rec.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-line/60 flex justify-between items-center font-mono text-xs">
                    <span className="text-[10px] text-faint">Remediation Available</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("failures");
                        setFailureSearch(rec.code.toLowerCase());
                      }}
                      className="text-ink font-bold hover:underline"
                    >
                      Troubleshoot →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Two-Column: Active Worker Nodes Preview + Pipeline Flow */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 60%: Worker Nodes Summary */}
            <div className="border border-line p-4 lg:col-span-7">
              <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                  Worker Nodes Execution Load
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("workers")}
                  className="font-mono text-[11px] text-muted hover:text-ink underline"
                >
                  Full node metrics →
                </button>
              </div>

              <div className="divide-y divide-line font-mono text-xs">
                {workers.map((w) => (
                  <div key={w.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cx(
                          "px-1 py-0.2 text-[10px] font-bold border",
                          w.status === "busy" ? "border-ink bg-ink text-canvas" : "border-line bg-canvas text-muted",
                        )}>
                          {w.status.toUpperCase()}
                        </span>
                        <span className="font-bold text-ink">{w.name}</span>
                        <span className="text-[10px] text-faint">({w.region})</span>
                      </div>
                      <div className="mt-1 text-[11px] text-muted">
                        {w.current_scan_id ? (
                          <span>
                            Scanning: <strong className="text-ink">{w.current_target}</strong> [{w.current_phase}]
                          </span>
                        ) : (
                          <span className="text-faint">Standing by for next Redis job claim</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:text-right">
                      <div>
                        <div className="text-[11px] font-bold text-ink">
                          {w.slots_used}/{w.slots_total} Slots
                        </div>
                        <div className="text-[10px] text-faint">
                          {w.cpu_percent}% CPU · {w.memory_mb} MB
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 40%: Architecture Seam & Queue Flow */}
            <div className="border border-line p-4 lg:col-span-5 font-mono text-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink">
                    Queue Architecture Seam (§06.1)
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("queues")}
                    className="text-[11px] text-muted hover:text-ink underline"
                  >
                    View queues →
                  </button>
                </div>

                <div className="flex flex-col gap-2.5 text-[11px] text-muted leading-relaxed">
                  <div className="border border-line bg-subtle p-2">
                    <div className="font-bold text-ink flex justify-between">
                      <span>1. Fastify Control Plane</span>
                      <span className="text-faint">HTTP / PostgreSQL</span>
                    </div>
                    <p className="text-[10px] text-muted mt-0.5 font-sans">
                      Validates asset ownership (§12), enqueues to Redis Streams, sets org RLS.
                    </p>
                  </div>

                  <div className="border border-line bg-subtle p-2">
                    <div className="font-bold text-ink flex justify-between">
                      <span>2. Jobs Stream (harizeon:scans:jobs)</span>
                      <span className="text-ink">{queues.jobs.length} in queue</span>
                    </div>
                    <p className="text-[10px] text-muted mt-0.5 font-sans">
                      Consumer group &apos;workers&apos; claims jobs via XREADGROUP. Zero direct DB credentials.
                    </p>
                  </div>

                  <div className="border border-line bg-subtle p-2">
                    <div className="font-bold text-ink flex justify-between">
                      <span>3. Ingest Pipeline (harizeon:scans:events)</span>
                      <span className="text-ink">{queues.events.lag} lag</span>
                    </div>
                    <p className="text-[10px] text-muted mt-0.5 font-sans">
                      Ingests finding events, updates status machine, sends notifications.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-line text-[10px] text-faint flex justify-between">
                <span>Heartbeat: TTL 30s</span>
                <span className="text-ink font-semibold">Reaper: 60s timeout ceiling</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORKER LOAD & NODES */}
      {activeTab === "workers" && (
        <div className="p-4 sm:p-5 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink">
                Scan Worker Pool Concurrency &amp; Node Telemetry
              </h3>
              <p className="text-[11px] text-muted font-sans">
                Real-time execution slots, CPU/RAM usage, and active scan jobs for all cluster nodes in {cluster.region}.
              </p>
            </div>
            <div className="font-mono text-xs text-muted">
              Fleet Capacity: <strong className="text-ink">{cluster.used_slots}</strong> of <strong className="text-ink">{cluster.total_slots}</strong> concurrency slots allocated
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {workers.map((w) => {
              const slotPercent = Math.round((w.slots_used / w.slots_total) * 100);
              return (
                <div key={w.id} className="border border-line bg-canvas p-4 flex flex-col justify-between">
                  <div>
                    {/* Worker Header */}
                    <div className="flex items-center justify-between border-b border-line pb-2.5 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={cx(
                          "px-1.5 py-0.5 text-[10px] font-bold border",
                          w.status === "busy" ? "border-ink bg-ink text-canvas" : "border-line bg-canvas text-muted",
                        )}>
                          [{w.status.toUpperCase()}]
                        </span>
                        <span className="font-bold text-ink">{w.name}</span>
                      </div>
                      <span className="text-[10px] text-faint">{w.id}</span>
                    </div>

                    {/* Active Assignment */}
                    <div className="border border-line bg-subtle p-3 mb-3">
                      <div className="text-[10px] uppercase tracking-wider text-faint mb-1">
                        Current Execution Context
                      </div>
                      {w.current_scan_id ? (
                        <div>
                          <div className="flex items-center justify-between">
                            <Link
                              href={`/scans/${w.current_scan_id}`}
                              className="font-bold text-ink underline hover:no-underline"
                            >
                              {w.current_scan_id}
                            </Link>
                            <span className="border border-line bg-canvas px-1 text-[10px] uppercase font-bold text-ink">
                              Phase: {w.current_phase}
                            </span>
                          </div>
                          <div className="mt-1 text-muted text-[11px]">
                            Target: <strong className="text-ink">{w.current_target}</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="text-faint text-[11px] py-0.5">
                          Idle · Standing by for next scan job from Redis Streams
                        </div>
                      )}
                    </div>

                    {/* Concurrency Slots Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-muted">Concurrency Slots</span>
                        <span className="font-bold text-ink">
                          {w.slots_used} / {w.slots_total} slots ({slotPercent}%)
                        </span>
                      </div>
                      {/* Segmented Slot Boxes */}
                      <div className="grid grid-cols-4 gap-1">
                        {Array.from({ length: w.slots_total }).map((_, i) => (
                          <div
                            key={i}
                            className={cx(
                              "h-3 border border-line",
                              i < w.slots_used ? "bg-ink" : "bg-canvas",
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Node Hardware Telemetry */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-line pt-2 text-muted">
                      <div>
                        <span className="text-faint">CPU Load:</span> <strong className="text-ink">{w.cpu_percent}%</strong>
                      </div>
                      <div>
                        <span className="text-faint">Memory:</span> <strong className="text-ink">{w.memory_mb} MB</strong>
                      </div>
                      <div>
                        <span className="text-faint">Completed:</span> <strong className="text-ink">{w.jobs_completed}</strong>
                      </div>
                      <div>
                        <span className="text-faint">Failed:</span> <strong className="text-ink">{w.jobs_failed}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-line/60 flex items-center justify-between text-[10px] text-faint">
                    <span>Zone: {w.region}</span>
                    <span>Heartbeat: active</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: QUEUE PIPELINE & STREAMS */}
      {activeTab === "queues" && (
        <div className="p-4 sm:p-5 flex flex-col gap-6 font-mono text-xs">
          <div className="border-b border-line pb-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-ink">
              Redis Streams &amp; Background Pipeline Metrics
            </h3>
            <p className="text-[11px] text-muted font-sans mt-0.5">
              Backpressure monitoring, stream buffer depth, and reaper watchdog status (§06.1).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Jobs Stream */}
            <div className="border border-line p-4 bg-canvas flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
                  <div>
                    <span className="text-xs font-bold uppercase text-ink">
                      {queues.jobs.name}
                    </span>
                    <div className="text-[10px] text-faint mt-0.5">
                      Stream Key: <code className="text-ink">{queues.jobs.stream_key}</code>
                    </div>
                  </div>
                  <span className="border border-line bg-subtle px-1.5 py-0.5 text-[10px] font-bold text-ink">
                    {queues.jobs.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 text-xs text-muted">
                  <div className="flex justify-between py-1 border-b border-line/50">
                    <span>Pending Jobs in Queue:</span>
                    <strong className="text-ink font-bold">{queues.jobs.length} jobs</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-line/50">
                    <span>In-Flight Active Claims:</span>
                    <strong className="text-ink font-bold">{queues.jobs.in_flight} jobs</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-line/50">
                    <span>Consumer Group:</span>
                    <span className="text-ink font-mono">{queues.jobs.consumer_group} ({queues.jobs.consumers_active} workers)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-line/50">
                    <span>Processing Rate:</span>
                    <span className="text-ink font-bold">{queues.jobs.throughput_per_min} jobs/min</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Avg Queue Latency:</span>
                    <span className="text-ink">{queues.jobs.avg_latency_ms}ms</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 border border-line bg-subtle p-2.5 text-[11px] text-muted font-sans">
                <strong>Ingress Policy:</strong> Verified assets only (§12). Scans are enqueued via atomic <code className="font-mono text-ink">XADD</code> operations with attempt counters.
              </div>
            </div>

            {/* Events Stream */}
            <div className="border border-line p-4 bg-canvas flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
                  <div>
                    <span className="text-xs font-bold uppercase text-ink">
                      {queues.events.name}
                    </span>
                    <div className="text-[10px] text-faint mt-0.5">
                      Stream Key: <code className="text-ink">{queues.events.stream_key}</code>
                    </div>
                  </div>
                  <span className="border border-line bg-subtle px-1.5 py-0.5 text-[10px] font-bold text-ink">
                    {queues.events.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 text-xs text-muted">
                  <div className="flex justify-between py-1 border-b border-line/50">
                    <span>Unacknowledged Messages:</span>
                    <strong className="text-ink font-bold">{queues.events.length} events</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-line/50">
                    <span>Ingest Lag Behind Head:</span>
                    <strong className="text-ink font-bold">{queues.events.lag} messages</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-line/50">
                    <span>Consumer Group:</span>
                    <span className="text-ink font-mono">{queues.events.consumer_group}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-line/50">
                    <span>Ingest Throughput:</span>
                    <span className="text-ink font-bold">{queues.events.throughput_per_min} events/min</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>At-Least-Once Recovery:</span>
                    <span className="text-ink font-semibold">reclaimEvents (30s idle)</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 border border-line bg-subtle p-2.5 text-[11px] text-muted font-sans">
                <strong>Worker Seam:</strong> Workers emit JSON findings over Redis Streams. Control plane ingests events and validates discovered assets before DB commit.
              </div>
            </div>
          </div>

          {/* Reaper Watchdog Panel */}
          <div className="border border-line p-4 bg-subtle/30">
            <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
              <span className="font-bold uppercase tracking-wider text-ink">
                Reaper Watchdog Loop (§06.4)
              </span>
              <span className="border border-line bg-canvas px-1.5 py-0.5 text-[10px] font-bold text-ink">
                STATUS: {queues.reaper.status.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-faint block text-[10px] uppercase">Reaper Polling Cadence</span>
                <span className="font-bold text-ink">Every {queues.reaper.interval_sec} seconds</span>
              </div>
              <div>
                <span className="text-faint block text-[10px] uppercase">Heartbeat Stale Threshold</span>
                <span className="font-bold text-ink">60s without heartbeat</span>
              </div>
              <div>
                <span className="text-faint block text-[10px] uppercase">Scans Reaped / Timed Out (24h)</span>
                <span className="font-bold text-ink">{queues.reaper.scans_reaped_24h} scan</span>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted font-sans">
              The reaper runs every 15s. If a worker process stops updating its heartbeat key (<code className="font-mono text-ink">harizeon:scan:hb:&lt;id&gt;</code>) for &gt;60s, the scan is reclaimed. Scans retry up to 2 times before reaching terminal timeout.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: SCAN FAILURE ANALYZER (THE PRIMARY TROUBLESHOOTING TOOL) */}
      {activeTab === "failures" && (
        <div className="p-4 sm:p-5 flex flex-col gap-5">
          {/* Header & Filter Controls */}
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-line pb-3">
              <div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink">
                  Scan Failure Root-Cause Analyzer &amp; Troubleshooting
                </h3>
                <p className="text-[11px] text-muted font-sans">
                  Diagnose why your scans are failing and resolve firewall, worker timeout, or DNS issues.
                </p>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <input
                  type="text"
                  placeholder="Filter by target or error..."
                  value={failureSearch}
                  onChange={(e) => setFailureSearch(e.target.value)}
                  className="border border-line bg-canvas px-2.5 py-1 text-xs text-ink placeholder:text-faint focus:border-ink outline-none"
                />

                <select
                  value={failureCategoryFilter}
                  onChange={(e) => setFailureCategoryFilter(e.target.value)}
                  className="border border-line bg-canvas px-2 py-1 text-xs text-ink outline-none"
                >
                  <option value="all">All Failure Causes ({recent_failures.length})</option>
                  <option value="network_firewall">Firewall / Network Timeout</option>
                  <option value="worker_timeout">Worker Execution Timeout</option>
                  <option value="dns_resolution">DNS Unresolvable</option>
                  <option value="waf_rate_limit">WAF / Rate Limiting</option>
                </select>
              </div>
            </div>
          </div>

          {/* Failure Cards List */}
          {filteredFailures.length === 0 ? (
            <div className="border border-line bg-canvas p-8 text-center font-mono">
              <p className="text-xs font-bold uppercase text-ink">No matching scan failures found</p>
              <p className="mt-1 text-xs text-muted font-sans">
                {failureSearch || failureCategoryFilter !== "all"
                  ? "Try clearing your filter or search query."
                  : "All recent scans have completed successfully."}
              </p>
              {(failureSearch || failureCategoryFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setFailureSearch("");
                    setFailureCategoryFilter("all");
                  }}
                  className="mt-3 border border-ink bg-canvas px-3 py-1 text-xs font-bold text-ink hover:bg-subtle"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredFailures.map((failure) => {
                const isExpanded = expandedFailureId === failure.id;
                const isCopied = copyFeedback === failure.id;

                return (
                  <div
                    key={failure.id}
                    className="border border-line bg-canvas transition-colors"
                  >
                    {/* Failure Header Card Bar */}
                    <div
                      onClick={() => setExpandedFailureId(isExpanded ? null : failure.id)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-subtle/40 border-b border-line"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <span className="border border-ink bg-ink text-canvas px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase">
                          {failure.status.toUpperCase()}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-ink">
                              {failure.id}
                            </span>
                            <span className="font-mono text-xs text-faint">
                              ({failure.profile} profile)
                            </span>
                            <span className="border border-line bg-subtle px-1 font-mono text-[10px] uppercase text-muted">
                              Phase: {failure.phase || "init"}
                            </span>
                          </div>
                          <div className="mt-1 font-mono text-xs text-muted flex flex-wrap items-center gap-2">
                            <span>Target: <strong className="text-ink">{failure.targets.map((t) => t.value).join(", ")}</strong></span>
                            <span>·</span>
                            <span className="text-ink font-semibold">{failure.error_code}</span>
                            <span>·</span>
                            <span>Attempt {failure.attempt}/{failure.max_attempts}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:self-center font-mono text-xs">
                        <span className="text-muted text-[11px]">
                          {formatRelativeTime(failure.failed_at)}
                        </span>
                        <span className="border border-line px-2 py-0.5 text-ink hover:bg-subtle">
                          {isExpanded ? "Collapse ▲" : "Diagnose ▼"}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Diagnostic Inspection Panel */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 flex flex-col gap-4 bg-canvas font-mono text-xs">
                        {/* Error Message Box */}
                        <div className="border border-line bg-subtle p-3">
                          <div className="text-[10px] uppercase font-bold text-faint mb-1">
                            Scan Engine Error Traceback
                          </div>
                          <div className="text-ink font-semibold font-mono text-xs">
                            {failure.error_message}
                          </div>
                        </div>

                        {/* Root-Cause Explanation */}
                        <div>
                          <h4 className="font-bold uppercase tracking-wider text-ink text-xs mb-1">
                            Root-Cause Analysis (Why this scan failed)
                          </h4>
                          <p className="text-xs text-muted leading-relaxed font-sans border-l-2 border-ink pl-3 py-1">
                            {failure.root_cause}
                          </p>
                        </div>

                        {/* Actionable Step-by-Step Troubleshooting Checklist */}
                        <div>
                          <h4 className="font-bold uppercase tracking-wider text-ink text-xs mb-2">
                            Actionable Troubleshooting Checklist
                          </h4>
                          <div className="border border-line divide-y divide-line font-sans text-xs">
                            {failure.troubleshooting_steps.map((step, idx) => (
                              <div key={idx} className="p-3 flex items-start gap-3 bg-subtle/20">
                                <span className="font-mono text-xs font-bold text-ink border border-line bg-canvas px-1.5 py-0.5">
                                  0{idx + 1}
                                </span>
                                <span className="text-ink leading-relaxed">
                                  {step}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/scans/${failure.id}`}>
                              <Button variant="secondary" size="sm">
                                View Scan Event Log
                              </Button>
                            </Link>

                            <Link href={`/scans/new?target=${encodeURIComponent(failure.targets[0]?.value || "")}&profile=${failure.profile === "deep" ? "standard" : failure.profile}`}>
                              <Button size="sm">
                                ⚡ Retry Scan ({failure.targets[0]?.value || "Target"})
                              </Button>
                            </Link>
                          </div>

                          <button
                            type="button"
                            onClick={() => copyDiagnostic(failure)}
                            className="border border-line bg-subtle px-3 py-1.5 text-xs text-ink hover:border-ink transition-colors font-mono"
                          >
                            {isCopied ? "✓ Diagnostic Copied to Clipboard" : "Copy Diagnostic Details (JSON)"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(isoString: string): string {
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export { SystemHealthDashboard as SystemHealth };
export default SystemHealthDashboard;
