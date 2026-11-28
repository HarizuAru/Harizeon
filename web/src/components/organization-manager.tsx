"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";

export interface OrgProfile {
  id: string;
  name: string;
  slug: string;
  country: string;
  currency: string;
  timezone: string;
  billing_status: string;
  enforce_mfa?: boolean;
  created_at: string;
}

export function OrganizationManager({ initialOrg }: { initialOrg: OrgProfile }) {
  const router = useRouter();
  const [org, setOrg] = useState<OrgProfile>(initialOrg);
  const [name, setName] = useState(initialOrg.name);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Security policies
  const [enforce2FA, setEnforce2FA] = useState(Boolean(initialOrg.enforce_mfa));
  const [isSavingMfa, setIsSavingMfa] = useState(false);
  const [strictSubdomains, setStrictSubdomains] = useState(true);
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState("12");

  // Export & Danger zone
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/v1/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, enforce_mfa: enforce2FA }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setError(errBody?.error?.message ?? "Failed to update organization profile.");
        return;
      }
      setOrg({ ...org, name, enforce_mfa: enforce2FA });
      setMessage("Organization details updated successfully.");
    } catch {
      setError("Network error while updating organization profile.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  async function handleToggleEnforce2FA(nextValue: boolean) {
    const previousValue = enforce2FA;
    setEnforce2FA(nextValue);
    setIsSavingMfa(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/v1/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enforce_mfa: nextValue }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setEnforce2FA(previousValue);
        setError(errBody?.error?.message ?? "Failed to persist MFA enforcement policy.");
        return;
      }
      setOrg({ ...org, enforce_mfa: nextValue });
      setMessage(nextValue ? "Organization MFA enforcement enabled." : "Organization MFA enforcement disabled.");
    } catch {
      setEnforce2FA(previousValue);
      setError("Network error while updating MFA enforcement policy.");
    } finally {
      setIsSavingMfa(false);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  async function handleExport() {
    setIsExporting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/v1/org/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setError(errBody?.error?.message ?? "Failed to export organization data.");
        return;
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `harizeon-${org.slug}-export.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage("Organization data bundle downloaded.");
    } catch {
      setError("Network error while exporting organization data.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDelete() {
    if (deleteConfirmText !== org.slug) return;
    setIsDeleting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/v1/org", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm_slug: deleteConfirmText }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setError(errBody?.error?.message ?? "Failed to delete organization.");
        return;
      }
      router.push("/login");
      router.refresh();
    } catch {
      setError("Network error while deleting organization.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <PageHeader
        title="Organization Settings"
        description="Configure your workspace profile, compliance boundary rules, and organization-wide security posture."
      />

      {message && (
        <div className="border border-ink bg-canvas p-4 font-mono text-xs text-ink">
          [OK] {message}
        </div>
      )}

      {error && (
        <div className="border border-ink bg-subtle p-4 font-mono text-xs text-ink">
          [ERR] {error}
        </div>
      )}

      {/* General Information */}
      <form onSubmit={handleSave} className="border border-line bg-canvas p-6 flex flex-col gap-6">
        <div>
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
            Organization Profile
          </h2>
          <p className="text-xs text-muted mt-1">
            This name appears on executive security reports and compliance documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase text-muted mb-1">
              Organization Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-line bg-canvas p-2 font-mono text-xs text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted mb-1">
              Workspace Identifier (Slug)
            </label>
            <input
              type="text"
              disabled
              value={org.slug}
              className="w-full border border-line bg-subtle p-2 font-mono text-xs text-faint cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted mb-1">
              Jurisdiction & Country
            </label>
            <input
              type="text"
              disabled
              value="Malaysia (MY)"
              className="w-full border border-line bg-subtle p-2 font-mono text-xs text-faint cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted mb-1">
              Reporting Timezone
            </label>
            <input
              type="text"
              disabled
              value="Asia/Kuala_Lumpur (MYT +08:00)"
              className="w-full border border-line bg-subtle p-2 font-mono text-xs text-faint cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-line">
          <button
            type="submit"
            disabled={isSaving}
            className="border border-ink bg-ink px-6 py-2 font-mono text-xs uppercase tracking-[0.05em] text-canvas hover:bg-canvas hover:text-ink transition-colors"
          >
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>

      {/* Security & Access Policies */}
      <div className="border border-line bg-canvas p-6 flex flex-col gap-6">
        <div>
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
            Access & Verification Policies
          </h2>
          <p className="text-xs text-muted mt-1">
            Mandate controls required by your cyber defense insurance or compliance frameworks.
          </p>
        </div>

        <div className="flex flex-col gap-4 font-mono text-xs">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enforce2FA}
              disabled={isSavingMfa}
              onChange={(e) => void handleToggleEnforce2FA(e.target.checked)}
              className="mt-0.5 accent-black"
            />
            <div>
              <span className="font-bold text-ink block">
                Mandatory Multi-Factor Authentication (MFA){isSavingMfa ? " · Saving..." : ""}
              </span>
              <span className="text-muted text-[11px]">
                Require TOTP authentication for all members before issuing a console session.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={strictSubdomains}
              onChange={(e) => setStrictSubdomains(e.target.checked)}
              className="mt-0.5 accent-black"
            />
            <div>
              <span className="font-bold text-ink block">Strict Subdomain Scope Enforcement</span>
              <span className="text-muted text-[11px]">
                Reject any target whose root domain has not been cryptographically verified via DNS TXT or HTTP token.
              </span>
            </div>
          </label>

          <div className="pt-2">
            <label className="block text-xs font-mono uppercase text-muted mb-1">
              Admin Session Idle Timeout
            </label>
            <select
              value={sessionTimeoutHours}
              onChange={(e) => setSessionTimeoutHours(e.target.value)}
              className="border border-line bg-canvas p-2 font-mono text-xs text-ink focus:border-ink focus:outline-none"
            >
              <option value="1">1 hour (High security)</option>
              <option value="4">4 hours</option>
              <option value="12">12 hours (Default)</option>
              <option value="24">24 hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Portability & Export (PDPA 2024) */}
      <div className="border border-line bg-canvas p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
            Data Portability &amp; Export
          </h2>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Download a portable JSON archive containing your organization profile, verified assets, scan history, redacted findings, reports, and immutable audit logs.
          </p>
        </div>
        <button
          type="button"
          disabled={isExporting}
          onClick={handleExport}
          className="border border-ink bg-canvas px-4 py-2 font-mono text-xs uppercase tracking-[0.05em] text-ink hover:bg-ink hover:text-canvas transition-colors shrink-0 disabled:opacity-40"
        >
          {isExporting ? "Exporting..." : "Download Organization Data (JSON)"}
        </button>
      </div>

      {/* Danger Zone (§10: Solid black fills and requires confirmation step) */}
      <div className="border border-ink bg-canvas p-6">
        <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
          Danger Zone
        </h2>
        <p className="text-xs text-muted mt-1 leading-relaxed">
          Deleting your organization permanently revokes all API keys, purges verified assets, terminates recurring scan schedules, and irrevocably shreds all stored finding evidence.
        </p>

        <div className="mt-4 pt-4 border-t border-line">
          <label className="block text-xs font-mono uppercase text-ink mb-1">
            Type your workspace slug <strong className="underline">{org.slug}</strong> to confirm:
          </label>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={org.slug}
              className="border border-line bg-canvas p-2 font-mono text-xs text-ink focus:border-ink focus:outline-none w-full sm:w-64"
            />
            <button
              type="button"
              disabled={deleteConfirmText !== org.slug || isDeleting}
              onClick={handleDelete}
              className="border border-ink bg-ink text-canvas px-4 py-2 font-mono text-xs uppercase disabled:opacity-30 disabled:cursor-not-allowed hover:bg-canvas hover:text-ink transition-colors"
            >
              {isDeleting ? "Purging..." : "Permanently Delete Organization"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
