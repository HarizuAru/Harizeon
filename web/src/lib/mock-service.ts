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
  asset_id: string | null;
  asset_value: string | null;
  first_seen_at: string;
  last_seen_at: string;
  status_reason: string | null;
  events: MockFindingEvent[];
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

const defaultOrg: MockOrg = {
  id: "org-harizeon-demo",
  name: "Acme Cyber Ops",
  slug: "acme-cyber-ops",
};

const defaultUser: MockUser = {
  id: "usr-admin-1",
  email: "admin@harizeon.local",
  name: "Security Lead",
  emailVerified: true,
};

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
    baseScans.push({
      id: `scn-hist-${day}a`,
      status: "completed",
      profile: day % 3 === 0 ? "deep" : day % 2 === 0 ? "quick" : "standard",
      phase: "report",
      progress_pct: 100,
      created_at: new Date(dayBase + 3600000 * 3).toISOString(),
      targets: [{ asset_id: "ast-001", type: "domain", value: "example.com" }],
      events: [
        { seq: 1, phase: "verify", level: "info", message: "Ownership verified", at: new Date(dayBase + 3600000 * 3).toISOString() },
        { seq: 2, phase: "report", level: "info", message: "Audit complete", at: new Date(dayBase + 3600000 * 3 + 400000).toISOString() },
      ],
      summary: { new: day % 6 === 0 ? 1 : 0, resolved: day % 4 === 0 ? 1 : 0, unchanged: 2 },
    });

    // Afternoon scan on most days
    if (day % 3 !== 1) {
      baseScans.push({
        id: `scn-hist-${day}b`,
        status: "completed",
        profile: "standard",
        phase: "report",
        progress_pct: 100,
        created_at: new Date(dayBase + 3600000 * 8).toISOString(),
        targets: [{ asset_id: "ast-002", type: "subdomain", value: "api.example.com" }],
        events: [
          { seq: 1, phase: "verify", level: "info", message: "Ownership verified", at: new Date(dayBase + 3600000 * 8).toISOString() },
          { seq: 2, phase: "report", level: "info", message: "Audit complete", at: new Date(dayBase + 3600000 * 8 + 500000).toISOString() },
        ],
        summary: { new: 0, resolved: 0, unchanged: 1 },
      });
    }

    // Failure on designated days to create realistic trend variations
    if (failureDays.has(day)) {
      baseScans.push({
        id: `scn-hist-${day}f`,
        status: day % 2 === 0 ? "timeout" : "failed",
        profile: "deep",
        phase: day % 2 === 0 ? "inspect" : "probe",
        progress_pct: 35,
        error_code: day % 2 === 0 ? "ERR_WORKER_TIMEOUT" : "ERR_CONNECTION_TIMEOUT",
        error_message: day % 2 === 0 ? "Worker heartbeat timed out during SPA crawl" : "TCP probe dropped by perimeter firewall",
        created_at: new Date(dayBase + 3600000 * 12).toISOString(),
        targets: [{ asset_id: "ast-003", type: "ip", value: "203.0.113.10" }],
        events: [
          { seq: 1, phase: "verify", level: "info", message: "Ownership verified", at: new Date(dayBase + 3600000 * 12).toISOString() },
          { seq: 2, phase: "probe", level: "error", message: "Execution error encountered", at: new Date(dayBase + 3600000 * 12 + 100000).toISOString() },
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
    asset_id: "ast-001",
    asset_value: "example.com",
    first_seen_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    last_seen_at: new Date().toISOString(),
    status_reason: null,
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
    asset_id: "ast-001",
    asset_value: "example.com",
    first_seen_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    last_seen_at: new Date().toISOString(),
    status_reason: null,
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
      "Port 6379 responded to ping from public scanner IP address.\nEvidence: Connected to 203.0.113.10:6379; received PONG response without authentication.",
    remediation:
      "Bind Redis exclusively to 127.0.0.1 or VPC private network interface. Block port 6379 on external firewall rules.",
    severity: "medium",
    status: "open",
    category: "exposed_service",
    cwe_id: "CWE-200",
    asset_id: "ast-003",
    asset_value: "203.0.113.10",
    first_seen_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    last_seen_at: new Date().toISOString(),
    status_reason: null,
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
  assets: MockAsset[] = [...initialAssets];
  verifications: Map<string, MockVerification> = new Map(Object.entries(initialVerifications));
  discovered: MockDiscovered[] = [...initialDiscovered];
  scans: MockScan[] = [...initialScans];
  findings: MockFinding[] = [...initialFindings];
  schedules: MockSchedule[] = [...initialSchedules];
  channels: MockChannel[] = [...initialChannels];
  reports: MockReport[] = [...initialReports];

  constructor() {
    this.users.set(defaultUser.email, defaultUser);
    this.orgs.set(defaultOrg.id, defaultOrg);
  }
}

// Persistent across module reloads in globalThis
const globalKey = "__hz_mock_store__";
const store: MockStore = (globalThis as unknown as Record<string, MockStore>)[globalKey] || new MockStore();
(globalThis as unknown as Record<string, MockStore>)[globalKey] = store;

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

  return {
    id: report.id,
    org_id: report.org_id,
    org_name: defaultOrg.name,
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
        rootCause = "Target perimeter firewall (AWS Security Group / Cloudflare Magic Transit / iptables) dropped scanner ingress packets. Harizeon scanner egress IP ranges are not whitelisted on target ingress rules.";
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
        rootCause = "The asset is hosted on internal split-horizon DNS (e.g. AWS Route 53 Private Hosted Zone) or the DNS record has been decommissioned while remaining in the monitored asset registry.";
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
      newScan.events.push({
        seq: 4,
        phase: "report",
        level: "info",
        message: "Scan complete. Targets analyzed successfully.",
        at: new Date().toISOString(),
      });
      newScan.summary = { new: 0, resolved: 0, unchanged: 3 };
    }, 4000);

    return { scan: newScan } as T;
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

  // POST /auth/logout
  if (pathname === "/auth/logout") {
    return { ok: true } as T;
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
    const json = {
      user: { id: user.id, email: user.email, name: user.name, emailVerified: true },
      org: { id: "org-1", name: b.orgName || "Demo Org", slug: b.orgSlug || "demo-org" },
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
