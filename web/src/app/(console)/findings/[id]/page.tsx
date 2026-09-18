import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SeverityChip, type Severity } from "@/components/ui/severity-chip";
import { StatusBadge } from "@/components/ui/status-badge";
import { FindingStatusActions } from "@/components/finding-status-actions";
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
    asset_id: string | null;
    asset_value: string | null;
    first_seen_at: string;
    last_seen_at: string;
    status_reason: string | null;
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
        {finding.cwe_id ? <span className="font-mono text-xs text-muted">{finding.cwe_id}</span> : null}
        <span className="font-mono text-xs text-faint">
          first seen {new Date(finding.first_seen_at).toLocaleString()} · last seen{" "}
          {new Date(finding.last_seen_at).toLocaleString()}
        </span>
      </div>

      <Section title="What it is">
        <p className="text-sm leading-relaxed text-ink">{what || "—"}</p>
      </Section>

      <Section title="Why it matters">
        <p className="text-sm leading-relaxed text-ink">{why}</p>
      </Section>

      <Section title="Evidence">
        {evidence ? <pre className={preBox}>{evidence}</pre> : <p className="font-mono text-xs text-faint">no captured evidence for this finding</p>}
      </Section>

      <Section title="How to fix">
        <p className="max-w-2xl text-sm leading-relaxed text-ink">
          {finding.remediation ?? "No remediation recorded yet."}
        </p>
      </Section>

      <Section title="Verify the fix">
        <p className="text-sm leading-relaxed text-ink">
          Rescan the asset after applying the fix — this finding will stop firing.{" "}
          <Link href="/scans/new" className="text-ink underline">
            Start a new scan
          </Link>{" "}
          or mark it fixed manually below.
        </p>
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
