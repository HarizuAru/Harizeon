import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { SeverityChip, type Severity } from "@/components/ui/severity-chip";

export const metadata: Metadata = { title: "Findings" };

type Row = {
  severity: Severity;
  title: string;
  asset: string;
  firstSeen: string;
  status: string;
};

const columns: Column<Row>[] = [
  { key: "severity", header: "Severity", render: (r) => <SeverityChip severity={r.severity} /> },
  { key: "title", header: "Title" },
  { key: "asset", header: "Asset", mono: true },
  { key: "firstSeen", header: "First seen", mono: true },
  { key: "status", header: "Status" },
];

const LEGEND: Severity[] = ["critical", "high", "medium", "low", "info"];

export default function FindingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Findings"
        description="The daily-driver screen. W07 wires the real queue, filters, and status workflow."
      />

      <div className="flex flex-wrap items-center gap-2 border border-line bg-canvas p-3">
        <span className="mr-1 text-xs font-medium uppercase tracking-[0.08em] text-muted">
          Severity markers
        </span>
        {LEGEND.map((s) => (
          <SeverityChip key={s} severity={s} />
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={[]}
        rowKey={(r) => `${r.asset}:${r.title}`}
        empty="No open findings. Nothing has been scanned yet."
      />
    </div>
  );
}
