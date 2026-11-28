export interface NavMegaColumn {
  heading: string;
  links: { label: string; href: string; badge?: string }[];
}

export interface NavMegaItem {
  id: string;
  label: string;
  richCards: {
    title: string;
    description: string;
    href: string;
  }[];
  columns: NavMegaColumn[];
  featured: {
    eyebrow: string;
    title: string;
    href: string;
    cta: string;
    image: string;
    imageAlt: string;
  };
  seeAllHref?: string;
  seeAllLabel?: string;
}

export const LANDING_NAV_DROPDOWNS: NavMegaItem[] = [
  {
    id: "platform",
    label: "Platform",
    richCards: [
      {
        title: "Harizeon AI-Armor (AIA)",
        description:
          "30-second external audit for unauthenticated LLM inference APIs, vector databases, MCP endpoints, and leaked client provider keys.",
        href: "/services/aia",
      },
      {
        title: "Harizeon Surface (ASM)",
        description:
          "Certificate Transparency & DNS subdomain discovery with strict verified-perimeter containment before any scan executes.",
        href: "/services/asm",
      },
      {
        title: "Harizeon Scan (SCN)",
        description:
          "Non-destructive multi-phase scanner covering ports, TLS protocols, HTTP headers, web secrets, and curated CVEs.",
        href: "/services/scan",
      },
      {
        title: "Harizeon Audit (ADT)",
        description:
          "Executive posture scoring (0–100) with prioritized remediation and ISO 27001, SOC 2, BNM RMiT, and PDPA mapping.",
        href: "/services/adt",
      },
    ],
    columns: [
      {
        heading: "Shipped Engines",
        links: [
          { label: "AIA · AI-Armor", href: "/services/aia" },
          { label: "ASM · Surface", href: "/services/asm" },
          { label: "PRO · Probe", href: "/services/pro" },
          { label: "INS · Inspect", href: "/services/ins" },
          { label: "SCN · Scan", href: "/services/scan" },
          { label: "ADT · Audit", href: "/services/adt" },
        ],
      },
      {
        heading: "Roadmap (v0.2+)",
        links: [
          { label: "VLT · Vault", href: "/services/vlt", badge: "Roadmap" },
          { label: "WCH · Watch", href: "/services/wch", badge: "Roadmap" },
          { label: "SHD · Shield", href: "/services/shd", badge: "Roadmap" },
          { label: "RSP · Respond", href: "/services/rsp", badge: "Roadmap" },
        ],
      },
    ],
    featured: {
      eyebrow: "Featured Posture",
      title: "98 / 100 Grade A — Harizeon Continuous Self-Scan",
      href: "/security",
      cta: "Inspect Security Posture",
      image: "/landing/nav-servers.avif",
      imageAlt: "Server rack infrastructure",
    },
    seeAllHref: "/services",
    seeAllLabel: "See All",
  },
  {
    id: "services",
    label: "Services",
    richCards: [
      {
        title: "Surface Reconnaissance",
        description:
          "Discover subdomains via CT logs, map public TCP ports, and capture service banners without exploit payloads.",
        href: "/services/asm",
      },
      {
        title: "AI & Vulnerability Sweeps",
        description:
          "Probe Ollama, vLLM, Qdrant, Milvus, ChromaDB, Weaviate, MCP servers, and leaked JavaScript provider keys.",
        href: "/services/aia",
      },
      {
        title: "Compliance & Executive Audit",
        description:
          "Generate print-ready A4 PDF reports mapped to international and Malaysian regulatory controls.",
        href: "/services/adt",
      },
      {
        title: "REST API & Webhooks",
        description:
          "Trigger scans programmatically and receive HMAC-SHA256 signed webhook events on completion.",
        href: "/docs/api",
      },
    ],
    columns: [
      {
        heading: "Scan Profiles",
        links: [
          { label: "Quick Profile (~4m)", href: "/docs/services" },
          { label: "Standard Full Sweep", href: "/docs/services" },
          { label: "Deep Profile + AI-Armor", href: "/docs/services" },
          { label: "AI Profile (~30s AIA)", href: "/services/aia" },
        ],
      },
    ],
    featured: {
      eyebrow: "Featured Guide",
      title: "Quickstart: Verify Ownership & Run Your First Scan",
      href: "/docs/quickstart",
      cta: "Read Quickstart",
      image: "/landing/nav-clusterware.avif",
      imageAlt: "Security operations console on laptop",
    },
    seeAllHref: "/docs",
    seeAllLabel: "See All",
  },
  {
    id: "compliance",
    label: "Compliance",
    richCards: [
      {
        title: "OWASP Top 10 for LLMs",
        description:
          "Maps AI-Armor findings directly to LLM01 (Model Abuse), LLM02 (Sensitive Info Disclosure), and LLM06 (Excessive Agency).",
        href: "/services/aia",
      },
      {
        title: "ISO/IEC 42001:2023",
        description:
          "Control mapping for A.6.2 (Data Protection for AI Systems) and A.8.4 (AI Resource Access Control).",
        href: "/services/aia",
      },
      {
        title: "ISO/IEC 27001 & SOC 2",
        description:
          "Deduplicated findings and evidence trails mapped to ISO/IEC 27001:2022 and SOC 2 controls.",
        href: "/services/adt",
      },
      {
        title: "BNM RMiT & Malaysian PDPA",
        description:
          "Built for Malaysian enterprises and regulated workloads with LHDN-ready invoicing and PDPA alignment.",
        href: "/legal/privacy",
      },
    ],
    columns: [
      {
        heading: "Legal & Governance",
        links: [
          { label: "Terms of Service", href: "/legal/terms" },
          { label: "Privacy Policy (PDPA)", href: "/legal/privacy" },
          { label: "Data Processing (DPA)", href: "/legal/dpa" },
          { label: "Acceptable Use", href: "/legal/acceptable-use" },
        ],
      },
    ],
    featured: {
      eyebrow: "Trust & Disclosure",
      title: "Vulnerability Disclosure Program & PGP Key",
      href: "/security",
      cta: "View Security Posture",
      image: "/landing/nav-racks.avif",
      imageAlt: "Data center security infrastructure",
    },
  },
];

