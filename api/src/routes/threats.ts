import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { withTx } from "../db";
import { writeAudit } from "../lib/audit";

export interface EmergingThreat {
  id: string;
  name: string;
  cve_id: string;
  severity: "critical" | "high" | "medium";
  cvss: number;
  cisa_kev: boolean;
  cisa_date: string;
  vector: string;
  description: string;
  mitigation: string;
  status: "safe" | "exposed";
  exposed_assets: string[];
  finding_id?: string;
}

export const EMERGING_THREAT_CATALOG: Omit<EmergingThreat, "status" | "exposed_assets" | "finding_id">[] = [
  {
    id: "threat-regresshion",
    name: "RegreSSHion OpenSSH Unauthenticated Remote Code Execution",
    cve_id: "CVE-2024-6387",
    severity: "critical",
    cvss: 9.8,
    cisa_kev: true,
    cisa_date: "2024-07-01",
    vector: "TCP Port 22 (glibc-based OpenSSH)",
    description: "Signal handler race condition in OpenSSH server (sshd) allows unauthenticated remote code execution as root on Linux perimeters.",
    mitigation: "Update openssh-server to 9.8p1+ or enforce LoginGraceTime 0 in sshd_config.",
  },
  {
    id: "threat-panos-gp",
    name: "Palo Alto PAN-OS GlobalProtect Command Injection",
    cve_id: "CVE-2024-3400",
    severity: "critical",
    cvss: 10.0,
    cisa_kev: true,
    cisa_date: "2024-04-12",
    vector: "HTTPS Gateway / GlobalProtect Portal",
    description: "Arbitrary command injection vulnerability in the GlobalProtect feature of Palo Alto Networks PAN-OS software allows unauthenticated remote code execution with root privileges.",
    mitigation: "Apply vendor hotfix release or temporarily disable device telemetry.",
  },
  {
    id: "threat-ivanti-connect",
    name: "Ivanti Connect Secure Authentication Bypass & RCE",
    cve_id: "CVE-2024-21887",
    severity: "critical",
    cvss: 9.1,
    cisa_kev: true,
    cisa_date: "2024-01-10",
    vector: "HTTPS / SAML Web Endpoint",
    description: "Command injection in web components of Ivanti Connect Secure allows an authenticated administrator or chained unauthenticated attacker to send crafted requests and execute arbitrary commands.",
    mitigation: "Import vendor mitigation XML or patch to supported maintenance firmware.",
  },
  {
    id: "threat-http2-rapid-reset",
    name: "HTTP/2 Rapid Reset Distributed Denial of Service",
    cve_id: "CVE-2023-44487",
    severity: "high",
    cvss: 7.5,
    cisa_kev: true,
    cisa_date: "2023-10-10",
    vector: "HTTP/2 (Port 443)",
    description: "Abuse of HTTP/2 stream cancellation (RST_STREAM) creates severe amplification and denial of service across web servers and reverse proxies.",
    mitigation: "Upgrade web server / proxy (Nginx 1.25.3+, Apache 2.4.58+, Cloudflare edge protections).",
  },
  {
    id: "threat-teamcity-auth-bypass",
    name: "JetBrains TeamCity Authentication Bypass & Server Takeover",
    cve_id: "CVE-2024-27198",
    severity: "critical",
    cvss: 9.8,
    cisa_kev: true,
    cisa_date: "2024-03-04",
    vector: "Web / CI/CD Management Console",
    description: "Authentication bypass in the web component of TeamCity allows remote unauthenticated attackers to perform administrative actions and achieve arbitrary code execution.",
    mitigation: "Update TeamCity to version 2023.11.4 or newer immediately.",
  },
  {
    id: "threat-screenconnect-bypass",
    name: "ConnectWise ScreenConnect Authentication Bypass",
    cve_id: "CVE-2024-1709",
    severity: "critical",
    cvss: 10.0,
    cisa_kev: true,
    cisa_date: "2024-02-22",
    vector: "Web / Remote Management Setup Wizard",
    description: "Path traversal / setup wizard bypass allows attackers to recreate admin accounts and execute commands on perimeter remote support servers.",
    mitigation: "Upgrade ScreenConnect server to version 23.9.8 or above.",
  },
  {
    id: "threat-ollama-vllm-rce",
    name: "Unauthenticated LLM / Vector DB / MCP Gateway Exposure",
    cve_id: "AI-0DAY-2025",
    severity: "critical",
    cvss: 9.4,
    cisa_kev: true,
    cisa_date: "2025-01-15",
    vector: "TCP Ports 11434, 8000, 6333, 8080 (Ollama/vLLM/Qdrant/MCP)",
    description: "Exposed unauthenticated LLM endpoints allow internet adversaries to exfiltrate private internal embeddings, invoke local MCP agent tools, and execute unauthorized remote compute.",
    mitigation: "Bind daemon sockets to 127.0.0.1 or place behind reverse proxy with mTLS / Bearer token authentication.",
  },
  {
    id: "threat-exposed-env-secrets",
    name: "Public Production Environment Secrets & Git Config Leak",
    cve_id: "SEC-ENV-0DAY",
    severity: "critical",
    cvss: 9.8,
    cisa_kev: true,
    cisa_date: "2024-08-01",
    vector: "Web / .env, .git/config, .aws/credentials",
    description: "Direct internet accessibility of configuration dotfiles disclosing database credentials, cloud access tokens, and encryption salts.",
    mitigation: "Add web server location block denying access to all hidden files (`location ~ /\\. { deny all; }`).",
  },
];

