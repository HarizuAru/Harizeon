"use client";

import { useState, useMemo, useEffect } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { SeverityChip, type Severity } from "@/components/ui/severity-chip";
import { Button } from "@/components/ui/button";
import { cx } from "@/lib/cx";
import type { Scan } from "@/components/scans-list-table";

export interface ComparisonFinding {
  id: string;
  title: string;
  severity: Severity;
  category: string;
  cwe_id: string;
  asset_value: string;
  description: string;
  remediation: string;
}

const CATALOG_FINDINGS: ComparisonFinding[] = [
  {
    id: "fnd-101",
    title: "TLS 1.0/1.1 enabled on public gateway",
    severity: "critical",
    category: "tls",
    cwe_id: "CWE-326",
    asset_value: "example.com",
    description: "Legacy TLS protocols accepted by reverse proxy. Vulnerable to BEAST and POODLE downgrade attacks.",
    remediation: "Disable TLS 1.0 and 1.1; enforce TLS 1.2 and TLS 1.3 exclusively.",
  },
  {
    id: "fnd-102",
    title: "Missing Content-Security-Policy (CSP) header",
    severity: "high",
    category: "headers",
    cwe_id: "CWE-693",
    asset_value: "example.com",
    description: "HTTP response lacks Content-Security-Policy header. Allows cross-site scripting (XSS) and inline script execution.",
    remediation: "Deploy strict Content-Security-Policy restricting script-src and object-src origins.",
  },
  {
    id: "fnd-103",
    title: "Exposed Redis TCP port 6379 without authentication",
    severity: "critical",
    category: "exposed_service",
    cwe_id: "CWE-200",
    asset_value: "203.0.113.10",
    description: "Unauthenticated remote access permitted on Redis server. Full cache and key memory dump possible.",
    remediation: "Bind Redis to 127.0.0.1 or VPC private subnet and block port 6379 on ingress firewall.",
  },
  {
    id: "fnd-104",
    title: "Exposed Spring Boot Actuator management endpoint",
    severity: "high",
    category: "web",
    cwe_id: "CWE-200",
    asset_value: "api.example.com",
    description: "Publicly reachable /actuator/env and /actuator/health disclosing application topology and environment vars.",
    remediation: "Restrict management.endpoints.web.exposure.include or require API gateway auth.",
  },
  {
    id: "fnd-105",
    title: "Strict-Transport-Security (HSTS) missing max-age directive",
    severity: "medium",
    category: "headers",
    cwe_id: "CWE-523",
    asset_value: "example.com",
    description: "Browser not instructed to automatically upgrade insecure HTTP requests to HTTPS.",
    remediation: "Include Strict-Transport-Security: max-age=31536000; includeSubDomains; preload header.",
  },
  {
    id: "fnd-106",
    title: "Server version banner information disclosure (X-Powered-By)",
    severity: "low",
    category: "headers",
    cwe_id: "CWE-200",
    asset_value: "api.example.com",
    description: "Response reveals underlying runtime version in X-Powered-By: Express and Server: nginx/1.18.0.",
    remediation: "Suppress Server and X-Powered-By headers in web server configuration.",
  },
  {
    id: "fnd-107",
    title: "Authoritative nameserver permits unrestricted DNS zone transfer",
    severity: "critical",
    category: "dns",
    cwe_id: "CWE-200",
    asset_value: "example.com",
    description: "AXFR query on authoritative DNS servers returned full perimeter zone records and hidden subdomains.",
    remediation: "Restrict AXFR zone transfers to authorized secondary nameserver IPs only.",
  },
  {
    id: "fnd-108",
    title: "GraphQL schema introspection enabled in production",
    severity: "medium",
    category: "api",
    cwe_id: "CWE-200",
    asset_value: "api.example.com",
    description: "Querying __schema on /graphql endpoint returns complete schema, types, and internal query signatures.",
    remediation: "Disable schema introspection on production GraphQL gateway servers.",
  },
  {
    id: "fnd-109",
    title: "Cross-Origin Resource Sharing (CORS) wildcard with credentials",
    severity: "medium",
    category: "web",
    cwe_id: "CWE-346",
    asset_value: "api.example.com",
    description: "Access-Control-Allow-Origin: * configured on authenticated API routes allowing cross-domain data leakage.",
    remediation: "Explicitly validate and whitelist allowed client origins in CORS handler.",
  },
  {
    id: "fnd-110",
    title: "Session cookie missing SameSite and Secure flags",
    severity: "low",
    category: "cookies",
    cwe_id: "CWE-614",
    asset_value: "example.com",
    description: "Session identification cookie transmitted over cleartext or without SameSite=Lax protection against CSRF.",
    remediation: "Set Secure, HttpOnly, and SameSite=Lax attributes on all authentication cookies.",
  },
];

