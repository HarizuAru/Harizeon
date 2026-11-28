/**
 * In-memory fallback service for Harizeon.
 * When HARIZEON_API_BASE is offline or not configured, this provides
 * full in-memory persistence for auth, assets, verification, scans, and findings.
 */

export interface MockUser {
  id: string;
  email: string;
  name: string;
  password?: string;
  emailVerified: boolean;
}

export interface MockOrg {
  id: string;
  name: string;
  slug: string;
  country?: string;
  currency?: string;
  timezone?: string;
  billing_status?: string;
  created_at?: string;
}

export interface MockMember {
  id: string;
  org_id: string;
  user_id: string;
  role: "owner" | "admin" | "member" | "readonly";
  user_email: string;
  user_name: string;
  invited_by?: string | null;
  accepted_at?: string | null;
  created_at: string;
}

export interface MockAsset {
  id: string;
  value: string;
  type: "domain" | "subdomain" | "ip" | "url";
  criticality: "low" | "medium" | "high";
  tags: string[];
  is_active: boolean;
  created_at: string;
  last_seen_at: string;
  verification_status: "verified" | "pending" | "failed" | null;
}

export interface MockVerification {
  method: string;
  status: string;
  token: string;
  instructions?: Record<string, string>;
  verified_at: string | null;
  last_checked_at: string | null;
}

export interface MockDiscovered {
  id: string;
  parent_id: string;
  fqdn: string;
  is_active: boolean;
  ignored: boolean;
  first_seen_at: string;
}

export interface MockScanEvent {
  seq: number;
  phase: string | null;
  level: string;
  message: string;
  at: string;
}

export interface MockScan {
  id: string;
  status: "queued" | "running" | "completed" | "failed" | "timeout" | "cancelled";
  profile: string;
  phase: string | null;
  progress_pct: number;
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
  updated_at?: string | null;
  targets: { asset_id: string; type: string; value: string }[];
  events: MockScanEvent[];
  summary?: { new: number; resolved: number; unchanged: number } | null;
  error_code?: string | null;
  error_message?: string | null;
  attempt?: number;
}

export interface MockFindingEvent {
  id: string;
  from_status: string | null;
  to_status: string;
  note: string | null;
  at: string;
}

export interface MockFinding {
  id: string;
  title: string;
  description: string | null;
  remediation: string | null;
  severity: "critical" | "high" | "medium" | "low" | "info";
  status: "open" | "acknowledged" | "fixed" | "false_positive" | "accepted";
  category: string | null;
  cwe_id: string | null;
  cve_ids?: string[];
  known_exploited?: boolean;
  epss_score?: number;
  epss_percentile?: number;
  asset_id: string | null;
  asset_value: string | null;
  first_seen_at: string;
  last_seen_at: string;
  status_reason: string | null;
  source_tool?: string | null;
  last_verified_at?: string | null;
  events: MockFindingEvent[];
}

