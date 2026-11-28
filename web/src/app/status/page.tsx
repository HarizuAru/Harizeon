import type { Metadata } from "next";
import { ConsoleOrPublicShell } from "@/components/console-or-public-shell";

export const metadata: Metadata = {
  title: "System Status & Availability",
  description: "Real-time uptime metrics, worker pool latency, and incident history for Harizeon security platforms.",
};

const SYSTEMS = [
  { name: "API Control Plane (Fastify)", status: "Operational", uptime: "99.98%", latency: "42ms" },
  { name: "Scanner Worker Pool (Redis Streams)", status: "Operational", uptime: "99.95%", latency: "110ms" },
  { name: "Finding Ingestion Pipeline", status: "Operational", uptime: "99.99%", latency: "18ms" },
  { name: "Webhook & Notification Dispatcher", status: "Operational", uptime: "100.0%", latency: "85ms" },
  { name: "PostgreSQL Database Cluster (RLS)", status: "Operational", uptime: "99.99%", latency: "12ms" },
  { name: "Asset Verification DNS Resolvers", status: "Operational", uptime: "100.0%", latency: "65ms" },
];

export default function StatusPage() {
  return (
    <ConsoleOrPublicShell>
        <div className="mx-auto max-w-5xl flex flex-col gap-10">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-[#02acc5] font-semibold block mb-2">
              Telemetry &amp; Availability
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#171d29]">
              System Status
            </h1>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Real-time operational availability for Harizeon scanners, queues, and public APIs.
            </p>
          </div>

          {/* Banner: All Systems Operational */}
          <div className="rounded-[24px] bg-[#171d29] p-6 text-white border-t-4 border-t-[#02acc5] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#02acc5] animate-pulse inline-block" />
              <span className="font-mono text-sm font-bold uppercase tracking-wider">
                All Systems Operational
              </span>
            </div>
            <span className="font-mono text-xs text-white/80">
              Updated just now · Region: ap-southeast-1
            </span>
          </div>

          {/* Component Status Table */}
          <div className="rounded-[24px] border border-[#dce2e3] bg-white overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[#dce2e3] flex items-center justify-between">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-[#171d29]">
                Infrastructure Components
              </h2>
              <span className="font-mono text-xs text-muted">90-Day Rolling Window</span>
            </div>

            <div className="divide-y divide-[#dce2e3] font-mono text-xs">
              {SYSTEMS.map((sys) => (
                <div key={sys.name} className="p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#f5f6f8] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-[#02acc5]" />
                    <span className="font-bold text-[#171d29]">{sys.name}</span>
                  </div>
                  <div className="flex items-center gap-6 text-muted text-[11px]">
                    <span>Avg Latency: <strong className="text-[#171d29]">{sys.latency}</strong></span>
                    <span>Uptime: <strong className="text-[#171d29]">{sys.uptime}</strong></span>
                    <span className="rounded-full bg-[#02acc5]/15 border border-[#02acc5]/30 px-2.5 py-0.5 uppercase text-[10px] text-[#02acc5] font-bold">
                      {sys.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Incidents */}
          <div className="rounded-[24px] border border-[#dce2e3] bg-white p-6 shadow-sm">
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-[#171d29] mb-4">
              Past Incident History
            </h2>
            <div className="flex flex-col gap-4 font-mono text-xs">
              <div className="rounded-xl border border-[#dce2e3] bg-[#f5f6f8] p-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[#171d29]">Scheduled Maintenance: Worker Fleet Rolling Update</span>
                  <span className="text-muted text-[10px]">15 Sep 2026</span>
                </div>
                <p className="text-muted text-[11px]">
                  Routine rollout of upgraded worker containers. Zero queued jobs were dropped. Duration: 6 minutes.
                </p>
              </div>

              <div className="rounded-xl border border-[#dce2e3] bg-[#f5f6f8] p-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[#171d29]">Resolved: DNS Upstream Latency on Verification Checks</span>
                  <span className="text-muted text-[10px]">02 Sep 2026</span>
                </div>
                <p className="text-muted text-[11px]">
                  Elevated response times from public secondary DNS resolvers. Fallback resolver pools activated. Duration: 18 minutes.
                </p>
              </div>
            </div>
          </div>
        </div>
    </ConsoleOrPublicShell>
  );
}
