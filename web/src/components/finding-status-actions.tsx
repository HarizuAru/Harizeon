"use client";

import { useState, useTransition } from "react";
import { updateFindingStatusAction, type FindingStatusAction } from "@/lib/finding-actions";
import { Button } from "@/components/ui/button";

const LABELS: Record<FindingStatusAction, string> = {
  open: "Reopen",
  acknowledged: "Acknowledge",
  fixed: "Mark fixed",
  false_positive: "Mark false positive",
  accepted: "Accept risk",
};

const ACTIONS_BY_STATE: Record<string, FindingStatusAction[]> = {
  open: ["acknowledged", "fixed", "false_positive", "accepted"],
  acknowledged: ["fixed", "false_positive", "accepted", "open"],
  fixed: ["open"],
  false_positive: ["open"],
  accepted: ["open"],
};

export function FindingStatusActions({
  findingId,
  currentStatus,
}: {
  findingId: string;
  currentStatus: string;
}) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const requestsReason = currentStatus === "fixed" || currentStatus === "accepted" || currentStatus === "acknowledged";

  function act(next: FindingStatusAction) {
    start(async () => {
      const r = await updateFindingStatusAction(findingId, next, note || undefined);
      if (!r.ok) setError(r.error ?? "Action failed");
      else {
        setError(null);
        setNote("");
      }
    });
  }

  const actions = ACTIONS_BY_STATE[currentStatus] ?? ["open"];

  return (
    <div className="flex flex-col gap-2">
      {requestsReason ? (
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional, e.g. why)"
          className="h-8 w-full border border-line bg-canvas px-2 font-mono text-xs text-ink placeholder:text-faint focus:border-ink"
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action}
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => act(action)}
          >
            {pending ? "Working..." : LABELS[action]}
          </Button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="font-mono text-xs font-bold text-ink">
          ERROR: {error}
        </p>
      ) : null}
    </div>
  );
}