/**
 * Deterministically resolve findings discovered during a specific scan.
 */
export function getFindingsForScan(scan: Scan): ComparisonFinding[] {
  // If scan is failed or timeout early, fewer or no findings reported
  if (scan.status === "failed" && scan.phase === "resolve") {
    return [CATALOG_FINDINGS[6]]; // Only DNS finding
  }
  if (scan.status === "failed" && scan.phase === "probe") {
    return [CATALOG_FINDINGS[2]]; // Only Redis / IP port finding
  }
  if (scan.status === "timeout") {
    return [CATALOG_FINDINGS[0], CATALOG_FINDINGS[1], CATALOG_FINDINGS[7]];
  }

  // Use scan ID characters to deterministically select realistic findings
  const hash = scan.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const selected: ComparisonFinding[] = [];

  // Core baseline findings based on profile
  if (scan.profile === "quick") {
    selected.push(CATALOG_FINDINGS[0]); // TLS
    selected.push(CATALOG_FINDINGS[1]); // CSP
    selected.push(CATALOG_FINDINGS[5]); // Server banner
    if (hash % 2 === 0) selected.push(CATALOG_FINDINGS[4]); // HSTS
  } else if (scan.profile === "standard") {
    selected.push(CATALOG_FINDINGS[0]); // TLS
    selected.push(CATALOG_FINDINGS[1]); // CSP
    selected.push(CATALOG_FINDINGS[2]); // Redis
    selected.push(CATALOG_FINDINGS[4]); // HSTS
    if (hash % 3 === 0) selected.push(CATALOG_FINDINGS[7]); // GraphQL
    if (hash % 2 === 0) selected.push(CATALOG_FINDINGS[9]); // Cookie
  } else {
    // Deep profile: extensive checks
    selected.push(CATALOG_FINDINGS[0]); // TLS
    selected.push(CATALOG_FINDINGS[1]); // CSP
    selected.push(CATALOG_FINDINGS[3]); // Spring Boot
    selected.push(CATALOG_FINDINGS[4]); // HSTS
    selected.push(CATALOG_FINDINGS[7]); // GraphQL
    selected.push(CATALOG_FINDINGS[8]); // CORS
    if (hash % 2 === 0) selected.push(CATALOG_FINDINGS[2]); // Redis
    if (hash % 3 !== 0) selected.push(CATALOG_FINDINGS[6]); // DNS AXFR
  }

  // De-duplicate by ID
  const map = new Map<string, ComparisonFinding>();
  for (const item of selected) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

export type DiffStatus = "new" | "resolved" | "unchanged";

export interface DiffRow {
  finding: ComparisonFinding;
  inA: boolean;
  inB: boolean;
  status: DiffStatus;
}

export function ScanComparisonModal({
  scanA,
  scanB,
  onClose,
  onSwap,
}: {
  scanA: Scan;
  scanB: Scan;
  onClose: () => void;
  onSwap?: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "diffs" | "new" | "resolved" | "unchanged">("all");
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const findingsA = useMemo(() => getFindingsForScan(scanA), [scanA]);
  const findingsB = useMemo(() => getFindingsForScan(scanB), [scanB]);

  const diffRows = useMemo<DiffRow[]>(() => {
    const map = new Map<string, DiffRow>();

    // Process Scan A findings
    for (const f of findingsA) {
      map.set(f.id, {
        finding: f,
        inA: true,
        inB: false,
        status: "resolved", // Initially assumed resolved until checked in B
      });
    }

    // Process Scan B findings
    for (const f of findingsB) {
      if (map.has(f.id)) {
        const existing = map.get(f.id)!;
        existing.inB = true;
        existing.status = "unchanged";
      } else {
        map.set(f.id, {
          finding: f,
          inA: false,
          inB: true,
          status: "new",
        });
      }
    }

    // Sort order: Critical first, then High, Medium, Low
    const severityWeight: Record<Severity, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
      info: 0,
    };

    return Array.from(map.values()).sort(
      (a, b) => severityWeight[b.finding.severity] - severityWeight[a.finding.severity],
    );
  }, [findingsA, findingsB]);

  const newInBCount = diffRows.filter((r) => r.status === "new").length;
  const resolvedInBCount = diffRows.filter((r) => r.status === "resolved").length;
  const unchangedCount = diffRows.filter((r) => r.status === "unchanged").length;

  const filteredRows = useMemo(() => {
    if (filter === "all") return diffRows;
    if (filter === "diffs") return diffRows.filter((r) => r.status === "new" || r.status === "resolved");
    if (filter === "new") return diffRows.filter((r) => r.status === "new");
    if (filter === "resolved") return diffRows.filter((r) => r.status === "resolved");
    if (filter === "unchanged") return diffRows.filter((r) => r.status === "unchanged");
    return diffRows;
  }, [diffRows, filter]);

  const handleCopySummary = () => {
    const lines = [
      `# Scan Comparison Report`,
      `Baseline Scan A: ${scanA.id} (${scanA.profile} profile · ${new Date(scanA.created_at).toLocaleString()})`,
      `Comparison Scan B: ${scanB.id} (${scanB.profile} profile · ${new Date(scanB.created_at).toLocaleString()})`,
      ``,
      `## Summary Delta`,
      `- Total Findings in Scan A: ${findingsA.length}`,
      `- Total Findings in Scan B: ${findingsB.length}`,
      `- [+] New in Scan B: ${newInBCount}`,
      `- [-] Resolved in Scan B: ${resolvedInBCount}`,
      `- [=] Unchanged: ${unchangedCount}`,
      ``,
      `## Findings Breakdown`,
      ...diffRows.map(
        (r) =>
          `[${r.status.toUpperCase()}] [${r.finding.severity.toUpperCase()}] ${r.finding.title} (${r.finding.asset_value})`,
      ),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6"
    >
      <div className="relative flex flex-col w-full max-w-6xl max-h-[92vh] border border-line bg-canvas font-mono text-xs text-ink shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-line p-4 bg-subtle/30">
          <div className="flex items-center gap-2.5">
            <span className="border border-ink bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase text-canvas">
              Diff Mode (§08.2)
            </span>
            <h2 id="comparison-dialog-title" className="text-sm font-bold uppercase tracking-wider text-ink">
              Side-by-Side Findings Comparison
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onSwap && (
              <button
                type="button"
                onClick={onSwap}
                className="border border-line bg-canvas px-2.5 py-1 text-xs text-ink hover:bg-subtle uppercase tracking-wide"
                title="Swap baseline scan and comparison scan"
              >
                ⇄ Swap Baseline
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="border border-line bg-canvas px-2.5 py-1 text-xs text-muted hover:border-ink hover:text-ink font-bold"
              aria-label="Close comparison view"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Scan Header Side-by-Side Metadata Cards */}
        <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 sm:divide-x border-b border-line bg-canvas">
          {/* Scan A Card (Baseline) */}
          <div className="p-4 bg-subtle/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase text-muted tracking-wider">
                Baseline Scan (Scan A)
              </span>
              <StatusBadge status={scanA.status}>{scanA.status}</StatusBadge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-ink">{scanA.id}</span>
              <span className="text-xs text-muted uppercase">({scanA.profile} profile)</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted">
              <div>
                <span className="block text-[10px] uppercase text-faint">Executed:</span>
                <span className="text-ink">{new Date(scanA.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-faint">Discovered Findings:</span>
                <strong className="text-ink">{findingsA.length} findings</strong>
              </div>
            </div>
          </div>

          {/* Scan B Card (Comparison) */}
          <div className="p-4 bg-subtle/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase text-muted tracking-wider">
                Comparison Target (Scan B)
              </span>
              <StatusBadge status={scanB.status}>{scanB.status}</StatusBadge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-ink">{scanB.id}</span>
              <span className="text-xs text-muted uppercase">({scanB.profile} profile)</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted">
              <div>
                <span className="block text-[10px] uppercase text-faint">Executed:</span>
                <span className="text-ink">{new Date(scanB.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-faint">Discovered Findings:</span>
                <strong className="text-ink">{findingsB.length} findings</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Diff KPI Bar */}
        <div className="grid grid-cols-3 divide-x divide-line border-b border-line bg-subtle/20 text-center">
          <div className="p-3 bg-emerald-500/[0.04]">
            <span className="block text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
              [+] New in Scan B
            </span>
            <div className="mt-0.5 text-lg font-bold text-ink">
              +{newInBCount}
            </div>
            <span className="text-[10px] text-muted">
              Vulnerabilities introduced or newly identified
            </span>
          </div>

          <div className="p-3 bg-zinc-500/[0.04]">
            <span className="block text-[10px] font-bold uppercase text-muted">
              [-] Resolved in Scan B
            </span>
            <div className="mt-0.5 text-lg font-bold text-ink">
              -{resolvedInBCount}
            </div>
            <span className="text-[10px] text-muted">
              Issues fixed or no longer reproducible
            </span>
          </div>

          <div className="p-3">
            <span className="block text-[10px] font-bold uppercase text-faint">
              [=] Unchanged
            </span>
            <div className="mt-0.5 text-lg font-bold text-ink">
              {unchangedCount}
            </div>
            <span className="text-[10px] text-muted">
              Persistent issues detected in both runs
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-3 bg-canvas">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-muted mr-1">
              View Filter:
            </span>

            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cx(
                "border px-2.5 py-1 text-xs uppercase transition-colors",
                filter === "all"
                  ? "border-ink bg-ink text-canvas font-bold"
                  : "border-line bg-canvas text-muted hover:border-ink hover:text-ink",
              )}
            >
              All ({diffRows.length})
            </button>

            <button
              type="button"
              onClick={() => setFilter("diffs")}
              className={cx(
                "border px-2.5 py-1 text-xs uppercase transition-colors",
                filter === "diffs"
                  ? "border-ink bg-ink text-canvas font-bold"
                  : "border-line bg-canvas text-muted hover:border-ink hover:text-ink",
              )}
            >
              Differences Only ({newInBCount + resolvedInBCount})
            </button>

            <button
              type="button"
              onClick={() => setFilter("new")}
              className={cx(
                "border px-2.5 py-1 text-xs uppercase transition-colors",
                filter === "new"
                  ? "border-emerald-600 bg-emerald-600 text-canvas font-bold"
                  : "border-line bg-canvas text-emerald-700 dark:text-emerald-400 hover:border-ink",
              )}
            >
              [+] New Only ({newInBCount})
            </button>

            <button
              type="button"
              onClick={() => setFilter("resolved")}
              className={cx(
                "border px-2.5 py-1 text-xs uppercase transition-colors",
                filter === "resolved"
                  ? "border-ink bg-ink text-canvas font-bold"
                  : "border-line bg-canvas text-muted hover:border-ink hover:text-ink",
              )}
            >
              [-] Resolved ({resolvedInBCount})
            </button>

            <button
              type="button"
              onClick={() => setFilter("unchanged")}
              className={cx(
                "border px-2.5 py-1 text-xs uppercase transition-colors",
                filter === "unchanged"
                  ? "border-ink bg-ink text-canvas font-bold"
                  : "border-line bg-canvas text-faint hover:border-ink hover:text-ink",
              )}
            >
              [=] Unchanged ({unchangedCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="border border-line bg-canvas px-2.5 py-1 text-xs text-ink hover:bg-subtle font-mono uppercase"
            >
              {copied ? "✓ Copied to clipboard" : "Copy diff report"}
            </button>
          </div>
        </div>

        {/* Scrollable Side-by-Side Findings Diff List */}
        <div className="flex-1 overflow-y-auto divide-y divide-line bg-canvas">
          {filteredRows.length === 0 ? (
            <div className="p-8 text-center text-muted font-mono">
              <p>No findings match the selected difference filter.</p>
            </div>
          ) : (
            filteredRows.map((row) => {
              const { finding, inA, inB, status } = row;

              return (
                <div
                  key={finding.id}
                  className={cx(
                    "p-4 transition-colors",
                    status === "new" && "bg-emerald-500/[0.04]",
                    status === "resolved" && "bg-zinc-500/[0.03]",
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    {/* Left: Finding Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <SeverityChip severity={finding.severity} />

                        {status === "new" && (
                          <span className="border border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                            [+] New Finding
                          </span>
                        )}

                        {status === "resolved" && (
                          <span className="border border-zinc-400 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-400 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                            [-] Resolved in Scan B
                          </span>
                        )}

                        {status === "unchanged" && (
                          <span className="border border-line bg-subtle text-muted px-1.5 py-0.5 text-[10px] uppercase">
                            [=] Persistent
                          </span>
                        )}

                        <span className="text-[11px] font-bold text-muted font-mono">
                          {finding.id} · {finding.cwe_id}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-ink leading-snug">
                        {finding.title}
                      </h4>
                      <p className="mt-1 text-[11px] text-muted font-sans leading-relaxed">
                        {finding.description}
                      </p>
                      <div className="mt-1 text-[10px] text-faint">
                        <span>Target: </span>
                        <code className="text-ink font-bold">{finding.asset_value}</code>
                        <span className="mx-2">·</span>
                        <span>Remediation: {finding.remediation}</span>
                      </div>
                    </div>

                    {/* Right: Presence Status Badges for Scan A vs Scan B */}
                    <div className="shrink-0 flex items-center gap-3 pt-1 sm:pt-0">
                      {/* Scan A indicator */}
                      <div className="flex flex-col items-center border border-line bg-canvas p-2 min-w-28 text-center">
                        <span className="text-[9px] uppercase text-muted block mb-1">
                          Scan A ({scanA.id.slice(0, 8)})
                        </span>
                        {inA ? (
                          <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                            <span>●</span>
                            <span>Detected</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted flex items-center gap-1">
                            <span>○</span>
                            <span>Not Found</span>
                          </span>
                        )}
                      </div>

                      {/* Arrow divider */}
                      <span className="text-muted font-bold">→</span>

                      {/* Scan B indicator */}
                      <div
                        className={cx(
                          "flex flex-col items-center border p-2 min-w-28 text-center",
                          status === "new"
                            ? "border-emerald-600 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                            : status === "resolved"
                              ? "border-line bg-subtle/50"
                              : "border-line bg-canvas",
                        )}
                      >
                        <span className="text-[9px] uppercase text-muted block mb-1">
                          Scan B ({scanB.id.slice(0, 8)})
                        </span>
                        {inB ? (
                          <span
                            className={cx(
                              "text-xs font-bold flex items-center gap-1",
                              status === "new"
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-rose-700 dark:text-rose-400",
                            )}
                          >
                            <span>●</span>
                            <span>{status === "new" ? "New Defect" : "Detected"}</span>
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <span>✓</span>
                            <span>Resolved</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-line p-3 bg-subtle/30 flex items-center justify-between text-[11px] text-muted">
          <span>
            Comparing <strong className="text-ink">{scanA.id}</strong> vs{" "}
            <strong className="text-ink">{scanB.id}</strong>. Press <kbd className="border border-line bg-canvas px-1">Esc</kbd> to close.
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