export const HERO_CONTENT = {
  title: "Security infrastructure, provisioned like cloud.",
  subtitle:
    "Scan, monitor, and prove the security of everything you own. Self-serve. Metered. No sales call.",
  pills: [
    { label: "AI-Armor LLM & Vector Defense", href: "/services/aia" },
    { label: "External Attack Surface (ASM)", href: "/services/asm" },
    { label: "Non-Destructive Port & TLS Audit", href: "/services/scan" },
    { label: "Executive Compliance Reports", href: "/services/adt" },
  ],
  ctaLabel: "Start free",
  ctaHref: "/signup",
  videoSrc: "/landing/hero-bg.mp4",
  posterSrc: "/landing/hero-poster.avif",
};

export const HIGHLIGHT_BANNER = {
  titleLine1: "Harizeon AI-Armor (AIA)",
  titleLine2: "Agentic, LLM & Vector Defense",
  description:
    "Non-destructive external perimeter scanning for Ollama, vLLM, Qdrant, Milvus, ChromaDB, Weaviate, MCP endpoints, and leaked provider keys — included on every plan.",
  href: "/services/aia",
};

export const STATS_CONTENT = {
  heading: "Verify, Scan, Audit, and Prove Attack Surface Globally",
  description:
    "Traditional vulnerability scanners miss modern AI and cloud exposures. Harizeon pairs isolated data-plane workers with strict cryptographic ownership verification and auditor-ready compliance mapping.",
  cards: [
    { value: "98 / 100", label: "Harizeon Self-Scan Grade A Posture" },
    { value: "< 30 sec", label: "AI-Armor Focused LLM & Vector Audit" },
    { value: "6 Engines", label: "Shipped Production Scanners & Audits" },
  ],
};

export interface PlatformLayerItem {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}

