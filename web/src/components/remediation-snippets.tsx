"use client";

import { useState } from "react";

interface RemediationSnippetProps {
  title: string;
  category: string | null;
  description: string | null;
  remediationText: string | null;
  assetValue: string | null;
}

interface SnippetTab {
  id: string;
  label: string;
  language: string;
  code: string;
  notes?: string;
}

export function RemediationSnippets({
  title,
  category,
  description,
  remediationText,
  assetValue,
}: RemediationSnippetProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const lowerTitle = (title || "").toLowerCase();
  const lowerDesc = (description || "").toLowerCase();
  const fullText = `${lowerTitle} ${lowerDesc}`;
  const targetHost = assetValue || "target-asset";

  // Detect port if present (e.g. "port 11434", ":8000", "port 6333", etc.)
  const portMatch = fullText.match(/port\s+(\d+)/) || fullText.match(/:(\d{2,5})/);
  const detectedPort = portMatch ? portMatch[1] : null;

  const tabs: SnippetTab[] = [];

  // 1. Exposed Ports & Services (Ollama, vLLM, Chroma, Milvus, Postgres, Redis, etc.)
  if (detectedPort || category === "exposed_service" || lowerTitle.includes("port") || lowerTitle.includes("exposed")) {
    const port = detectedPort || "11434";
    tabs.push({
      id: "ufw",
      label: "UFW (Linux)",
      language: "bash",
      code: `# 1. Block public access to port ${port} immediately\nsudo ufw deny ${port}/tcp\nsudo ufw reload\n\n# Optional: Allow access ONLY from your trusted VPN / bastion IP\n# sudo ufw allow from 10.0.0.1 to any port ${port} proto tcp`,
      notes: "Denies external ingress while keeping loopback/internal traffic accessible.",
    });

    tabs.push({
      id: "docker",
      label: "Docker Compose",
      language: "yaml",
      code: `# In your docker-compose.yml, bind to 127.0.0.1 loopback instead of 0.0.0.0:\nservices:\n  service-name:\n    # Vulnerable: - "${port}:${port}"\n    # Protected (Localhost only):\n    ports:\n      - "127.0.0.1:${port}:${port}"\n\n# Re-deploy with:\n# docker compose up -d`,
      notes: "Prevents Docker from bypassing host iptables rules to the public internet.",
    });

    tabs.push({
      id: "cloud-sg",
      label: "Cloud Firewall (AWS/GCP)",
      language: "bash",
      code: `# AWS CLI: Revoke 0.0.0.0/0 ingress for port ${port}\naws ec2 revoke-security-group-ingress \\\n  --group-id sg-xxxxxxxx \\\n  --protocol tcp \\\n  --port ${port} \\\n  --cidr 0.0.0.0/0`,
      notes: "Restrict security group ingress to specific VPC or private subnet CIDR.",
    });
  }

  // 2. Missing Security Headers (HSTS, CSP, X-Frame-Options, MIME)
  if (category === "headers" || lowerTitle.includes("header") || lowerTitle.includes("csp") || lowerTitle.includes("hsts") || lowerTitle.includes("x-frame")) {
    tabs.push({
      id: "nginx-headers",
      label: "Nginx",
      language: "nginx",
      code: `# In /etc/nginx/conf.d/security.conf or inside server block:\nadd_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;\nadd_header X-Content-Type-Options "nosniff" always;\nadd_header X-Frame-Options "DENY" always;\nadd_header Referrer-Policy "strict-origin-when-cross-origin" always;\nadd_header Content-Security-Policy "default-src 'self'; frame-ancestors 'none';" always;\n\n# Test and reload:\n# sudo nginx -t && sudo systemctl reload nginx`,
      notes: "Applies modern browser defense-in-depth headers against XSS and clickjacking.",
    });

    tabs.push({
      id: "nextjs-headers",
      label: "Next.js",
      language: "javascript",
      code: `// In next.config.mjs:\nconst securityHeaders = [\n  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },\n  { key: 'X-Content-Type-Options', value: 'nosniff' },\n  { key: 'X-Frame-Options', value: 'DENY' },\n  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },\n];\n\nexport default {\n  async headers() {\n    return [{ source: '/(.*)', headers: securityHeaders }];\n  },\n};`,
      notes: "Configures native response headers on all Next.js application routes.",
    });

    tabs.push({
      id: "cloudflare-rules",
      label: "Cloudflare",
      language: "text",
      code: `1. Open Cloudflare Dashboard -> Rules -> Transform Rules\n2. Create a "Modify Response Header" rule for (http.host eq "${targetHost}")\n3. Set Headers:\n   - Strict-Transport-Security: max-age=63072000; includeSubDomains\n   - X-Content-Type-Options: nosniff\n   - X-Frame-Options: DENY`,
      notes: "Injects edge security headers before traffic reaches client browsers.",
    });
  }

  // 3. Leaked Keys / Secrets / Tokens
  if (lowerTitle.includes("key") || lowerTitle.includes("token") || lowerTitle.includes("secret") || lowerTitle.includes("credential") || lowerTitle.includes("leak")) {
    tabs.push({
      id: "revoke-rotate",
      label: "Revoke & Rotate",
      language: "bash",
      code: `# 1. Immediately revoke the compromised key from provider console (OpenAI, Gemini, AWS, etc.)\n# 2. Check provider audit logs for unauthorized API calls.\n# 3. Generate a new key and update environment variables.`,
      notes: "Never assume a leaked token has not been indexed by automated threat scrapers.",
    });

    tabs.push({
      id: "git-purge",
      label: "Git Purge",
      language: "bash",
      code: `# Untrack committed secret files without deleting local copy:\ngit rm --cached .env\necho ".env" >> .gitignore\ngit commit -m "security: untrack .env secrets file"\ngit push origin main`,
      notes: "Ensure secrets are never packaged in client-facing bundles (NEXT_PUBLIC_*).",
    });
  }

  // 4. Verification Check
  tabs.push({
    id: "verify",
    label: "Verify Fix",
    language: "bash",
    code: detectedPort
      ? `# Verify the port is closed from outside:\nnc -zv -w 3 ${targetHost} ${detectedPort}\n# Expected: Connection refused or timed out`
      : `# Verify HTTP response headers:\ncurl -s -I https://${targetHost} | grep -Ei "(strict-transport|content-security|x-frame|x-content)"`,
    notes: "Run from an external terminal or machine to confirm the fix took effect.",
  });

  const [activeTabId, setActiveTabId] = useState<string>(tabs[0]?.id || "verify");
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((current) => (current === id ? null : current));
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-3 border border-line bg-canvas p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                className={`px-2.5 py-1 font-mono text-xs transition-colors ${
                  isActive
                    ? "border border-ink bg-ink text-canvas font-semibold"
                    : "border border-line bg-subtle text-muted hover:text-ink hover:border-ink"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleCopy(activeTab.code, activeTab.id)}
          className="flex items-center gap-1.5 border border-line bg-subtle px-2.5 py-1 font-mono text-xs font-medium text-ink transition-colors hover:border-ink"
        >
          {copiedId === activeTab.id ? (
            <span className="font-bold text-ink">✓ COPIED</span>
          ) : (
            <span>COPY SNIPPET</span>
          )}
        </button>
      </div>

      <div className="relative">
        <pre className="max-w-full overflow-x-auto whitespace-pre-wrap border border-line bg-subtle p-3 font-mono text-xs text-ink leading-relaxed">
          {activeTab.code}
        </pre>
      </div>

      {activeTab.notes ? (
        <p className="font-mono text-[11px] text-muted">
          <span className="text-ink font-semibold">NOTE:</span> {activeTab.notes}
        </p>
      ) : null}

      {remediationText ? (
        <div className="border-t border-line pt-2 text-xs text-muted">
          <span className="font-mono uppercase tracking-wider text-faint">Advisory context:</span>{" "}
          <span className="text-ink">{remediationText}</span>
        </div>
      ) : null}
    </div>
  );
}
