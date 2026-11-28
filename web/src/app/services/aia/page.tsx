import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Harizeon AI-Armor (AIA) · LLM, Vector DB & Agent Perimeter Defense",
  description:
    "External attack surface management for modern AI builders: detection of unauthenticated LLM inference endpoints, exposed vector databases, unauthenticated agent tool execution, and client-side AI key leaks.",
};

const VECTORS = [
  {
    num: "01",
    title: "Unauthenticated LLM Inference Endpoints",
    ports: "11434 (Ollama), 8000 (vLLM), 1234 (LM Studio), 8080 (LocalAI)",
    description:
      "Detects publicly exposed inference servers. Without authentication, anyone on the internet can list private models, execute generation queries on your GPU infrastructure, and inspect fine-tuned models.",
    mitigation: "Bind inference daemons to localhost, require API key gates, or isolate within private cloud VPC subnets.",
  },
  {
    num: "02",
    title: "Vector Database & RAG Storage Exposures",
    ports: "8000 (ChromaDB), 6333 (Qdrant), 19530 (Milvus), 8080 (Weaviate)",
    description:
      "Discovers unauthenticated vector search databases powering Retrieval-Augmented Generation. Unauthenticated access allows extraction of proprietary embeddings, document chunks, and customer knowledge bases.",
    mitigation: "Enable database token authentication, configure firewall rules, and never expose default vector ports publicly.",
  },
  {
    num: "03",
    title: "Client-Side AI Provider Credential Leaks",
    ports: "Client-side JavaScript bundles (HTTP/HTTPS)",
    description:
      "Deeply analyzes client JavaScript bundles for leaked provider tokens (OpenAI sk-proj-, Anthropic sk-ant-, Gemini AIza, DeepSeek, Groq, Mistral, Together AI). Verified with Shannon entropy to eliminate dummy constants.",
    mitigation: "Remove embedded keys immediately, rotate provider credentials, and proxy AI calls through an authenticated backend.",
  },
  {
    num: "04",
    title: "Shadow Agent & MCP Tool Execution Endpoints",
    ports: "3000, 7860 (Flowise/Langflow), /mcp, /sse (Model Context Protocol)",
    description:
      "Audits exposed agent pipelines and unauthenticated Model Context Protocol (MCP) server endpoints that allow external callers to execute internal tools, databases, and filesystem integrations.",
    mitigation: "Enforce bearer token authentication on all agent orchestrators and MCP transport endpoints.",
  },
];

const COMPLIANCE_ROWS = [
  {
    framework: "OWASP Top 10 for LLMs",
    control: "LLM01: Prompt Injection & Model Abuse",
    focus: "Unauthenticated inference endpoints exposing model parameters and compute.",
  },
  {
    framework: "OWASP Top 10 for LLMs",
    control: "LLM02: Sensitive Information Disclosure",
    focus: "Vector database RAG leaks and client-side AI provider API key exposure.",
  },
  {
    framework: "OWASP Top 10 for LLMs",
    control: "LLM06: Excessive Agency",
    focus: "Unauthenticated agent workflow orchestrators and MCP tool execution interfaces.",
  },
  {
    framework: "ISO/IEC 42001:2023",
    control: "A.6.2 Data Protection for AI Systems",
    focus: "Protection of vector embeddings, fine-tuning datasets, and training documents.",
  },
  {
    framework: "ISO/IEC 42001:2023",
    control: "A.8.4 AI Resource Access Control",
    focus: "Access authorization for inference compute, model endpoints, and LLM APIs.",
  },
];