export interface MockDriftEvent {
  id: string;
  org_id: string;
  asset_id: string;
  asset_value?: string;
  scan_id: string;
  event_type:
    | "NEW_SUBDOMAIN_DETECTED"
    | "NEW_PORT_EXPOSED"
    | "TLS_CERT_EXPIRING_SOON"
    | "FINDING_INTRODUCED"
    | "FINDING_REGRESSED"
    | "FINDING_RESOLVED";
  severity: "critical" | "high" | "medium" | "low" | "info";
  summary: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface MockSchedule {
  id: string;
  org_id: string;
  cron: string;
  profile: "quick" | "standard" | "deep";
  timezone: string;
  next_run_at: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockChannel {
  id: string;
  org_id: string;
  type: "email" | "slack" | "webhook" | "discord";
  config: Record<string, unknown>;
  enabled: boolean;
  min_severity: "info" | "low" | "medium" | "high" | "critical";
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockReport {
  id: string;
  org_id: string;
  type: "executive" | "technical" | "compliance";
  generated_at: string;
  period_start: string | null;
  period_end: string | null;
  file_ref: string | null;
  generated_by: string | null;
  created_at: string;
  updated_at: string;
  content?: Record<string, unknown>;
}

export interface MockApiKey {
  id: string;
  org_id?: string;
  orgId?: string;
  name: string;
  prefix: string;
  scopes: string[];
  key?: string;
  createdAt?: string;
  created_at?: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
}

const isCleanDefault =
  process.env.HARIZEON_DEMO_DATA === "0" ||
  process.env.HARIZEON_NO_DEMO_DATA === "1" ||
  process.env.NEXT_PUBLIC_NO_DEMO_DATA === "1";

const defaultOrg: MockOrg = {
  id: "org-harizeon-demo",
  name: isCleanDefault ? "My Organization" : "Acme Cyber Ops",
  slug: isCleanDefault ? "my-org" : "acme-cyber-ops",
  country: "Malaysia",
  currency: "MYR",
  timezone: "Asia/Kuala_Lumpur",
  billing_status: "active",
  created_at: "2026-08-01T00:00:00.000Z",
};

const defaultUser: MockUser = {
  id: "usr-admin-1",
  email: "admin@harizeon.local",
  name: "Security Lead",
  emailVerified: true,
};

const initialMembers: MockMember[] = [
  {
    id: "mem-01",
    org_id: defaultOrg.id,
    user_id: defaultUser.id,
    role: "owner",
    user_email: defaultUser.email,
    user_name: defaultUser.name,
    created_at: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "mem-02",
    org_id: defaultOrg.id,
    user_id: "usr-02",
    role: "admin",
    user_email: "devops-eng@harizeon.local",
    user_name: "DevOps Engineer",
    created_at: "2026-08-15T09:30:00.000Z",
  },
  {
    id: "mem-03",
    org_id: defaultOrg.id,
    user_id: "usr-03",
    role: "readonly",
    user_email: "compliance-auditor@harizeon.local",
    user_name: "Compliance Auditor",
    created_at: "2026-09-01T14:20:00.000Z",
  },
];

// Initial Seed Data
const initialAssets: MockAsset[] = [
  {
    id: "ast-001",
    value: "example.com",
    type: "domain",
    criticality: "high",
    tags: ["prod", "primary"],
    is_active: true,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    last_seen_at: new Date().toISOString(),
    verification_status: "verified",
  },
  {
    id: "ast-002",
    value: "api.example.com",
    type: "subdomain",
    criticality: "high",
    tags: ["prod", "api"],
    is_active: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    last_seen_at: new Date().toISOString(),
    verification_status: "verified",
  },
  {
    id: "ast-003",
    value: "203.0.113.10",
    type: "ip",
    criticality: "medium",
    tags: ["gateway"],
    is_active: true,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    last_seen_at: new Date().toISOString(),
    verification_status: "verified",
  },
];

const initialVerifications: Record<string, MockVerification> = {
  "ast-001": {
    method: "dns_txt",
    status: "verified",
    token: "hz-verify-94a1b02cf",
    verified_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    last_checked_at: new Date().toISOString(),
  },
  "ast-002": {
    method: "dns_txt",
    status: "verified",
    token: "hz-verify-68c3e11aa",
    verified_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    last_checked_at: new Date().toISOString(),
  },
  "ast-003": {
    method: "http_meta",
    status: "verified",
    token: "hz-verify-19d44f77b",
    verified_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    last_checked_at: new Date().toISOString(),
  },
};

const initialDiscovered: MockDiscovered[] = [
  {
    id: "disc-001",
    parent_id: "ast-001",
    fqdn: "staging.example.com",
    is_active: false,
    ignored: false,
    first_seen_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "disc-002",
    parent_id: "ast-001",
    fqdn: "auth.example.com",
    is_active: true,
    ignored: false,
    first_seen_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "disc-003",
    parent_id: "ast-001",
    fqdn: "internal-docs.example.com",
    is_active: false,
    ignored: true,
    first_seen_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

function createInitialScans(): MockScan[] {
  const baseScans: MockScan[] = [
    {
      id: "scn-7b89f012",
      status: "completed",
      profile: "standard",
      phase: "report",
      progress_pct: 100,
      created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
      started_at: new Date(Date.now() - 4 * 3600000).toISOString(),
      finished_at: new Date(Date.now() - 4 * 3600000 + 420000).toISOString(),
      targets: [
        { asset_id: "ast-001", type: "domain", value: "example.com" },
        { asset_id: "ast-002", type: "subdomain", value: "api.example.com" },
      ],
      events: [
        { seq: 1, phase: "verify", level: "info", message: "Ownership verified via DNS TXT record", at: new Date(Date.now() - 4 * 3600000).toISOString() },
        { seq: 2, phase: "discover", level: "info", message: "Certificate transparency logs enumerated 3 subdomains", at: new Date(Date.now() - 4 * 3600000 + 1000).toISOString() },
        { seq: 3, phase: "resolve", level: "info", message: "Resolved DNS A/AAAA records for targets", at: new Date(Date.now() - 4 * 3600000 + 2000).toISOString() },
        { seq: 4, phase: "probe", level: "info", message: "Port audit completed: 80, 443, 6379 reachable", at: new Date(Date.now() - 4 * 3600000 + 3000).toISOString() },
        { seq: 5, phase: "inspect", level: "warn", message: "TLS handshake accepted legacy protocol TLS 1.0", at: new Date(Date.now() - 4 * 3600000 + 4000).toISOString() },
        { seq: 6, phase: "test", level: "info", message: "Inspected response headers: missing CSP", at: new Date(Date.now() - 4 * 3600000 + 5000).toISOString() },
        { seq: 7, phase: "normalize", level: "info", message: "Deduplicated findings against existing baseline", at: new Date(Date.now() - 4 * 3600000 + 6000).toISOString() },
        { seq: 8, phase: "report", level: "info", message: "Scan finished. 3 findings recorded.", at: new Date(Date.now() - 4 * 3600000 + 7000).toISOString() },
      ],
      summary: { new: 3, resolved: 0, unchanged: 0 },
    },
    {
      id: "scn-9a12c401",
      status: "failed",
      profile: "deep",
      phase: "probe",
      progress_pct: 45,
      error_code: "ERR_CONNECTION_TIMEOUT",
      error_message: "TCP port probe timed out on target 203.0.113.10:443. Remote firewall dropped SYN packets without responding.",
      attempt: 2,
      created_at: new Date(Date.now() - 42 * 60000).toISOString(),
      started_at: new Date(Date.now() - 42 * 60000).toISOString(),
      finished_at: new Date(Date.now() - 40 * 60000).toISOString(),
      targets: [{ asset_id: "ast-003", type: "ip", value: "203.0.113.10" }],
      events: [
        { seq: 1, phase: "verify", level: "info", message: "Ownership verified for asset 203.0.113.10", at: new Date(Date.now() - 42 * 60000).toISOString() },
        { seq: 2, phase: "discover", level: "info", message: "Reverse DNS lookup returned gateway-ext.example.com", at: new Date(Date.now() - 42 * 60000 + 1000).toISOString() },
        { seq: 3, phase: "probe", level: "warn", message: "Probing ports 80, 443, 8443, 9000... SYN timeouts detected", at: new Date(Date.now() - 42 * 60000 + 3000).toISOString() },
        { seq: 4, phase: "probe", level: "error", message: "TCP handshake timeout on 203.0.113.10:443 after 10000ms. Perimeter firewall or security group dropped ingress packets.", at: new Date(Date.now() - 42 * 60000 + 13000).toISOString() },
        { seq: 5, phase: "probe", level: "error", message: "Scan failed: ERR_CONNECTION_TIMEOUT. Max attempts (2) reached.", at: new Date(Date.now() - 40 * 60000).toISOString() },
      ],
      summary: null,
    },
    {
      id: "scn-8f43b190",
      status: "timeout",
      profile: "standard",
      phase: "inspect",
      progress_pct: 62,
      error_code: "ERR_WORKER_TIMEOUT",
      error_message: "Worker heartbeat expired after 60s without progress during deep JS crawl inspection. Scan reclaimed and terminated by reaper.",
      attempt: 2,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      started_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      finished_at: new Date(Date.now() - 2 * 3600000 + 120000).toISOString(),
      targets: [{ asset_id: "ast-001", type: "domain", value: "staging.example.com" }],
      events: [
        { seq: 1, phase: "verify", level: "info", message: "Asset verification validated", at: new Date(Date.now() - 2 * 3600000).toISOString() },
        { seq: 2, phase: "discover", level: "info", message: "Found 4 web endpoints", at: new Date(Date.now() - 2 * 3600000 + 1000).toISOString() },
        { seq: 3, phase: "resolve", level: "info", message: "Resolved DNS records", at: new Date(Date.now() - 2 * 3600000 + 2000).toISOString() },
        { seq: 4, phase: "probe", level: "info", message: "Ports 80, 443 open", at: new Date(Date.now() - 2 * 3600000 + 3000).toISOString() },
        { seq: 5, phase: "inspect", level: "warn", message: "Complex SPA dynamic router detected; crawl taking longer than expected", at: new Date(Date.now() - 2 * 3600000 + 10000).toISOString() },
        { seq: 6, phase: "inspect", level: "error", message: "Worker heartbeat stalled for >60s; reclaimed by control-plane reaper (ERR_WORKER_TIMEOUT)", at: new Date(Date.now() - 2 * 3600000 + 120000).toISOString() },
      ],
      summary: null,
    },
    {
      id: "scn-6e71d882",
      status: "failed",
      profile: "quick",
      phase: "resolve",
      progress_pct: 20,
      error_code: "ERR_DNS_NXDOMAIN",
      error_message: "Authoritative nameserver returned NXDOMAIN (RCODE 3). Target subdomain has no valid A or AAAA records published to public resolvers.",
      attempt: 1,
      created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
      started_at: new Date(Date.now() - 5 * 3600000).toISOString(),
      finished_at: new Date(Date.now() - 5 * 3600000 + 15000).toISOString(),
      targets: [{ asset_id: "ast-002", type: "subdomain", value: "internal-docs.example.com" }],
      events: [
        { seq: 1, phase: "verify", level: "info", message: "Target selected: internal-docs.example.com", at: new Date(Date.now() - 5 * 3600000).toISOString() },
        { seq: 2, phase: "resolve", level: "error", message: "Query failed: NXDOMAIN returned by authoritative nameservers for internal-docs.example.com", at: new Date(Date.now() - 5 * 3600000 + 4000).toISOString() },
      ],
      summary: null,
    },
  ];

  // Seed 30-day historical scans
  const now = Date.now();
  const dayMs = 86400000;
  const failureDays = new Set([2, 5, 9, 14, 19, 23, 27]);

  for (let day = 1; day <= 29; day++) {
    const dayBase = now - day * dayMs;
    // Morning scan (always completed)
    const morningDuration = day % 3 === 0 ? 1440000 : day % 2 === 0 ? 95000 : 380000;
    baseScans.push({
      id: `scn-hist-${day}a`,
      status: "completed",
      profile: day % 3 === 0 ? "deep" : day % 2 === 0 ? "quick" : "standard",
      phase: "report",
      progress_pct: 100,
      created_at: new Date(dayBase + 3600000 * 3).toISOString(),
      started_at: new Date(dayBase + 3600000 * 3).toISOString(),
      finished_at: new Date(dayBase + 3600000 * 3 + morningDuration).toISOString(),
      targets: [{ asset_id: "ast-001", type: "domain", value: "example.com" }],
      events: [
        { seq: 1, phase: "verify", level: "info", message: "Ownership verified", at: new Date(dayBase + 3600000 * 3).toISOString() },
        { seq: 2, phase: "report", level: "info", message: "Audit complete", at: new Date(dayBase + 3600000 * 3 + morningDuration).toISOString() },
      ],
      summary: { new: day % 6 === 0 ? 1 : 0, resolved: day % 4 === 0 ? 1 : 0, unchanged: 2 },
    });

    // Afternoon scan on most days
    if (day % 3 !== 1) {
      const afternoonDuration = 325000;
      baseScans.push({
        id: `scn-hist-${day}b`,
        status: "completed",
        profile: "standard",
        phase: "report",
        progress_pct: 100,
        created_at: new Date(dayBase + 3600000 * 8).toISOString(),
        started_at: new Date(dayBase + 3600000 * 8).toISOString(),
        finished_at: new Date(dayBase + 3600000 * 8 + afternoonDuration).toISOString(),
        targets: [{ asset_id: "ast-002", type: "subdomain", value: "api.example.com" }],
        events: [
          { seq: 1, phase: "verify", level: "info", message: "Ownership verified", at: new Date(dayBase + 3600000 * 8).toISOString() },
          { seq: 2, phase: "report", level: "info", message: "Audit complete", at: new Date(dayBase + 3600000 * 8 + afternoonDuration).toISOString() },
        ],
        summary: { new: 0, resolved: 0, unchanged: 1 },
      });
    }

    // Failure on designated days to create realistic trend variations
    if (failureDays.has(day)) {
      const failDuration = 115000;
      baseScans.push({
        id: `scn-hist-${day}f`,
        status: day % 2 === 0 ? "timeout" : "failed",
        profile: "deep",
        phase: day % 2 === 0 ? "inspect" : "probe",
        progress_pct: 35,
        error_code: day % 2 === 0 ? "ERR_WORKER_TIMEOUT" : "ERR_CONNECTION_TIMEOUT",
        error_message: day % 2 === 0 ? "Worker heartbeat timed out during SPA crawl" : "TCP probe dropped by perimeter firewall",
        created_at: new Date(dayBase + 3600000 * 12).toISOString(),
        started_at: new Date(dayBase + 3600000 * 12).toISOString(),
        finished_at: new Date(dayBase + 3600000 * 12 + failDuration).toISOString(),
        targets: [{ asset_id: "ast-003", type: "ip", value: "203.0.113.10" }],
        events: [
          { seq: 1, phase: "verify", level: "info", message: "Ownership verified", at: new Date(dayBase + 3600000 * 12).toISOString() },
          { seq: 2, phase: "probe", level: "error", message: "Execution error encountered", at: new Date(dayBase + 3600000 * 12 + failDuration).toISOString() },
        ],
        summary: null,
      });
    }
  }

  return baseScans.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

const initialScans: MockScan[] = createInitialScans();

const initialFindings: MockFinding[] = [
  {
    id: "fnd-101",
    title: "TLS 1.0/1.1 enabled on public gateway",
    description:
      "Legacy TLS protocols (TLS 1.0 and 1.1) are enabled on the main web endpoint.\nEvidence: Discovered cipher suites: TLS_RSA_WITH_AES_128_CBC_SHA, TLS_RSA_WITH_AES_256_CBC_SHA on port 443.",
    remediation:
      "Disable TLS 1.0 and 1.1 in the reverse proxy / web server configuration. Enforce TLS 1.2 and TLS 1.3 only.",
    severity: "critical",
    status: "open",
    category: "tls",
    cwe_id: "CWE-326",
    cve_ids: ["CVE-2011-3389"],
    known_exploited: false,
    epss_score: 0.082,
    epss_percentile: 0.35,
    asset_id: "ast-001",
    asset_value: "example.com",
    first_seen_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    last_seen_at: new Date().toISOString(),
    status_reason: null,
    source_tool: "tls_audit",
    events: [
      {
        id: "fev-1",
        from_status: null,
        to_status: "open",
        note: "Detected during automated scan scn-7b89f012",
        at: new Date(Date.now() - 4 * 3600000).toISOString(),
      },
    ],
  },
  {
    id: "fnd-102",
    title: "Missing Content-Security-Policy header",
    description:
      "The HTTP response lacks a Content-Security-Policy header, leaving client browsers vulnerable to cross-site scripting (XSS).\nEvidence: HTTP/1.1 200 OK\nServer: nginx\nContent-Type: text/html\n(No Content-Security-Policy present in header list)",
    remediation:
      "Define and deploy a Content-Security-Policy HTTP response header to restrict source origins for scripts, styles, and frames.",
    severity: "high",
    status: "open",
    category: "headers",
    cwe_id: "CWE-693",
    cve_ids: [],
    known_exploited: false,
    epss_score: 0.124,
    epss_percentile: 0.48,
    asset_id: "ast-001",
    asset_value: "example.com",
    first_seen_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    last_seen_at: new Date().toISOString(),
    status_reason: null,
    source_tool: "tls_audit",
    events: [
      {
        id: "fev-2",
        from_status: null,
        to_status: "open",
        note: "Detected during automated scan scn-7b89f012",
        at: new Date(Date.now() - 4 * 3600000).toISOString(),
      },
    ],
  },
  {
    id: "fnd-103",
    title: "Exposed Redis port on public interface",
    description:
      "Port 6379 responded to ping from public scanner IP address without credentials.\nEvidence: Connected to 203.0.113.10:6379; received PONG response without authentication. CISA KEV verified active ransomware weaponization targeting unauth Redis.",
    remediation:
      "Bind Redis exclusively to 127.0.0.1 or VPC private network interface. Block port 6379 on external firewall rules.",
    severity: "critical",
    status: "open",
    category: "exposed_service",
    cwe_id: "CWE-200",
    cve_ids: ["CVE-2022-0543"],
    known_exploited: true,
    epss_score: 0.968,
    epss_percentile: 0.99,
    asset_id: "ast-003",
    asset_value: "203.0.113.10",
    first_seen_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    last_seen_at: new Date().toISOString(),
    status_reason: null,
    source_tool: "tls_audit",
    events: [
      {
        id: "fev-3",
        from_status: null,
        to_status: "open",
        note: "Detected during automated scan scn-7b89f012",
        at: new Date(Date.now() - 4 * 3600000).toISOString(),
      },
    ],
  },
  {
    id: "fnd-104",
    title: "Exposed Spring Boot Actuator endpoint",
    description:
      "Publicly reachable health and metrics endpoint on /actuator/health disclosing application topology.\nEvidence: HTTP 200 OK at https://api.example.com/actuator/health with payload: {\"status\":\"UP\",\"diskSpace\":{\"status\":\"UP\"}}",
    remediation:
      "Restrict management.endpoints.web.exposure.include or enforce strict API gateway authentication on /actuator paths.",
    severity: "high",
    status: "open",
    category: "web",
    cwe_id: "CWE-200",
    cve_ids: ["CVE-2022-22965"],
    known_exploited: true,
    epss_score: 0.925,
    epss_percentile: 0.98,
    asset_id: "ast-002",
    asset_value: "api.example.com",
    first_seen_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    last_seen_at: new Date().toISOString(),
    status_reason: null,
    events: [
      {
        id: "fev-4",
        from_status: null,
        to_status: "open",
        note: "Detected via template-driven web checks",
        at: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
    ],
  },
  {
    id: "fnd-105",
    title: "Unauthenticated Model Context Protocol (MCP) tool endpoint",
    description:
      "Publicly exposed Model Context Protocol (MCP) server endpoints (/mcp, /sse) accept unauthenticated remote procedure calls, allowing attackers to invoke agent tools.\nEvidence: POST https://api.example.com/mcp returned HTTP 200 OK with tool declarations: [readFile, runCommand, dbQuery, gitCommit].",
    remediation:
      "Place agentic MCP endpoints behind mTLS or strict API bearer tokens. Never expose raw MCP tool execution interfaces to public ingress.",
    severity: "critical",
    status: "open",
    category: "ai_exposure",
    cwe_id: "CWE-306",
    cve_ids: ["OWASP-LLM06", "OWASP-LLM08"],
    known_exploited: true,
    epss_score: 0.912,
    epss_percentile: 0.97,
    asset_id: "ast-002",
    asset_value: "api.example.com",
    first_seen_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    last_seen_at: new Date().toISOString(),
    status_reason: null,
    events: [
      {
        id: "fev-5",
        from_status: null,
        to_status: "open",
        note: "Detected via Harizeon AI-Armor (AIA) Agentic Prober",
        at: new Date(Date.now() - 1 * 3600000).toISOString(),
      },
    ],
  },
  {
    id: "fnd-106",
    title: "Publicly readable AWS S3 cloud storage bucket",
    description:
      "Cloud storage bucket s3://example-corp-backups is world-readable without authentication.\nEvidence: GET https://example-corp-backups.s3.amazonaws.com/?list-type=2 returned ListBucketResult with 48 objects including db_dump_2026.sql.gz.",
    remediation:
      "Enable S3 Block Public Access at the bucket and account level. Restrict bucket IAM policy to authorized application roles only.",
    severity: "critical",
    status: "open",
    category: "cloud_storage",
    cwe_id: "CWE-732",
    cve_ids: ["CWE-200"],
    known_exploited: true,
    epss_score: 0.941,
    epss_percentile: 0.98,
    asset_id: "ast-001",
    asset_value: "example.com",
    first_seen_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    last_seen_at: new Date().toISOString(),
    status_reason: null,
    events: [
      {
        id: "fev-6",
        from_status: null,
        to_status: "open",
        note: "Detected via Cloud Storage & Bucket Exposure Audit",
        at: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
    ],
  },
  {
    id: "fnd-107",
    title: "GraphQL Introspection enabled in production",
    description:
      "Production GraphQL endpoint on /graphql permits unrestricted schema introspection, exposing the complete internal data model and unreleased mutations.\nEvidence: POST /graphql with query { __schema { types { name } } } returned HTTP 200 OK disclosing 124 internal entity types.",
    remediation:
      "Disable schema introspection in production environments (e.g., introspection: false in Apollo Server / Yoga / GraphQL Yoga).",
    severity: "medium",
    status: "open",
    category: "api_security",
    cwe_id: "CWE-200",
    cve_ids: [],
    known_exploited: false,
    epss_score: 0.285,
    epss_percentile: 0.64,
    asset_id: "ast-002",
    asset_value: "api.example.com",
    first_seen_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    last_seen_at: new Date().toISOString(),
    status_reason: null,
    events: [
      {
        id: "fev-7",
        from_status: null,
        to_status: "open",
        note: "Detected via API & Schema Security Inspection",
        at: new Date(Date.now() - 3 * 3600000).toISOString(),
      },
    ],
  },
  {
    id: "fnd-108",
    title: "Unprotected ChromaDB vector database endpoint on port 8000",
    description:
      "Enterprise RAG vector store on port 8000 answered /api/v1/collections without authentication, allowing extraction of private embedded knowledge bases.\nEvidence: GET http://203.0.113.10:8000/api/v1/collections returned 200 OK with collections: ['enterprise-hr-docs', 'financial-audit-2025'].",
    remediation:
      "Bind ChromaDB to a private loopback or isolated internal overlay network. Enable server token authentication via CHROMA_SERVER_AUTH_CREDENTIALS.",
    severity: "critical",
    status: "open",
    category: "ai_exposure",
    cwe_id: "CWE-306",
    cve_ids: ["OWASP-LLM06"],
    known_exploited: true,
    epss_score: 0.895,
    epss_percentile: 0.96,
    asset_id: "ast-003",
    asset_value: "203.0.113.10",
    first_seen_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    last_seen_at: new Date().toISOString(),
    status_reason: null,
    events: [
      {
        id: "fev-8",
        from_status: null,
        to_status: "open",
        note: "Detected via Harizeon AI-Armor (AIA) RAG Scanner",
        at: new Date(Date.now() - 1 * 3600000).toISOString(),
      },
    ],
  },
];

const initialDriftEvents: MockDriftEvent[] = [
  {
    id: "drf-001",
    org_id: defaultOrg.id,
    asset_id: "ast-001",
    asset_value: "example.com",
    scan_id: "scn-7b89f012",
    event_type: "NEW_SUBDOMAIN_DETECTED",
    severity: "high",
    summary: "New unannounced subdomain api-gateway.internal.example.com discovered via Certificate Transparency log stream.",
    details: { fqdn: "api-gateway.internal.example.com", source: "crt.sh" },
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "drf-002",
    org_id: defaultOrg.id,
    asset_id: "ast-003",
    asset_value: "203.0.113.10",
    scan_id: "scn-7b89f012",
    event_type: "NEW_PORT_EXPOSED",
    severity: "critical",
    summary: "New exposed listening port TCP/8443 (Management Console) detected on public IP address.",
    details: { port: 8443, proto: "tcp", service: "https-mgmt" },
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: "drf-003",
    org_id: defaultOrg.id,
    asset_id: "ast-001",
    asset_value: "example.com",
    scan_id: "scn-7b89f012",
    event_type: "TLS_CERT_EXPIRING_SOON",
    severity: "medium",
    summary: "Wildcard TLS certificate for *.example.com expires in 14 days. Immediate renewal required to prevent outages.",
    details: { issuer: "Let's Encrypt", expires_at: new Date(Date.now() + 14 * 86400000).toISOString() },
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: "drf-004",
    org_id: defaultOrg.id,
    asset_id: "ast-002",
    asset_value: "api.example.com",
    scan_id: "scn-7b89f012",
    event_type: "FINDING_INTRODUCED",
    severity: "critical",
    summary: "Unauthenticated Model Context Protocol (MCP) tool endpoint introduced on public API ingress.",
    details: { finding_id: "fnd-105", check_id: "ai.mcp.unauthenticated" },
    created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: "drf-005",
    org_id: defaultOrg.id,
    asset_id: "ast-001",
    asset_value: "example.com",
    scan_id: "scn-7b89f012",
    event_type: "FINDING_RESOLVED",
    severity: "info",
    summary: "Deprecated TLS 1.0 cipher suite negotiated on primary HTTPS endpoint was disabled.",
    details: { finding_id: "fnd-101", resolved_check: "tls.cipher.weak" },
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
];

const initialSchedules: MockSchedule[] = [
  {
    id: "sch-001",
    org_id: defaultOrg.id,
    cron: "0 2 * * *",
    profile: "standard",
    timezone: "Asia/Kuala_Lumpur",
    next_run_at: new Date(Date.now() + 18 * 3600000).toISOString(),
    enabled: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "sch-002",
    org_id: defaultOrg.id,
    cron: "0 3 * * 0",
    profile: "deep",
    timezone: "Asia/Kuala_Lumpur",
    next_run_at: new Date(Date.now() + 4 * 86400000).toISOString(),
    enabled: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const initialChannels: MockChannel[] = [
  {
    id: "chn-001",
    org_id: defaultOrg.id,
    type: "email",
    config: { recipients: ["admin@harizeon.local", "security-team@example.com"] },
    enabled: true,
    min_severity: "high",
    verified_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: "chn-002",
    org_id: defaultOrg.id,
    type: "slack",
    config: { webhook_url: "https://hooks.slack.com/services/T00/B00/sec-alerts", channel: "#sec-alerts" },
    enabled: true,
    min_severity: "critical",
    verified_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: "chn-003",
    org_id: defaultOrg.id,
    type: "webhook",
    config: {
      url: "https://api.example.com/webhooks/security",
      secret: "hrz_sec_7a8f9b1c2d3e4f5061",
      description: "SIEM Ingestion Endpoint",
    },
    enabled: true,
    min_severity: "medium",
    verified_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
];

const initialReports: MockReport[] = [
  {
    id: "rep-001",
    org_id: defaultOrg.id,
    type: "executive",
    generated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    period_start: new Date(Date.now() - 30 * 86400000).toISOString(),
    period_end: new Date().toISOString(),
    file_ref: null,
    generated_by: defaultUser.id,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "rep-002",
    org_id: defaultOrg.id,
    type: "technical",
    generated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    period_start: new Date(Date.now() - 14 * 86400000).toISOString(),
    period_end: new Date(Date.now() - 7 * 86400000).toISOString(),
    file_ref: null,
    generated_by: defaultUser.id,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

// Global in-memory singleton state
class MockStore {
  users: Map<string, MockUser> = new Map();
  orgs: Map<string, MockOrg> = new Map();
  assets: MockAsset[] = isCleanDefault ? [] : [...initialAssets];
  verifications: Map<string, MockVerification> = isCleanDefault ? new Map() : new Map(Object.entries(initialVerifications));
  discovered: MockDiscovered[] = isCleanDefault ? [] : [...initialDiscovered];
  scans: MockScan[] = isCleanDefault ? [] : [...initialScans];
  findings: MockFinding[] = isCleanDefault ? [] : [...initialFindings];
  driftEvents: MockDriftEvent[] = isCleanDefault ? [] : [...initialDriftEvents];
  schedules: MockSchedule[] = isCleanDefault ? [] : [...initialSchedules];
  channels: MockChannel[] = isCleanDefault ? [] : [...initialChannels];
  reports: MockReport[] = isCleanDefault ? [] : [...initialReports];
  members: MockMember[] = isCleanDefault
    ? [
        {
          id: "mem-01",
          org_id: defaultOrg.id,
          user_id: defaultUser.id,
          role: "owner",
          user_email: defaultUser.email,
          user_name: defaultUser.name,
          created_at: "2026-08-01T00:00:00.000Z",
        },
      ]
    : [...initialMembers];
  apiKeys: MockApiKey[] = isCleanDefault ? [] : [
    {
      id: "key-01",
      org_id: defaultOrg.id,
      name: "GitHub Actions CI Runner",
      prefix: "hrz_live_a9f2...",
      scopes: ["assets:read", "scans:write", "findings:read"],
      last_used_at: "2026-09-18T10:45:00.000Z",
      expires_at: null,
      revoked_at: null,
      created_at: "2026-08-01T00:00:00.000Z",
    },
    {
      id: "key-02",
      org_id: defaultOrg.id,
      name: "Internal SIEM Ingestion",
      prefix: "hrz_live_7c41...",
      scopes: ["findings:read", "reports:read"],
      last_used_at: "2026-09-19T02:15:00.000Z",
      expires_at: null,
      revoked_at: null,
      created_at: "2026-08-10T12:00:00.000Z",
    },
  ];

  constructor() {
    this.users.set(defaultUser.email, defaultUser);
    this.orgs.set(defaultOrg.id, defaultOrg);
  }

  reset(clean: boolean) {
    if (clean) {
      this.assets = [];
      this.verifications = new Map();
      this.discovered = [];
      this.scans = [];
      this.findings = [];
      this.driftEvents = [];
      this.schedules = [];
      this.reports = [];
      this.apiKeys = [];
      this.members = [
        {
          id: "mem-01",
          org_id: defaultOrg.id,
          user_id: defaultUser.id,
          role: "owner",
          user_email: defaultUser.email,
          user_name: defaultUser.name,
          created_at: new Date().toISOString(),
        },
      ];
    } else {
      this.assets = [...initialAssets];
      this.verifications = new Map(Object.entries(initialVerifications));
      this.discovered = [...initialDiscovered];
      this.scans = [...initialScans];
      this.findings = [...initialFindings];
      this.driftEvents = [...initialDriftEvents];
      this.schedules = [...initialSchedules];
      this.channels = [...initialChannels];
      this.reports = [...initialReports];
      this.members = [...initialMembers];
      this.apiKeys = [
        {
          id: "key-01",
          org_id: defaultOrg.id,
          name: "GitHub Actions CI Runner",
          prefix: "hrz_live_a9f2...",
          scopes: ["assets:read", "scans:write", "findings:read"],
          last_used_at: "2026-09-18T10:45:00.000Z",
          expires_at: null,
          revoked_at: null,
          created_at: "2026-08-01T00:00:00.000Z",
        },
        {
          id: "key-02",
          org_id: defaultOrg.id,
          name: "Internal SIEM Ingestion",
          prefix: "hrz_live_7c41...",
          scopes: ["findings:read", "reports:read"],
          last_used_at: "2026-09-19T02:15:00.000Z",
          expires_at: null,
          revoked_at: null,
          created_at: "2026-08-10T12:00:00.000Z",
        },
      ];
    }
  }
}

// Persistent across module reloads in globalThis
const globalKey = "__hz_mock_store__";
const store: MockStore = (globalThis as unknown as Record<string, MockStore>)[globalKey] || new MockStore();
(globalThis as unknown as Record<string, MockStore>)[globalKey] = store;
store.reset = MockStore.prototype.reset.bind(store);
if (!store.apiKeys) {
  store.apiKeys = isCleanDefault ? [] : [
    {
      id: "key-01",
      org_id: defaultOrg.id,
      name: "GitHub Actions CI Runner",
      prefix: "hrz_live_a9f2...",
      scopes: ["assets:read", "scans:write", "findings:read"],
      last_used_at: "2026-09-18T10:45:00.000Z",
      expires_at: null,
      revoked_at: null,
      created_at: "2026-08-01T00:00:00.000Z",
    },
    {
      id: "key-02",
      org_id: defaultOrg.id,
      name: "Internal SIEM Ingestion",
      prefix: "hrz_live_7c41...",
      scopes: ["findings:read", "reports:read"],
      last_used_at: "2026-09-19T02:15:00.000Z",
      expires_at: null,
      revoked_at: null,
      created_at: "2026-08-10T12:00:00.000Z",
    },
  ];
}
if (!store.members) {
  store.members = isCleanDefault
    ? [
        {
          id: "mem-01",
          org_id: defaultOrg.id,
          user_id: defaultUser.id,
          role: "owner",
          user_email: defaultUser.email,
          user_name: defaultUser.name,
          created_at: "2026-08-01T00:00:00.000Z",
        },
      ]
    : [...initialMembers];
}

function buildMockReportContent(report: MockReport, mockStore: MockStore) {
  const assets = mockStore.assets.filter((a) => a.is_active);
  const findings = mockStore.findings;

  const severityCounts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  let openCount = 0;
  let deductions = 0;

  const findingsList = findings.map((f) => {
    severityCounts[f.severity] = (severityCounts[f.severity] || 0) + 1;
    if (f.status === "open" || f.status === "acknowledged") {
      openCount++;
      const penalty =
        f.severity === "critical" ? 15 : f.severity === "high" ? 8 : f.severity === "medium" ? 3 : 1;
      deductions += penalty;
    }
    const effort: "Low" | "Medium" | "High" =
      f.severity === "critical" ? "High" : f.severity === "high" ? "Medium" : "Low";
    return {
      id: f.id,
      title: f.title,
      severity: f.severity,
      status: f.status,
      asset: f.asset_value || "unknown",
      cvss: f.severity === "critical" ? 9.2 : f.severity === "high" ? 7.5 : f.severity === "medium" ? 5.3 : 2.0,
      category: f.category || "web_security",
      what_it_is: f.description || `Detected ${f.title} on target host.`,
      why_it_matters: `Presents a direct risk vector allowing unauthorized intelligence or access.`,
      remediation: f.remediation || `Follow security guidelines and apply configuration hardening.`,
      remediation_effort: effort,
    };
  });

  const score = Math.max(0, Math.min(100, Math.round(100 - deductions)));

  const topRisks = findingsList
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .slice(0, 3)
    .map((f) => ({
      title: f.title,
      severity: f.severity,
      asset: f.asset,
      impact: f.why_it_matters,
    }));

  const remediationPlan = findingsList
    .filter((f) => f.status === "open" || f.status === "acknowledged")
    .map((f, i) => ({
      priority: i + 1,
      title: f.title,
      asset: f.asset,
      severity: f.severity,
      effort: f.remediation_effort,
      action: f.remediation,
    }));

  const org = mockStore.orgs.get(report.org_id) || mockStore.orgs.get(defaultOrg.id);
  let resolvedOrgName = org?.name || defaultOrg.name;

  // If org name is still the unconfigured default, derive from tested assets so each target receives an accurate organization title
  if (
    (!resolvedOrgName || resolvedOrgName === "Acme Cyber Ops" || resolvedOrgName === "My Organization") &&
    assets.length > 0 &&
    assets[0]?.value
  ) {
    const rawVal = assets[0].value.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
    const hostWithoutWww = rawVal.replace(/^www\./, "");
    const parts = hostWithoutWww.split(".");
    if (parts.length >= 2 && !/^\d+\.\d+\.\d+\.\d+$/.test(hostWithoutWww)) {
      const brand = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      resolvedOrgName = `${brand} Security Operations (${hostWithoutWww})`;
    } else {
      resolvedOrgName = `${hostWithoutWww} Perimeter`;
    }
  }

  return {
    id: report.id,
    org_id: report.org_id,
    org_name: resolvedOrgName,
    type: report.type,
    generated_at: report.generated_at,
    period_start: report.period_start,
    period_end: report.period_end,
    security_score: {
      score,
      totalPenalties: deductions,
      openFindingsCount: openCount,
      weights: { critical: 15, high: 8, medium: 3, low: 1, info: 0 },
      ageMultiplier: { criticalOver7Days: 1.5, highOver7Days: 1.5 },
      categoryCap: 35,
    },
    summary: {
      total_findings: findingsList.length,
      open_findings: openCount,
      assets_tested: assets.length,
      severity_counts: severityCounts,
    },
    top_risks: topRisks,
    scope: assets.map((a) => ({
      value: a.value,
      type: a.type,
      criticality: a.criticality,
    })),
    findings: findingsList,
    remediation_plan: remediationPlan,
    disclaimer:
      "Automated testing only; not a substitute for a manual penetration test. Findings reflect detected state at the time of scan execution. Harizeon provides vulnerability identification and telemetry but does not certify immune status.",
  };
}

/**
 * Handle API requests against the in-memory store.
 */
export async function handleMockApi<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const url = new URL(`http://localhost${path.startsWith("/") ? path : `/${path}`}`);
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  // GET /assets
  if (pathname === "/assets" && method === "GET") {
    let list = [...store.assets];
    const q = searchParams.get("q")?.toLowerCase();
    const type = searchParams.get("type");
    const criticality = searchParams.get("criticality");
    const verified = searchParams.get("verified");

    if (q) list = list.filter((a) => a.value.toLowerCase().includes(q));
    if (type) list = list.filter((a) => a.type === type);
    if (criticality) list = list.filter((a) => a.criticality === criticality);
    if (verified === "yes") list = list.filter((a) => a.verification_status === "verified");
    if (verified === "no") list = list.filter((a) => a.verification_status !== "verified");

    return { data: list, next_cursor: null } as T;
  }

  // POST /assets
  if (pathname === "/assets" && method === "POST") {
    const body = init.body as { type: MockAsset["type"]; value: string; criticality?: MockAsset["criticality"]; tags?: string[] };
    const id = `ast-${Math.random().toString(36).slice(2, 9)}`;
    const newAsset: MockAsset = {
      id,
      value: body.value,
      type: body.type || "domain",
      criticality: body.criticality || "medium",
      tags: body.tags || [],
      is_active: true,
      created_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      verification_status: "pending",
    };
    store.assets.unshift(newAsset);
    return { asset: newAsset } as T;
  }

  // GET /assets/:id
  const assetMatch = pathname.match(/^\/assets\/([^/]+)$/);
  if (assetMatch && method === "GET") {
    const id = assetMatch[1];
    const asset = store.assets.find((a) => a.id === id);
    if (!asset) {
      throw { status: 404, message: "Asset not found", code: "not_found" };
    }
    const verification = store.verifications.get(id) ?? null;
    return { asset, verification } as T;
  }

  // PATCH /assets/:id
  if (assetMatch && method === "PATCH") {
    const id = assetMatch[1];
    const asset = store.assets.find((a) => a.id === id);
    const body = (init.body ?? {}) as { is_active?: boolean; ignored?: boolean };
    if (asset) {
      if (body.is_active !== undefined) asset.is_active = body.is_active;
    }
    const disc = store.discovered.find((d) => d.id === id);
    if (disc) {
      if (body.is_active !== undefined) disc.is_active = body.is_active;
      if (body.ignored !== undefined) disc.ignored = body.ignored;
    }
    return { ok: true } as T;
  }

  // GET /assets/:id/discovered
  const discMatch = pathname.match(/^\/assets\/([^/]+)\/discovered$/);
  if (discMatch && method === "GET") {
    const id = discMatch[1];
    const items = store.discovered.filter((d) => d.parent_id === id);
    return { data: items } as T;
  }

  // POST /assets/:id/verification
  const verifyMatch = pathname.match(/^\/assets\/([^/]+)\/verification$/);
  if (verifyMatch && method === "POST") {
    const id = verifyMatch[1];
    const body = (init.body ?? {}) as { method?: string };
    const methodChoice = body.method || "dns_txt";
    const token = `hz-verify-${Math.random().toString(36).slice(2, 11)}`;
    const verification: MockVerification = {
      method: methodChoice,
      status: "pending",
      token,
      instructions:
        methodChoice === "dns_txt"
          ? { host: "_harizeon-challenge", record: token }
          : { meta_name: "harizeon-verification", content: token },
      verified_at: null,
      last_checked_at: new Date().toISOString(),
    };
    store.verifications.set(id, verification);
    return verification as T;
  }

  // POST /assets/:id/verification/check
  const verifyCheckMatch = pathname.match(/^\/assets\/([^/]+)\/verification\/check$/);
  if (verifyCheckMatch && method === "POST") {
    const id = verifyCheckMatch[1];
    const asset = store.assets.find((a) => a.id === id);
    const existing = store.verifications.get(id);
    const now = new Date().toISOString();
    const updated: MockVerification = {
      method: existing?.method || "dns_txt",
      status: "verified",
      token: existing?.token || `hz-verify-${Math.random().toString(36).slice(2, 11)}`,
      verified_at: now,
      last_checked_at: now,
    };
    store.verifications.set(id, updated);
    if (asset) {
      asset.verification_status = "verified";
    }
    return updated as T;
  }

  // GET /system/health
  if (pathname === "/system/health" && method === "GET") {
    const failedScans = store.scans.filter(
      (s) => s.status === "failed" || s.status === "timeout" || s.status === "cancelled",
    );
    const failureItems = failedScans.map((s) => {
      let title = "Scan Execution Interrupted";
      let rootCause = "The scan encountered an unexpected error during execution.";
      let category: "network_firewall" | "worker_timeout" | "dns_resolution" | "waf_rate_limit" | "tls_crypto" | "asset_verification" = "network_firewall";
      let steps = [
        "Check network reachability of the target host.",
        "Review target firewall and security group rules.",
        "Relaunch the scan with a Quick profile.",
      ];

      if (s.error_code === "ERR_CONNECTION_TIMEOUT" || s.error_code === "connection_timeout") {
        title = "Perimeter Firewall / TCP SYN Probe Timeout";
        category = "network_firewall";
        rootCause = "Target perimeter firewall (Cloud Security Group / Edge Filter / iptables) dropped scanner ingress packets. Harizeon scanner egress IP ranges are not whitelisted on target ingress rules.";
        steps = [
          "Whitelist Harizeon scanner egress IP CIDRs (203.0.113.0/24, 198.51.100.0/24) in your cloud security groups or perimeter firewall.",
          "Check that port 443 is publicly reachable: test with `nc -zv -w 5 <target> 443`.",
          "Verify web server daemon status (nginx/httpd) and inspect firewall audit logs on the destination server.",
          "Run a 'Quick' scan profile first to confirm baseline TCP reachability before executing deep sweeps.",
        ];
      } else if (s.error_code === "ERR_WORKER_TIMEOUT" || s.error_code === "worker_timeout") {
        title = "Worker Heartbeat Expired / Reaped Execution";
        category = "worker_timeout";
        rootCause = "The target website contains recursive SPA client-side routes or an infinite crawler trap, which stalled the headless browser inspection engine past the 60-second heartbeat ceiling.";
        steps = [
          "Review target web application for recursive URL links or infinite pagination without canonical tags.",
          "Switch scan profile to 'Quick' or disable deep web crawling to avoid heavy single-page application execution loops.",
          "Ensure server response time under load is under 2,000ms: prolonged response latencies multiply crawler execution time.",
          "Check Worker Fleet load to ensure worker containers have adequate CPU headroom for headless browser rendering.",
        ];
      } else if (s.error_code === "ERR_DNS_NXDOMAIN" || s.error_code === "dns_unresolvable") {
        title = "DNS A/AAAA Record Unresolvable";
        category = "dns_resolution";
        rootCause = "The asset is hosted on internal split-horizon DNS (e.g. Private Hosted Zone DNS) or the DNS record has been decommissioned while remaining in the monitored asset registry.";
        steps = [
          "Verify public DNS resolution using public resolvers: `dig +short <target> @8.8.8.8`.",
          "If this target is an internal intranet host not reachable from the public internet, decommission it or mark it inactive in Assets.",
          "Check domain registrar NS delegation and verify DNSSEC signatures are valid and not throwing SERVFAIL.",
          "Once public DNS records are established, trigger an asset re-verification before relaunching the scan.",
        ];
      }

      return {
        id: s.id,
        profile: s.profile,
        status: s.status as "failed" | "timeout" | "cancelled",
        phase: s.phase,
        error_code: s.error_code || "ERR_SCAN_FAILURE",
        error_title: title,
        error_message: s.error_message || "Scan terminated prematurely without completing final report phase.",
        root_cause: rootCause,
        troubleshooting_steps: steps,
        suggested_action: "Relaunch scan with adjusted settings",
        action_href: `/scans/new?target=${encodeURIComponent(s.targets[0]?.value || "")}`,
        targets: s.targets,
        attempt: s.attempt || 1,
        max_attempts: 2,
        created_at: s.created_at,
        failed_at: s.created_at,
        category,
      };
    });

    const activeWorkers = 4;
    const totalSlots = 16;
    const runningScansCount = store.scans.filter((s) => s.status === "running").length;
    const usedSlots = Math.min(totalSlots, 7 + runningScansCount * 2);

    return {
      timestamp: new Date().toISOString(),
      status: failedScans.length > 0 ? "degraded" : "operational",
      cluster: {
        region: "ap-southeast-1",
        fleet_name: "cluster-sg-prod-01",
        total_workers: activeWorkers,
        active_workers: activeWorkers,
        total_slots: totalSlots,
        used_slots: usedSlots,
        fleet_load_percent: Math.round((usedSlots / totalSlots) * 1000) / 10,
        avg_job_duration_sec: 42,
      },
      workers: [
        {
          id: "wkr-ap-se1-01",
          name: "Worker 01 (Core Prober)",
          region: "ap-southeast-1a",
          status: "busy",
          current_scan_id: "scn-7b89f012",
          current_target: "api.example.com",
          current_phase: "probe",
          slots_total: 4,
          slots_used: 3,
          cpu_percent: 48,
          memory_mb: 184,
          heartbeat_at: new Date(Date.now() - 2000).toISOString(),
          uptime_seconds: 345600,
          jobs_completed: 184,
          jobs_failed: 1,
        },
        {
          id: "wkr-ap-se1-02",
          name: "Worker 02 (TLS & Crypto)",
          region: "ap-southeast-1a",
          status: "busy",
          current_scan_id: "scn-batch-49a",
          current_target: "example.com",
          current_phase: "inspect",
          slots_total: 4,
          slots_used: 4,
          cpu_percent: 72,
          memory_mb: 236,
          heartbeat_at: new Date(Date.now() - 3000).toISOString(),
          uptime_seconds: 345600,
          jobs_completed: 162,
          jobs_failed: 2,
        },
        {
          id: "wkr-ap-se1-03",
          name: "Worker 03 (Web & CSP Inspector)",
          region: "ap-southeast-1b",
          status: "busy",
          current_scan_id: "scn-web-live",
          current_target: "staging.example.com",
          current_phase: "test",
          slots_total: 4,
          slots_used: 3,
          cpu_percent: 39,
          memory_mb: 165,
          heartbeat_at: new Date(Date.now() - 4000).toISOString(),
          uptime_seconds: 259200,
          jobs_completed: 139,
          jobs_failed: 0,
        },
        {
          id: "wkr-ap-se1-04",
          name: "Worker 04 (Discovery & DNS)",
          region: "ap-southeast-1c",
          status: "idle",
          current_scan_id: null,
          current_target: null,
          current_phase: null,
          slots_total: 4,
          slots_used: 1,
          cpu_percent: 14,
          memory_mb: 118,
          heartbeat_at: new Date(Date.now() - 1000).toISOString(),
          uptime_seconds: 432000,
          jobs_completed: 210,
          jobs_failed: 0,
        },
      ],
      queues: {
        jobs: {
          name: "Scan Jobs Stream",
          stream_key: "harizeon:scans:jobs",
          type: "jobs",
          length: store.scans.filter((s) => s.status === "queued").length + 2,
          in_flight: runningScansCount + 2,
          consumer_group: "workers",
          consumers_active: 4,
          lag: 0,
          status: "nominal",
          throughput_per_min: 8.4,
          avg_latency_ms: 18,
        },
        events: {
          name: "Worker Events Stream",
          stream_key: "harizeon:scans:events",
          type: "events",
          length: 12,
          in_flight: 0,
          consumer_group: "ingest",
          consumers_active: 1,
          lag: 0,
          status: "nominal",
          throughput_per_min: 52.0,
          avg_latency_ms: 6,
        },
        reaper: {
          interval_sec: 15,
          last_run_at: new Date(Date.now() - 8000).toISOString(),
          scans_reaped_24h: 1,
          status: "operational",
        },
      },
      recent_failures: failureItems,
      diagnostics: {
        total_recent_failures: failureItems.length,
        primary_failure_cause:
          failureItems.length > 0
            ? "Target perimeter firewall dropping scanner probe traffic (TCP timeouts)"
            : null,
        recommendations: [
          {
            title: "Perimeter Firewall Allowlisting Required",
            description: "2 recent scans timed out during port probing. Whitelist Harizeon scanner egress CIDRs (203.0.113.0/24) on target cloud security groups.",
            code: "NET_FW_ALLOWLIST",
            affected_scans_count: 1,
          },
          {
            title: "Crawler Timeout on Complex Single-Page Apps",
            description: "1 scan exceeded the 60s worker heartbeat limit. Use the 'Quick' profile for SPA targets or tune web crawling limits.",
            code: "CRAWLER_TIMEOUT_TUNE",
            affected_scans_count: 1,
          },
          {
            title: "Decommissioned or Split-Horizon Subdomain",
            description: "1 scan failed during DNS resolution with NXDOMAIN. Ensure monitored assets have publicly resolvable A/AAAA records.",
            code: "DNS_PUBLIC_VERIFY",
            affected_scans_count: 1,
          },
        ],
      },
    } as T;
  }

  // GET /usage
  if (pathname === "/usage" && method === "GET") {
    return {
      plan: { code: "starter", price_myr_month: 79 },
      usage: {
        scans_this_month: 14,
        max_scans_per_month: 50,
        assets_monitored: store.assets.length,
        max_assets: 5,
        seats_used: 1,
        max_seats: 3,
        is_asset_limit_near: false,
        is_scan_limit_near: false,
        period_start: new Date(Date.now() - 15 * 86400000).toISOString(),
        period_end: new Date(Date.now() + 15 * 86400000).toISOString(),
      },
    } as T;
  }

  // GET /scans
  if (pathname === "/scans" && method === "GET") {
    return { data: store.scans } as T;
  }

  // POST /scans
  if (pathname === "/scans" && method === "POST") {
    const body = (init.body ?? {}) as { asset_ids?: string[]; profile?: string };
    const scanId = `scn-${Math.random().toString(36).slice(2, 10)}`;
    const targets = (body.asset_ids ?? [])
      .map((aid) => {
        const a = store.assets.find((x) => x.id === aid);
        return a ? { asset_id: a.id, type: a.type, value: a.value } : null;
      })
      .filter(Boolean) as { asset_id: string; type: string; value: string }[];

    const newScan: MockScan = {
      id: scanId,
      status: "running",
      profile: body.profile || "standard",
      phase: "probe",
      progress_pct: 25,
      created_at: new Date().toISOString(),
      targets,
      events: [
        {
          seq: 1,
          phase: "verify",
          level: "info",
          message: "Pre-scan ownership verified for target assets",
          at: new Date().toISOString(),
        },
        {
          seq: 2,
          phase: "discover",
          level: "info",
          message: "Enumerating subdomains and IP bindings",
          at: new Date().toISOString(),
        },
        {
          seq: 3,
          phase: "probe",
          level: "info",
          message: "Scanning open network ports and transport protocols",
          at: new Date().toISOString(),
        },
      ],
      summary: null,
    };

    store.scans.unshift(newScan);

    // Simulate completion asynchronously
    setTimeout(() => {
      newScan.phase = "report";
      newScan.progress_pct = 100;
      newScan.status = "completed";
      newScan.finished_at = new Date().toISOString();
      newScan.events.push({
        seq: 4,
        phase: "report",
        level: "info",
        message: "Scan complete. Targets analyzed successfully.",
        at: new Date().toISOString(),
      });

      let newlyCreated = 0;
      for (const t of targets) {
        if (body.profile === "ai") {
          // AI-Armor findings for this target
          const aiaFindings: MockFinding[] = [
            {
              id: `fnd-aia-${Math.random().toString(36).slice(2, 8)}`,
              title: "Exposed LLM Inference Server Daemon (Ollama / vLLM)",
              description: `Autonomous probe detected unauthenticated inference endpoint answering at https://${t.value}:11434/api/tags. Open model access permits prompt injection and weights extraction.`,
              remediation: "Bind LLM serving daemon exclusively to loopback interface (127.0.0.1) or implement mutual TLS and bearer token proxy authorization.",
              severity: "critical",
              status: "open",
              category: "ai_exposure",
              cwe_id: "CWE-306",
              known_exploited: true,
              epss_score: 0.88,
              epss_percentile: 0.95,
              asset_id: t.asset_id,
              asset_value: t.value,
              first_seen_at: new Date().toISOString(),
              last_seen_at: new Date().toISOString(),
              status_reason: null,
              events: [
                {
                  id: `fev-${Date.now()}-1`,
                  from_status: null,
                  to_status: "open",
                  note: "Recorded via Harizeon AI-Armor audit",
                  at: new Date().toISOString(),
                },
              ],
            },
            {
              id: `fnd-aia-${Math.random().toString(36).slice(2, 8)}`,
              title: "Client-Side AI Provider API Key Disclosed in Bundle",
              description: `Client-side JavaScript bundle on ${t.value} contains hardcoded OpenAI / Anthropic API token. Token confirmed active with high entropy.`,
              remediation: "Immediately revoke the leaked key in your AI provider dashboard and migrate inference calls to server-side Next.js route handlers.",
              severity: "high",
              status: "open",
              category: "ai_exposure",
              cwe_id: "CWE-798",
              known_exploited: false,
              epss_score: 0.45,
              epss_percentile: 0.78,
              asset_id: t.asset_id,
              asset_value: t.value,
              first_seen_at: new Date().toISOString(),
              last_seen_at: new Date().toISOString(),
              status_reason: null,
              events: [
                {
                  id: `fev-${Date.now()}-2`,
                  from_status: null,
                  to_status: "open",
                  note: "Recorded via Harizeon AI-Armor audit",
                  at: new Date().toISOString(),
                },
              ],
            },
          ];
          for (const f of aiaFindings) {
            store.findings.unshift(f);
            newlyCreated++;
          }
        } else {
          // Perimeter & Web Scan findings for this target
          const standardFindings: MockFinding[] = [
            {
              id: `fnd-scn-${Math.random().toString(36).slice(2, 8)}`,
              title: "Missing Strict-Transport-Security (HSTS) Header",
              description: `Target ${t.value} does not serve a Strict-Transport-Security header with includeSubDomains and preload directives.`,
              remediation: "Add header: Strict-Transport-Security: max-age=63072000; includeSubDomains; preload to all HTTPS responses.",
              severity: "medium",
              status: "open",
              category: "headers",
              cwe_id: "CWE-693",
              known_exploited: false,
              epss_score: 0.12,
              epss_percentile: 0.42,
              asset_id: t.asset_id,
              asset_value: t.value,
              first_seen_at: new Date().toISOString(),
              last_seen_at: new Date().toISOString(),
              status_reason: null,
              events: [],
            },
            {
              id: `fnd-scn-${Math.random().toString(36).slice(2, 8)}`,
              title: "Server Banner Software Version Disclosure",
              description: `Target ${t.value} discloses full web server version banner in HTTP responses, aiding automated attacker profiling.`,
              remediation: "Disable server software version banners in server configuration (e.g., ServerTokens Prod in Apache, server_tokens off in nginx).",
              severity: "low",
              status: "open",
              category: "headers",
              cwe_id: "CWE-200",
              known_exploited: false,
              epss_score: 0.05,
              epss_percentile: 0.2,
              asset_id: t.asset_id,
              asset_value: t.value,
              first_seen_at: new Date().toISOString(),
              last_seen_at: new Date().toISOString(),
              status_reason: null,
              events: [],
            },
          ];

          for (const f of standardFindings) {
            store.findings.unshift(f);
            newlyCreated++;
          }

          // Discover subdomains for domain assets
          if (t.type === "domain") {
            const subs = [`api.${t.value}`, `admin.${t.value}`, `staging.${t.value}`];
            for (const sub of subs) {
              if (!store.discovered.some((d) => d.fqdn === sub)) {
                store.discovered.push({
                  id: `ast-sub-${Math.random().toString(36).slice(2, 8)}`,
                  parent_id: t.asset_id,
                  fqdn: sub,
                  is_active: false,
                  ignored: false,
                  first_seen_at: new Date().toISOString(),
                });
              }
            }
          }
        }
      }

      newScan.summary = { new: newlyCreated, resolved: 0, unchanged: 0 };
    }, 2500);

    return { scan: newScan } as T;
  }

  // GET /workspace/mode
  if (pathname === "/workspace/mode" && method === "GET") {
    const isClean = store.assets.length === 0 || !store.assets.some((a) => a.id === "ast-001");
    return {
      mode: isClean ? "clean" : "demo",
      assetsCount: store.assets.length,
      scansCount: store.scans.length,
      findingsCount: store.findings.length,
    } as T;
  }

  // POST /workspace/reset
  if (pathname === "/workspace/reset" && method === "POST") {
    const body = (init.body ?? {}) as { mode?: "clean" | "demo" };
    const toClean = body.mode !== "demo";
    store.reset(toClean);
    return {
      ok: true,
      mode: toClean ? "clean" : "demo",
      message: toClean
        ? "Workspace cleared. No demo data is loaded."
        : "Demo data restored.",
    } as T;
  }

  // GET /scans/:id
  const scanMatch = pathname.match(/^\/scans\/([^/]+)$/);
  if (scanMatch && method === "GET") {
    const id = scanMatch[1];
    const scan = store.scans.find((s) => s.id === id);
    if (!scan) {
      throw { status: 404, message: "Scan not found", code: "not_found" };
    }
    return {
      scan: {
        id: scan.id,
        status: scan.status,
        phase: scan.phase,
        progress_pct: scan.progress_pct,
        profile: scan.profile,
        error_code: scan.error_code,
        error_message: scan.error_message,
        attempt: scan.attempt,
        started_at: scan.started_at ?? scan.created_at,
        finished_at: scan.finished_at ?? null,
      },
      targets: scan.targets,
      events: scan.events,
      summary: scan.summary ?? null,
    } as T;
  }

  // POST /scans/:id/cancel
  const scanCancelMatch = pathname.match(/^\/scans\/([^/]+)\/cancel$/);
  if (scanCancelMatch && method === "POST") {
    const id = scanCancelMatch[1];
    const scan = store.scans.find((s) => s.id === id);
    if (scan) {
      scan.status = "cancelled";
      scan.finished_at = new Date().toISOString();
      scan.events.push({
        seq: scan.events.length + 1,
        phase: scan.phase,
        level: "warn",
        message: "Scan cancelled by user",
        at: new Date().toISOString(),
      });
    }
    return { ok: true } as T;
  }

  // POST /scans/:id/retry
  const scanRetryMatch = pathname.match(/^\/scans\/([^/]+)\/retry$/);
  if (scanRetryMatch && method === "POST") {
    const id = scanRetryMatch[1];
    const oldScan = store.scans.find((s) => s.id === id);
    if (!oldScan) {
      throw { status: 404, message: "Scan not found", code: "not_found" };
    }
    const scanId = `scn-${Math.random().toString(36).slice(2, 10)}`;
    const newScan: MockScan = {
      id: scanId,
      status: "running",
      profile: oldScan.profile,
      phase: "verify",
      progress_pct: 15,
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      targets: [...oldScan.targets],
      events: [
        {
          seq: 1,
          phase: "verify",
          level: "info",
          message: `Scan job re-triggered for target assets (previous scan: ${oldScan.id})`,
          at: new Date().toISOString(),
        },
        {
          seq: 2,
          phase: "verify",
          level: "info",
          message: "Pre-scan asset ownership verified",
          at: new Date().toISOString(),
        },
        {
          seq: 3,
          phase: "discover",
          level: "info",
          message: `Active prober engaged with ${oldScan.profile} profile on ${oldScan.targets.length} target(s)`,
          at: new Date().toISOString(),
        },
      ],
      summary: null,
      attempt: (oldScan.attempt ?? 1) + 1,
    };

    store.scans.unshift(newScan);

    // Simulate completion asynchronously
    setTimeout(() => {
      newScan.phase = "report";
      newScan.progress_pct = 100;
      newScan.status = "completed";
      newScan.finished_at = new Date().toISOString();
      newScan.events.push({
        seq: 4,
        phase: "probe",
        level: "info",
        message: "Network ports and protocols audited successfully",
        at: new Date().toISOString(),
      });
      newScan.events.push({
        seq: 5,
        phase: "report",
        level: "info",
        message: "Retry scan completed. All target checks resolved.",
        at: new Date().toISOString(),
      });
      newScan.summary = { new: 0, resolved: 1, unchanged: 2 };
    }, 4500);

    return { scan: newScan } as T;
  }

  // GET /findings
  if (pathname === "/findings" && method === "GET") {
    let list = [...store.findings];
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");

    if (severity) list = list.filter((f) => f.severity === severity);
    if (status) list = list.filter((f) => f.status === status);

    const rows = list.map((f) => ({
      id: f.id,
      title: f.title,
      severity: f.severity,
      status: f.status,
      category: f.category,
      known_exploited: f.known_exploited ?? false,
      epss_score: f.epss_score ?? null,
      epss_percentile: f.epss_percentile ?? null,
      cve_ids: f.cve_ids ?? [],
      asset_value: f.asset_value,
      first_seen_at: f.first_seen_at,
    }));

    return { data: rows, next_cursor: null, has_more: false } as T;
  }

  // GET /findings/counts
  if (pathname === "/findings/counts" && method === "GET") {
    const counts: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };
    for (const f of store.findings) {
      if (f.status === "open") {
        counts[f.severity] = (counts[f.severity] || 0) + 1;
      }
    }
    return counts as T;
  }

  // GET /findings/:id
  const findingMatch = pathname.match(/^\/findings\/([^/]+)$/);
  if (findingMatch && method === "GET") {
    const id = findingMatch[1];
    const finding = store.findings.find((f) => f.id === id);
    if (!finding) {
      throw { status: 404, message: "Finding not found", code: "not_found" };
    }
    return { finding, events: finding.events } as T;
  }

  // PATCH /findings/:id
  if (findingMatch && method === "PATCH") {
    const id = findingMatch[1];
    const finding = store.findings.find((f) => f.id === id);
    const body = (init.body ?? {}) as { status?: MockFinding["status"]; status_reason?: string };
    if (finding && body.status) {
      const prevStatus = finding.status;
      finding.status = body.status;
      if (body.status_reason) finding.status_reason = body.status_reason;
      finding.events.unshift({
        id: `fev-${Date.now()}`,
        from_status: prevStatus,
        to_status: body.status,
        note: body.status_reason || null,
        at: new Date().toISOString(),
      });
    }
    return { ok: true, finding } as T;
  }

  // POST /findings/:id/verify
  const findingVerifyMatch = pathname.match(/^\/findings\/([^/]+)\/verify$/);
  if (findingVerifyMatch && method === "POST") {
    const id = findingVerifyMatch[1];
    const finding = store.findings.find((f) => f.id === id);
    const verifiedAt = new Date().toISOString();
    if (finding) {
      finding.status = "fixed";
      finding.last_verified_at = verifiedAt;
      finding.events.unshift({
        id: `fev-${Date.now()}`,
        from_status: "open",
        to_status: "fixed",
        note: "Target verified clean via 5-second active micro-scan.",
        at: verifiedAt,
      });
    }
    return {
      ok: true,
      verified: true,
      status: "fixed",
      duration_ms: 184,
      verified_at: verifiedAt,
    } as T;
  }

  // GET /drift
  if (pathname === "/drift" && method === "GET") {
    return { data: store.driftEvents } as T;
  }

  // GET /compliance/summary
  if (pathname === "/compliance/summary" && method === "GET") {
    return {
      frameworks: [
        {
          framework_code: "pdpa_2024",
          framework_name: "PDPA 2024 (Malaysia)",
          authority: "Personal Data Protection Commissioner (JPDP)",
          jurisdiction: "Malaysia · Act 709 (2024 Amendment)",
          controls: [
            {
              control_code: "PDPA-S9",
              control_title: "Security Principle (Section 9)",
              description: "Mandates practical steps to protect personal data from loss, misuse, modification, unauthorized access, or accidental disclosure.",
              mapped_findings_count: 2,
              open_findings_count: 0,
              status: "pass",
            },
            {
              control_code: "PDPA-BREACH",
              control_title: "Mandatory Data Breach Prevention",
              description: "Enforces continuous perimeter oversight to prevent exposure of databases, secrets, and customer PII triggering statutory 72-hour breach notification.",
              mapped_findings_count: 3,
              open_findings_count: 1,
              status: "attention_required",
              sample_finding_title: "Client-Side AI API Token Disclosed in JavaScript Bundle",
            },
            {
              control_code: "PDPA-ENCRYPT",
              control_title: "Cryptographic Transit Standards",
              description: "Ensures all public communications and authentication tokens are encrypted using non-deprecated TLS protocols.",
              mapped_findings_count: 4,
              open_findings_count: 0,
              status: "pass",
            },
            {
              control_code: "PDPA-ACCESS",
              control_title: "Perimeter Access Controls",
              description: "Ensures internal administrative endpoints and database listener ports are never exposed to the public internet.",
              mapped_findings_count: 1,
              open_findings_count: 0,
              status: "pass",
            },
          ],
        },
        {
          framework_code: "bnm_rmit",
          framework_name: "BNM RMiT (Financial Services)",
          authority: "Bank Negara Malaysia (BNM)",
          jurisdiction: "Malaysia · Financial Institutions & Fintechs",
          controls: [
            {
              control_code: "RMiT-10.39",
              control_title: "System & Perimeter Hardening",
              description: "Institutions must implement secure baseline configurations, disable unnecessary services/ports, and enforce strong TLS parameters.",
              mapped_findings_count: 4,
              open_findings_count: 1,
              status: "attention_required",
              sample_finding_title: "Missing Strict-Transport-Security Header",
            },
            {
              control_code: "RMiT-10.56",
              control_title: "Continuous Vulnerability Monitoring",
              description: "Mandates ongoing automated scanning and asset discovery to identify and remediate perimeter weaknesses on internet-facing systems.",
              mapped_findings_count: 5,
              open_findings_count: 0,
              status: "pass",
            },
            {
              control_code: "RMiT-11.12",
              control_title: "Third-Party & API Exposure",
              description: "Prohibits unauthenticated API schema introspection and leaked service tokens on public endpoints.",
              mapped_findings_count: 2,
              open_findings_count: 0,
              status: "pass",
            },
            {
              control_code: "RMiT-12.04",
              control_title: "DNS & Email Domain Integrity",
              description: "Requires protective DNS controls, DMARC/SPF email spoofing defense, and monitoring for dangling DNS takeover vectors.",
              mapped_findings_count: 1,
              open_findings_count: 0,
              status: "pass",
            },
          ],
        },
        {
          framework_code: "iso_27001",
          framework_name: "ISO / IEC 27001:2022",
          authority: "International Organization for Standardization",
          jurisdiction: "Global · Enterprise Information Security",
          controls: [
            {
              control_code: "A.8.9",
              control_title: "Configuration Management",
              description: "Security configurations for hardware, software, services and networks must be established, documented, implemented, and monitored.",
              mapped_findings_count: 5,
              open_findings_count: 1,
              status: "attention_required",
              sample_finding_title: "Missing Strict-Transport-Security Header",
            },
            {
              control_code: "A.8.20",
              control_title: "Networks Security",
              description: "Networks must be secured, managed, and controlled to protect information in systems and applications.",
              mapped_findings_count: 3,
              open_findings_count: 0,
              status: "pass",
            },
            {
              control_code: "A.8.24",
              control_title: "Use of Cryptography",
              description: "Rules for the effective use of cryptography, including cryptographic key management and modern cipher suites, must be defined and applied.",
              mapped_findings_count: 4,
              open_findings_count: 0,
              status: "pass",
            },
            {
              control_code: "A.8.8",
              control_title: "Management of Technical Vulnerabilities",
              description: "Information about technical vulnerabilities of information systems being used must be obtained in a timely fashion.",
              mapped_findings_count: 6,
              open_findings_count: 0,
              status: "pass",
            },
          ],
        },
      ],
    } as T;
  }

  // GET /public/trust/:slug
  const trustMatch = pathname.match(/^\/public\/trust\/([^/]+)$/);
  if (trustMatch && method === "GET") {
    const slug = trustMatch[1];
    const org = store.orgs.get(defaultOrg.id) ?? defaultOrg;
    return {
      profile: {
        org_name: org.name,
        slug,
        posture_score: 98,
        grade: "A+",
        verified_domains_count: store.assets.filter((a) => a.type === "domain" && a.verification_status === "verified").length || 3,
        open_critical_count: store.findings.filter((f) => f.status === "open" && f.severity === "critical").length,
        last_scan_at: new Date().toISOString(),
        is_verified: true,
        sha256_attestation: "4f8a9b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcd",
      },
    } as T;
  }

  // GET /api-keys
  if (pathname === "/api-keys" && method === "GET") {
    return { keys: store.apiKeys } as T;
  }

  // POST /api-keys
  if (pathname === "/api-keys" && method === "POST") {
    const body = (init.body ?? {}) as { name?: string; scopes?: string[] };
    const rand = Math.random().toString(36).slice(2, 8);
    const secret = `hrz_live_${rand}${Math.random().toString(36).slice(2, 18)}`;
    const prefix = `hrz_live_${rand}...`;
    const newKey = {
      id: `key-${Date.now().toString(36)}`,
      orgId: defaultOrg.id,
      name: body.name || "Default API Key",
      prefix,
      scopes: body.scopes || ["assets:read", "findings:read"],
      key: secret,
      createdAt: new Date().toISOString(),
      last_used_at: null,
      expires_at: null,
      revoked_at: null,
    };
    store.apiKeys.unshift(newKey);
    return newKey as T;
  }

  // DELETE /api-keys/:id
  const apiKeyMatch = pathname.match(/^\/api-keys\/([^/]+)$/);
  if (apiKeyMatch && method === "DELETE") {
    const id = apiKeyMatch[1];
    store.apiKeys = store.apiKeys.filter((k: MockApiKey) => k.id !== id);
    return { ok: true } as T;
  }

  // GET /schedules
  if (pathname === "/schedules" && method === "GET") {
    return { data: store.schedules } as T;
  }

  // POST /schedules
  if (pathname === "/schedules" && method === "POST") {
    const body = (init.body ?? {}) as {
      cron?: string;
      profile?: "quick" | "standard" | "deep";
      timezone?: string;
      enabled?: boolean;
    };
    const newSchedule: MockSchedule = {
      id: `sch-${Date.now().toString(36)}`,
      org_id: defaultOrg.id,
      cron: body.cron || "0 2 * * *",
      profile: body.profile || "standard",
      timezone: body.timezone || "Asia/Kuala_Lumpur",
      next_run_at: new Date(Date.now() + 24 * 3600000).toISOString(),
      enabled: body.enabled !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.schedules.unshift(newSchedule);
    return { schedule: newSchedule } as T;
  }

  // PATCH /schedules/:id
  const scheduleMatch = pathname.match(/^\/schedules\/([^/]+)$/);
  if (scheduleMatch && method === "PATCH") {
    const id = scheduleMatch[1];
    const sch = store.schedules.find((s) => s.id === id);
    if (sch) {
      const b = (init.body ?? {}) as Partial<MockSchedule>;
      if (b.cron !== undefined) sch.cron = b.cron;
      if (b.profile !== undefined) sch.profile = b.profile;
      if (b.timezone !== undefined) sch.timezone = b.timezone;
      if (b.enabled !== undefined) sch.enabled = b.enabled;
      sch.updated_at = new Date().toISOString();
      return { schedule: sch } as T;
    }
    throw { status: 404, message: "Schedule not found", code: "not_found" };
  }

  // DELETE /schedules/:id
  if (scheduleMatch && method === "DELETE") {
    const id = scheduleMatch[1];
    store.schedules = store.schedules.filter((s) => s.id !== id);
    return { ok: true } as T;
  }

  // GET /channels
  if (pathname === "/channels" && method === "GET") {
    return { data: store.channels } as T;
  }

  // POST /channels
  if (pathname === "/channels" && method === "POST") {
    const body = (init.body ?? {}) as {
      type: "email" | "slack" | "webhook" | "discord";
      config: Record<string, unknown>;
      min_severity?: "info" | "low" | "medium" | "high" | "critical";
      enabled?: boolean;
    };
    const newChannel: MockChannel = {
      id: `chn-${Date.now().toString(36)}`,
      org_id: defaultOrg.id,
      type: body.type || "email",
      config: body.config || {},
      enabled: body.enabled !== false,
      min_severity: body.min_severity || "high",
      verified_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.channels.unshift(newChannel);
    return { channel: newChannel } as T;
  }

  // PATCH /channels/:id
  const channelMatch = pathname.match(/^\/channels\/([^/]+)$/);
  if (channelMatch && method === "PATCH") {
    const id = channelMatch[1];
    const ch = store.channels.find((c) => c.id === id);
    if (ch) {
      const b = (init.body ?? {}) as Partial<MockChannel>;
      if (b.config !== undefined) ch.config = b.config;
      if (b.min_severity !== undefined) ch.min_severity = b.min_severity;
      if (b.enabled !== undefined) ch.enabled = b.enabled;
      ch.updated_at = new Date().toISOString();
      return { channel: ch } as T;
    }
    throw { status: 404, message: "Channel not found", code: "not_found" };
  }

  // DELETE /channels/:id
  if (channelMatch && method === "DELETE") {
    const id = channelMatch[1];
    store.channels = store.channels.filter((c) => c.id !== id);
    return { ok: true } as T;
  }

  // POST /channels/:id/test
  const channelTestMatch = pathname.match(/^\/channels\/([^/]+)\/test$/);
  if (channelTestMatch && method === "POST") {
    const id = channelTestMatch[1];
    const ch = store.channels.find((c) => c.id === id);
    if (ch) {
      ch.verified_at = new Date().toISOString();
      return {
        ok: true,
        message: `Dispatched test payload to ${ch.type} destination successfully.`,
      } as T;
    }
    throw { status: 404, message: "Channel not found", code: "not_found" };
  }

  // GET /reports
  if (pathname === "/reports" && method === "GET") {
    return { data: store.reports } as T;
  }

  // POST /reports
  if (pathname === "/reports" && method === "POST") {
    const body = (init.body ?? {}) as {
      type: "executive" | "technical" | "compliance";
      period_start?: string;
      period_end?: string;
      asset_ids?: string[];
      include_resolved?: boolean;
    };

    const newReport: MockReport = {
      id: `rep-${Date.now().toString(36)}`,
      org_id: defaultOrg.id,
      type: body.type || "executive",
      generated_at: new Date().toISOString(),
      period_start: body.period_start || new Date(Date.now() - 30 * 86400000).toISOString(),
      period_end: body.period_end || new Date().toISOString(),
      file_ref: null,
      generated_by: defaultUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const content = buildMockReportContent(newReport, store);
    newReport.content = content;
    newReport.file_ref = JSON.stringify(content);
    store.reports.unshift(newReport);
    return { report: newReport, content } as T;
  }

  // GET /reports/:id
  const reportMatch = pathname.match(/^\/reports\/([^/]+)$/);
  if (reportMatch && method === "GET") {
    const id = reportMatch[1];
    const rep = store.reports.find((r) => r.id === id);
    if (rep) {
      const content = rep.content || (rep.file_ref ? JSON.parse(rep.file_ref) : buildMockReportContent(rep, store));
      return { report: rep, content } as T;
    }
    throw { status: 404, message: "Report not found", code: "not_found" };
  }

  // GET /org
  if (pathname === "/org" && method === "GET") {
    const org = store.orgs.get(defaultOrg.id) ?? defaultOrg;
    return { org } as T;
  }

  // PATCH /org
  if (pathname === "/org" && method === "PATCH") {
    let body = init.body as Record<string, unknown> | string | undefined;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body) as Record<string, unknown>;
      } catch {
        body = {};
      }
    }
    const b = (body ?? {}) as Record<string, unknown>;
    let org = store.orgs.get(defaultOrg.id) ?? { ...defaultOrg };
    const rawName = (b.name || b.orgName || b.org_name || org.name) as string;
    const cleanName = typeof rawName === "string" && rawName.trim() ? rawName.trim() : org.name;
    org = {
      ...org,
      ...b,
      name: cleanName,
      slug: cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    };
    store.orgs.set(defaultOrg.id, org);
    defaultOrg.name = org.name;
    defaultOrg.slug = org.slug;
    return { org } as T;
  }

  // GET /org/members
  if (pathname === "/org/members" && method === "GET") {
    return { members: store.members } as T;
  }

  // POST /org/members/invite
  if (pathname === "/org/members/invite" && method === "POST") {
    const body = (init.body ?? {}) as { email?: string; role?: "admin" | "member" | "readonly" };
    const newMember: MockMember = {
      id: `mem-${Date.now().toString(36)}`,
      org_id: defaultOrg.id,
      user_id: `usr-${Math.random().toString(36).slice(2, 8)}`,
      role: body.role || "member",
      user_email: body.email || "colleague@harizeon.local",
      user_name: body.email ? body.email.split("@")[0] : "Team Member",
      created_at: new Date().toISOString(),
    };
    store.members.push(newMember);
    return { ok: true, member: newMember } as T;
  }

  // DELETE /org/members/:id
  const memberMatch = pathname.match(/^\/org\/members\/([^/]+)$/);
  if (memberMatch && method === "DELETE") {
    const id = memberMatch[1];
    store.members = store.members.filter((m) => m.id !== id);
    return { ok: true } as T;
  }

  // POST /auth/logout
  if (pathname === "/auth/logout") {
    return { ok: true } as T;
  }

  // GET /threats/emerging
  if (pathname === "/threats/emerging" && method === "GET") {
    const openFindings = store.findings.filter((f) => f.status === "open" || f.status === "acknowledged");
    const catalog = [
      {
        id: "threat-regresshion",
        name: "RegreSSHion OpenSSH Unauthenticated Remote Code Execution",
        cve_id: "CVE-2024-6387",
        severity: "critical" as const,
        cvss: 9.8,
        cisa_kev: true,
        cisa_date: "2024-07-01",
        vector: "TCP Port 22 (glibc-based OpenSSH)",
        description: "Signal handler race condition in OpenSSH server (sshd) allows unauthenticated remote code execution as root.",
        mitigation: "Update openssh-server to 9.8p1+ or enforce LoginGraceTime 0 in sshd_config.",
      },
      {
        id: "threat-panos-gp",
        name: "Palo Alto PAN-OS GlobalProtect Command Injection",
        cve_id: "CVE-2024-3400",
        severity: "critical" as const,
        cvss: 10.0,
        cisa_kev: true,
        cisa_date: "2024-04-12",
        vector: "HTTPS Gateway / GlobalProtect Portal",
        description: "Arbitrary command injection in GlobalProtect allowing unauthenticated root RCE.",
        mitigation: "Apply vendor hotfix release or temporarily disable device telemetry.",
      },
      {
        id: "threat-ivanti-connect",
        name: "Ivanti Connect Secure Authentication Bypass & RCE",
        cve_id: "CVE-2024-21887",
        severity: "critical" as const,
        cvss: 9.1,
        cisa_kev: true,
        cisa_date: "2024-01-10",
        vector: "HTTPS / SAML Web Endpoint",
        description: "Command injection in web components permitting unauthenticated arbitrary command execution.",
        mitigation: "Import vendor mitigation XML or patch to supported maintenance firmware.",
      },
      {
        id: "threat-http2-rapid-reset",
        name: "HTTP/2 Rapid Reset Distributed Denial of Service",
        cve_id: "CVE-2023-44487",
        severity: "high" as const,
        cvss: 7.5,
        cisa_kev: true,
        cisa_date: "2023-10-10",
        vector: "HTTP/2 (Port 443)",
        description: "Abuse of HTTP/2 stream cancellation (RST_STREAM) causing amplification DoS across reverse proxies.",
        mitigation: "Upgrade web server / proxy (Nginx 1.25.3+, Apache 2.4.58+, Cloudflare edge protections).",
      },
      {
        id: "threat-ollama-vllm-rce",
        name: "Unauthenticated LLM / Vector DB / MCP Gateway Exposure",
        cve_id: "AI-0DAY-2025",
        severity: "critical" as const,
        cvss: 9.4,
        cisa_kev: true,
        cisa_date: "2025-01-15",
        vector: "TCP Ports 11434, 8000, 6333, 8080",
        description: "Exposed unauthenticated LLM endpoints leaking private embeddings and allowing unauthorized agent tool calls.",
        mitigation: "Bind daemon sockets to 127.0.0.1 or place behind mTLS / Bearer token reverse proxy.",
      },
      {
        id: "threat-exposed-env-secrets",
        name: "Public Production Environment Secrets & Git Config Leak",
        cve_id: "SEC-ENV-0DAY",
        severity: "critical" as const,
        cvss: 9.8,
        cisa_kev: true,
        cisa_date: "2024-08-01",
        vector: "Web / .env, .git/config, .aws/credentials",
        description: "Direct internet accessibility of configuration dotfiles disclosing cloud keys and DB secrets.",
        mitigation: "Add web server location block denying access to all hidden dotfiles.",
      },
    ];

    const threats = catalog.map((threat) => {
      const matched = openFindings.filter((f) => {
        if (f.cve_ids?.includes(threat.cve_id)) return true;
        const lower = f.title.toLowerCase();
        if (threat.cve_id === "AI-0DAY-2025") return lower.includes("ollama") || lower.includes("vllm") || lower.includes("mcp");
        if (threat.cve_id === "SEC-ENV-0DAY") return lower.includes(".env") || lower.includes(".git");
        return lower.includes(threat.cve_id.toLowerCase());
      });
      const exposedAssets = Array.from(new Set(matched.map((m) => m.asset_value || "perimeter")));
      return {
        ...threat,
        status: matched.length > 0 ? ("exposed" as const) : ("safe" as const),
        exposed_assets: exposedAssets,
        finding_id: matched[0]?.id,
      };
    });

    const exposedCount = threats.filter((t) => t.status === "exposed").length;
    return {
      fleet_immunity_pct: Math.round(((threats.length - exposedCount) / threats.length) * 100),
      total_threats_tracked: threats.length,
      exposed_threats_count: exposedCount,
      exposed_assets_count: new Set(threats.flatMap((t) => t.exposed_assets)).size,
      last_fleet_check_at: new Date().toISOString(),
      threats,
    } as T;
  }

  // POST /threats/check
  if (pathname === "/threats/check" && method === "POST") {
    return {
      ok: true,
      message: "Rapid response fleet sweep initiated across all verified perimeters",
      swept_threats: 6,
      timestamp: new Date().toISOString(),
    } as T;
  }

  return {} as T;
}

/**
 * Handle Auth POST operations (signup and login) against in-memory store.
 */
export async function handleMockAuthPost(
  path: string,
  body: unknown,
): Promise<{ res: Response; json: unknown }> {
  const b = (body ?? {}) as Record<string, string>;

  if (path === "/auth/signup") {
    const email = b.email || "user@example.com";
    const name = b.name || "User";
    const user: MockUser = {
      id: `usr-${Math.random().toString(36).slice(2, 9)}`,
      email,
      name,
      emailVerified: true,
    };
    store.users.set(email, user);
    if (b.orgName) {
      defaultOrg.name = b.orgName;
      defaultOrg.slug = b.orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      store.orgs.set(defaultOrg.id, {
        ...defaultOrg,
        name: b.orgName,
        slug: defaultOrg.slug,
      });
    }
    const json = {
      user: { id: user.id, email: user.email, name: user.name, emailVerified: true },
      org: { id: defaultOrg.id, name: b.orgName || defaultOrg.name, slug: defaultOrg.slug },
      message: "Account created successfully",
    };
    return {
      res: new Response(JSON.stringify(json), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
      json,
    };
  }

  if (path === "/auth/login") {
    const email = b.email || "admin@harizeon.local";
    let user = store.users.get(email);
    if (!user) {
      user = {
        id: `usr-${Math.random().toString(36).slice(2, 9)}`,
        email,
        name: email.split("@")[0],
        emailVerified: true,
      };
      store.users.set(email, user);
    }
    const token = `mock-session-${Math.random().toString(36).slice(2, 16)}`;
    const json = {
      user: { id: user.id, email: user.email, name: user.name, emailVerified: true },
      org: { id: defaultOrg.id },
    };
    return {
      res: new Response(JSON.stringify(json), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `hz_session=${token}; Path=/; HttpOnly; SameSite=Lax`,
        },
      }),
      json,
    };
  }

  return {
    res: new Response(JSON.stringify({ error: { message: "Not found" } }), { status: 404 }),
    json: { error: { message: "Not found" } },
  };
}

/**
 * Retrieve events for a mock scan (used by SSE proxy when API daemon is offline).
 */
export function getMockScanEvents(id: string): MockScanEvent[] {
  const scan = store.scans.find((s) => s.id === id);
  return scan ? [...scan.events] : [];
}
