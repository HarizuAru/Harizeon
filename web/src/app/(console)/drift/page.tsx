import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { SeverityChip, type Severity } from "@/components/ui/severity-chip";
import { apiFetch, ApiError } from "@/lib/api";

export const metadata: Metadata = { title: "Attack Surface Drift" };

export interface DriftEventItem {
  id: string;
  org_id: string;
  asset_id: string;
  asset_value?: string;
  scan_id: string;
  event_type:
    | "NEW_SUBDOMAIN_DETECTED"
    | "NEW_PORT_EXPOSED"
    | "TLS_CERT_EXPIRING_SOON"
    | "FINDING_INTRODUCED"
    | "FINDING_REGRESSED"
    | "FINDING_RESOLVED";
  severity: Severity;
  summary: string;
  details?: Record<string, unknown>;
  created_at: string;
}

const EVENT_LABELS: Record<string, string> = {
  NEW_SUBDOMAIN_DETECTED: "NEW SUBDOMAIN",
  NEW_PORT_EXPOSED: "PORT EXPOSURE",
  TLS_CERT_EXPIRING_SOON: "CERT EXPIRING",
  FINDING_INTRODUCED: "NEW VULNERABILITY",
  FINDING_REGRESSED: "REGRESSION",
  FINDING_RESOLVED: "RESOLVED CLEAN",
};

const columns: Column<DriftEventItem>[] = [
  {
    key: "event_type",
    header: "Drift Type",
    mono: true,
    render: (r) => (
      <span className="border border-line bg-subtle px-1.5 py-0.5 text-[10px] font-bold text-ink">
        {EVENT_LABELS[r.event_type] || r.event_type}
      </span>
    ),
  },
  {
    key: "severity",
    header: "Severity",
    render: (r) => <SeverityChip severity={r.severity} />,
  },
  {
    key: "summary",
    header: "Summary & Impact",
    render: (r) => (
      <div className="flex flex-col gap-0.5 max-w-lg">
        <span className="text-xs text-ink font-medium">{r.summary}</span>
        {r.asset_value && (
          <Link href={`/assets/${r.asset_id}`} className="font-mono text-[10px] text-muted underline">
            {r.asset_value}
          </Link>
        )}
      </div>
    ),
  },
  {
    key: "scan_id",
    header: "Origin Scan",
    mono: true,
    render: (r) => (
      <Link href={`/scans/${r.scan_id}`} className="text-xs text-ink underline">
        {r.scan_id}
      </Link>
    ),
  },
  {
    key: "created_at",
    header: "Detected",
    mono: true,
    render: (r) => new Date(r.created_at).toLocaleString(),
  },
];

export default async function DriftPage() {
  let events: DriftEventItem[] = [];
  let error: string | null = null;

  try {
    const res = await apiFetch<{ data: DriftEventItem[] }>("/drift");
    events = res.data ?? [];
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login");
    }
    error = e instanceof ApiError ? e.message : "Cannot reach the API. Is it running?";
  }

  const newSubdomains = events.filter((e) => e.event_type === "NEW_SUBDOMAIN_DETECTED").length;
  const newPorts = events.filter((e) => e.event_type === "NEW_PORT_EXPOSED").length;
  const certAlerts = events.filter((e) => e.event_type === "TLS_CERT_EXPIRING_SOON").length;
  const criticalDrifts = events.filter((e) => e.severity === "critical" || e.severity === "high").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Perimeter Drift & Attack Surface Delta"
        description="Continuous change detection across monitored infrastructure. Flags unannounced ports, newly published DNS records, and impending certificate expirations."
      />

      {/* Metrics Stat Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-line bg-canvas p-4 font-mono">
          <div className="text-[10px] uppercase text-muted">High Risk Delta</div>
          <div className={`text-2xl font-bold mt-1 ${criticalDrifts > 0 ? "text-ink underline" : "text-ink"}`}>
            {criticalDrifts}
          </div>
          <div className="text-[10px] text-faint mt-1">Requiring immediate audit</div>
        </div>

        <div className="border border-line bg-canvas p-4 font-mono">
          <div className="text-[10px] uppercase text-muted">New Subdomains</div>
          <div className="text-2xl font-bold mt-1 text-ink">{newSubdomains}</div>
          <div className="text-[10px] text-faint mt-1">Discovered via CT logs</div>
        </div>

        <div className="border border-line bg-canvas p-4 font-mono">
          <div className="text-[10px] uppercase text-muted">Open Ports Delta</div>
          <div className="text-2xl font-bold mt-1 text-ink">{newPorts}</div>
          <div className="text-[10px] text-faint mt-1">Exposed services changed</div>
        </div>

        <div className="border border-line bg-canvas p-4 font-mono">
          <div className="text-[10px] uppercase text-muted">Cert Expirations</div>
          <div className="text-2xl font-bold mt-1 text-ink">{certAlerts}</div>
          <div className="text-[10px] text-faint mt-1">Expiring within 30 days</div>
        </div>
      </div>

      {error ? (
        <EmptyState title="Could not load perimeter drift" description={error} />
      ) : events.length === 0 ? (
        <EmptyState
          title="No perimeter drift detected."
          description="Your attack surface is completely aligned with the previous scan baseline. No new ports, unexpected subdomains, or cert expirations found."
        />
      ) : (
        <div className="border border-line bg-canvas">
          <DataTable columns={columns} rows={events} rowKey={(r) => r.id} />
        </div>
      )}
    </div>
  );
}