export default function ServiceAiArmorPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f8] text-[#171d29]">
      <PublicHeader />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl flex flex-col gap-12">
          {/* Header & Breadcrumb */}
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-muted mb-4">
              <Link href="/services" className="hover:text-[#02acc5] transition-colors">Services</Link>
              <span>/</span>
              <span className="text-[#02acc5] font-bold">AIA</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-lg border border-[#02acc5]/30 bg-[#02acc5]/10 px-3 py-1 font-mono text-base font-bold text-[#02acc5]">
                AIA
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#171d29]">
                Harizeon AI-Armor
              </h1>
            </div>

            <p className="mt-4 text-base text-muted max-w-3xl leading-relaxed">
              The external attack surface management engine engineered specifically for modern AI startups, SaaS companies, and GenAI builders. Continuous discovery and non-destructive validation across your entire AI perimeter.
            </p>
          </div>

          {/* Quick CTA banner */}
          <div className="rounded-[24px] bg-[#171d29] text-white p-7 border-t-4 border-t-[#02acc5] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white block mb-1">
                Fast AI Perimeter Audit · 30 Seconds
              </span>
              <p className="text-xs text-[#dce2e3]">
                Available on all plans including Free. Probes model endpoints, vector databases, and client tokens.
              </p>
            </div>
            <Link
              href="/scans/new"
              className="bg-[#02acc5] text-white px-5 py-2.5 font-mono text-xs font-bold uppercase hover:bg-[#029cb3] transition-colors whitespace-nowrap"
            >
              Launch AI Scan →
            </Link>
          </div>

          {/* 4 Core Threat Vectors */}
          <div className="rounded-[24px] border border-[#dce2e3] bg-white p-8 shadow-sm">
            <h2 className="font-mono text-base font-bold uppercase tracking-wider text-[#171d29] mb-6">
              AI Surface Vectors Inspected
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              {VECTORS.map((v) => (
                <div key={v.num} className="rounded-xl border border-[#dce2e3] bg-[#f5f6f8] p-5.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#02acc5] font-bold">{v.num}.</span>
                      <span className="rounded-full border border-[#dce2e3] bg-white px-2 py-0.5 text-[10px] text-muted">
                        NON-DESTRUCTIVE
                      </span>
                    </div>
                    <span className="font-bold text-[#171d29] text-sm block mb-1">
                      {v.title}
                    </span>
                    <span className="text-[10px] text-muted block mb-3 font-mono">
                      Targets: {v.ports}
                    </span>
                    <p className="text-muted text-[11px] leading-relaxed mb-4">
                      {v.description}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#dce2e3] text-[11px] text-muted">
                    <strong className="text-[#171d29]">Remediation:</strong> {v.mitigation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance & Governance Matrix */}
          <div className="rounded-[24px] border border-[#dce2e3] bg-white p-8 shadow-sm">
            <h2 className="font-mono text-base font-bold uppercase tracking-wider text-[#171d29] mb-2">
              Compliance &amp; Governance Mapping
            </h2>
            <p className="text-xs text-muted mb-6">
              Findings map directly to recognized international AI risk frameworks to provide auditor-ready proof.
            </p>

            <div className="overflow-x-auto rounded-xl border border-[#dce2e3]">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b border-[#dce2e3] bg-[#f5f6f8] text-muted text-[11px] uppercase">
                  <tr>
                    <th className="p-3.5">Framework</th>
                    <th className="p-3.5">Control Reference</th>
                    <th className="p-3.5">Threat Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dce2e3] text-xs">
                  {COMPLIANCE_ROWS.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#f5f6f8] transition-colors">
                      <td className="p-3.5 font-mono text-[#171d29] font-bold">{row.framework}</td>
                      <td className="p-3.5 font-mono text-muted">{row.control}</td>
                      <td className="p-3.5 text-muted">{row.focus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Technical Implementation & Safety Note (§12) */}
          <div className="rounded-[24px] border border-[#dce2e3] bg-white p-8 font-mono text-xs shadow-sm">
            <h2 className="font-bold uppercase tracking-wider text-[#171d29] mb-4">
              Data Plane Safety &amp; Non-Destructive Scanning (§12)
            </h2>
            <p className="text-muted text-[11px] leading-relaxed mb-4">
              Harizeon AI-Armor adheres to strict safety boundaries. Probes are benign metadata queries that verify endpoint presence without executing model inferences, extracting training weights, or dumping vector databases.
            </p>
            <ul className="flex flex-col gap-2 text-[11px] text-muted">
              <li>• Zero heavy GPU computation: no completion payloads sent to inference daemons.</li>
              <li>• Zero secret disclosure: leaked API keys are redacted before storing or emitting.</li>
              <li>• Isolated workers: scan workers run in isolated data containers with zero database credentials.</li>
            </ul>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
