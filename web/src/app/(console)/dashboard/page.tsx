import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Did anything get worse since yesterday?"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Security score" value="—" hint="no data" />
        <StatTile label="Open findings" value="0" />
        <StatTile label="Assets monitored" value="0" />
        <StatTile label="Last scan" value="—" hint="never" />
      </div>

      <EmptyState
        title="No data yet. Add an asset to begin."
        description="Harizeon can only scan what you prove you own. Add a domain, verify it, then run your first scan."
        action={<Button>Add asset</Button>}
      />
    </div>
  );
}