export const PLATFORM_CONTENT = {
  eyebrow: "Our Platform",
  heading: "Full-Stack Security & AI Perimeter Platform",
  description:
    "Our platform separates control-plane row-level security (Fastify + PostgreSQL) from isolated data-plane workers (Redis Streams + Python) to help engineering teams verify, scan, and prove posture with speed and precision.",
  items: [
    {
      id: "aia",
      title: "1. Harizeon AI-Armor (AIA)",
      description:
        "Detects publicly exposed LLM inference servers (Ollama 11434, vLLM 8000, LM Studio 1234, LocalAI 8080), unauthenticated vector databases (Qdrant, ChromaDB, Milvus, Weaviate), MCP endpoints, and leaked provider API keys.",
      ctaLabel: "Explore AI-Armor",
      href: "/services/aia",
    },
    {
      id: "asm",
      title: "2. Harizeon Surface (ASM)",
      description:
        "Continuously discovers subdomains from Certificate Transparency logs (crt.sh) and DNS resolution. Strict boundary checks hold discovered hosts out of scope until explicitly authorized.",
      ctaLabel: "Explore Surface Recon",
      href: "/services/asm",
    },
    {
      id: "scn",
      title: "3. Harizeon Scan (SCN)",
      description:
        "Multi-phase non-destructive scanner covering exposed configuration files (.git, .env, SQL dumps, phpinfo, Swagger, Actuator), curated CVE matching from banners, and AI perimeter checks.",
      ctaLabel: "Explore Vulnerability Scan",
      href: "/services/scan",
    },
    {
      id: "pro-ins",
      title: "4. Probe & Inspect (PRO · INS)",
      description:
        "Safe TCP connect port probing across common and extended port sets pinned to validated public IPs, paired with TLS protocol inspection (SSLv2/3, TLS 1.0/1.1, cert expiry) and header compliance.",
      ctaLabel: "Explore Probe & Inspect",
      href: "/services/pro",
    },
    {
      id: "adt",
      title: "5. Harizeon Audit (ADT)",
      description:
        "Computes a transparent 0–100 executive posture score with prioritized remediation playbooks, append-only audit logs, and print-ready A4 PDF reports mapped to ISO 27001, SOC 2, BNM RMiT, and PDPA.",
      ctaLabel: "Explore Compliance Reports",
      href: "/services/adt",
    },
  ] satisfies PlatformLayerItem[],
};

export interface ThreatVectorItem {
  id: string;
  code: string;
  severity: "CRIT" | "HIGH" | "MED";
  title: string;
  ports: string;
  summary: string;
  probeSignature: string;
  evidenceSample: string;
  image: string;
  imageAlt: string;
  href: string;
}

