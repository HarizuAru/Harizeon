"use client";

import { useState } from "react";
import Link from "next/link";

interface ServiceItem {
  code: string;
  name: string;
  description: string;
  href: string;
  category: string;
  badge?: string;
}

const ALL_SERVICES: ServiceItem[] = [
  // Perimeter & Attack Surface
  {
    code: "ASM",
    name: "Attack Surface Inventory",
    description: "Manage verified domains, subdomains, and public CIDRs/IPs",
    href: "/assets",
    category: "Perimeter & Assets",
    badge: "Core",
  },
  {
    code: "NEW",
    name: "Register New Asset",
    description: "Add a new perimeter asset and generate ownership verification challenge",
    href: "/assets/new",
    category: "Perimeter & Assets",
  },
  {
    code: "DIS",
    name: "Subdomain Discovery",
    description: "Passive Certificate Transparency (CT) and DNS zone enumeration",
    href: "/services",
    category: "Perimeter & Assets",
  },

  // Security Scanners & Probes
  {
    code: "SCN",
    name: "Vulnerability Scans",
    description: "View past scan executions, telemetry events, and progress",
    href: "/scans",
    category: "Scanning & Engines",
    badge: "Active",
  },
  {
    code: "RUN",
    name: "Launch Security Scan",
    description: "Execute Quick (passive), Standard (ports+TLS+headers), or Deep scans",
    href: "/scans/new",
    category: "Scanning & Engines",
  },
  {
    code: "SCH",
    name: "Scan Schedules",
    description: "Automate recurring daily, weekly, or cron-triggered perimeter sweeps",
    href: "/schedules",
    category: "Scanning & Engines",
  },
  {
    code: "PRB",
    name: "Port & Service Fingerprinting",
    description: "Non-destructive TCP SYN recon and exposed daemon detection",
    href: "/services",
    category: "Scanning & Engines",
  },

  // Vulnerability & Threat Ops
  {
    code: "FND",
    name: "Security Findings",
    description: "Prioritized vulnerabilities with CVSS scores, reproduction curls, and status workflows",
    href: "/findings",
    category: "Vulnerabilities & Risk",
    badge: "Risk",
  },
  {
    code: "SCO",
    name: "Security Posture Score",
    description: "Quantitative 0-100 posture metrics with category penalty caps and age multipliers",
    href: "/dashboard",
    category: "Vulnerabilities & Risk",
  },

  // Compliance & Reporting
  {
    code: "REP",
    name: "Audit & Compliance Reports",
    description: "Generate Executive, Technical, and ISO 27001 / SOC 2 PDF reports",
    href: "/reports",
    category: "Reports & Compliance",
  },
  {
    code: "NOT",
    name: "Notification Channels & SIEM",
    description: "Configure Webhooks, Slack, Discord, and Email security alert pipelines",
    href: "/settings/notifications",
    category: "Reports & Compliance",
  },

  // Governance & IAM
  {
    code: "ADT",
    name: "CloudTrail & Audit Log",
    description: "Append-only cryptographic event log of all administrative actions",
    href: "/settings/audit-log",
    category: "Management & IAM",
    badge: "Audit",
  },
  {
    code: "KEY",
    name: "API Keys & Service Tokens",
    description: "Provision scoped REST credentials for CI/CD and automated pipelines",
    href: "/settings/api-keys",
    category: "Management & IAM",
  },
  {
    code: "USR",
    name: "IAM Members & Roles",
    description: "Manage team users, permissions, and Role-Based Access Control",
    href: "/settings/members",
    category: "Management & IAM",
  },
  {
    code: "ORG",
    name: "Organization Profile",
    description: "Manage tenant identity, GUC domain boundaries, and legal contacts",
    href: "/settings/organization",
    category: "Management & IAM",
  },
  {
    code: "BIL",
    name: "Billing & Service Quotas",
    description: "Manage tier capacity, metered scan quotas, and payment methods",
    href: "/settings/billing",
    category: "Management & IAM",
  },

  // Documentation & Reference
  {
    code: "DOC",
    name: "Documentation Hub",
    description: "Architecture whitepapers, CLI reference, and implementation guides",
    href: "/docs",
    category: "Documentation & Tools",
  },
  {
    code: "API",
    name: "REST API Reference",
    description: "OpenAPI specifications for automated scan pipelines and asset sync",
    href: "/docs/api",
    category: "Documentation & Tools",
  },
  {
    code: "STA",
    name: "Service Health Status",
    description: "Real-time uptime and incident monitoring for scanner clusters",
    href: "/status",
    category: "Documentation & Tools",
  },
];