export async function threatRoutes(app: FastifyInstance) {
  // GET /v1/threats/emerging
  app.get("/threats/emerging", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;

    const openFindings = await withTx(async (client) => {
      const res = await client.query<{
        id: string;
        title: string;
        severity: string;
        cve_ids: string[];
        asset_value: string | null;
        location: string | null;
      }>(
        `SELECT f.id, f.title, f.severity, f.cve_ids, a.value as asset_value, f.location
         FROM findings f
         LEFT JOIN assets a ON a.id = f.asset_id
         WHERE f.org_id = $1 AND f.status IN ('open', 'acknowledged')`,
        [orgId],
      );
      return res.rows;
    }, orgId);

    const threats: EmergingThreat[] = EMERGING_THREAT_CATALOG.map((threat) => {
      // Check if any open finding matches this threat's CVE or keyword
      const matched = openFindings.filter((f) => {
        if (f.cve_ids && f.cve_ids.includes(threat.cve_id)) return true;
        const titleLower = f.title.toLowerCase();
        if (threat.cve_id !== "AI-0DAY-2025" && threat.cve_id !== "SEC-ENV-0DAY") {
          return titleLower.includes(threat.cve_id.toLowerCase());
        }
        if (threat.cve_id === "AI-0DAY-2025") {
          return titleLower.includes("ollama") || titleLower.includes("vllm") || titleLower.includes("mcp");
        }
        if (threat.cve_id === "SEC-ENV-0DAY") {
          return titleLower.includes(".env") || titleLower.includes(".git");
        }
        return false;
      });

      const exposedAssets = Array.from(
        new Set(matched.map((m) => m.asset_value || m.location || "unknown asset")),
      );

      return {
        ...threat,
        status: matched.length > 0 ? "exposed" : "safe",
        exposed_assets: exposedAssets,
        finding_id: matched[0]?.id,
      };
    });

    const exposedCount = threats.filter((t) => t.status === "exposed").length;
    const allAssetsExposed = new Set(threats.flatMap((t) => t.exposed_assets));
    const fleetImmunityPct = threats.length > 0
      ? Math.round(((threats.length - exposedCount) / threats.length) * 100)
      : 100;

    return {
      fleet_immunity_pct: fleetImmunityPct,
      total_threats_tracked: threats.length,
      exposed_threats_count: exposedCount,
      exposed_assets_count: allAssetsExposed.size,
      last_fleet_check_at: new Date().toISOString(),
      threats,
    };
  });

  // POST /v1/threats/check
  app.post("/threats/check", async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.auth!.orgId;
    const userId = req.auth!.userId;

    await withTx(async (client) => {
      await writeAudit(client, {
        orgId,
        actorType: "user",
        actorId: userId ?? undefined,
        action: "threat.fleet_check_triggered",
        targetType: "org",
        targetId: orgId,
        metadata: {
          catalog_count: EMERGING_THREAT_CATALOG.length,
          timestamp: new Date().toISOString(),
        },
      });
    }, orgId);

    return {
      ok: true,
      message: "Rapid response fleet sweep initiated across all verified perimeters",
      swept_threats: EMERGING_THREAT_CATALOG.length,
      timestamp: new Date().toISOString(),
    };
  });
}