export const THREAT_VECTORS_CONTENT = {
  eyebrow: "Shipped Detection Coverage",
  headingLine1: "What Harizeon Detects",
  headingLine2: "Across Your Perimeter",
  items: [
    {
      id: "llm-api",
      code: "ai.unauth_model_api",
      severity: "CRIT",
      title: "Unauthenticated LLM Inference",
      ports: "11434 (Ollama) · 8000 (vLLM) · 1234 (LM Studio) · 8080 (LocalAI)",
      summary:
        "Detects publicly reachable model inference servers responding without API key gates, preventing unauthorized GPU compute abuse and private model enumeration.",
      probeSignature: "GET /api/tags · GET /v1/models",
      evidenceSample: '{"models":[{"name":"internal-rag-llama3:latest"}]}',
      image: "/landing/nav-servers.avif",
      imageAlt: "Inference server cluster infrastructure",
      href: "/services/aia",
    },
    {
      id: "vector-db",
      code: "ai.vector_db_exposure",
      severity: "CRIT",
      title: "Exposed Vector & RAG Stores",
      ports: "6333 (Qdrant) · 8000 (ChromaDB) · 19530 (Milvus) · 8080 (Weaviate)",
      summary:
        "Identifies unauthenticated vector databases storing proprietary company knowledge bases, embeddings, and RAG chunks without dumping or exfiltrating records.",
      probeSignature: "GET /collections · GET /api/v1/version · GET /v1/meta",
      evidenceSample: '{"result":{"collections":[{"name":"customer_rag_prod"}]}}',
      image: "/landing/nav-racks.avif",
      imageAlt: "Data center vector storage racks",
      href: "/services/aia",
    },
    {
      id: "leaked-keys",
      code: "web.leaked_ai_credentials",
      severity: "CRIT",
      title: "Leaked AI Provider Keys",
      ports: "HTTP / HTTPS Client JavaScript Bundles",
      summary:
        "Analyzes client-side JS bundles for OpenAI (sk-proj-), Anthropic (sk-ant-), Gemini (AIza), DeepSeek, Groq, Hugging Face, Mistral, Together, and Cohere keys validated via Shannon entropy and redacted automatically.",
      probeSignature: "Context-anchored regex + Shannon entropy > 3.0",
      evidenceSample: "Redacted token sk-proj-8a9F...4xQz in /assets/chat.js",
      image: "/landing/nav-clusterware.avif",
      imageAlt: "Client bundle security inspection",
      href: "/services/aia",
    },
    {
      id: "mcp-agent",
      code: "ai.unauth_agent_endpoint",
      severity: "HIGH",
      title: "Shadow MCP & Agent Endpoints",
      ports: "7860 (Flowise/Langflow) · /mcp · /sse · /invoke",
      summary:
        "Audits exposed agent orchestrators and Model Context Protocol (MCP) endpoints that allow unauthenticated visitors to invoke internal tools or databases.",
      probeSignature: "GET /mcp · GET /sse · GET /api/v1/flows",
      evidenceSample: "HTTP 200 text/event-stream · MCP tool manifest reachable",
      image: "/landing/nav-cxl.avif",
      imageAlt: "Compute and agent orchestration server",
      href: "/services/aia",
    },
    {
      id: "tls-headers",
      code: "tls.legacy_protocol",
      severity: "HIGH",
      title: "Legacy TLS & Header Gaps",
      ports: "443 (HTTPS / SNI validated public IP)",
      summary:
        "Flags SSLv2/SSLv3/TLS 1.0/1.1 acceptance, certificates expiring within 14 days, and missing HSTS, CSP, X-Content-Type-Options, or X-Frame-Options headers.",
      probeSignature: "SNI-pinned TLS handshake + header compliance",
      evidenceSample: "TLS 1.0 accepted · Missing Strict-Transport-Security",
      image: "/landing/industry-sovereign-ai.avif",
      imageAlt: "Cryptographic lock and protocol inspection",
      href: "/services/ins",
    },
    {
      id: "infra-secrets",
      code: "web.exposed_config",
      severity: "MED",
      title: "Exposed Infra & Config Files",
      ports: "Common + Extended TCP Ports · 80 / 443",
      summary:
        "Identifies internet-facing Redis, Elasticsearch, Telnet, RDP, and VNC alongside exposed .git, .env, SQL dumps, phpinfo, Swagger UI, and Spring Actuator.",
      probeSignature: "TCP banner capture + non-destructive web checks",
      evidenceSample: "HTTP 200 /.git/HEAD · Port 6379 Redis banner open",
      image: "/landing/industry-ai-cloud.avif",
      imageAlt: "Cloud server rack perimeter",
      href: "/services/scan",
    },
  ] satisfies ThreatVectorItem[],
};

export interface ComplianceCard {
  title: string;
  subtitle: string;
  image: string;
  alt: string;
  href: string;
}

