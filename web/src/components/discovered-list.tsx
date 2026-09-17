"use client";

import { useState, useTransition } from "react";
import { setDiscoveryScopeAction } from "@/lib/asset-actions";

export type DiscoveredChild = {
  id: string;
  fqdn: string;
  first_seen_at: string;
  is_active: boolean;
};

const th = "px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.08em] text-muted";

export function DiscoveredList({ parentId, items }: { parentId: string; items: DiscoveredChild[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function act(childId: string, inScope: boolean) {
    startTransition(async () => {
      const r = await setDiscoveryScopeAction(parentId, childId, inScope);
      if (!r.ok) setError(r.error ?? "Action failed");
      else setError(null);
    });
  }

  if (items.length === 0) {
    return (
      <p className="border border-line bg-canvas p-3 text-sm text-muted">
        No discovered subdomains yet. Run a scan and discovery will enumerate them.
      </p>
    );
  }

  return (
    <div className="border border-line bg-canvas">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className={th}>Subdomain</th>
            <th scope="col" className={th}>First seen</th>
            <th scope="col" className={th}>Scope</th>
            <th scope="col" className={`${th} text-right`}>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((child) => (
            <tr key={child.id} className="border-b border-line last:border-0 hover:bg-subtle">
              <td className="px-3 py-2 font-mono">{child.fqdn}</td>
              <td className="px-3 py-2 font-mono text-muted">
                {new Date(child.first_seen_at).toLocaleDateString()}
              </td>
              <td className="px-3 py-2">{child.is_active ? "in scope" : "pending"}</td>
              <td className="px-3 py-2">
                <div className="flex justify-end gap-3">
                  {!child.is_active ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => act(child.id, true)}
                      className="text-xs underline disabled:text-faint"
                    >
                      Add to scope
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => act(child.id, false)}
                    className="text-xs text-muted underline disabled:text-faint"
                  >
                    Ignore
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error ? (
        <p role="alert" className="border-t border-line p-2 font-mono text-xs font-bold text-ink">
          ERROR: {error}
        </p>
      ) : null}
    </div>
  );
}
