"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { DashboardFinding, DashboardAsset, DashboardScan } from "@/components/dashboard-view";

interface SecurityInsightsProps {
  findings: DashboardFinding[];
  assets: DashboardAsset[];
  scans: DashboardScan[];
  now?: number;
}

export function SecurityInsights({ findings, assets, scans, now }: SecurityInsightsProps) {
  const metrics = useMemo(() => {
    const totalFindings = findings.length;
    const openFindings = findings.filter((f) => f.status === "open");
    const resolvedFindings = findings.filter((f) => f.status === "fixed");

    // 1. Threat Vector Categorization
    const vectorCounts: Record<string, number> = {
      ai_exposure: 0,
      cloud_storage: 0,
      api_security: 0,
      headers: 0,
      tls: 0,
      exposed_ports: 0,
      other: 0,
    };

    findings.forEach((f) => {
      const lower = `${f.title} ${f.category || ""}`.toLowerCase();
      if (
        lower.includes("ai") ||
        lower.includes("mcp") ||
        lower.includes("ollama") ||
        lower.includes("vllm") ||
        lower.includes("chroma") ||
        lower.includes("vector") ||
        lower.includes("token") ||
        lower.includes("key")
      ) {
        vectorCounts.ai_exposure += 1;
      } else if (lower.includes("s3") || lower.includes("bucket") || lower.includes("storage") || lower.includes("blob")) {
        vectorCounts.cloud_storage += 1;
      } else if (lower.includes("graphql") || lower.includes("introspection") || lower.includes("actuator") || lower.includes("api") || lower.includes("swagger")) {
        vectorCounts.api_security += 1;
      } else if (lower.includes("header") || lower.includes("csp") || lower.includes("hsts") || lower.includes("frame")) {
        vectorCounts.headers += 1;
      } else if (lower.includes("tls") || lower.includes("ssl") || lower.includes("cert")) {
        vectorCounts.tls += 1;
      } else if (lower.includes("port") || lower.includes("service") || lower.includes("db") || lower.includes("exposed")) {
        vectorCounts.exposed_ports += 1;
      } else {
        vectorCounts.other += 1;
      }
    });

    const timestamp = now ?? (typeof window !== "undefined" ? 1700000000000 : 0);
    // 2. Mean Exposure Age & MTTR (Mean Time to Remediate)
    const openAges = openFindings.map((f) => Math.max(0, (timestamp - new Date(f.first_seen_at).getTime()) / 86400000));
    const avgOpenAgeDays = openAges.length > 0 ? (openAges.reduce((a, b) => a + b, 0) / openAges.length).toFixed(1) : "0.0";

    // 3. Scanner Fleet Throughput & Efficiency
    const completedScans = scans.filter((s) => s.status === "completed");
    const aiScans = scans.filter((s) => s.profile === "ai");

    return {
      totalFindings,
      openCount: openFindings.length,
      resolvedCount: resolvedFindings.length,
      vectorCounts,
      avgOpenAgeDays,
      totalAssets: assets.length,
      verifiedAssets: assets.filter((a) => a.verification_status === "verified").length,
      totalScans: scans.length,
      completedScans: completedScans.length,
      aiScanShare: scans.length > 0 ? Math.round((aiScans.length / scans.length) * 100) : 0,
    };
  }, [findings, assets, scans, now]);

  const maxVector = Math.max(
    1,
    metrics.vectorCounts.ai_exposure,
    metrics.vectorCounts.cloud_storage,
    metrics.vectorCounts.api_security,
    metrics.vectorCounts.headers,
    metrics.vectorCounts.tls,
    metrics.vectorCounts.exposed_ports,
    metrics.vectorCounts.other,
  );

  return (
    <div className="border border-line bg-canvas">
      <div className="flex flex-col justify-between gap-2 border-b border-line p-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink">
              Scanner Telemetry &amp; Perimeter Intelligence
            </span>
            <span className="border border-ink bg-subtle px-1.5 py-0.2 font-mono text-[10px] font-bold text-ink">
              TELEMETRY ENGINE
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted font-sans">
            Synthesized operational telemetry from continuous external scans, adaptive probes, and remediation velocity.
          </p>
        </div>
        <Link
          href="/reports"
          className="font-mono text-xs text-muted hover:text-ink hover:underline"
        >
          Compliance audit reports →
        </Link>
      </div>

      <div className="grid grid-cols-1 divide-y divide-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {/* Metric 1: Threat Vector Breakdown */}
        <div className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-ink uppercase tracking-wider text-[11px]">
                01 / Threat Vector Distribution
              </span>
              <span className="text-muted">{metrics.totalFindings} Total Signals</span>
            </div>
            <p className="mt-1 text-[11px] text-muted leading-relaxed">
              Distribution of discovered security gaps across monitored external infrastructure.
            </p>

            <div className="mt-4 flex flex-col gap-2.5 font-mono text-xs">
              <div>
                <div className="flex justify-between text-muted text-[11px] mb-1">
                  <span className="text-ink font-semibold">AI &amp; Agent Infrastructure</span>
                  <span>{metrics.vectorCounts.ai_exposure}</span>
                </div>
                <div className="h-2 w-full border border-line bg-subtle">
                  <div
                    className="h-full bg-ink"
                    style={{ width: `${(metrics.vectorCounts.ai_exposure / maxVector) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-muted text-[11px] mb-1">
                  <span className="text-ink font-semibold">Cloud Storage &amp; Buckets (S3/GCS)</span>
                  <span>{metrics.vectorCounts.cloud_storage}</span>
                </div>
                <div className="h-2 w-full border border-line bg-subtle">
                  <div
                    className="h-full bg-ink"
                    style={{ width: `${(metrics.vectorCounts.cloud_storage / maxVector) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-muted text-[11px] mb-1">
                  <span className="text-ink font-semibold">API &amp; GraphQL Schema Security</span>
                  <span>{metrics.vectorCounts.api_security}</span>
                </div>
                <div className="h-2 w-full border border-line bg-subtle">
                  <div
                    className="h-full bg-ink"
                    style={{ width: `${(metrics.vectorCounts.api_security / maxVector) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-muted text-[11px] mb-1">
                  <span className="text-ink font-semibold">Web Headers &amp; Browser Defense</span>
                  <span>{metrics.vectorCounts.headers}</span>
                </div>
                <div className="h-2 w-full border border-line bg-subtle">
                  <div
                    className="h-full bg-ink"
                    style={{ width: `${(metrics.vectorCounts.headers / maxVector) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-muted text-[11px] mb-1">
                  <span className="text-ink font-semibold">TLS &amp; Transport Encryption</span>
                  <span>{metrics.vectorCounts.tls}</span>
                </div>
                <div className="h-2 w-full border border-line bg-subtle">
                  <div
                    className="h-full bg-ink"
                    style={{ width: `${(metrics.vectorCounts.tls / maxVector) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-muted text-[11px] mb-1">
                  <span className="text-ink font-semibold">Exposed Services &amp; Ports</span>
                  <span>{metrics.vectorCounts.exposed_ports}</span>
                </div>
                <div className="h-2 w-full border border-line bg-subtle">
                  <div
                    className="h-full bg-ink"
                    style={{ width: `${(metrics.vectorCounts.exposed_ports / maxVector) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-line pt-2 text-[10px] font-mono text-faint">
            Targeting Ollama, vLLM, ChromaDB, TLS ciphers, and CSP policies.
          </div>
        </div>

        {/* Metric 2: Remediation & Exposure Velocity */}
        <div className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-ink uppercase tracking-wider text-[11px]">
                02 / Remediation Velocity
              </span>
              <span className="text-muted">Lifecycle Telemetry</span>
            </div>
            <p className="mt-1 text-[11px] text-muted leading-relaxed">
              Measurement of how rapidly security exposures are patched once discovered.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 font-mono">
              <div className="border border-line bg-subtle p-3">
                <span className="text-[10px] text-faint uppercase block">Avg Unmitigated Age</span>
                <span className="text-2xl font-extrabold text-ink">{metrics.avgOpenAgeDays}d</span>
                <span className="text-[10px] text-muted block mt-1">Days open across fleet</span>
              </div>
              <div className="border border-line bg-subtle p-3">
                <span className="text-[10px] text-faint uppercase block">Fixed Vulnerabilities</span>
                <span className="text-2xl font-extrabold text-ink">{metrics.resolvedCount}</span>
                <span className="text-[10px] text-muted block mt-1">Verified resolved</span>
              </div>
            </div>

            <div className="mt-3 border border-line bg-canvas p-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted text-[11px]">Active Resolution Rate</span>
                <span className="font-bold text-ink">
                  {metrics.totalFindings > 0
                    ? `${Math.round((metrics.resolvedCount / metrics.totalFindings) * 100)}%`
                    : "100%"}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-faint">
                {metrics.openCount} open vulnerabilities currently affecting security score.
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-line pt-2 text-[10px] font-mono text-faint">
            Findings older than 7 days incur a 1.5× score penalty (§20.4).
          </div>
        </div>

        {/* Metric 3: Scanner Fleet Efficiency */}
        <div className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-ink uppercase tracking-wider text-[11px]">
                03 / Scanner Fleet Performance
              </span>
              <span className="text-muted">Engine Throughput</span>
            </div>
            <p className="mt-1 text-[11px] text-muted leading-relaxed">
              Execution telemetry and adaptive probe metrics across scanning workers.
            </p>

            <div className="mt-4 flex flex-col gap-2 font-mono text-xs">
              <div className="flex items-center justify-between border border-line bg-subtle p-2">
                <span className="text-muted">Total Scans Run</span>
                <span className="font-bold text-ink">{metrics.totalScans}</span>
              </div>
              <div className="flex items-center justify-between border border-line bg-subtle p-2">
                <span className="text-muted">Adaptive Fast-Bailout</span>
                <span className="font-bold text-ink">ENABLED</span>
              </div>
              <div className="flex items-center justify-between border border-line bg-subtle p-2">
                <span className="text-muted">AI-Armor Profiles</span>
                <span className="font-bold text-ink">&lt; 30s SLA</span>
              </div>
              <div className="flex items-center justify-between border border-line bg-subtle p-2">
                <span className="text-muted">Verified Scope Coverage</span>
                <span className="font-bold text-ink">
                  {metrics.totalAssets > 0
                    ? `${Math.round((metrics.verifiedAssets / metrics.totalAssets) * 100)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-line pt-2 text-[10px] font-mono text-faint">
            Adaptive engine skips dead hosts automatically to conserve compute.
          </div>
        </div>
      </div>
    </div>
  );
}