export const COMPLIANCE_CAROUSEL_CONTENT = {
  eyebrow: "Governance & Compliance",
  headingLine1: "Auditor-Ready Mapping in",
  headingLine2: "Standards & Security Sectors",
  items: [
    {
      title: "OWASP Top 10 for LLMs",
      subtitle: "LLM01 · LLM02 · LLM06",
      image: "/landing/industry-ai-cloud.avif",
      alt: "OWASP LLM security",
      href: "/services/aia",
    },
    {
      title: "ISO/IEC 42001:2023",
      subtitle: "AI Management Controls",
      image: "/landing/industry-sovereign-ai.avif",
      alt: "ISO 42001 AI governance",
      href: "/services/aia",
    },
    {
      title: "ISO/IEC 27001:2022",
      subtitle: "Annex A Compliance",
      image: "/landing/industry-financial.avif",
      alt: "ISO 27001 security controls",
      href: "/services/adt",
    },
    {
      title: "SOC 2 Type II Controls",
      subtitle: "CC6 & CC7 Monitoring",
      image: "/landing/industry-government.avif",
      alt: "SOC 2 compliance auditing",
      href: "/services/adt",
    },
    {
      title: "BNM RMiT Alignment",
      subtitle: "Financial Risk Tech",
      image: "/landing/industry-critical-infra.avif",
      alt: "BNM RMiT financial compliance",
      href: "/services/adt",
    },
    {
      title: "Malaysian PDPA",
      subtitle: "Data Protection & DPA",
      image: "/landing/industry-life-sciences.avif",
      alt: "PDPA data protection",
      href: "/legal/privacy",
    },
    {
      title: "AI Startups & SaaS",
      subtitle: "< 30s Fast Perimeter Audit",
      image: "/landing/industry-manufacturing.avif",
      alt: "AI SaaS infrastructure",
      href: "/services/aia",
    },
    {
      title: "DevSecOps & CI API",
      subtitle: "REST v1 & Webhooks",
      image: "/landing/industry-retail.avif",
      alt: "REST API DevSecOps automation",
      href: "/docs/api",
    },
  ] satisfies ComplianceCard[],
};

export interface WorkflowStepItem {
  id: "verify" | "discover" | "sweep" | "prove";
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  image: string;
  imageAlt: string;
}

export const WORKFLOW_CONTENT = {
  eyebrow: "Our Process",
  headingLine1: "External Perimeter",
  headingLine2: "Comprehensive Security",
  description:
    "Every scan starts with cryptographic ownership proof. Isolated workers then execute non-destructive checks and generate auditor-ready findings in minutes.",
  items: [
    {
      id: "verify",
      title: "Verify",
      description:
        "Publish a DNS TXT record or HTTP well-known token. Harizeon verifies you control the target before a single packet is transmitted — with no bypass flag.",
      ctaLabel: "Verify an Asset",
      href: "/assets/new",
      image: "/landing/process-design.avif",
      imageAlt: "Clean infrastructure verification",
    },
    {
      id: "discover",
      title: "Discover",
      description:
        "Enumerate strict subdomains from Certificate Transparency logs (crt.sh) and DNS while non-destructive TCP connect probing maps exposed ports and banners.",
      ctaLabel: "Surface Discovery",
      href: "/services/asm",
      image: "/landing/process-build.avif",
      imageAlt: "Network discovery and port probing",
    },
    {
      id: "sweep",
      title: "Sweep",
      description:
        "Run Quick, Standard, Deep, or <30s AI-Armor profiles to audit TLS protocols, security headers, web secrets, curated CVEs, LLM APIs, Vector DBs, and MCP endpoints.",
      ctaLabel: "Launch a Scan",
      href: "/scans/new",
      image: "/landing/process-deploy.webp",
      imageAlt: "Engineers executing security sweeps",
    },
    {
      id: "prove",
      title: "Prove",
      description:
        "Review deduplicated findings with reproduction curl commands, track your 0–100 executive posture score, and export print-ready A4 compliance PDFs.",
      ctaLabel: "Audit Reports",
      href: "/reports",
      image: "/landing/process-manage.avif",
      imageAlt: "Continuous posture management",
    },
  ] satisfies WorkflowStepItem[],
};

export interface GuaranteeItem {
  quote: string;
  author: string;
  role: string;
  badge: string;
}

