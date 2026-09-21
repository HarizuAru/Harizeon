"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";

export interface ApiKeyItem {
  id: string;
  org_id: string;
  name: string;
  prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

const AVAILABLE_SCOPES = [
  { id: "assets:read", label: "assets:read", description: "Query assets and verification state" },
  { id: "assets:write", label: "assets:write", description: "Create and verify new targets" },
  { id: "scans:read", label: "scans:read", description: "Poll scan execution state & progress" },
  { id: "scans:write", label: "scans:write", description: "Dispatch on-demand scans" },
  { id: "findings:read", label: "findings:read", description: "Extract vulnerabilities & evidence" },
  { id: "reports:read", label: "reports:read", description: "Generate & stream PDF compliance reports" },
];

export function ApiKeysManager({ initialKeys }: { initialKeys: ApiKeyItem[] }) {
  const [keys, setKeys] = useState<ApiKeyItem[]>(initialKeys);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    "assets:read",
    "scans:write",
    "findings:read",
  ]);

  // One-time secret reveal state
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggleScope(scopeId: string) {
    if (selectedScopes.includes(scopeId)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scopeId));
    } else {
      setSelectedScopes([...selectedScopes, scopeId]);
    }
  }

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName, scopes: selectedScopes }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setMessage(body?.error?.message ?? `Could not create the key (HTTP ${res.status}).`);
        return;
      }

      const data = await res.json();
      const createdItem: ApiKeyItem = {
        id: data.id ?? `key-${data.prefix}`,
        org_id: data.orgId ?? "",
        name: data.name,
        prefix: data.prefix,
        scopes: data.scopes,
        last_used_at: null,
        expires_at: null,
        revoked_at: null,
        created_at: data.createdAt ?? new Date().toISOString(),
      };
      setKeys([createdItem, ...keys]);
      setRevealedSecret(data.key);
      setIsCreateOpen(false);
      setNewKeyName("");
    } catch {
      setMessage("Cannot reach the API. Is it running?");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRevoke(id: string, name: string) {
    if (!confirm(`Revoke API key "${name}" immediately? Any automated scripts or CI/CD pipelines using this key will immediately fail.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/api-keys/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setMessage(body?.error?.message ?? `Could not revoke the key (HTTP ${res.status}).`);
        return;
      }
    } catch {
      setMessage("Cannot reach the API. Is it running?");
      return;
    }

    setKeys(
      keys.map((k) =>
        k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k,
      ),
    );
    setMessage(`Revoked API key: ${name}`);
    setTimeout(() => setMessage(null), 4000);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="API Keys & Programmatic Access"
          description="Authenticate automated scan triggers from CI/CD pipelines and query normalized vulnerability findings."
        />
        <button
          onClick={() => setIsCreateOpen(true)}
          className="self-start sm:self-auto border border-ink bg-ink px-4 py-2 font-mono text-xs uppercase tracking-[0.05em] text-canvas hover:bg-canvas hover:text-ink transition-colors"
        >
          + Create API Key
        </button>
      </div>

      {message && (
        <div className="border border-ink bg-canvas p-4 font-mono text-xs text-ink">
          [OK] {message}
        </div>
      )}

      {/* One-Time Secret View (§9.2: Solid black callout: "This is the only time you will see this key.") */}
      {revealedSecret && (
        <div className="border-2 border-ink bg-ink p-6 text-canvas">
          <div className="flex items-center justify-between border-b border-white/20 pb-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-canvas">
              [!] Save Your API Key Secret Now
            </span>
            <button
              onClick={() => setRevealedSecret(null)}
              className="font-mono text-xs text-white/60 hover:text-canvas"
            >
              [I Have Saved This Key]
            </button>
          </div>

          <p className="mt-3 text-xs text-white/80 leading-relaxed font-sans">
            <strong>This is the only time you will see this key.</strong> For security, Harizeon stores only a SHA-256 cryptographic hash of the token. If you lose this key, you must revoke it and generate a new one.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 border border-white/40 bg-black p-3 font-mono text-sm tracking-wider text-white break-all select-all">
              {revealedSecret}
            </div>
            <button
              onClick={() => copyToClipboard(revealedSecret)}
              className="border border-white bg-white text-black px-4 py-3 font-mono text-xs uppercase font-bold hover:bg-black hover:text-white transition-colors"
            >
              {copied ? "COPIED [✓]" : "COPY KEY"}
            </button>
          </div>
        </div>
      )}

      {/* API Keys Table */}
      <div className="border border-line bg-canvas">
        <div className="p-4 border-b border-line flex items-center justify-between">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
            Active & Revoked Tokens ({keys.length})
          </h2>
          <span className="font-mono text-xs text-muted">Bearer Token Auth</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-line bg-subtle text-muted uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Token Name</th>
                <th className="px-4 py-3">Prefix</th>
                <th className="px-4 py-3">Scopes</th>
                <th className="px-4 py-3">Last Used</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {keys.map((k) => {
                const isRevoked = !!k.revoked_at;
                return (
                  <tr key={k.id} className="hover:bg-subtle">
                    <td className="px-4 py-3 font-bold text-ink">{k.name}</td>
                    <td className="px-4 py-3 text-muted">{k.prefix}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {k.scopes.map((s) => (
                          <span
                            key={s}
                            className="border border-line bg-subtle px-1.5 py-0.5 text-[10px] text-ink"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted text-[11px]">
                      {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`border px-1.5 py-0.5 text-[10px] uppercase ${
                          isRevoked
                            ? "border-line bg-subtle text-faint"
                            : "border-ink bg-ink text-canvas font-bold"
                        }`}
                      >
                        {isRevoked ? "Revoked" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isRevoked && (
                        <button
                          onClick={() => handleRevoke(k.id, k.name)}
                          className="border border-line px-2 py-1 text-[10px] uppercase text-muted hover:border-ink hover:text-ink"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage Example Snippet */}
      <div className="border border-line bg-canvas p-6">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-ink mb-2">
          Usage with cURL or CI/CD Pipeline
        </h3>
        <p className="text-xs text-muted mb-4 font-sans leading-relaxed">
          Pass your token via the standard <code className="font-mono text-ink">Authorization: Bearer hrz_live_...</code> header.
        </p>
        <pre className="border border-line bg-subtle p-4 font-mono text-xs text-ink overflow-x-auto">
{`$ curl -X POST https://api.harizeon.com/v1/scans \\
  -H "Authorization: Bearer hrz_live_your_token_here" \\
  -H "Content-Type: application/json" \\
  -d '{"asset_ids": ["ast_01H..."], "profile": "standard"}'

{ "id": "scn_01H...", "status": "queued" }`}
        </pre>
      </div>

      {/* Create Key Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleCreateKey}
            className="w-full max-w-lg border border-line bg-canvas p-6 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
                Create New API Token
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="font-mono text-xs text-muted hover:text-ink"
              >
                [ESC]
              </button>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-muted mb-1">
                Token Name / Description
              </label>
              <input
                type="text"
                required
                placeholder="GitHub Actions CI Runner"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full border border-line bg-canvas p-2 font-mono text-xs text-ink focus:border-ink focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-muted mb-2">
                Scoped Permissions
              </label>
              <div className="flex flex-col gap-2 font-mono text-xs">
                {AVAILABLE_SCOPES.map((scope) => (
                  <label key={scope.id} className="flex items-start gap-2 cursor-pointer border border-line p-2 hover:bg-subtle">
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes(scope.id)}
                      onChange={() => toggleScope(scope.id)}
                      className="mt-0.5 accent-black"
                    />
                    <div>
                      <span className="font-bold text-ink block">{scope.label}</span>
                      <span className="text-muted text-[11px]">{scope.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-line">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="border border-line px-4 py-2 font-mono text-xs uppercase hover:border-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newKeyName}
                className="border border-ink bg-ink px-4 py-2 font-mono text-xs uppercase text-canvas hover:bg-canvas hover:text-ink transition-colors disabled:opacity-40"
              >
                {isSubmitting ? "Generating..." : "Generate Secret Token"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
