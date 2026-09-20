"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchItem {
  id: string;
  title: string;
  category: "Services" | "Features & Actions" | "Documentation" | "Perimeter Assets";
  href: string;
  description?: string;
  badge?: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  // Services
  { id: "s-assets", title: "Assets & Attack Surface Inventory", category: "Services", href: "/assets", badge: "ASM", description: "View verified domains, subdomains, IPs, and CIDRs" },
  { id: "s-scans", title: "Vulnerability Scans & Executions", category: "Services", href: "/scans", badge: "SCN", description: "Historical and active scan jobs with event telemetry" },
  { id: "s-findings", title: "Findings & Vulnerabilities", category: "Services", href: "/findings", badge: "FND", description: "All detected security exposures, CVEs, and CVSS scores" },
  { id: "s-schedules", title: "Scan Schedules", category: "Services", href: "/schedules", badge: "SCH", description: "Recurring cron-based automated perimeter scanning" },
  { id: "s-reports", title: "Compliance & Executive Reports", category: "Services", href: "/reports", badge: "REP", description: "Generate and download ISO 27001 / SOC 2 PDF reports" },
  { id: "s-dashboard", title: "Console Dashboard (Security Hub)", category: "Services", href: "/dashboard", badge: "HUB", description: "Central posture score, risk deltas, and inventory overview" },
  { id: "s-audit", title: "CloudTrail & Audit Logs", category: "Services", href: "/settings/audit-log", badge: "ADT", description: "Append-only cryptographic administrative audit trail" },
  { id: "s-api-keys", title: "API Keys & Service Credentials", category: "Services", href: "/settings/api-keys", badge: "IAM", description: "Provision and revoke REST API tokens" },
  { id: "s-members", title: "IAM Members & RBAC Roles", category: "Services", href: "/settings/members", badge: "IAM", description: "Manage organization members, roles, and permissions" },
  { id: "s-billing", title: "Billing, Costs & Service Quotas", category: "Services", href: "/settings/billing", badge: "BIL", description: "Current tier capacity, metered usage, and invoice history" },
  { id: "s-notifications", title: "Notification Channels & SIEM", category: "Services", href: "/settings/notifications", badge: "SIEM", description: "Configure Webhook, Slack, Discord, and Email alerts" },

  // Actions
  { id: "a-new-scan", title: "Launch New Security Scan", category: "Features & Actions", href: "/scans/new", badge: "ACTION", description: "Start an immediate Quick, Standard, or Deep scan" },
  { id: "a-new-asset", title: "Register Perimeter Asset", category: "Features & Actions", href: "/assets/new", badge: "ACTION", description: "Add a new domain, IP, or URL for ownership verification" },
  { id: "a-gen-report", title: "Generate Security Report", category: "Features & Actions", href: "/reports", badge: "ACTION", description: "Create an executive posture assessment document" },

  // Assets
  { id: "ast-ex", title: "example.com", category: "Perimeter Assets", href: "/assets/ast-001", badge: "DOMAIN", description: "Verified primary domain (3 findings active)" },
  { id: "ast-api", title: "api.example.com", category: "Perimeter Assets", href: "/assets/ast-002", badge: "SUBDOMAIN", description: "Verified API gateway endpoint" },
  { id: "ast-ip", title: "203.0.113.10", category: "Perimeter Assets", href: "/assets/ast-003", badge: "PUBLIC IP", description: "Verified perimeter IP gateway" },

  // Documentation
  { id: "d-quickstart", title: "Quickstart Guide", category: "Documentation", href: "/docs/quickstart", description: "Verify ownership and execute first scan in 4 minutes" },
  { id: "d-api", title: "REST API Documentation", category: "Documentation", href: "/docs/api", description: "Fastify OpenAPI schema and curl authentication guide" },
  { id: "d-status", title: "Service Status & Health", category: "Documentation", href: "/status", description: "Scanner cluster uptime and operational telemetry" },
];

export function AwsSearchPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const q = query.toLowerCase().trim();
  const filtered = SEARCH_ITEMS.filter(
    (item) =>
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.badge?.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q),
  );

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        router.push(filtered[selectedIndex].href);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl border border-line bg-canvas font-mono shadow-2xl">
        {/* Search Input Bar (AWS style) */}
        <div className="flex items-center border-b border-line bg-subtle px-4 py-3">
          <span className="mr-3 text-muted">🔍</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search services, assets, scans, findings, docs... [Esc to close]"
            className="flex-1 bg-transparent font-mono text-xs text-ink placeholder:text-faint outline-none"
          />
          <span className="border border-line bg-canvas px-1.5 py-0.5 text-[10px] text-faint">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-line">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted">
              No results found for &quot;{query}&quot;. Try &apos;assets&apos;, &apos;scans&apos;, or &apos;findings&apos;.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const active = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex cursor-pointer items-center justify-between p-3 transition-colors ${
                    active ? "bg-subtle text-ink" : "text-muted hover:bg-subtle/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {item.badge && (
                      <span className="border border-line bg-canvas px-1.5 py-0.5 text-[10px] font-bold text-ink shrink-0">
                        {item.badge}
                      </span>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ink font-mono">{item.title}</span>
                        <span className="text-[10px] text-faint uppercase font-sans">
                          [{item.category}]
                        </span>
                      </div>
                      {item.description && (
                        <p className="mt-0.5 text-[11px] text-muted font-sans line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] text-faint font-mono shrink-0 ml-4">
                    {item.href} →
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Keyboard Hint Bar */}
        <div className="flex items-center justify-between border-t border-line bg-subtle px-4 py-2 text-[10px] text-faint">
          <div className="flex items-center gap-3">
            <span>[↑↓] Navigate</span>
            <span>·</span>
            <span>[Enter] Select</span>
            <span>·</span>
            <span>[Esc] Close</span>
          </div>
          <div>Harizeon Global Search</div>
        </div>
      </div>
    </div>
  );
}