export const GUARANTEES_CONTENT: GuaranteeItem[] = [
  {
    quote:
      "“No scan ever executes against an unverified target. DNS TXT or HTTP well-known ownership is validated cryptographically before a single packet is transmitted — with no bypass flag.”",
    author: "Cryptographic Ownership Gate",
    role: "§12 Verified Perimeter Only",
    badge: "HARIZEON CONTROL PLANE",
  },
  {
    quote:
      "“The Fastify API owns PostgreSQL transactions and row-level security; the Python worker runs in total data-plane isolation with zero database credentials, communicating strictly via Redis Streams.”",
    author: "Isolated Worker Execution",
    role: "§06.1 Control Plane vs Data Plane",
    badge: "ZERO DB CREDENTIALS",
  },
  {
    quote:
      "“Harizeon AI-Armor probes only lightweight metadata and version health endpoints. It never sends jailbreak payloads, dumps vector records, or exhausts victim GPU VRAM.”",
    author: "Non-Destructive AI Probing",
    role: "§12 Safe AI-Armor Budget (<30s)",
    badge: "AUTO KEY REDACTION",
  },
  {
    quote:
      "“Every verification event, scan dispatch, and status change writes to an immutable append-only audit ledger, while outbound webhooks carry HMAC-SHA256 signatures.”",
    author: "Tamper-Evident Audit Ledger",
    role: "§08 X-Harizeon-Signature HMAC",
    badge: "APPEND-ONLY AUDIT",
  },
  {
    quote:
      "“We practice what we engineer. Every Harizeon domain, API endpoint, and reverse proxy is continuously scanned by our own worker pool — maintaining a 98/100 Grade A posture.”",
    author: "Continuous Self-Scan Posture",
    role: "TLS 1.3 Only · DMARC p=reject",
    badge: "98 / 100 GRADE A",
  },
];

export interface EngineSubTab {
  id: string;
  tabLabel: string;
  title: string;
  status: "Available" | "Roadmap";
  paragraphs: string[];
  ctaLabel: string;
  href: string;
  image: string;
  imageAlt: string;
}

export interface EngineCategoryTab {
  id: string;
  label: string;
  subTabs: EngineSubTab[];
}

