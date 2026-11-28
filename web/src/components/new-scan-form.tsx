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
  ["ai", "ai · ~30s · Harizeon AI-Armor (LLM, Vector DB & Agent endpoints)"],
  ["api", "api · ~1 min · Harizeon API-Scan (OpenAPI/Swagger discovery & OWASP API Top 10)"],
];

export function NewScanForm({
  assets,
  defaultAssetId,
  defaultProfile = "standard",
}: {
  assets: Asset[];
  defaultAssetId?: string;
  defaultProfile?: string;
}) {
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
                <input
                  type="checkbox"
                  name="asset_ids"
                  value={a.id}
                  defaultChecked={defaultAssetId ? a.id === defaultAssetId : true}
                />
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
              <input
                type="radio"
                name="profile"
                value={value}
                defaultChecked={value === (defaultProfile || "standard")}
              />
              <span className="text-muted">{desc}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="border border-line bg-subtle p-4">
        <label className="flex items-start gap-3 text-xs leading-relaxed cursor-pointer">
          <input type="checkbox" name="authorized" required className="mt-0.5" />
          <span className="text-ink">
            <strong className="font-mono uppercase text-ink block mb-0.5">Legal Authorization Warranty (§12.4):</strong>
            I legally certify and warrant under the Malaysian Computer Crimes Act 1997 and applicable cyber legislation that our organization owns or holds written, contractual authorization from the asset owner to conduct external security reconnaissance against these target perimeters.
          </span>
        </label>
      </div>

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
