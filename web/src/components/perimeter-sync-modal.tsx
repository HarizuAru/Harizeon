"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { bulkCreateAssetsAction } from "@/lib/asset-actions";

export function PerimeterSyncModal({ onImportComplete }: { onImportComplete?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [parsedDomains, setParsedDomains] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [authorized, setAuthorized] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleParse = (text: string) => {
    setRawText(text);
    // Regex matching valid domain / subdomain patterns
    const domainRegex = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]\b/gi;
    const matches = text.match(domainRegex) || [];
    
    // Filter out common noise, IPs, or TLD-only entries
    const cleaned = Array.from(
      new Set(
        matches
          .map((d) => d.toLowerCase().replace(/\.$/, ""))
          .filter((d) => {
            // Must contain at least one dot and not be an IP address
            return d.includes(".") && !/^\d+\.\d+\.\d+\.\d+$/.test(d) && !d.endsWith(".arpa");
          }),
      ),
    );

    setParsedDomains(cleaned);
    setSelectedDomains(new Set(cleaned));
  };

  const toggleDomain = (domain: string) => {
    const next = new Set(selectedDomains);
    if (next.has(domain)) next.delete(domain);
    else next.add(domain);
    setSelectedDomains(next);
  };

  const handleImport = () => {
    if (selectedDomains.size === 0 || !authorized) return;

    startTransition(async () => {
      const domainsToImport = Array.from(selectedDomains);
      const res = await bulkCreateAssetsAction(domainsToImport);

      setStatusMessage(`Successfully imported ${res.imported} perimeter asset(s). ${res.failed > 0 ? `(${res.failed} failed or already registered)` : ""}`);
      setTimeout(() => {
        setIsOpen(false);
        setRawText("");
        setParsedDomains([]);
        setStatusMessage(null);
        if (onImportComplete) onImportComplete();
        window.location.reload();
      }, 1500);
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="font-mono text-xs"
      >
        [ CLOUDFLARE / ROUTE53 IMPORT ]
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col border border-line bg-canvas p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
                  Cloudflare / AWS Route53 Perimeter Asset Sync
                </h2>
                <p className="font-mono text-xs text-muted mt-0.5">
                  Continuous perimeter ingestion from Cloudflare BIND zonefiles, Route53 JSON, or domain lists
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="font-mono text-xs text-muted hover:text-ink"
              >
                [ESC / CLOSE]
              </button>
            </div>

            <div className="my-4 flex flex-col gap-4 overflow-y-auto">
              <div>
                <label className="font-mono text-xs uppercase text-ink block mb-1">
                  Paste Cloudflare BIND export, Route53 JSON, or raw domain list:
                </label>
                <textarea
                  rows={5}
                  value={rawText}
                  onChange={(e) => handleParse(e.target.value)}
                  placeholder={`api.example.com. IN A 104.21.5.12\nstaging.example.com. IN CNAME lb.aws.com\nauth.example.com`}
                  className="w-full border border-line bg-subtle p-3 font-mono text-xs text-ink focus:border-ink focus:outline-none"
                />
              </div>

              {parsedDomains.length > 0 && (
                <div>
                  <div className="flex items-center justify-between font-mono text-xs text-muted mb-2">
                    <span>DISCOVERED PERIMETERS ({selectedDomains.size} / {parsedDomains.length} selected):</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedDomains(
                          selectedDomains.size === parsedDomains.length
                            ? new Set()
                            : new Set(parsedDomains),
                        )
                      }
                      className="underline text-ink"
                    >
                      {selectedDomains.size === parsedDomains.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  <div className="max-h-40 overflow-y-auto border border-line bg-subtle p-2">
                    {parsedDomains.map((d) => (
                      <label
                        key={d}
                        className="flex items-center gap-2 py-1 px-2 font-mono text-xs cursor-pointer hover:bg-canvas"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDomains.has(d)}
                          onChange={() => toggleDomain(d)}
                        />
                        <span className="text-ink">{d}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="border border-line bg-subtle p-3">
                <label className="flex items-start gap-2 text-xs leading-relaxed cursor-pointer">
                  <input
                    type="checkbox"
                    checked={authorized}
                    onChange={(e) => setAuthorized(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-ink">
                    <strong className="font-mono uppercase block mb-0.5">Authorization Warranty:</strong>
                    I certify under the Malaysian Computer Crimes Act 1997 that our organization owns or holds written authority to perform external security discovery against these target perimeters.
                  </span>
                </label>
              </div>

              {statusMessage && (
                <div className="border border-ink bg-subtle p-2 font-mono text-xs text-ink">
                  &gt; {statusMessage}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-line pt-3">
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={selectedDomains.size === 0 || !authorized || isPending}
                onClick={handleImport}
              >
                {isPending ? "Importing Perimeters..." : `Import ${selectedDomains.size} Asset(s)`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
