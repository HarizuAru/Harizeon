"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { labelClass, selectClass } from "@/lib/ui";

export interface ReportItem {
  id: string;
  type: "executive" | "technical" | "compliance";
  generated_at: string;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

export function ReportsManager({ initialReports }: { initialReports: ReportItem[] }) {
  const router = useRouter();
  const [reports, setReports] = useState<ReportItem[]>(initialReports);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportType, setReportType] = useState<"executive" | "technical" | "compliance">("executive");
  const [periodDays, setPeriodDays] = useState("30");
  const [includeResolved, setIncludeResolved] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    const days = parseInt(periodDays, 10);
    const period_start = new Date(Date.now() - days * 86400000).toISOString();
    const period_end = new Date().toISOString();

    try {
      const res = await fetch("/api/v1/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reportType,
          period_start,
          period_end,
          include_resolved: includeResolved,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? `Could not generate the report (HTTP ${res.status}).`);
        return;
      }
      const data = await res.json();
      setReports([data.report, ...reports]);
      setIsModalOpen(false);
      router.push(`/reports/${data.report.id}`);
    } catch {
      setError("Cannot reach the API. Is it running?");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    setReports(reports.filter((r) => r.id !== id));
  };

  const formatPeriod = (start: string | null, end: string | null) => {
    if (!start || !end) return "Complete Baseline History";
    const s = new Date(start).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const e = new Date(end).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    return `${s} — ${e}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Action Row */}
      <div className="flex flex-col justify-between gap-4 border border-line bg-canvas p-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-mono text-sm font-bold uppercase tracking-[0.05em] text-ink">
            Client-Ready Security Reports (§09.2)
          </p>
          <p className="text-xs text-muted">
            Formal print-ready executive digests, technical vulnerability assessments, and compliance packages.
          </p>
        </div>
        <Button id="btn-generate-report" onClick={() => setIsModalOpen(true)}>
          Generate report
        </Button>
      </div>

      {/* Reports Table */}
      {reports.length === 0 ? (
        <EmptyState
          title="No reports generated yet."
          description="Generate client-ready printable executive reports with security scores, finding breakdowns, and prioritized remediation plans."
          action={<Button onClick={() => setIsModalOpen(true)}>Generate first report</Button>}
        />
      ) : (
        <div className="border border-line bg-canvas">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-subtle font-mono text-xs uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th className="px-4 py-3">Report Document</th>
                  <th className="px-4 py-3">Assessment Window</th>
                  <th className="px-4 py-3">Generated At</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono">
                {reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-subtle/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="border border-ink bg-subtle px-2 py-0.5 text-xs font-bold uppercase tracking-[0.05em] text-ink">
                          {rep.type}
                        </span>
                        <Link
                          href={`/reports/${rep.id}`}
                          className="font-sans font-semibold text-ink hover:underline"
                        >
                          Harizeon {rep.type.toUpperCase()} Assessment
                        </Link>
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-faint">{rep.id}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {formatPeriod(rep.period_start, rep.period_end)}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink">
                      {new Date(rep.generated_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge className="border-ink text-ink font-bold">READY</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/reports/${rep.id}`}
                          className="border border-line bg-canvas px-3 py-1 text-xs text-ink hover:bg-subtle font-sans font-medium"
                        >
                          View & Print
                        </Link>
                        <button
                          onClick={() => handleDelete(rep.id)}
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

      {/* Generate Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg border border-line bg-canvas p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="font-mono text-base font-bold uppercase tracking-[0.05em] text-ink">
                Generate security report
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="font-mono text-sm text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerate} className="mt-4 flex flex-col gap-4">
              {error && (
                <div className="border border-ink bg-subtle p-3 text-xs text-ink">
                  {error}
                </div>
              )}

              <div>
                <label className={labelClass}>Report Format & Audience</label>
                <select
                  value={reportType}
                  onChange={(e) =>
                    setReportType(e.target.value as "executive" | "technical" | "compliance")
                  }
                  className={selectClass}
                >
                  <option value="executive">Executive Summary (Score, high-level posture, top 3 risks)</option>
                  <option value="technical">Technical Vulnerability Report (Full findings, evidence, CVSS)</option>
                  <option value="compliance">Compliance Assessment (Scope coverage, audit trail)</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Assessment Window</label>
                <select
                  value={periodDays}
                  onChange={(e) => setPeriodDays(e.target.value)}
                  className={selectClass}
                >
                  <option value="7">Past 7 days</option>
                  <option value="30">Past 30 days (Recommended)</option>
                  <option value="90">Past 90 days (Quarterly)</option>
                  <option value="365">Past 365 days (Annual audit)</option>
                </select>
              </div>

              <label className="flex items-center gap-3 text-xs text-ink">
                <input
                  type="checkbox"
                  checked={includeResolved}
                  onChange={(e) => setIncludeResolved(e.target.checked)}
                />
                <span>Include resolved findings and verified remediations</span>
              </label>

              <div className="mt-4 flex items-center justify-end gap-3 border-t border-line pt-4">
                <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isGenerating}>
                  {isGenerating ? "Compiling..." : "Generate report"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