const CATEGORIES = [
  "All Services",
  "Perimeter & Assets",
  "Scanning & Engines",
  "Vulnerabilities & Risk",
  "Reports & Compliance",
  "Management & IAM",
  "Documentation & Tools",
];

export function ServicesMegaMenu({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selectedCat, setSelectedCat] = useState("All Services");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filtered = ALL_SERVICES.filter((svc) => {
    const matchesCat = selectedCat === "All Services" || svc.category === selectedCat;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      svc.name.toLowerCase().includes(q) ||
      svc.description.toLowerCase().includes(q) ||
      svc.code.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Services Dropdown Panel (AWS Console Mega Menu style) */}
      <div className="fixed top-14 left-0 right-0 z-50 mx-auto max-w-6xl border-x border-b border-line bg-canvas shadow-2xl">
        {/* Header with Search & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line bg-subtle px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="border border-ink bg-ink px-2 py-0.5 font-mono text-xs font-bold uppercase text-canvas">
              Services
            </span>
            <span className="font-mono text-sm font-bold text-ink">
              Harizeon Security Infrastructure Catalog
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter services (e.g. assets, scans, cve)..."
              className="h-8 w-64 border border-line bg-canvas px-3 font-mono text-xs text-ink placeholder:text-faint focus:border-ink"
              autoFocus
            />
            <button
              onClick={onClose}
              className="border border-line bg-canvas px-2.5 py-1 font-mono text-xs text-muted hover:border-ink hover:text-ink"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Two-pane layout: Categories on Left, Services Grid on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[70vh] overflow-y-auto">
          {/* Left Categories Rail */}
          <div className="border-r border-line bg-canvas p-3 md:col-span-3">
            <span className="px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-faint block">
              Categories
            </span>
            <nav className="mt-2 flex flex-col gap-1">
              {CATEGORIES.map((cat) => {
                const active = selectedCat === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCat(cat)}
                    className={`flex items-center justify-between px-3 py-2 text-left font-mono text-xs transition-colors ${
                      active
                        ? "border-l-2 border-ink bg-subtle font-bold text-ink"
                        : "text-muted hover:bg-subtle/60 hover:text-ink"
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="text-[10px] text-faint">
                      {cat === "All Services"
                        ? ALL_SERVICES.length
                        : ALL_SERVICES.filter((s) => s.category === cat).length}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Services Grid */}
          <div className="p-6 md:col-span-9">
            <div className="mb-4 flex items-center justify-between border-b border-line pb-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted">
                {selectedCat} ({filtered.length} services)
              </span>
              <span className="font-mono text-[11px] text-faint">
                Click any service to navigate
              </span>
            </div>

            {filtered.length === 0 ? (
              <p className="py-8 text-center font-mono text-xs text-muted">
                No services matched &quot;{searchQuery}&quot;.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((svc) => (
                  <Link
                    key={svc.code}
                    href={svc.href}
                    onClick={onClose}
                    className="group flex flex-col justify-between border border-line bg-canvas p-3.5 hover:border-ink hover:bg-subtle/30 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="border border-line bg-subtle px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink">
                          {svc.code}
                        </span>
                        {svc.badge && (
                          <span className="border border-ink bg-ink px-1 text-[9px] font-mono uppercase text-canvas">
                            {svc.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="mt-2 font-mono text-xs font-bold text-ink group-hover:underline">
                        {svc.name}
                      </h4>
                      <p className="mt-1 text-[11px] text-muted line-clamp-2 leading-relaxed font-sans">
                        {svc.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-line/60 flex items-center justify-between font-mono text-[10px] text-faint">
                      <span>{svc.category}</span>
                      <span className="group-hover:text-ink">Open →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between border-t border-line bg-subtle px-6 py-2 font-mono text-[11px] text-muted">
          <div className="flex items-center gap-4">
            <span>Current Tenant: org-prod-01</span>
            <span>Cluster: ap-southeast-1</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/services" onClick={onClose} className="hover:text-ink underline">
              View Full Architecture Specifications (§05-§11)
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
