"use client";

import { useActionState } from "react";
import { createAssetAction } from "@/lib/asset-actions";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/login-form";

const selectClass = `${inputClass} pr-2`;

export function NewAssetForm() {
  const [state, action, pending] = useActionState(createAssetAction, null);
  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="type" className={labelClass}>
          Type
        </label>
        <select id="type" name="type" defaultValue="domain" className={selectClass}>
          <option value="domain">domain</option>
          <option value="subdomain">subdomain</option>
          <option value="ip">ip</option>
          <option value="url">url</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="value" className={labelClass}>
          Value
        </label>
        <input
          id="value"
          name="value"
          type="text"
          required
          placeholder="example.com"
          autoComplete="off"
          spellCheck={false}
          className={`${inputClass} font-mono`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="criticality" className={labelClass}>
          Criticality
        </label>
        <select id="criticality" name="criticality" defaultValue="medium" className={selectClass}>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
      </div>
      {state?.error ? (
        <p role="alert" className="font-mono text-sm font-bold text-ink">
          ERROR: {state.error}
        </p>
      ) : null}
      <div>
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Adding..." : "Add asset"}
        </Button>
      </div>
      <p className="font-mono text-xs text-faint">
        Harizeon can only scan what you prove you own. You will verify this asset next.
      </p>
    </form>
  );
}
