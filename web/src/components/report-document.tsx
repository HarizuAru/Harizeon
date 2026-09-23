"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SeverityChip } from "@/components/ui/severity-chip";

export interface ReportContent {
  id: string;
  org_name: string;
  type: string;
  generated_at: string;
  period_start: string | null;
  period_end: string | null;
  security_score: {
    score: number;
    totalPenalties: number;
    openFindingsCount: number;
    weights: Record<string, number>;
    ageMultiplier: Record<string, number>;
    categoryCap: number;
  };
  summary: {
    total_findings: number;
    open_findings: number;
    assets_tested: number;
    severity_counts: Record<string, number>;
  };
  top_risks: Array<{
    title: string;
    severity: "critical" | "high" | "medium" | "low" | "info";
    asset: string;
    impact: string;
  }>;
  scope: Array<{
    value: string;
    type: string;
    criticality: string;
  }>;
  findings: Array<{
    id: string;
    title: string;
    severity: "critical" | "high" | "medium" | "low" | "info";
    status: string;
    asset: string;
    cvss: number;
    category: string;
    what_it_is: string;
    why_it_matters: string;
    remediation: string;
    remediation_effort: "Low" | "Medium" | "High";
  }>;
  remediation_plan: Array<{
    priority: number;
    title: string;
    asset: string;
    severity: "critical" | "high" | "medium" | "low" | "info";
    effort: "Low" | "Medium" | "High";
    action: string;
  }>;
  /** Absent on reports generated before compliance mapping existed. */
  compliance?: ComplianceFrameworkResult[];
  disclaimer: string;
}

export interface ComplianceControlResult {
  control: string;
  title: string;
  status: "attention" | "no_findings_detected";
  findings: Array<{
    id: string;
    title: string;
    severity: "critical" | "high" | "medium" | "low" | "info";
    status: string;
    asset: string;
  }>;
}

export interface ComplianceFrameworkResult {
  framework: string;
  controls: ComplianceControlResult[];
  open_findings: number;
}

