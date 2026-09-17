"use client";

import { useActionState } from "react";
import { createScanAction } from "@/lib/scan-actions";
import { Button } from "@/components/ui/button";
import { labelClass } from "@/lib/ui";

type Asset = { id: string; value: string; type: string };

const PROFILES: [string, string][] = [
  ["quick", "quick · ~2 min · passive only"],
  ["standard", "standard · ~10 min · passive + ports + TLS + web"],
  ["deep", "deep · ~45 min · standard + broader range"],
];

export function NewScanForm({ assets }: { assets: Asset[] }) {
  const [state, action, pending] = useActionState(createScanAction, null);

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-6">
      <fieldset>
        <legend className={labelClass}>Verified assets to scan</legend>
        <div className="mt-2 border border-line bg-canvas">
          {assets.length === 0 ? (
            <p className="p-3 text-sm text-muted">
              No verified assets yet. Verify one before scanning.
            </p>
          ) : (
            assets.map((a) => (
              <label
                key={a.id}
                className="flex items-center gap-3 border-b border-line px-3 py-2 text-sm last:border-0"
              >
                <input type="checkbox" name="asset_ids" value={a.id} defaultChecked />
                <span className="font-mono">{a.value}</span>
                <span className="text-muted">{a.type}</span>
              </label>
            ))
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend className={labelClass}>Profile</legend>
        <div className="mt-2 flex flex-col gap-2">
          {PROFILES.map(([value, desc]) => (
            <label key={value} className="flex items-center gap-3 text-sm">
              <input type="radio" name="profile" value={value} defaultChecked={value === "standard"} />
              <span className="text-muted">{desc}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" required className="mt-1" />
        <span>I am authorized to test these assets.</span>
      </label>

      {state?.error ? (
        <p role="alert" className="font-mono text-sm font-bold text-ink">
          ERROR: {state.error}
        </p>
      ) : null}

      <div>
        <Button type="submit" size="md" disabled={pending || assets.length === 0}>
          {pending ? "Starting..." : "Start scan"}
        </Button>
      </div>
    </form>
  );
}
