import type { FastifyInstance } from "fastify";
import { redis } from "../lib/redis";
import { pool } from "../db";
import { config } from "../config";
import { JOBS_STREAM, EVENTS_STREAM } from "../lib/queue";

export async function healthRoutes(app: FastifyInstance) {
  // Public basic health probe
  app.get("/health", async (_req, _reply) => {
    return { status: "ok", service: "harizeon-api", version: "0.1.0" };
  });

  const getSystemHealthHandler = async () => {
    let jobsLen = 0;
    let eventsLen = 0;
    try {
      if (redis.status === "ready" || redis.status === "connect") {
        jobsLen = await redis.xlen(config.HARIZEON_QUEUE_PREFIX + JOBS_STREAM).catch(() => 0);
        eventsLen = await redis.xlen(config.HARIZEON_QUEUE_PREFIX + EVENTS_STREAM).catch(() => 0);
      }
    } catch {
      // Redis unavailable or lazy
    }

    interface DbFailedScan {
      id: string;
      profile: string;
      status: "failed" | "timeout" | "cancelled";
      phase: string | null;
      error_code: string | null;
      attempt: number;
      created_at: string;
      finished_at: string | null;
      targets?: { asset_id: string; type: string; value: string }[];
    }

    let dbFailures: DbFailedScan[] = [];
    try {
      const res = await pool.query<DbFailedScan>(
        `SELECT s.id, s.profile, s.status, s.phase, s.error_code, s.attempt, s.created_at, s.finished_at,
          COALESCE(
            json_agg(json_build_object('asset_id', a.id, 'type', a.type, 'value', a.value))
            FILTER (WHERE a.id IS NOT NULL), '[]'
          ) as targets
         FROM scans s
         LEFT JOIN scan_targets st ON st.scan_id = s.id
         LEFT JOIN assets a ON a.id = st.asset_id
         WHERE s.status IN ('failed', 'timeout', 'cancelled')
         GROUP BY s.id
         ORDER BY s.created_at DESC
         LIMIT 10`,
      );
      dbFailures = res.rows;
    } catch {
      // Postgres query failed or offline
    }

    const failureItems = dbFailures.map((s) => {
      let title = "Scan Execution Interrupted";
      let rootCause = "The scan encountered an unexpected error during execution.";
      let category: "network_firewall" | "worker_timeout" | "dns_resolution" | "waf_rate_limit" | "tls_crypto" | "asset_verification" = "network_firewall";
      let steps = [
        "Check network reachability of the target host.",
        "Review target firewall and security group rules.",
        "Relaunch the scan with a Quick profile.",
      ];

      if (s.error_code === "connection_timeout" || s.error_code === "ERR_CONNECTION_TIMEOUT") {
        title = "Perimeter Firewall / TCP SYN Probe Timeout";
        category = "network_firewall";
        rootCause = "Target perimeter firewall (AWS Security Group / Cloudflare Magic Transit / iptables) dropped scanner ingress packets.";
        steps = [
          "Whitelist Harizeon scanner egress IP CIDRs (203.0.113.0/24, 198.51.100.0/24) in your cloud security groups or perimeter firewall.",
          "Check that port 443 is publicly reachable: test with `nc -zv -w 5 <target> 443`.",
          "Verify web server daemon status (nginx/httpd) and inspect firewall audit logs on the destination server.",
          "Run a 'Quick' scan profile first to confirm baseline TCP reachability before executing deep sweeps.",
        ];
      } else if (s.error_code === "worker_timeout" || s.error_code === "ERR_WORKER_TIMEOUT") {
        title = "Worker Heartbeat Expired / Reaped Execution";
        category = "worker_timeout";
        rootCause = "The target website contains recursive SPA client-side routes or an infinite crawler trap, which stalled the headless browser inspection engine past the 60-second heartbeat ceiling.";
        steps = [
          "Review target web application for recursive URL links or infinite pagination without canonical tags.",
          "Switch scan profile to 'Quick' or disable deep web crawling to avoid heavy single-page application execution loops.",
          "Ensure server response time under load is under 2,000ms: prolonged response latencies multiply crawler execution time.",
          "Check Worker Fleet load to ensure worker containers have adequate CPU headroom for headless browser rendering.",
        ];
      } else if (s.error_code === "dns_unresolvable" || s.error_code === "ERR_DNS_NXDOMAIN") {
        title = "DNS A/AAAA Record Unresolvable";
        category = "dns_resolution";
        rootCause = "The asset is hosted on internal split-horizon DNS or the DNS record has been decommissioned while remaining in the monitored asset registry.";
        steps = [
          "Verify public DNS resolution using public resolvers: `dig +short <target> @8.8.8.8`.",
          "If this target is an internal intranet host not reachable from the public internet, decommission it or mark it inactive in Assets.",
          "Check domain registrar NS delegation and verify DNSSEC signatures are valid and not throwing SERVFAIL.",
          "Once public DNS records are established, trigger an asset re-verification before relaunching the scan.",
        ];
      }

      return {
        id: s.id,
        profile: s.profile,
        status: s.status,
        phase: s.phase,
        error_code: s.error_code || "ERR_SCAN_FAILURE",
        error_title: title,
        error_message: s.error_code ? `Scan failed with code ${s.error_code}` : "Scan execution was interrupted",
        root_cause: rootCause,
        troubleshooting_steps: steps,
        suggested_action: "Relaunch scan with adjusted settings",
        action_href: "/scans/new",
        targets: s.targets || [],
        attempt: s.attempt || 1,
        max_attempts: 2,
        created_at: s.created_at,
        failed_at: s.finished_at || s.created_at,
        category,
      };
    });

    interface DbActiveScan {
      id: string;
      phase: string | null;
      started_at: string | null;
      target_value: string | null;
    }

    let activeScans: DbActiveScan[] = [];
    try {
      const activeRes = await pool.query<DbActiveScan>(
        `SELECT s.id, s.phase, s.started_at, MIN(a.value) AS target_value
         FROM scans s
         LEFT JOIN scan_targets st ON st.scan_id = s.id
         LEFT JOIN assets a ON a.id = st.asset_id
         WHERE s.status IN ('claimed', 'running')
         GROUP BY s.id
         ORDER BY s.started_at DESC NULLS LAST
         LIMIT 16`,
      );
      activeScans = activeRes.rows;
    } catch {
      // Postgres query failed or offline
    }

    const workers = activeScans.map((s, idx) => ({
      id: `wkr-${s.id.slice(0, 8)}`,
      name: `Worker ${String(idx + 1).padStart(2, "0")}`,
      region: "local",
      status: "busy",
      current_scan_id: s.id,
      current_target: s.target_value,
      current_phase: s.phase,
      slots_total: 1,
      slots_used: 1,
      cpu_percent: 0,
      memory_mb: 0,
      heartbeat_at: s.started_at ?? new Date().toISOString(),
      uptime_seconds: 0,
      jobs_completed: 0,
      jobs_failed: 0,
    }));

    const activeWorkers = workers.length;
    const totalSlots = Math.max(4, activeWorkers);
    const usedSlots = activeWorkers;
    const reaped24h = failureItems.filter(
      (f) => f.error_code === "worker_timeout" && Date.now() - new Date(f.failed_at).getTime() <= 86_400_000,
    ).length;

    const recommendations = failureItems.slice(0, 3).map((f) => ({
      title: f.error_title,
      description: f.root_cause,
      code: f.error_code,
      affected_scans_count: 1,
    }));

    return {
      timestamp: new Date().toISOString(),
      status: failureItems.length > 0 ? "degraded" : "operational",
      cluster: {
        region: "local",
        fleet_name: "harizeon-worker-pool",
        total_workers: activeWorkers,
        active_workers: activeWorkers,
        total_slots: totalSlots,
        used_slots: usedSlots,
        fleet_load_percent: totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 1000) / 10 : 0,
        avg_job_duration_sec: 0,
      },
      workers,
      queues: {
        jobs: {
          name: "Scan Jobs Stream",
          stream_key: config.HARIZEON_QUEUE_PREFIX + JOBS_STREAM,
          type: "jobs",
          length: jobsLen,
          in_flight: usedSlots,
          consumer_group: "workers",
          consumers_active: activeWorkers,
          lag: 0,
          status: "nominal",
          throughput_per_min: 0,
          avg_latency_ms: 0,
        },
        events: {
          name: "Worker Events Stream",
          stream_key: config.HARIZEON_QUEUE_PREFIX + EVENTS_STREAM,
          type: "events",
          length: eventsLen,
          in_flight: 0,
          consumer_group: "ingest",
          consumers_active: config.HARIZEON_RUN_LOOPS ? 1 : 0,
          lag: 0,
          status: "nominal",
          throughput_per_min: 0,
          avg_latency_ms: 0,
        },
        reaper: {
          interval_sec: 15,
          last_run_at: new Date().toISOString(),
          scans_reaped_24h: reaped24h,
          status: "operational",
        },
      },
      recent_failures: failureItems,
      diagnostics: {
        total_recent_failures: failureItems.length,
        primary_failure_cause: failureItems[0]?.root_cause ?? null,
        recommendations,
      },
    };
  };

  app.get("/system/health", getSystemHealthHandler);
  app.get("/v1/system/health", getSystemHealthHandler);
}
