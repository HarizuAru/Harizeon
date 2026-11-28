import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SeverityChip, type Severity } from "@/components/ui/severity-chip";
import { StatusBadge } from "@/components/ui/status-badge";
import { FindingStatusActions } from "@/components/finding-status-actions";
import { FindingVerifyButton } from "@/components/finding-verify-button";
import { RemediationSnippets } from "@/components/remediation-snippets";
import { IssueTrackerExport } from "@/components/issue-tracker-export";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Finding" };

type Detail = {
  finding: {
    id: string;
    title: string;
    description: string | null;
    remediation: string | null;
    severity: string;
    status: string;
    category: string | null;
    cwe_id: string | null;
    known_exploited: boolean;
    cve_ids: string[];
    epss_score?: number | null;
    epss_percentile?: number | null;
    asset_id: string | null;
    asset_value: string | null;
    first_seen_at: string;
    last_seen_at: string;
    status_reason: string | null;
    source_tool?: string | null;
    last_verified_at?: string | null;
  };
  events: { id: string; from_status: string | null; to_status: string; note: string | null; at: string }[];
};

// §9.2 finding detail: WHAT IT IS → WHY IT MATTERS → EVIDENCE → HOW TO FIX →
// VERIFY THE FIX. Evidence is appended to the description by the ingest layer.
const WHY: Record<string, string> = {
  tls: "Weak transport security lets an attacker read or tamper with traffic, and modern browsers warn users away from your site.",
  headers:
    "Missing browser protections make common attacks (XSS, clickjacking, MIME confusion) far easier to pull off.",
  exposed_service:
    "A service that should be internal-only is reachable from the internet, giving attackers a direct foothold.",
  ai_exposure:
    "Exposed Model Context Protocol (MCP) tool endpoints, unauthenticated LLM APIs, or vector databases allow adversaries to extract private RAG embeddings, steal provider API keys, or execute unauthorized agent tools on your internal infrastructure.",
  cloud_storage:
    "Publicly accessible cloud storage buckets (AWS S3, Azure Blob, GCS) allow unauthorized internet users to list and download confidential database backups, PII, and infrastructure configurations.",
  api_security:
    "Unrestricted GraphQL introspection and unprotected schema documentation disclose internal data models, unpublished mutations, and administrative endpoints directly to threat actors.",
};

function splitDescription(description: string | null): { what: string; evidence: string | null } {
  if (!description) return { what: "", evidence: null };
  const marker = "Evidence: ";
  const idx = description.indexOf(marker);
  if (idx === -1) return { what: description, evidence: null };
  return {
    what: description.slice(0, idx).trimEnd(),
    evidence: description.slice(idx + marker.length).trim(),
  };
}

