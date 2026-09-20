"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";

export interface AuditLogItem {
  id: string;
  org_id: string;
  actor_type: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  ip: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function AuditLogManager({ initialLogs }: { initialLogs: AuditLogItem[] }) {
  const [logs] = useState<AuditLogItem[]>(initialLogs);
  const [filterAction, setFilterAction] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (filterAction === "all") return true;
    return log.action.startsWith(filterAction);
  });

  function exportCSV() {
    const headers = ["ID", "Timestamp", "Actor Type", "Actor ID", "Action", "Target Type", "Target ID", "IP Address", "Metadata"];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.created_at,
      l.actor_type,
      l.actor_id ?? "",
      l.action,
      l.target_type ?? "",
      l.target_id ?? "",
      l.ip ?? "",
      JSON.stringify(l.metadata).replace(/"/g, '""'),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `harizeon-audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Security Audit Trail"
          description="Tamper-evident append-only ledger tracking all authentication, scans, asset verifications, and permission mutations."
        />
        <button
          onClick={exportCSV}
          className="self-start sm:self-auto border border-ink bg-canvas px-4 py-2 font-mono text-xs uppercase tracking-[0.05em] text-ink hover:bg-ink hover:text-canvas transition-colors"
        >
          Export CSV Log
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-4 border border-line bg-canvas p-4 font-mono text-xs">
        <span className="text-muted uppercase">Action Category:</span>
        <div className="flex flex-wrap gap-2">
          {["all", "asset", "scan", "finding", "member", "apikey", "billing"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterAction(cat)}
              className={`border px-2 py-1 uppercase ${
                filterAction === cat
                  ? "border-ink bg-ink text-canvas font-bold"
                  : "border-line bg-canvas text-ink hover:border-ink"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="border border-line bg-canvas">
        <div className="p-4 border-b border-line flex items-center justify-between">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
            Audit Records ({filteredLogs.length})
          </h2>
          <span className="font-mono text-xs text-muted">Immutable Ledger</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-line bg-subtle text-muted uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Timestamp (UTC)</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-subtle">
                  <td className="px-4 py-3 text-muted">
                    {new Date(log.created_at).toISOString().replace("T", " ").replace("Z", "")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="border border-line px-1.5 py-0.5 text-[10px] uppercase">
                      {log.actor_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-ink">{log.action}</td>
                  <td className="px-4 py-3 text-muted">
                    {log.target_type ? `${log.target_type}:${log.target_id?.slice(0, 8) ?? ""}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">{log.ip ?? "internal"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="border border-line px-2 py-0.5 text-[10px] uppercase hover:border-ink"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg border border-line bg-canvas p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
                Audit Event Inspector
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="font-mono text-xs text-muted hover:text-ink"
              >
                [ESC]
              </button>
            </div>

            <div className="flex flex-col gap-2 font-mono text-xs">
              <div>
                <span className="text-muted block text-[10px]">EVENT ID:</span>
                <span className="text-ink font-bold">{selectedLog.id}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">ACTION:</span>
                <span className="text-ink font-bold">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">TIMESTAMP:</span>
                <span className="text-ink">{selectedLog.created_at}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">ACTOR:</span>
                <span className="text-ink">{selectedLog.actor_type} ({selectedLog.actor_id ?? "system"})</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">IP & USER AGENT:</span>
                <span className="text-ink">{selectedLog.ip ?? "None"} · {selectedLog.user_agent ?? "None"}</span>
              </div>

              <div className="pt-2">
                <span className="text-muted block text-[10px] mb-1">EVENT METADATA (JSON):</span>
                <pre className="border border-line bg-subtle p-3 text-[11px] text-ink overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-line">
              <button
                onClick={() => setSelectedLog(null)}
                className="border border-line px-4 py-2 font-mono text-xs uppercase hover:border-ink"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
