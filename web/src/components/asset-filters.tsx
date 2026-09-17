import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { compactInputClass, compactSelectClass, labelClass } from "@/lib/ui";

type Props = { q: string; type: string; criticality: string; verified: string };

export function AssetFilters({ q, type, criticality, verified }: Props) {
  const active = Boolean(q || type || criticality || verified);
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 border border-line bg-canvas p-3"
    >
      <div className="flex w-56 flex-col gap-1">
        <label htmlFor="q" className={labelClass}>
          Search
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="value contains…"
          className={compactInputClass}
        />
      </div>
      <div className="flex w-36 flex-col gap-1">
        <label htmlFor="f-type" className={labelClass}>
          Type
        </label>
        <select id="f-type" name="type" defaultValue={type} className={compactSelectClass}>
          <option value="">any</option>
          <option value="domain">domain</option>
          <option value="subdomain">subdomain</option>
          <option value="ip">ip</option>
          <option value="url">url</option>
        </select>
      </div>
      <div className="flex w-32 flex-col gap-1">
        <label htmlFor="f-crit" className={labelClass}>
          Criticality
        </label>
        <select id="f-crit" name="criticality" defaultValue={criticality} className={compactSelectClass}>
          <option value="">any</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
      </div>
      <div className="flex w-32 flex-col gap-1">
        <label htmlFor="f-verified" className={labelClass}>
          Verified
        </label>
        <select id="f-verified" name="verified" defaultValue={verified} className={compactSelectClass}>
          <option value="">any</option>
          <option value="yes">verified</option>
          <option value="no">unverified</option>
        </select>
      </div>
      <button type="submit" className={buttonClass("secondary", "sm")}>
        Apply
      </button>
      {active ? (
        <Link
          href="/assets"
          className="inline-flex h-8 items-center px-1 text-sm text-muted underline"
        >
          Clear
        </Link>
      ) : null}
    </form>
  );
}
