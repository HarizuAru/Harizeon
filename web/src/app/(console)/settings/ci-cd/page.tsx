"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function CiCdSettingsPage() {
  const [activeTab, setActiveTab] = useState<"github" | "gitlab" | "cli">("github");
  const [copied, setCopied] = useState<string | null>(null);

  const githubSnippet = `name: Harizeon Perimeter Security Quality Gate

on:
  pull_request:
    branches: [main, master, staging]
  push:
    branches: [main, master]

jobs:
  perimeter-security-gate:
    name: Audit Perimeter Attack Surface
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Run Harizeon Quality Gate
        env:
          HARIZEON_API_URL: \${{ secrets.HARIZEON_API_URL || 'https://api.harizeon.com' }}
          HARIZEON_API_KEY: \${{ secrets.HARIZEON_API_KEY }}
        run: |
          node tools/ci-gate.mjs --fail-on high --max-allowed 0`;

  const gitlabSnippet = `stages:
  - security

harizeon-perimeter-gate:
  stage: security
  image: node:20-alpine
  script:
    - node tools/ci-gate.mjs --fail-on high --max-allowed 0
  variables:
    HARIZEON_API_URL: "https://api.harizeon.com"
    HARIZEON_API_KEY: "$HARIZEON_API_KEY"
  only:
    - merge_requests
    - main`;

  const cliSnippet = `# 1. Set your Harizeon API Key (generated in Settings -> API Keys)
export HARIZEON_API_KEY="harizeon_live_..."
export HARIZEON_API_URL="https://api.harizeon.com"

# 2. Run the gate directly against your staging or production assets
node tools/ci-gate.mjs --fail-on high --max-allowed 0

# Or target a specific API asset only:
node tools/ci-gate.mjs --asset api.example.com --fail-on critical`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 3000);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="CI/CD Quality Gates & Developer Integrations"
        description="Automated perimeter security quality gates for your build, pull request, and deployment pipelines."
        actions={
          <Link href="/settings/api-keys">
            <Button variant="secondary" size="sm">
              Generate API Key →
            </Button>
          </Link>
        }
      />

      <div className="border border-line bg-canvas p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
              Continuous Shift-Left Attack Surface Management
            </h2>
            <p className="font-mono text-xs text-muted mt-0.5">
              Automatically block pull requests or deployments if a high or critical perimeter vulnerability is introduced.
            </p>
          </div>
          <span className="border border-line bg-subtle px-2 py-0.5 font-mono text-[10px] text-muted uppercase">
            Exit Code 1 on Failure
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-line gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("github")}
            className={`border-b-2 px-3 py-2 font-mono text-xs uppercase font-bold transition-colors ${
              activeTab === "github"
                ? "border-ink text-ink bg-subtle"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            GitHub Actions (.github/workflows)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gitlab")}
            className={`border-b-2 px-3 py-2 font-mono text-xs uppercase font-bold transition-colors ${
              activeTab === "gitlab"
                ? "border-ink text-ink bg-subtle"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            GitLab CI (.gitlab-ci.yml)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cli")}
            className={`border-b-2 px-3 py-2 font-mono text-xs uppercase font-bold transition-colors ${
              activeTab === "cli"
                ? "border-ink text-ink bg-subtle"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            Terminal / Bash / Docker CLI
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted">
              {activeTab === "github" && "File path: .github/workflows/harizeon-gate.yml"}
              {activeTab === "gitlab" && "File path: .gitlab-ci.yml"}
              {activeTab === "cli" && "Standalone Node.js CLI script"}
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const txt =
                  activeTab === "github"
                    ? githubSnippet
                    : activeTab === "gitlab"
                    ? gitlabSnippet
                    : cliSnippet;
                copyToClipboard(txt, activeTab.toUpperCase());
              }}
              className="font-mono text-xs"
            >
              {copied ? `✓ COPIED ${copied}` : "COPY CONFIGURATION"}
            </Button>
          </div>

          <pre className="overflow-x-auto border border-line bg-subtle p-4 font-mono text-xs text-ink leading-relaxed">
            {activeTab === "github" && githubSnippet}
            {activeTab === "gitlab" && gitlabSnippet}
            {activeTab === "cli" && cliSnippet}
          </pre>
        </div>
      </div>

      {/* Integration Step-by-Step Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="border border-line bg-canvas p-4 flex flex-col gap-2">
          <span className="text-[10px] text-muted uppercase font-bold">Step 1</span>
          <span className="font-bold text-ink">Generate API Key</span>
          <p className="font-sans text-xs text-muted leading-relaxed">
            Navigate to <Link href="/settings/api-keys" className="underline text-ink">Settings → API Keys</Link> and create a scoped key with finding read permissions.
          </p>
        </div>

        <div className="border border-line bg-canvas p-4 flex flex-col gap-2">
          <span className="text-[10px] text-muted uppercase font-bold">Step 2</span>
          <span className="font-bold text-ink">Add Repository Secret</span>
          <p className="font-sans text-xs text-muted leading-relaxed">
            In your GitHub repository settings, add <code>HARIZEON_API_KEY</code> under Secrets and Variables → Actions.
          </p>
        </div>

        <div className="border border-line bg-canvas p-4 flex flex-col gap-2">
          <span className="text-[10px] text-muted uppercase font-bold">Step 3</span>
          <span className="font-bold text-ink">Automated Quality Gate</span>
          <p className="font-sans text-xs text-muted leading-relaxed">
            On every pull request, the quality gate audits your perimeter and blocks merge if high or critical exposures violate policy.
          </p>
        </div>
      </div>
    </div>
  );
}
