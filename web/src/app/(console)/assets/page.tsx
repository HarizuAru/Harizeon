import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Assets" };

type Row = {
  value: string;
  type: string;
  verified: string;
  findings: number;
  lastScan: string;
  criticality: string;
};

const columns: Column<Row>[] = [
  { key: "value", header: "Value", mono: true },
  { key: "type", header: "Type" },
  { key: "verified", header: "Verified" },
  { key: "findings", header: "Findings", align: "right", mono: true },
  { key: "lastScan", header: "Last scan", mono: true },
  { key: "criticality", header: "Crit" },
];

export default function AssetsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assets"
        description="Everything you own and have verified. W03 adds CRUD + DNS verification."
        actions={<Button>Add asset</Button>}
      />
      <DataTable
        columns={columns}
        rows={[]}
        rowKey={(r) => r.value}
        selectable
        empty="No assets. Harizeon can only scan what you prove you own."
      />
    </div>
  );
}