export const ENGINES_MATRIX_CONTENT = {
  eyebrow: "Our Engines",
  headingLine1: "Precision Engineered for",
  headingLine2: "Verified Security Posture",
  categories: [
    {
      id: "ai-threat",
      label: "AI & Threat",
      subTabs: [
        {
          id: "aia",
          tabLabel: "AI-Armor (AIA)",
          title: "Harizeon AI-Armor®",
          status: "Available",
          paragraphs: [
            "Harizeon AI-Armor (AIA) is a fast <30-second external perimeter scanner engineered for LLM inference servers (Ollama, vLLM, LocalAI, LM Studio), vector databases (Qdrant, ChromaDB, Milvus, Weaviate), and MCP agent endpoints.",
            "It also audits client-side JavaScript bundles for leaked provider keys using Shannon entropy validation and automatic redaction, mapped directly to OWASP Top 10 for LLMs and ISO/IEC 42001.",
          ],
          ctaLabel: "Discover AI-Armor",
          href: "/services/aia",
          image: "/landing/product-originai.avif",
          imageAlt: "Security engineer reviewing AI perimeter telemetry",
        },
        {
          id: "scn",
          tabLabel: "Scan (SCN)",
          title: "Harizeon Scan™",
          status: "Available",
          paragraphs: [
            "Non-destructive multi-phase external scanner combining TCP port probing, TLS inspection, HTTP security header audits, and template-driven web checks.",
            "Detects exposed .git repositories, .env files, SQL dumps, phpinfo, Swagger UI, Spring Actuator, and curated CVEs from service banners without transmitting exploit payloads.",
          ],
          ctaLabel: "Discover Scan",
          href: "/services/scan",
          image: "/landing/nav-clusterware.avif",
          imageAlt: "Harizeon vulnerability scan dashboard",
        },
        {
          id: "vlt-wch",
          tabLabel: "Vault & Watch",
          title: "Vault & Watch (v0.2+ Roadmap)",
          status: "Roadmap",
          paragraphs: [
            "Planned v0.2+ modules extending monitoring to public GitHub/GitLab commit & paste credential leaks (Harizeon Vault) and continuous DNS/BGP route drift detection (Harizeon Watch).",
            "Plainly marked as Roadmap per §10.8 — Harizeon never advertises unshipped checks as active production capabilities.",
          ],
          ctaLabel: "View Roadmap Specs",
          href: "/services/vlt",
          image: "/landing/nav-racks.avif",
          imageAlt: "Data center aisle for planned continuous watch",
        },
      ],
    },
    {
      id: "surface-recon",
      label: "Surface & Recon",
      subTabs: [
        {
          id: "asm",
          tabLabel: "Surface (ASM)",
          title: "Harizeon Surface®",
          status: "Available",
          paragraphs: [
            "Automated external attack-surface discovery powered by Certificate Transparency logs (crt.sh) and DNS resolution across your verified domains.",
            "Enforces strict domain boundaries: only strict subdomains of verified assets are accepted, and newly discovered hosts stay out of scope until explicitly authorized.",
          ],
          ctaLabel: "Discover Surface",
          href: "/services/asm",
          image: "/landing/product-ztc-endurance.avif",
          imageAlt: "Surface attack mapping hardware",
        },
        {
          id: "pro",
          tabLabel: "Probe (PRO)",
          title: "Harizeon Probe™",
          status: "Available",
          paragraphs: [
            "Non-destructive TCP connect port probing and banner capture across common and extended port sets inside isolated worker containers.",
            "Flags internet-exposed services such as unauthenticated Redis, Elasticsearch, Telnet, RDP, and VNC while dropping non-public IP ranges prior to connection.",
          ],
          ctaLabel: "Discover Probe",
          href: "/services/pro",
          image: "/landing/product-ztc-edge.avif",
          imageAlt: "Edge perimeter probing appliance",
        },
        {
          id: "ins",
          tabLabel: "Inspect (INS)",
          title: "Harizeon Inspect®",
          status: "Available",
          paragraphs: [
            "Cryptographic TLS protocol and certificate expiry auditor plus HTTP security-header compliance checker run against validated public IPs with SNI.",
            "Flags SSLv2, SSLv3, TLS 1.0, TLS 1.1 acceptance, certificates expiring within 14 days, and missing HSTS, CSP, X-Content-Type-Options, or X-Frame-Options.",
          ],
          ctaLabel: "Discover Inspect",
          href: "/services/ins",
          image: "/landing/product-everrun.avif",
          imageAlt: "Protocol and TLS inspection visual",
        },
      ],
    },
    {
      id: "governance-api",
      label: "Governance & API",
      subTabs: [
        {
          id: "adt",
          tabLabel: "Audit (ADT)",
          title: "Harizeon Audit®",
          status: "Available",
          paragraphs: [
            "Computes a transparent 0–100 executive posture score with a prioritized remediation plan and direct mapping to ISO/IEC 27001:2022, SOC 2, BNM RMiT, and Malaysian PDPA.",
            "Supports instant print / A4 PDF export backed by row-level security and an immutable append-only audit ledger.",
          ],
          ctaLabel: "Discover Audit",
          href: "/services/adt",
          image: "/landing/product-cxl.avif",
          imageAlt: "Executive audit and governance reporting",
        },
        {
          id: "api",
          tabLabel: "REST API v1",
          title: "Programmatic REST API & SSE",
          status: "Available",
          paragraphs: [
            "Trigger on-demand scans, stream live worker phase progress over Server-Sent Events (SSE), and extract JSON findings into your CI/CD pipeline or SIEM.",
            "All outbound webhook payloads are signed with HMAC-SHA256 in the X-Harizeon-Signature header.",
          ],
          ctaLabel: "Read API Reference",
          href: "/docs/api",
          image: "/landing/product-zdimm.avif",
          imageAlt: "API and memory pipeline architecture",
        },
        {
          id: "shd-rsp",
          tabLabel: "Shield & Respond",
          title: "Shield & Respond (v0.2+ Roadmap)",
          status: "Roadmap",
          paragraphs: [
            "Planned v0.2+ modules for automated edge cloaking rules (Harizeon Shield) and guided incident containment checklists (Harizeon Respond).",
            "Clearly designated as Roadmap until implemented and verified in production code.",
          ],
          ctaLabel: "View Roadmap Specs",
          href: "/services/shd",
          image: "/landing/product-flash.avif",
          imageAlt: "Planned edge defense architecture",
        },
      ],
    },
  ] satisfies EngineCategoryTab[],
};