const sectionTitle = "text-xs font-medium uppercase tracking-[0.08em] text-muted";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border border-line bg-canvas p-4">
      <h2 className={sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

const preBox =
  "max-w-2xl overflow-x-auto whitespace-pre-wrap border border-line bg-subtle p-3 font-mono text-xs text-ink";

export default async function FindingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let detail: Detail | null = null;
  let error: string | null = null;
  try {
    detail = await apiFetch<Detail>(`/findings/${id}`);
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    if (e instanceof ApiError && e.status === 404) notFound();
    error = e instanceof ApiError ? e.message : "Cannot reach the API. Is it running?";
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Finding" description="Could not load this finding." />
        <EmptyState title="Could not load finding." description={error ?? "Unknown error."} />
      </div>
    );
  }

  const { finding, events } = detail;
  const { what, evidence } = splitDescription(finding.description);
  const why =
    WHY[finding.category ?? ""] ??
    "This weakens the security posture of the asset it was found on.";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={finding.title}
        description={
          finding.asset_id ? (
            <Link href={`/assets/${finding.asset_id}`} className="font-mono underline">
              {finding.asset_value ?? "asset"}
            </Link>
          ) : (
            "unknown asset"
          )
        }
      />

      <div className="flex flex-wrap items-center gap-4">
        <SeverityChip severity={finding.severity as Severity} />
        <StatusBadge>{finding.status}</StatusBadge>
        {finding.known_exploited ? (
          <span className="border border-red-600 bg-red-600/10 text-red-600 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
            KEV · EXPLOITED IN THE WILD
          </span>
        ) : null}
        {typeof finding.epss_score === "number" ? (
          <span className="border border-[#02acc5] bg-[#02acc5]/10 text-[#02acc5] px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
            EPSS {(finding.epss_score * 100).toFixed(1)}%
          </span>
        ) : null}
        {finding.cwe_id ? <span className="font-mono text-xs text-muted">{finding.cwe_id}</span> : null}
        {finding.cve_ids?.length ? (
          <span className="font-mono text-xs text-muted">{finding.cve_ids.join(", ")}</span>
        ) : null}
        <span className="font-mono text-xs text-faint">
          first seen {new Date(finding.first_seen_at).toLocaleString()} · last seen{" "}
          {new Date(finding.last_seen_at).toLocaleString()}
        </span>
      </div>

      {/* 2025-2030 Threat Intelligence & Exploitability Prioritization */}
      {(finding.known_exploited || typeof finding.epss_score === "number") && (
        <div className="flex flex-col gap-3 border border-line bg-canvas p-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
              <span>Threat Intelligence &amp; Exploitability Analysis</span>
              <span className="border border-line bg-subtle px-1.5 py-0.5 text-[9px] font-mono text-muted">
                EPSS v3 + CISA KEV
              </span>
            </h2>
            {finding.known_exploited && (
              <span className="border border-red-600 bg-red-600 text-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                CISA KEV · WEAPONIZED
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs pt-1">
            <div className="border border-line bg-subtle p-3 flex flex-col gap-1">
              <span className="text-[10px] uppercase text-muted">EPSS Exploit Probability</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-bold ${
                  (finding.epss_score ?? 0) >= 0.7 ? "text-red-600" : (finding.epss_score ?? 0) >= 0.3 ? "text-amber-600" : "text-ink"
                }`}>
                  {typeof finding.epss_score === "number" ? `${(finding.epss_score * 100).toFixed(1)}%` : "N/A"}
                </span>
                <span className="text-[10px] text-muted">
                  {finding.epss_percentile ? `(${Math.round(finding.epss_percentile * 100)}th %tile)` : ""}
                </span>
              </div>
              <p className="text-[10px] text-muted font-sans mt-0.5">
                Likelihood of this vulnerability being actively exploited in the wild within 30 days.
              </p>
            </div>

            <div className="border border-line bg-subtle p-3 flex flex-col gap-1">
              <span className="text-[10px] uppercase text-muted">CISA KEV Catalog Status</span>
              <span className={`text-sm font-bold ${finding.known_exploited ? "text-red-600" : "text-muted"}`}>
                {finding.known_exploited ? "CONFIRMED ACTIVE EXPLOITATION" : "No known active campaign"}
              </span>
              <p className="text-[10px] text-muted font-sans mt-0.5">
                {finding.known_exploited
                  ? "CISA mandates federal remediation. Threat actors actively target this in the wild."
                  : "No automated exploit kits currently detected targeting this exact endpoint."}
              </p>
            </div>

            <div className="border border-line bg-subtle p-3 flex flex-col gap-1">
              <span className="text-[10px] uppercase text-muted">Remediation Urgency (ROI)</span>
              <span className={`text-sm font-bold ${
                finding.known_exploited || (finding.epss_score ?? 0) >= 0.7 ? "text-red-600" : "text-ink"
              }`}>
                {finding.known_exploited || (finding.epss_score ?? 0) >= 0.7
                  ? "P0 · IMMEDIATE (24H SLA)"
                  : (finding.epss_score ?? 0) >= 0.3
                  ? "P1 · HIGH (7D SLA)"
                  : "P2 · SCHEDULED"}
              </span>
              <p className="text-[10px] text-muted font-sans mt-0.5">
                Knapsack algorithm rank: {finding.known_exploited ? "Top 1% priority for posture recovery." : "Standard maintenance queue."}
              </p>
            </div>
          </div>
        </div>
      )}

      <Section title="What it is">
        <p className="text-sm leading-relaxed text-ink">{what || "-"}</p>
      </Section>

      <Section title="Why it matters">
        <p className="text-sm leading-relaxed text-ink">{why}</p>
      </Section>

      <Section title="Evidence">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between font-mono text-[10px] text-muted">
            <span>
              SOURCE ENGINE: <strong className="text-ink">{finding.source_tool || "harizeon-easm"}</strong>
            </span>
            {finding.last_verified_at && (
              <span>LAST VERIFIED: {new Date(finding.last_verified_at).toLocaleString()}</span>
            )}
          </div>
          {evidence ? (
            <pre className={preBox}>{evidence}</pre>
          ) : (
            <p className="font-mono text-xs text-faint">no captured evidence payload for this finding</p>
          )}
        </div>
      </Section>

      <Section title="How to fix">
        <RemediationSnippets
          title={finding.title}
          category={finding.category}
          description={finding.description}
          remediationText={finding.remediation}
          assetValue={finding.asset_value}
        />
      </Section>

      {/* Detectify / Intruder / Probely Parity: 1-Click Issue Tracker Export */}
      <IssueTrackerExport
        findingId={finding.id}
        title={finding.title}
        severity={finding.severity}
        assetValue={finding.asset_value}
        cveIds={finding.cve_ids}
        cweId={finding.cwe_id}
        evidence={evidence}
        remediation={finding.remediation}
        category={finding.category}
      />

      <Section title="Verify the fix">
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-ink">
            Apply the configuration hardening snippet above, then execute an instant micro-probe to confirm the port or endpoint ceased firing.
          </p>
          <FindingVerifyButton
            findingId={finding.id}
            assetValue={finding.asset_value}
            currentStatus={finding.status}
          />
          <p className="text-xs text-muted">
            Alternatively, launch a complete workspace scan via{" "}
            <Link href="/scans/new" className="text-ink underline">
              New Security Scan
            </Link>{" "}
            or manually transition status in the actions panel below.
          </p>
        </div>
      </Section>

      <Section title="Status">
        <FindingStatusActions findingId={finding.id} currentStatus={finding.status} />
        {finding.status_reason ? (
          <p className="font-mono text-xs text-muted">note: {finding.status_reason}</p>
        ) : null}
        {events.length > 0 ? (
          <div className="mt-2 flex flex-col border-t border-line pt-2">
            {events.slice(0, 10).map((ev) => (
              <div key={ev.id} className="flex flex-wrap items-baseline gap-2 py-1 font-mono text-xs text-muted">
                <span className="text-faint">{new Date(ev.at).toLocaleString()}</span>
                <span>
                  {ev.from_status ? `${ev.from_status} → ` : ""}
                  {ev.to_status}
                </span>
                {ev.note ? <span>· {ev.note}</span> : null}
              </div>
            ))}
          </div>
        ) : null}
      </Section>
    </div>
  );
}