export function ReportDocument({ content }: { content: ReportContent }) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(content, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `harizeon-report-${content.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const formatWindow = (start: string | null, end: string | null) => {
    if (!start || !end) return "Complete Historical Horizon";
    return `${new Date(start).toLocaleDateString()} — ${new Date(end).toLocaleDateString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Non-printed Controls Bar */}
      <div className="flex flex-col justify-between gap-4 border border-line bg-canvas p-4 print:hidden sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 font-mono text-xs">
          <Link href="/reports" className="text-muted hover:text-ink">
            ← BACK TO REPORTS
          </Link>
          <span className="text-line">/</span>
          <span className="text-ink font-bold">{content.id}</span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={handleDownloadJson}>
            Download JSON
          </Button>
          <Button onClick={handlePrint}>
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Printable Report Document Body */}
      <article className="border border-line bg-canvas p-8 print:border-none print:p-0">
        {/* Cover Section */}
        <header className="border-b-2 border-ink pb-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-muted">
                HARIZEON SECURITY ASSURANCE REPORT
              </div>
              <h1 className="mt-2 font-mono text-3xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
                {content.type} Security Assessment
              </h1>
              <p className="mt-1 font-mono text-sm text-muted">
                Target Organization: <strong className="text-ink">{content.org_name}</strong>
              </p>
            </div>

            <div className="border-2 border-ink p-3 text-right font-mono text-xs">
              <div className="font-bold text-ink">HARIZEON EASM v0.1</div>
              <div className="text-faint">SHA256 VERIFIED</div>
              <div className="mt-1 font-mono text-[10px] text-muted">
                {new Date(content.generated_at).toISOString().slice(0, 19)}Z
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-4 font-mono text-xs sm:grid-cols-4">
            <div>
              <span className="text-faint">ASSESSMENT WINDOW:</span>
              <p className="font-semibold text-ink">{formatWindow(content.period_start, content.period_end)}</p>
            </div>
            <div>
              <span className="text-faint">ASSETS TESTED:</span>
              <p className="font-semibold text-ink">{content.summary.assets_tested} Verified Targets</p>
            </div>
            <div>
              <span className="text-faint">OPEN VULNERABILITIES:</span>
              <p className="font-semibold text-ink">{content.summary.open_findings} Findings</p>
            </div>
            <div>
              <span className="text-faint">REPORT ID:</span>
              <p className="font-semibold text-ink">{content.id}</p>
            </div>
          </div>
        </header>

        {/* Section 1: Executive Summary & Score */}
        <section className="mt-8 border-b border-line pb-8">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted">
            01 / Executive Summary & Posture
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="border border-line bg-subtle p-5">
              <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted">
                Security Score (§20.4)
              </span>
              <div className="mt-2 font-mono text-4xl font-extrabold text-ink">
                {content.security_score.score} <span className="text-lg font-normal text-faint">/ 100</span>
              </div>
              <p className="mt-2 text-xs text-muted">
                Posture rating:{" "}
                <strong className="text-ink">
                  {content.security_score.score >= 80 ? "STRONG" : content.security_score.score >= 60 ? "MODERATE" : "AT RISK"}
                </strong>
              </p>
              <p className="mt-1 font-mono text-[11px] text-faint">
                Total penalty: -{content.security_score.totalPenalties} pts across categories
              </p>
            </div>

            <div className="sm:col-span-2 flex flex-col justify-center text-sm leading-relaxed text-muted">
              <p>
                During this assessment period, Harizeon conducted non-invasive and verified external security testing across{" "}
                <strong className="text-ink">{content.summary.assets_tested} verified asset perimeters</strong>.
                A total of <strong className="text-ink">{content.summary.open_findings} active findings</strong> require remediation.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 font-mono text-xs">
                <div className="border border-line px-3 py-1 text-ink">
                  CRITICAL: <strong>{content.summary.severity_counts.critical || 0}</strong>
                </div>
                <div className="border border-line px-3 py-1 text-ink">
                  HIGH: <strong>{content.summary.severity_counts.high || 0}</strong>
                </div>
                <div className="border border-line px-3 py-1 text-ink">
                  MEDIUM: <strong>{content.summary.severity_counts.medium || 0}</strong>
                </div>
                <div className="border border-line px-3 py-1 text-ink">
                  LOW: <strong>{content.summary.severity_counts.low || 0}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Top Risks */}
          {content.top_risks.length > 0 && (
            <div className="mt-6">
              <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink">
                Primary Threat Vectors Requiring Immediate Attention
              </h3>
              <div className="mt-3 flex flex-col gap-2">
                {content.top_risks.map((risk, idx) => (
                  <div key={idx} className="flex items-start gap-3 border border-line p-3 text-xs">
                    <SeverityChip severity={risk.severity} />
                    <div>
                      <div className="font-mono font-bold text-ink">{risk.title}</div>
                      <div className="font-mono text-[11px] text-muted">Host: {risk.asset}</div>
                      <p className="mt-1 text-muted">{risk.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Section 2: Scope */}
        <section className="mt-8 border-b border-line pb-8">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted">
            02 / Scope of Monitored Assets
          </h2>
          <p className="mt-1 text-xs text-muted">
            Inspection was strictly restricted to verified assets owned or authorized by the organization (§12).
          </p>

          <div className="mt-4 overflow-x-auto border border-line">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-line bg-subtle uppercase text-muted">
                <tr>
                  <th className="p-2.5">Asset Target</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Criticality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {content.scope.map((a, i) => (
                  <tr key={i}>
                    <td className="p-2.5 font-bold text-ink">{a.value}</td>
                    <td className="p-2.5 text-muted">{a.type}</td>
                    <td className="p-2.5 uppercase text-ink">{a.criticality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Findings Detail */}
        <section className="mt-8 border-b border-line pb-8">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted">
            03 / Findings & Vulnerability Analysis
          </h2>

          <div className="mt-4 flex flex-col gap-6">
            {content.findings.map((f) => (
              <div key={f.id} className="border border-line bg-canvas p-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
                  <div className="flex items-center gap-2">
                    <SeverityChip severity={f.severity} />
                    <span className="font-mono text-sm font-bold text-ink">{f.title}</span>
                  </div>
                  <div className="font-mono text-[11px] text-faint">
                    CVSS: <strong className="text-ink">{f.cvss}</strong> · ID: {f.id}
                  </div>
                </div>

                <div className="mt-2 font-mono text-[11px] text-muted">
                  Affected Target: <strong className="text-ink">{f.asset}</strong> | Category: {f.category}
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                      What it is
                    </span>
                    <p className="mt-1 leading-relaxed text-ink whitespace-pre-line">{f.what_it_is}</p>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                      Why it matters (Risk)
                    </span>
                    <p className="mt-1 leading-relaxed text-ink">{f.why_it_matters}</p>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                      How to fix (Remediation)
                    </span>
                    <p className="mt-1 leading-relaxed text-ink">{f.remediation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Prioritized Remediation Plan */}
        <section className="mt-8 border-b border-line pb-8">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted">
            04 / Prioritized Remediation Plan
          </h2>
          <p className="mt-1 text-xs text-muted">
            Recommended sequence of engineering actions ordered by risk reduction per unit of remediation effort.
          </p>

          <div className="mt-4 overflow-x-auto border border-line">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-line bg-subtle uppercase text-muted">
                <tr>
                  <th className="p-2.5">Priority</th>
                  <th className="p-2.5">Severity</th>
                  <th className="p-2.5">Finding & Target</th>
                  <th className="p-2.5">Effort</th>
                  <th className="p-2.5">Required Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {content.remediation_plan.map((item) => (
                  <tr key={item.priority}>
                    <td className="p-2.5 font-bold text-ink">#{item.priority}</td>
                    <td className="p-2.5">
                      <SeverityChip severity={item.severity} />
                    </td>
                    <td className="p-2.5">
                      <span className="font-bold text-ink">{item.title}</span>
                      <div className="text-[10px] text-muted">{item.asset}</div>
                    </td>
                    <td className="p-2.5 uppercase text-muted">{item.effort}</td>
                    <td className="p-2.5 text-ink">{item.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Compliance mapping (evidence for auditors) */}
        {content.compliance && content.compliance.length > 0 && (
          <section className="mt-8 border-b border-line pb-8">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted">
              05 / Compliance Control Mapping
            </h2>
            <p className="mt-1 text-xs text-muted">
              Findings grouped by the controls they touch. A control marked ATTENTION has at least one
              open finding; &quot;no findings detected&quot; is not a statement of compliance.
            </p>

            {content.compliance.map((fw) => (
              <div key={fw.framework} className="mt-5">
                <div className="flex items-baseline justify-between border-b border-line pb-1">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink">
                    {fw.framework}
                  </h3>
                  <span className="font-mono text-[11px] text-muted">
                    {fw.open_findings} open finding{fw.open_findings === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="mt-2 overflow-x-auto border border-line">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="border-b border-line bg-subtle uppercase text-muted">
                      <tr>
                        <th className="p-2.5">Control</th>
                        <th className="p-2.5">Requirement</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {fw.controls.map((c) => (
                        <tr key={`${fw.framework}-${c.control}`}>
                          <td className="p-2.5 font-bold text-ink">{c.control}</td>
                          <td className="p-2.5 text-muted">{c.title}</td>
                          <td className="p-2.5">
                            {c.status === "attention" ? (
                              <div>
                                <span className="font-bold text-ink">[!] ATTENTION</span>
                                <ul className="mt-1 space-y-0.5">
                                  {c.findings.map((f) => (
                                    <li key={f.id} className="text-[10px] text-muted">
                                      <SeverityChip severity={f.severity} /> {f.title} — {f.asset}
                                      {f.status !== "open" ? ` (${f.status})` : ""}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <span className="text-muted">no findings detected</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Section 6: Appendix & Disclaimer */}
        <footer className="mt-8 pt-4 font-mono text-[11px] text-muted leading-relaxed">
          <div className="border border-line bg-subtle p-4">
            <strong className="text-ink">METHODOLOGY & LEGAL DISCLAIMER (§09.2):</strong>
            <p className="mt-1">{content.disclaimer}</p>
            <p className="mt-2 text-faint">
              Harizeon Security Engine · Generated for {content.org_name} · Verification Token: {content.id}
            </p>
          </div>
        </footer>
      </article>
    </div>
  );
}