export interface PricingHighlightItem {
  category: string;
  badge: string;
  headline: string;
  description: string;
  href: string;
  image: string;
  alt: string;
}

export const PRICING_AND_RESOURCES_CONTENT = {
  eyebrow: "Transparent Metering & Guides",
  heading: "Predictable Capacity & Resources",
  items: [
    {
      category: "Free · MYR 0",
      badge: "1 Asset",
      headline: "Free Plan — Monthly scan, Quick + AI-Armor, 14d retention",
      description: "Includes <30s AIA perimeter scan and community support.",
      href: "/signup",
      image: "/landing/news-08.webp",
      alt: "Free tier AI security cluster",
    },
    {
      category: "Starter · MYR 79/mo",
      badge: "5 Assets",
      headline: "Starter Plan — Weekly cadence, 50 scans/mo, PDF reports",
      description: "Quick, Standard & AI profiles with 90-day evidence retention.",
      href: "/pricing",
      image: "/landing/news-10.webp",
      alt: "Starter tier automated monitoring",
    },
    {
      category: "Growth · MYR 249/mo",
      badge: "25 Assets · Recommended",
      headline: "Growth Plan — Daily cadence, 500 scans/mo, REST API & 3 seats",
      description: "All scan profiles, white-label PDF reports, and 365-day retention.",
      href: "/pricing",
      image: "/landing/news-13.webp",
      alt: "Growth tier API and deep scanning",
    },
    {
      category: "Scale · MYR 799/mo",
      badge: "100 Assets",
      headline: "Scale Plan — Continuous cadence, Unlimited scans, 10 seats, 4h SLA",
      description: "730-day retention, dedicated Slack, and MYR 8/asset metered overage.",
      href: "/pricing",
      image: "/landing/news-20.webp",
      alt: "Scale tier enterprise posture",
    },
    {
      category: "Guide · 4 Min",
      badge: "Quickstart",
      headline: "Verify DNS TXT Ownership & Run Your First Scan",
      description: "Step-by-step onboarding from zero to verified perimeter.",
      href: "/docs/quickstart",
      image: "/landing/nav-servers.avif",
      alt: "Quickstart verification guide",
    },
    {
      category: "Docs · API v1",
      badge: "HMAC-SHA256",
      headline: "Trigger Scans & Stream Live SSE Progress via REST API",
      description: "Integrate Harizeon into GitHub Actions, CI/CD, and your SIEM.",
      href: "/docs/api",
      image: "/landing/nav-clusterware.avif",
      alt: "REST API developer documentation",
    },
    {
      category: "Posture · Live",
      badge: "98 / 100 Grade A",
      headline: "Harizeon Self-Scan Security Posture & PGP Disclosure",
      description: "Inspect our own continuous Deep Scan score, TLS 1.3, and security.txt.",
      href: "/security",
      image: "/landing/nav-racks.avif",
      alt: "Harizeon public security posture",
    },
    {
      category: "Matrix · Specs",
      badge: "6 Shipped · 4 Roadmap",
      headline: "Explore All Shipped & Planned Harizeon Engines",
      description: "Exact ports, check signatures, and compliance framework mappings.",
      href: "/services",
      image: "/landing/nav-cxl.avif",
      alt: "Harizeon services matrix",
    },
  ] satisfies PricingHighlightItem[],
};

export const BOTTOM_CTA_CONTENT = {
  eyebrow: "Verify a Domain · 4 Minutes",
  heading: "Start Scanning Your Perimeter",
  paragraphs: [
    "Every plan — including Free — unlocks Harizeon AI-Armor (AIA) to audit unauthenticated LLM endpoints, exposed vector stores, MCP servers, and leaked provider keys in under 30 seconds.",
    "Verify DNS TXT or HTTP ownership and launch your first non-destructive scan with zero sales calls.",
  ],
  ctaLabel: "Start free",
  ctaHref: "/signup",
  videoSrc: "/landing/experts-bg.mp4",
};
