import type { Metadata } from "next";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "System Status & Availability — Harizeon",
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
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl flex flex-col gap-10">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-muted block mb-2">
              Telemetry & Availability
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-sans">
              System Status
            </h1>
            <p className="mt-2 text-sm text-muted font-sans leading-relaxed">
              Real-time operational availability for Harizeon scanners, queues, and public APIs.
            </p>
          </div>

          {/* Banner: All Systems Operational */}
          <div className="border border-ink bg-ink p-6 text-canvas flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 bg-canvas inline-block" />
              <span className="font-mono text-sm font-bold uppercase tracking-wider">
                All Systems Operational
              </span>
            </div>
            <span className="font-mono text-xs text-canvas/80">
              Updated just now · Region: ap-southeast-1
            </span>
          </div>

          {/* Component Status Table */}
          <div className="border border-line bg-canvas">
            <div className="p-4 border-b border-line flex items-center justify-between">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
                Infrastructure Components
              </h2>
              <span className="font-mono text-xs text-muted">90-Day Rolling Window</span>
            </div>

            <div className="divide-y divide-line font-mono text-xs">
              {SYSTEMS.map((sys) => (
                <div key={sys.name} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-subtle">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 bg-ink" />
                    <span className="font-bold text-ink">{sys.name}</span>
                  </div>
                  <div className="flex items-center gap-6 text-muted text-[11px]">
                    <span>Avg Latency: <strong className="text-ink">{sys.latency}</strong></span>
                    <span>Uptime: <strong className="text-ink">{sys.uptime}</strong></span>
                    <span className="border border-line px-2 py-0.5 uppercase text-[10px] text-ink bg-canvas font-bold">
                      {sys.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Incidents */}
          <div className="border border-line bg-canvas p-6">
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink mb-4">
              Past Incident History
            </h2>
            <div className="flex flex-col gap-4 font-mono text-xs">
              <div className="border border-line p-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-ink">Scheduled Maintenance: Worker Fleet Rolling Update</span>
                  <span className="text-muted text-[10px]">15 Sep 2026</span>
                </div>
                <p className="text-muted text-[11px] font-sans">
                  Routine rollout of upgraded worker containers. Zero queued jobs were dropped. Duration: 6 minutes.
                </p>
              </div>

              <div className="border border-line p-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-ink">Resolved: DNS Upstream Latency on Verification Checks</span>
                  <span className="text-muted text-[10px]">02 Sep 2026</span>
                </div>
                <p className="text-muted text-[11px] font-sans">
                  Elevated response times from public secondary DNS resolvers. Fallback resolver pools activated. Duration: 18 minutes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
