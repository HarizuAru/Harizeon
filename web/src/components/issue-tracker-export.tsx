"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface IssueTrackerExportProps {
  findingId: string;
  title: string;
  severity: string;
  assetValue?: string | null;
  cveIds?: string[];
  cweId?: string | null;
  evidence?: string | null;
  remediation?: string | null;
  category?: string | null;
}

export function IssueTrackerExport({
  findingId,
  title,
  severity,
  assetValue,
  cveIds = [],
  cweId,
  evidence,
  remediation,
}: IssueTrackerExportProps) {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const formattedEvidence = evidence || "Observed during automated perimeter attack surface sweep.";
  const formattedRemediation = remediation || "Apply recommended infrastructure configuration hardening.";
  const cveStr = cveIds && cveIds.length > 0 ? cveIds.join(", ") : "N/A";

  const markdownBody = `### [Harizeon Security Finding] ${title}

- **Severity**: ${severity.toUpperCase()}
- **Target Asset**: \`${assetValue || "Unknown"}\`
- **CVE References**: ${cveStr}
- **CWE**: ${cweId || "N/A"}
- **Engine**: Harizeon EASM

### Evidence
\`\`\`
${formattedEvidence}
\`\`\`

### Recommended Remediation
${formattedRemediation}

---
*Tracked by Harizeon Console: [Verify Fix in 5s](/findings/${findingId})*`;

  const jiraMarkup = `h2. [Harizeon Security Finding] ${severity.toUpperCase()} - ${title}

* *Target Asset:* ${assetValue || "Perimeter"}
* *Severity:* ${severity.toUpperCase()}
* *CVE References:* ${cveStr}
* *CWE ID:* ${cweId || "N/A"}
* *Engine:* Harizeon Continuous EASM

h3. Captured Evidence
{code}
${formattedEvidence}
{code}

h3. Remediation Actions
${formattedRemediation}

----
_Detected by Harizeon EASM. Re-test this endpoint via Harizeon Micro-Probe in /findings/${findingId}_`;

  const handleExportGitHub = () => {
    // Copy Markdown to clipboard and open GitHub issue creator
    navigator.clipboard.writeText(markdownBody);
    setCopiedType("GitHub Markdown copied (opening GitHub...)");
    window.open("https://github.com/new", "_blank");
    setTimeout(() => setCopiedType(null), 4000);
  };

  const handleExportLinear = () => {
    const issueTitle = `[SEC-${severity.toUpperCase()}] ${title}`;
    const linearUrl = `https://linear.app/new?title=${encodeURIComponent(issueTitle)}&description=${encodeURIComponent(markdownBody)}`;
    navigator.clipboard.writeText(markdownBody);
    setCopiedType("Linear Markdown copied (opening Linear...)");
    window.open(linearUrl, "_blank");
    setTimeout(() => setCopiedType(null), 4000);
  };

  const handleCopyJira = () => {
    navigator.clipboard.writeText(jiraMarkup);
    setCopiedType("Jira Ticket Markup copied to clipboard");
    setTimeout(() => setCopiedType(null), 3000);
  };

  return (
    <div className="flex flex-col gap-2 border border-line bg-canvas p-4">
      <div className="flex items-center justify-between border-b border-line pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
            1-Click Issue Tracker Export
          </span>
          <span className="border border-line bg-subtle px-1.5 py-0.2 font-mono text-[9px] uppercase tracking-wider text-muted">
            Engineering Workflow
          </span>
        </div>
        <span className="font-mono text-[10px] text-muted">
          Push directly to engineering backlog
        </span>
      </div>

      <p className="text-xs text-muted font-sans leading-relaxed">
        Export this vulnerability with reproduction steps, redacted evidence, and copy-paste remediation commands directly to your team&apos;s sprint tracker:
      </p>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleExportGitHub}
          className="font-mono text-xs"
        >
          <span className="font-bold mr-1">GH</span> GitHub Issue →
        </Button>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleExportLinear}
          className="font-mono text-xs"
        >
          <span className="font-bold mr-1">LN</span> Linear Issue →
        </Button>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleCopyJira}
          className="font-mono text-xs"
        >
          <span className="font-bold mr-1">JR</span> Copy Jira Ticket
        </Button>

        {copiedType && (
          <span className="font-mono text-[11px] text-ink font-bold border border-ink bg-subtle px-2 py-1">
            ✓ {copiedType}
          </span>
        )}
      </div>
    </div>
  );
}
