export interface NavFeaturedPost {
  eyebrow: string;
  title: string;
  description?: string;
  href: string;
  cta: string;
  image: string;
  imageAlt: string;
}

export interface NavColumn {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
}

export interface NavRichLink {
  title: string;
  description: string;
  href: string;
  icon: "chip" | "shield" | "server" | "memory" | "design" | "deploy" | "build" | "manage" | "users" | "handshake" | "layers" | "blog" | "news" | "calendar" | "hub" | "compass" | "rocket" | "heart" | "briefcase";
}

export interface NavDropdownData {
  id: string;
  label: string;
  layout: "what-we-do" | "solutions" | "rich-columns" | "company";
  richLinks?: NavRichLink[];
  columns?: NavColumn[];
  featured?: NavFeaturedPost;
  seeAllHref?: string;
  seeAllLabel?: string;
}

const BASE_URL = "https://www.penguinsolutions.com";

export function toSourceHref(href: string): string {
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#")
  ) {
    return href;
  }
  if (href.startsWith("/en-us")) {
    return `${BASE_URL}${href}`;
  }
  return `${BASE_URL}/en-us${href.startsWith("/") ? href : `/${href}`}`;
}

export const UTILITY_NAV = {
  phone: "1-415-954-2800",
  phoneHref: "tel:1-415-954-2800",
  supportLabel: "Support",
  supportHref: toSourceHref("/en-us/support"),
  languages: ["English", "한국어", "日本語"],
};

export const NAV_DROPDOWNS: NavDropdownData[] = [
  {
    id: "what-we-do",
    label: "What We Do",
    layout: "what-we-do",
    columns: [
      {
        heading: "Expertise",
        links: [
          { label: "AI Infrastructure", href: toSourceHref("/en-us/expertise/data-center-ai-infrastructure") },
          { label: "Cluster Management", href: toSourceHref("/en-us/expertise/data-center-cluster-management") },
          { label: "Private Cloud", href: toSourceHref("/en-us/expertise/data-center-private-cloud") },
          { label: "Power & Cooling", href: toSourceHref("/en-us/expertise/data-center-power-cooling") },
          { label: "Sovereign AI", href: toSourceHref("/en-us/industries/sovereign-ai") },
          { label: "Edge", href: toSourceHref("/en-us/expertise/edge-fault-tolerant-solutions") },
          { label: "Data Centers", href: toSourceHref("/en-us/expertise/data-center-fault-tolerant-solutions") },
          { label: "Expansion & Pooling", href: toSourceHref("/en-us/expertise/integrated-memory-expansion-pooling") },
          { label: "Protective Coating", href: toSourceHref("/en-us/expertise/integrated-memory-protective-coating") },
          { label: "Specialty Memory Solutions", href: toSourceHref("/en-us/products/smart-modular-portfolio") },
        ],
      },
      {
        heading: "Challenges",
        links: [
          { label: "Token Economics & TCO", href: toSourceHref("/en-us/challenges/token-economics-total-cost-ownership") },
          { label: "Computational Power & Scalability", href: toSourceHref("/en-us/challenges/computational-power-scalability") },
          { label: "Energy Consumption & Sustainability", href: toSourceHref("/en-us/challenges/energy-consumption-sustainability") },
          { label: "Unplanned Operational Downtime", href: toSourceHref("/en-us/challenges/unplanned-downtime") },
          { label: "Scaling the Memory Wall", href: toSourceHref("/en-us/challenges/memory-wall-scaling") },
        ],
      },
      {
        heading: "Industries",
        links: [
          { label: "AI Cloud Providers", href: toSourceHref("/en-us/industries/ai-cloud-providers") },
          { label: "Sovereign AI", href: toSourceHref("/en-us/industries/sovereign-ai") },
          { label: "Financial Services", href: toSourceHref("/en-us/industries/financial-services") },
          { label: "Oil & Gas", href: toSourceHref("/en-us/industries/oil-gas-energy") },
          { label: "Life Sciences & Healthcare", href: toSourceHref("/en-us/industries/life-sciences-healthcare") },
          { label: "Higher Education", href: toSourceHref("/en-us/industries/higher-education") },
          { label: "Government", href: toSourceHref("/en-us/industries/government") },
          { label: "Weather", href: toSourceHref("/en-us/industries/weather") },
          { label: "Manufacturing", href: toSourceHref("/en-us/industries/manufacturing") },
          { label: "Retail", href: toSourceHref("/en-us/industries/retail") },
          { label: "Critical Infrastructure", href: toSourceHref("/en-us/industries/critical-infrastructure") },
          { label: "Transportation", href: toSourceHref("/en-us/industries/transportation") },
        ],
      },
    ],
    featured: {
      eyebrow: "Featured Post",
      title: "Breaking the Memory Wall with CXL for AI Workloads",
      href: toSourceHref("/resources/blog/cxl-for-ai-workloads"),
      cta: "Read full article",
      image: "/sites/penguinsolutions/nav-servers.avif",
      imageAlt: "Rack of servers",
    },
    seeAllHref: toSourceHref("/en-us/resources/blog"),
    seeAllLabel: "See All",
  },
  {
    id: "solutions",
    label: "Solutions",
    layout: "solutions",
    richLinks: [
      {
        title: "AI Software & Frameworks",
        description:
          "Software for robust AI infrastructure deployment and operations combined with powerful enterprise AI models, frameworks, and application blueprints.",
        href: toSourceHref("/en-us/solutions/ai-software-frameworks"),
        icon: "chip",
      },
      {
        title: "Fault Tolerant Computing",
        description:
          "Run complex software stacks with 99.99999% availability, which enables IT/OT staff to deliver critical applications with no downtime or data loss.",
        href: toSourceHref("/en-us/solutions/fault-tolerant-computing-platforms"),
        icon: "shield",
      },
      {
        title: "AI Compute Server Platforms",
        description:
          "AI-optimized computing solutions designed to support large-scale training, inference, and workloads while enabling deployment and future growth.",
        href: toSourceHref("/en-us/solutions/ai-compute-server-platforms"),
        icon: "server",
      },
      {
        title: "Integrated Memory",
        description:
          "Specialty memory solutions based on CXL, DRAM, and Flash technology designed to accelerate data center and embedded device workloads.",
        href: toSourceHref("/en-us/solutions/integrated-memory"),
        icon: "memory",
      },
    ],
    columns: [
      {
        heading: "AI & High-Performance Computing",
        links: [
          { label: "OriginAI®", href: toSourceHref("/en-us/products/originai-infrastructure-solution") },
          { label: "ClusterWareAI™", href: toSourceHref("/en-us/products/clusterwareai-ai-factory-platform-operating-system-software") },
          { label: "NVIDIA AI Enterprise Software", href: toSourceHref("/en-us/products/nvidia-ai-enterprise") },
          { label: "ComputeAI™ Systems", href: toSourceHref("/en-us/products/computeai-ai-computing-infrastructure") },
          { label: "MemoryAI™ KV Cache Server", href: toSourceHref("/en-us/products/cxl-memory-expansion-servers") },
          { label: "MemoryAI™ Photonic Appliance", href: toSourceHref("/en-us/products/photonics-based-hbm-class-memory-appliance") },
          { label: "Dell AI Optimized Hardware", href: toSourceHref("/en-us/products/dell-ai-infrastructure") },
          { label: "NVIDIA DGX™ Systems", href: toSourceHref("/en-us/products/nvidia-dgx-systems") },
        ],
      },
      {
        heading: "Fault Tolerant Computing",
        links: [
          { label: "Stratus ztC Endurance®", href: toSourceHref("/en-us/products/stratus-ztc-endurance") },
          { label: "Stratus ztC Edge®", href: toSourceHref("/en-us/products/stratus-ztc-edge") },
          { label: "Stratus ftServer™", href: toSourceHref("/en-us/products/stratus-ftserver") },
          { label: "Stratus everRun®", href: toSourceHref("/en-us/products/stratus-everrun") },
          { label: "Stratus V Series", href: toSourceHref("/en-us/products/stratus-v-series") },
        ],
      },
      {
        heading: "Integrated Memory",
        links: [
          { label: "MemoryAI™ KV Cache Server", href: toSourceHref("/en-us/products/cxl-memory-expansion-servers") },
          { label: "SMART Modular CXL®-Based Solutions", href: toSourceHref("/en-us/products/finder?category=advanced-serial-memory&series=cxl-based-solutions&product-type=aic-add-in-card") },
          { label: "SMART Modular DRAM Memory Modules", href: toSourceHref("/en-us/products/finder?category=dram-modules&series=memory-modules&product-type=dram-dimm-types") },
          { label: "SMART Modular Zefr® ZDIMMs", href: toSourceHref("/en-us/products/finder?category=dram-modules&series=zefr-zdimms&product-type=dram-dimm-types") },
          { label: "SMART Modular Rugged / Industrial", href: toSourceHref("/en-us/products/finder?category=dram-modules&series=rugged-industrial&product-type=dram-dimm-types") },
          { label: "SMART Modular Embedded SSDs", href: toSourceHref("/en-us/products/finder?category=flash-storage&series=embedded-ssds&product-type=ssd") },
          { label: "SMART Modular Data Center SSDs", href: toSourceHref("/en-us/products/finder?category=flash-storage&series=data-center-ssds&product-type=dc5820") },
          { label: "SMART Modular RUGGED™ SSDs", href: toSourceHref("/en-us/products/finder?category=flash-storage&series=rugged-ssds&product-type=t-series") },
        ],
      },
    ],
    featured: {
      eyebrow: "Featured",
      title: "What Does AI Infrastructure Really Cost at Scale?",
      href: toSourceHref("/resources/analyst-reports/what-does-ai-infrastructure-really-cost-at-scale"),
      cta: "Read full article",
      image: "/sites/penguinsolutions/nav-racks.avif",
      imageAlt: "Data center room aisle",
    },
  },
  {
    id: "services",
    label: "Services",
    layout: "rich-columns",
    richLinks: [
      {
        title: "Design AI",
        description:
          "Accelerate time to value by engaging with our AI infrastructure experts to tune proven Penguin Solutions system blueprints to meet your specific workload and use case requirements.",
        href: toSourceHref("/en-us/services/designing-infrastructure"),
        icon: "design",
      },
      {
        title: "Build AI",
        description:
          "Meet your AI solution production timelines and budget by partnering with Penguin for complex supply chain management, full system integration, burn-in, and rack scale delivery.",
        href: toSourceHref("/en-us/services/building-infrastructure"),
        icon: "build",
      },
      {
        title: "Deploy AI",
        description:
          "Streamline on-site implementation and production readiness with Penguin Solutions' deployment services for AI servers, high-performance networking, data storage, and software.",
        href: toSourceHref("/en-us/services/deploying-infrastructure"),
        icon: "deploy",
      },
      {
        title: "Manage AI",
        description:
          "Ensure continuous production readiness and smooth operations by working with Penguin Solutions, a certified NVIDIA DGX Managed Services provider with end-to-end services capabilities.",
        href: toSourceHref("/en-us/services/managing-infrastructure"),
        icon: "manage",
      },
    ],
    columns: [
      {
        heading: "Infrastructure & Support Services",
        links: [
          { label: "Cluster Integrity Assessment", href: toSourceHref("/en-us/services/cluster-assessment") },
          { label: "Infrastructure Support Services", href: toSourceHref("/en-us/services/support-services") },
          { label: "Managed Services", href: toSourceHref("/en-us/services/global-managed-services") },
          { label: "Professional Services", href: toSourceHref("/en-us/services/professional-services") },
          { label: "Educational Services", href: "https://apps.stratus.com/education/", external: true },
          { label: "Support Services", href: toSourceHref("/en-us/services/support-services") },
          { label: "SMART Memory Test Labs", href: toSourceHref("/en-us/services/smart-memory-test-labs") },
          { label: "Zefr Enterprise Memory", href: toSourceHref("/en-us/services/zefr-high-reliability-memory") },
        ],
      },
    ],
    featured: {
      eyebrow: "Featured Post",
      title: "Get Full Value from Your AI Infrastructure",
      href: toSourceHref("/resources/blog/get-full-value-from-your-ai-infrastructure"),
      cta: "Read full article",
      image: "/sites/penguinsolutions/nav-clusterware.avif",
      imageAlt: "ClusterWare on laptop screen on desk",
    },
    seeAllHref: toSourceHref("/en-us/resources/blog"),
    seeAllLabel: "See All",
  },
  {
    id: "company",
    label: "Company",
    layout: "company",
    columns: [
      {
        heading: "Who We Are",
        links: [
          { label: "About Us", href: toSourceHref("/en-us/company/about-us") },
          { label: "Leadership", href: toSourceHref("/en-us/company/leadership") },
          { label: "Locations", href: toSourceHref("/en-us/company/locations") },
        ],
      },
      {
        heading: "Environmental, Social & Safety",
        links: [
          { label: "Overview", href: toSourceHref("/en-us/company/ess/overview") },
          { label: "Environment", href: toSourceHref("/en-us/company/ess/environment") },
          { label: "People", href: toSourceHref("/en-us/company/ess/people") },
          { label: "Social", href: toSourceHref("/en-us/company/ess/social") },
          { label: "Governance", href: toSourceHref("/en-us/company/ess/governance") },
          { label: "Supply Chain", href: toSourceHref("/en-us/company/ess/supply-chain") },
        ],
      },
      {
        heading: "Investor Relations",
        links: [
          { label: "Overview", href: "https://ir.penguinsolutions.com/investors/default.aspx", external: true },
          { label: "Financials", href: "https://ir.penguinsolutions.com/financials/quarterly-results/default.aspx", external: true },
          { label: "Stock Information", href: "https://ir.penguinsolutions.com/stock-information/stock-quote-and-charts/default.aspx", external: true },
          { label: "Events & Presentations", href: "https://ir.penguinsolutions.com/events-and-presentations/default.aspx", external: true },
          { label: "Governance", href: "https://ir.penguinsolutions.com/governance/governance-documents/default.aspx", external: true },
          { label: "Resources", href: "https://ir.penguinsolutions.com/resources/investor-email-alerts/default.aspx", external: true },
          { label: "News", href: "https://ir.penguinsolutions.com/news/default.aspx", external: true },
        ],
      },
      {
        heading: "Other Businesses",
        links: [
          { label: "SMARTsemi®", href: "https://www.smartsemi.com/", external: true },
          { label: "Cree LED", href: "https://www.cree-led.com/", external: true },
        ],
      },
    ],
    featured: {
      eyebrow: "Featured",
      title: "Penguin Solutions Powers Deepgram's Enterprise Voice AI Infrastructure",
      href: "https://ir.penguinsolutions.com/news/news-details/2026/Penguin-Solutions-Selected-by-Deepgram-to-Enable-Deployment-of-Optimized-AI-Inference-Infrastructure-for-Enterprise-Voice-AI/default.aspx",
      cta: "Read full article",
      image: "/sites/penguinsolutions/news-15.webp",
      imageAlt: "Penguin Solutions Selected by Deepgram",
    },
    seeAllHref: toSourceHref("/en-us/resources/newsroom"),
    seeAllLabel: "See All",
  },
  {
    id: "partners",
    label: "Partners",
    layout: "rich-columns",
    richLinks: [
      {
        title: "Solution Partners",
        description:
          "Meet our compute, storage, technology, and uptime automation partners for high-performance enterprise solutions.",
        href: toSourceHref("/en-us/partners"),
        icon: "layers",
      },
      {
        title: "Channel Partners",
        description:
          "Our partner focused programs reward organizations that see the mutual benefit of collaborating to drive success.",
        href: toSourceHref("/en-us/partners/partner-program-channel-partners"),
        icon: "handshake",
      },
      {
        title: "Alliance Partners",
        description:
          "Together, our solutions simplify, protect, and automate your digitally transforming business-critical operations.",
        href: toSourceHref("/en-us/partners/partner-program-alliance-partners"),
        icon: "users",
      },
      {
        title: "System Integrators",
        description:
          "Gain the training, certification, accreditation, and support to develop automation and control solutions.",
        href: toSourceHref("/en-us/partners/partner-program-system-integrators"),
        icon: "server",
      },
    ],
    columns: [
      {
        heading: "Partner Program",
        links: [
          { label: "Plan Overview", href: toSourceHref("/en-us/partners/partner-program-overview") },
          { label: "Find a Partner", href: toSourceHref("/en-us/partners/partner-program-directory") },
          { label: "Partner Login", href: "https://partner.stratus.com/login", external: true },
          { label: "SMART Modular Distributors, OEM, & Channel Sales", href: toSourceHref("/en-us/products/where-to-buy") },
        ],
      },
    ],
    featured: {
      eyebrow: "Partner News",
      title: "Penguin Solutions Becomes an NVIDIA AI Factory Specialized Partner",
      href: "https://ir.penguinsolutions.com/news/news-details/2026/Penguin-Solutions-Becomes-an-NVIDIA-AI-Factory-Specialized-Partner/default.aspx",
      cta: "Read full article",
      image: "/sites/penguinsolutions/news-11.webp",
      imageAlt: "NVIDIA AI Factory Specialized Partner",
    },
  },
  {
    id: "resources",
    label: "Resources",
    layout: "rich-columns",
    richLinks: [
      {
        title: "Blog",
        description:
          "Explore the extensive library of thought leadership articles about AI, HPC, Cloud, Edge, and IoT from Penguin Solutions.",
        href: toSourceHref("/en-us/resources/blog"),
        icon: "blog",
      },
      {
        title: "Newsroom",
        description:
          "The latest press releases, featuring company news, innovations, and key announcements.",
        href: toSourceHref("/en-us/resources/newsroom"),
        icon: "news",
      },
      {
        title: "Events",
        description:
          "Engage with experts from Penguin Solutions and discuss your solution requirements and challenges.",
        href: toSourceHref("/en-us/company/events"),
        icon: "calendar",
      },
      {
        title: "AI Cloud Providers Hub",
        description:
          "Explore AI Factory insights to evaluate your options, inform investment decisions, and prepare for growth.",
        href: toSourceHref("/en-us/resources/hub/ai-cloud-providers-hub"),
        icon: "hub",
      },
    ],
    columns: [
      {
        heading: "Resource Library",
        links: [
          { label: "Analyst Reports", href: toSourceHref("/en-us/resources/analyst-reports") },
          { label: "Brochures", href: toSourceHref("/en-us/resources/brochures") },
          { label: "Case Studies", href: toSourceHref("/en-us/resources/case-studies") },
          { label: "Datasheets", href: toSourceHref("/en-us/resources/datasheets") },
          { label: "eBooks", href: toSourceHref("/en-us/resources/ebooks") },
          { label: "EDGEucation Hubs", href: toSourceHref("/en-us/resources/edgeucation-hubs") },
          { label: "Infographics", href: toSourceHref("/en-us/resources/infographics") },
          { label: "On-Demand Webinars", href: toSourceHref("/en-us/resources/webinars") },
          { label: "Solution Briefs", href: toSourceHref("/en-us/resources/solution-briefs") },
          { label: "Videos", href: toSourceHref("/en-us/resources/videos") },
          { label: "Virtual Tours", href: toSourceHref("/en-us/resources/tours/memoryai-kv-cache-server") },
          { label: "Whitepapers", href: toSourceHref("/en-us/resources/whitepapers") },
        ],
      },
    ],
    featured: {
      eyebrow: "Featured",
      title: "Virtual Tour: MemoryAI™ KV Cache Server",
      href: toSourceHref("/resources/tours/memoryai-kv-cache-server"),
      cta: "Read full article",
      image: "/sites/penguinsolutions/nav-cxl.avif",
      imageAlt: "CXL memory server",
    },
  },
  {
    id: "careers",
    label: "Careers",
    layout: "rich-columns",
    richLinks: [
      {
        title: "Careers Overview",
        description:
          "Whether you're a seasoned expert or just starting your career, this is where your individual journey toward meaningful innovation begins.",
        href: toSourceHref("/en-us/company/careers"),
        icon: "compass",
      },
      {
        title: "How We Hire",
        description:
          "Expect thoughtful conversations, timely feedback, and a candidate experience that puts people first, just like in everything we do.",
        href: toSourceHref("/en-us/company/careers/how-we-hire"),
        icon: "heart",
      },
      {
        title: "Life At Penguin",
        description:
          "From mentorship programs to continuous learning, we create an environment where everyone can thrive, grow, and make a difference.",
        href: toSourceHref("/en-us/company/careers/life-at-penguin"),
        icon: "rocket",
      },
      {
        title: "Become A Penguin",
        description:
          "Explore open roles, connect with our talent community, and discover how your skills can help solve some of the world’s most complex challenges.",
        href: "https://careers.penguinsolutions.com/",
        icon: "briefcase",
      },
    ],
    columns: [
      {
        heading: "Locations",
        links: [
          { label: "California, USA", href: "https://careers.penguinsolutions.com/search/?locationsearch=ca", external: true },
          { label: "Massachusetts, USA", href: "https://careers.penguinsolutions.com/search/?locationsearch=ma", external: true },
          { label: "North Carolina, USA", href: "https://careers.penguinsolutions.com/search/?locationsearch=nc", external: true },
          { label: "Bengaluru, India", href: "https://careers.penguinsolutions.com/search/?locationsearch=in", external: true },
          { label: "New Taipei City, Taiwan", href: "https://careers.penguinsolutions.com/search/?locationsearch=tw", external: true },
          { label: "Penang, Malaysia", href: "https://careers.penguinsolutions.com/search/?locationsearch=my", external: true },
          { label: "Gyeonggi-do, South Korea", href: "https://careers.penguinsolutions.com/search/?locationsearch=kr", external: true },
          { label: "Tydal, Norway", href: "https://careers.penguinsolutions.com/search/?locationsearch=no", external: true },
        ],
      },
    ],
    featured: {
      eyebrow: "Stories That Shape Us",
      title: "Penguin Stories",
      href: toSourceHref("/company/careers/life-at-penguin#stories"),
      cta: "Penguin Stories",
      image: "/sites/penguinsolutions/nav-story.jpg",
      imageAlt: "Employee stories that shape us",
    },
  },
];

export const HERO_DATA = {
  title: "The AI Factory Platform Company",
  subtitle: "Powering data center AI infrastructure with our Platform",
  pills: [
    {
      label: "Faster Time-to-First-Token",
      href: toSourceHref("/en-us/products/cxl-memory-expansion-servers"),
    },
    {
      label: "Validated AI Factory Architecture",
      href: toSourceHref("/en-us/products/originai-infrastructure-solution"),
    },
    {
      label: "End-to-End AI Factory Services",
      href: toSourceHref("/en-us/services/end-to-end-infrastructure-services"),
    },
    {
      label: "Best Token Economics & TCO",
      href: toSourceHref("/en-us/challenges/token-economics-total-cost-ownership"),
    },
  ],
  ctaLabel: "Let's Talk",
  ctaHref: toSourceHref("/en-us/contact-us"),
  videoSrc: "/sites/penguinsolutions/hero-bg.mp4",
  posterSrc: "/sites/penguinsolutions/hero-poster.avif",
};

export const NVIDIA_BANNER = {
  titleLine1: "NVIDIA AI Factory",
  titleLine2: "Specialized Partner",
  description:
    "Proven experience designing, building, deploying, and operating NVIDIA-based AI factory infrastructure.",
};

export const STATS_DATA = {
  heading: "Design, Build, Deploy, and Manage AI Data Centers Globally",
  description:
    "With deep expertise at the intersection of AI infrastructure and memory solutions, Penguin helps customers deploy and scale AI with superior token economics, measurable ROI, and greater operational efficiency.",
  cards: [
    { value: "25+", label: "Years Experience" },
    { value: "100,000+", label: "GPUs Deployed & Managed" },
    { value: "4.2+ Billion", label: "Hours of GPU Runtime" },
  ],
};

export interface PlatformItem {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}

export const PLATFORM_DATA = {
  eyebrow: "Our Platform",
  heading: "Full-Stack AI Factory Platform",
  description:
    "Our Full-Stack AI Factory Platform combines OEM-like product innovation, system integrator-like end-to-end services, and industry-leading partner technologies to help customers confidently deploy and scale AI workloads with speed and precision.",
  image: "/sites/penguinsolutions/platform-diagram.webp",
  imageAlt: "AI Factory Platform",
  items: [
    {
      id: "clusterware",
      title: "1. ClusterWareAI™",
      description:
        "AI factory platform operating system software that unifies and automates cluster deployment and management to simplify operations, streamline administration, and optimize performance.",
      ctaLabel: "Explore ClusterWareAI",
      href: toSourceHref("/en-us/products/clusterwareai-ai-factory-platform-operating-system-software"),
    },
    {
      id: "memoryai",
      title: "2. MemoryAI™",
      description:
        "Memory solutions designed specifically for data centers and AI inference. Together, they optimize performance, improve efficiency, and support the growing demand for inference and agentic AI.",
      ctaLabel: "Explore MemoryAI",
      href: toSourceHref("/en-us/products/cxl-memory-expansion-servers"),
    },
    {
      id: "computeai",
      title: "3. ComputeAI™",
      description:
        "Advanced computing systems and infrastructure elements optimized for AI workloads. Built for scalability and performance, these solutions support AI training, inference, and data-intensive applications.",
      ctaLabel: "Explore ComputeAI",
      href: toSourceHref("/en-us/products/computeai-ai-computing-infrastructure"),
    },
    {
      id: "originai",
      title: "4. OriginAI®",
      description:
        "Validated AI factory reference designs for scalable full-stack AI training and inference solutions. Designed to accelerate deployment, scale efficiently, and optimize performance across AI environments at scale.",
      ctaLabel: "Explore OriginAI",
      href: toSourceHref("/en-us/products/originai-infrastructure-solution"),
    },
    {
      id: "services",
      title: "5. End-to-End Services",
      description:
        "Expert support across the full AI lifecycle, including design, build, deployment, and managed services. Penguin Solutions helps customers confidently deploy, optimize, and scale AI environments with speed and precision.",
      ctaLabel: "Explore End-to-End Services",
      href: toSourceHref("/en-us/services/end-to-end-infrastructure-services"),
    },
  ] satisfies PlatformItem[],
};

export interface CustomerStory {
  id: string;
  name: string;
  logo: string;
  summary: string;
  href: string;
  image: string;
  imageAlt: string;
}

export const CUSTOMER_STORIES_DATA = {
  eyebrow: "Customer Stories",
  headingLine1: "Customers Trust",
  headingLine2: "Penguin Solutions",
  items: [
    {
      id: "sk-telecom",
      name: "SK telecom",
      logo: "/sites/penguinsolutions/logo-sk-telecom.png",
      summary:
        "Penguin Solutions designed, built, deployed, and now manages one of Korea’s largest GPU clusters, consisting of over 1,000 NVIDIA Blackwell GPUs integrated into a single cluster.",
      href: "https://news.sktelecom.com/en/2056",
      image: "/sites/penguinsolutions/customer-sk-telecom.avif",
      imageAlt: "Haein cluster in network data center",
    },
    {
      id: "bp",
      name: "bp",
      logo: "/sites/penguinsolutions/logo-bp.png",
      summary:
        "bp partnered with Penguin Solutions and NVIDIA to deploy GPU-accelerated HPC infrastructure, achieving 80x faster seismic imaging for smarter, faster well placement decisions.",
      href: toSourceHref("/resources/blog/gpu-accelerated-hpc-oil-gas-bp-case-study"),
      image: "/sites/penguinsolutions/customer-bp.avif",
      imageAlt: "bp HPC data center",
    },
    {
      id: "deepgram",
      name: "Deepgram",
      logo: "/sites/penguinsolutions/logo-deepgram.png",
      summary:
        "With Dell PowerEdge servers and Dell PowerScale storage optimized for AI workloads, Penguin Solutions delivered an optimal solution to support and enhance Deepgram’s innovative Speech-to-Text (STT), Text-to-Speech (TTS), and Voice Agent capabilities, ensuring maximum reliability and performance.",
      href: "https://ir.penguinsolutions.com/news/news-details/2026/Penguin-Solutions-Selected-by-Deepgram-to-Enable-Deployment-of-Optimized-AI-Inference-Infrastructure-for-Enterprise-Voice-AI/default.aspx",
      image: "/sites/penguinsolutions/customer-deepgram.avif",
      imageAlt: "Deepgram API model",
    },
    {
      id: "georgia-tech",
      name: "Georgia Tech",
      logo: "/sites/penguinsolutions/logo-georgia-tech.png",
      summary:
        "Penguin Solutions designed, built, and deployed the infrastructure to support the Georgia Tech AI Makerspace.",
      href: "https://coe.gatech.edu/news/2024/04/georgia-tech-unveils-new-ai-makerspace-collaboration-nvidia",
      image: "/sites/penguinsolutions/customer-georgia-tech.avif",
      imageAlt: "Server rack",
    },
    {
      id: "sandia",
      name: "Sandia National Labs",
      logo: "/sites/penguinsolutions/logo-sandia.png",
      summary:
        "Penguin Solutions deploys NextSilicon accelerator technology as part of the Vanguard program at Sandia National Labs.",
      href: "https://www.sandia.gov/research/news/sandia-partners-with-nextsilicon-and-penguin-solutions-to-deliver-first-of-its-kind-runtime-reconfigurable-accelerator-technology/",
      image: "/sites/penguinsolutions/customer-sandia.avif",
      imageAlt: "Racking servers",
    },
    {
      id: "shell",
      name: "Shell",
      logo: "/sites/penguinsolutions/logo-shell.png",
      summary:
        "Shell powers its sustainable high-performance data centers with Penguin’s high-performance computing (HPC) solutions, including immersion cooling.",
      href: "https://www.amd.com/en/resources/case-studies/shell.html",
      image: "/sites/penguinsolutions/customer-shell.avif",
      imageAlt: "An Immersion Cooling Tank",
    },
  ] satisfies CustomerStory[],
};

export interface IndustryCard {
  title: string;
  href: string;
  image: string;
  alt: string;
}

export const INDUSTRIES_DATA = {
  eyebrow: "Industry Expertise",
  headingLine1: "Unmatched Expertise in",
  headingLine2: "Industry-Specific Solutions",
  items: [
    {
      title: "AI Cloud Providers",
      href: toSourceHref("/en-us/industries/ai-cloud-providers"),
      image: "/sites/penguinsolutions/industry-ai-cloud.avif",
      alt: "AI cloud server center",
    },
    {
      title: "Sovereign AI",
      href: toSourceHref("/en-us/industries/sovereign-ai"),
      image: "/sites/penguinsolutions/industry-sovereign-ai.avif",
      alt: "Data protect",
    },
    {
      title: "Financial Services",
      href: toSourceHref("/en-us/industries/financial-services"),
      image: "/sites/penguinsolutions/industry-financial.avif",
      alt: "Stock ticker on wall",
    },
    {
      title: "Oil & Gas",
      href: toSourceHref("/en-us/industries/oil-gas-energy"),
      image: "/sites/penguinsolutions/industry-oil-gas.avif",
      alt: "Pipelines leading to refinery",
    },
    {
      title: "Life Sciences & Healthcare",
      href: toSourceHref("/en-us/industries/life-sciences-healthcare"),
      image: "/sites/penguinsolutions/industry-life-sciences.avif",
      alt: "DNA chain",
    },
    {
      title: "Higher Education",
      href: toSourceHref("/en-us/industries/higher-education"),
      image: "/sites/penguinsolutions/industry-higher-ed.avif",
      alt: "Student and professor reviewing monitor at desk",
    },
    {
      title: "Government",
      href: toSourceHref("/en-us/industries/government"),
      image: "/sites/penguinsolutions/industry-government.avif",
      alt: "Government building",
    },
    {
      title: "Weather",
      href: toSourceHref("/en-us/industries/weather"),
      image: "/sites/penguinsolutions/industry-weather.avif",
      alt: "Weather monitoring sensors tower",
    },
    {
      title: "Manufacturing",
      href: toSourceHref("/en-us/industries/manufacturing"),
      image: "/sites/penguinsolutions/industry-manufacturing.avif",
      alt: "Rivets on metal object",
    },
    {
      title: "Retail",
      href: toSourceHref("/en-us/industries/retail"),
      image: "/sites/penguinsolutions/industry-retail.avif",
      alt: "Credit card purchase on laptop",
    },
    {
      title: "Critical Infrastructure",
      href: toSourceHref("/en-us/industries/critical-infrastructure"),
      image: "/sites/penguinsolutions/industry-critical-infra.avif",
      alt: "Telecommunications dish",
    },
    {
      title: "Transportation",
      href: toSourceHref("/en-us/industries/transportation"),
      image: "/sites/penguinsolutions/industry-transportation.avif",
      alt: "Shipyard with cargo crates",
    },
  ] satisfies IndustryCard[],
};

export interface ProcessItem {
  id: "design" | "build" | "deploy" | "manage";
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  image: string;
  imageAlt: string;
}

export const PROCESS_DATA = {
  eyebrow: "Our Process",
  headingLine1: "AI Infrastructure",
  headingLine2: "Comprehensive Services",
  description:
    "With deep expertise in designing, building, deploying, and managing AI data centers, we have enabled some of the world’s most sophisticated workloads.",
  items: [
    {
      id: "design",
      title: "Design",
      description:
        "Accelerate time to value by basing system architectures on a proven set of designs that have been validated at scale in numerous production deployments.",
      ctaLabel: "Design Services",
      href: toSourceHref("/services/designing-infrastructure"),
      image: "/sites/penguinsolutions/process-design.avif",
      imageAlt: "Empty server room",
    },
    {
      id: "build",
      title: "Build",
      description:
        "Achieve high rates of system stability with our in-factory experts who integrate and validate all components of the compute cluster including rack integration, network configuration, and burn-in testing.",
      ctaLabel: "Build Services",
      href: toSourceHref("/services/building-infrastructure"),
      image: "/sites/penguinsolutions/process-build.avif",
      imageAlt: "Clean room server build cabling",
    },
    {
      id: "deploy",
      title: "Deploy",
      description:
        "Drive on-site installations with coordination of data center staff, data storage partners, and infrastructure cooling providers—and utilize ClusterWareAI™ software to validate production readiness.",
      ctaLabel: "Deploy Services",
      href: toSourceHref("/services/deploying-infrastructure"),
      image: "/sites/penguinsolutions/process-deploy.webp",
      imageAlt: "Server room network engineers",
    },
    {
      id: "manage",
      title: "Manage",
      description:
        "Assure production readiness and change management by working with a certified NVIDIA DGX Managed Services provider, the offers a full set of end-to-end services.",
      ctaLabel: "Manage Services",
      href: toSourceHref("/services/managing-infrastructure"),
      image: "/sites/penguinsolutions/process-manage.avif",
      imageAlt: "Network engineer at work in server room",
    },
  ] satisfies ProcessItem[],
};

export interface TestimonialItem {
  quote: string;
  author: string;
  role: string;
  logo: string;
  logoAlt: string;
}

export const TESTIMONIALS_DATA: TestimonialItem[] = [
  {
    quote:
      "“By partnering with Penguin Solutions and leveraging its Full-Stack AI Factory Platform, we can deliver customer-defined GPU capacity in customer-defined geographical locations that leverage readily available energy while meeting data, model, and infrastructure sovereignty requirements.”",
    author: "Karl Andersen",
    role: "CEO",
    logo: "/sites/penguinsolutions/testimonial-lektra.webp",
    logoAlt: "Lektra",
  },
  {
    quote:
      "“By combining Penguin Solutions’ HPC expertise with NVIDIA’s GPU technology, we’re enabling our teams to use some of the most advanced physics available in seismic imaging.”",
    author: "Richard Corfield",
    role: "Vice President of Imaging Technology",
    logo: "/sites/penguinsolutions/testimonial-bp.webp",
    logoAlt: "bp",
  },
  {
    quote:
      "“Penguin Solutions demonstrated a deep understanding of our technical requirements, translating them into a sophisticated infrastructure environment that meets and exceeds expectations.”",
    author: "Abe Pursell",
    role: "Vice President of Partnerships and Business Development",
    logo: "/sites/penguinsolutions/testimonial-deepgram.webp",
    logoAlt: "Deepgram",
  },
  {
    quote:
      "“It takes a village to do AI well, it takes an infrastructure, it takes a data center, and it takes experts. And, I think in that regard, having Georgia Tech, NVIDIA, and Penguin—that’s what it takes.”",
    author: "Matthieu Bloch",
    role: "Associate Dean of Academic Affairs",
    logo: "/sites/penguinsolutions/testimonial-georgia-tech.webp",
    logoAlt: "Georgia Tech",
  },
  {
    quote:
      "“After a thorough RFP process, it was clear early on that Penguin was the right partner for us. Not only do they have the technical expertise and decades of experience, but they’re able to move very fast.”",
    author: "Ozan Kaya",
    role: "CEO",
    logo: "/sites/penguinsolutions/testimonial-voltage-park.webp",
    logoAlt: "Voltage Park",
  },
];

export interface ProductSubTab {
  id: string;
  tabLabel: string;
  title: string;
  paragraphs: string[];
  ctaLabel: string;
  href: string;
  image: string;
  imageAlt: string;
}

export interface ProductCategoryTab {
  id: string;
  label: string;
  subTabs: ProductSubTab[];
}

export const PRODUCTS_DATA = {
  eyebrow: "Our Products",
  headingLine1: "Precision Engineered for",
  headingLine2: "Accelerated Performance",
  categories: [
    {
      id: "ai",
      label: "AI",
      subTabs: [
        {
          id: "originai",
          tabLabel: "OriginAI",
          title: "OriginAI®",
          paragraphs: [
            "OriginAI® is an AI factory infrastructure solution built on proven, pre-defined AI architectures that can scale from hundreds to over 16,000 GPU clusters.",
            "OriginAI integrates these validated technologies with Penguin’s intelligent, intuitive cluster management software and expert services for designing, building, deploying, and managing AI infrastructure at scale.",
          ],
          ctaLabel: "Discover OriginAI",
          href: toSourceHref("/products/originai-infrastructure-solution"),
          image: "/sites/penguinsolutions/product-originai.avif",
          imageAlt: "Woman in data center with tablet",
        },
        {
          id: "clusterwareai",
          tabLabel: "ClusterWareAI",
          title: "ClusterWareAI™",
          paragraphs: [
            "Simplify the deployment and management of AI clusters to realize greater productivity at speed with our AI factory platform operating system software.",
            "With ClusterWareAI software, bare-metal hardware, network, and software resources are transformed into high-performance cluster environments, reducing administration complexity and optimizing resource availability.",
          ],
          ctaLabel: "Discover ClusterWareAI",
          href: toSourceHref("/en-us/products/clusterwareai-ai-factory-platform-operating-system-software"),
          image: "/sites/penguinsolutions/nav-clusterware.avif",
          imageAlt: "ClusterWare on laptop screen on desk",
        },
        {
          id: "ai-managed-services",
          tabLabel: "AI Managed Services",
          title: "Delivering NVIDIA DGX-Ready Managed Services",
          paragraphs: [
            "Penguin Solutions has designed and deployed large NVIDIA DGX clusters with high-speed NVIDIA InfiniBand networking and optimized storage.",
            "We have deep expertise and relationships with most storage vendors which allows us to provide bespoke solutions for every customer.",
          ],
          ctaLabel: "Explore AI Managed Services",
          href: toSourceHref("/services/managing-infrastructure"),
          image: "/sites/penguinsolutions/nav-racks.avif",
          imageAlt: "Data center room aisle",
        },
      ],
    },
    {
      id: "fault-tolerance",
      label: "Fault Tolerance",
      subTabs: [
        {
          id: "ztc-endurance",
          tabLabel: "Stratus ztC Endurance",
          title: "Stratus ztC Endurance®",
          paragraphs: [
            "Stratus ztC Endurance® is an innovative family of computing platforms that enables intelligent, predictive fault tolerance and 99.99999% compute platform availability.",
            "The platform combines built-in fault tolerance, proactive health monitoring, and serviceability by OT or IT, all while meeting your cybersecurity requirements.",
          ],
          ctaLabel: "Discover Stratus ztC Endurance",
          href: toSourceHref("/products/stratus-ztc-endurance"),
          image: "/sites/penguinsolutions/product-ztc-endurance.avif",
          imageAlt: "ztc Endurance",
        },
        {
          id: "ztc-edge",
          tabLabel: "Stratus ztC Edge",
          title: "Stratus ztC Edge®",
          paragraphs: [
            "Stratus ztC Edge® is a secure, rugged, highly automated computing platform that improves productivity, increases operational efficiency, and reduces downtime risk at the edge of corporate networks.",
            "Its self-protecting and self-monitoring features drastically reduce unplanned downtime and ensure continuous availability of business-critical applications.",
          ],
          ctaLabel: "Discover Stratus ztC Edge",
          href: toSourceHref("/products/stratus-ztc-edge"),
          image: "/sites/penguinsolutions/product-ztc-edge.avif",
          imageAlt: "ztc Edge",
        },
        {
          id: "everrun",
          tabLabel: "Stratus everRun",
          title: "Stratus everRun®",
          paragraphs: [
            "Stratus everRun® is a software solution that pairs two servers via virtualization to create protected and replicated virtual machines (VMs) within a single operating environment, ensuring your applications run without interruption or data loss.",
            "Stratus everRun accelerates time to revenue by transforming your applications into continuously available solutions with customized availability.",
          ],
          ctaLabel: "Discover Stratus everRun",
          href: toSourceHref("/products/stratus-everrun"),
          image: "/sites/penguinsolutions/product-everrun.avif",
          imageAlt: "everRun",
        },
      ],
    },
    {
      id: "memory",
      label: "Memory",
      subTabs: [
        {
          id: "cxl-memory",
          tabLabel: "CXL® Memory Solutions",
          title: "Introducing the New Family of CXL® Add-in-Cards (AICs)",
          paragraphs: [
            "Compute Express Link (CXL) enables data centers, cloud services, and HPC providers to expand memory for intensive computing easily and cost-effectively.",
          ],
          ctaLabel: "Discover CXL AIC",
          href: toSourceHref("/products/finder?category=advanced-serial-memory&series=cxl-based-solutions"),
          image: "/sites/penguinsolutions/product-cxl.avif",
          imageAlt: "CXL expansion memory",
        },
        {
          id: "zefr-zdimms",
          tabLabel: "Zefr ZDIMMs",
          title: "Ultra-High Reliability Zefr ZDIMM Memory Modules",
          paragraphs: [
            "Ideal for data centers, hyperscalers, and HPC platforms running large memory applications that require maximum compute availability.",
          ],
          ctaLabel: "Discover Zefr ZDIMM",
          href: toSourceHref("/products/finder?category=dram-modules&series=zefr-zdimms"),
          image: "/sites/penguinsolutions/product-zdimm.avif",
          imageAlt: "ZDIMM",
        },
        {
          id: "data-center-ssds",
          tabLabel: "Data Center SSDs",
          title: "Next-Generation Data Center SSDs",
          paragraphs: [
            "Designed to meet the stringent demands placed on storage systems in hyperscaler, hyper-converged, enterprise, and edge data centers.",
          ],
          ctaLabel: "Discover Data Center SSDs",
          href: toSourceHref("/products/finder?category=flash-storage&series=data-center-ssds"),
          image: "/sites/penguinsolutions/product-flash.avif",
          imageAlt: "Flash memory",
        },
      ],
    },
  ] satisfies ProductCategoryTab[],
};

export interface NewsItem {
  category: "News" | "Media" | "Blog";
  date: string;
  headline: string;
  href: string;
  image: string;
  alt: string;
}

export const NEWS_DATA = {
  eyebrow: "News Corner",
  heading: "Latest from Penguin Solutions",
  items: [
    {
      category: "News",
      date: "November 16, 2026",
      headline: "Penguin Unveils Industry’s First Photonics-Based HBM-Class Memory Appliance",
      href: "https://ir.penguinsolutions.com/news/news-details/2026/Penguin-Solutions-Unveils-Industrys-First-Photonics-Based-HBM-Class-Memory-Appliance-to-Break-the-GPU-Memory-Wall-for-Agentic-AI/default.aspx",
      image: "/sites/penguinsolutions/news-01.webp",
      alt: "Photonics-Based HBM-Class Memory Appliance",
    },
    {
      category: "News",
      date: "November 4, 2026",
      headline: "Penguin Solutions Announces Agreement to Sell Cree LED",
      href: "https://ir.penguinsolutions.com/news/news-details/2026/Penguin-Solutions-Announces-Agreement-to-Sell-Cree-LED-to-Transom-Capital-Group/default.aspx",
      image: "/sites/penguinsolutions/news-02.webp",
      alt: "Penguin Solutions Announces Agreement to Sell Cree LED",
    },
    {
      category: "News",
      date: "October 14, 2026",
      headline: "Axe Compute Signs Multi-Year Strategic Partnership with Penguin Solutions",
      href: "https://ir.penguinsolutions.com/news/news-details/2026/Axe-Compute-Signs-Penguin-Solutions-as-Strategic-Partner-to-Accelerate-Delivery-of-Next-Generation-AI-Infrastructure-as-Demand-for-Axe-Compute-Build-Surges/default.aspx",
      image: "/sites/penguinsolutions/news-03.webp",
      alt: "Axe Compute",
    },
    {
      category: "News",
      date: "October 13, 2026",
      headline: "Penguin's MemoryAI™ KV Cache Server Named “Best AI Infrastructure Solution”",
      href: "https://www.cloud-awards.com/ai-awards/2026-winners",
      image: "/sites/penguinsolutions/news-04.webp",
      alt: "Award badge",
    },
    {
      category: "News",
      date: "September 18, 2026",
      headline: "Penguin’s OriginAI® Named “AI-Powered Enterprise Solution of the Year”",
      href: "https://www.techascensionawards.com/ai-award-winners-2026",
      image: "/sites/penguinsolutions/news-05.webp",
      alt: "2026 Tech Ascension Awards",
    },
    {
      category: "Media",
      date: "September 17, 2026",
      headline: "CXL Solutions for Data Centers Discussed at AI Infra Summit 2026",
      href: "https://www.youtube.com/watch?v=YiLnEgfMcXo",
      image: "/sites/penguinsolutions/news-06.webp",
      alt: "Andy Mills at AI Infra Summit 2026",
    },
    {
      category: "News",
      date: "September 9, 2026",
      headline: "Penguin Solutions Full-Stack AI Factory Platform Enables Lektra's AI Data Centers",
      href: "https://ir.penguinsolutions.com/news/news-details/2026/Penguin-Solutions-Full-Stack-AI-Factory-Platform-Enables-Lektras-Distributed-AI-Data-Centers/default.aspx",
      image: "/sites/penguinsolutions/news-07.webp",
      alt: "Lektra solar panels on rooftop",
    },
    {
      category: "Blog",
      date: "August 26, 2026",
      headline: "First Year of Success: Four Insights from SK Telecom’s Haein Sovereign AI Cluster",
      href: toSourceHref("/resources/blog/sk-telecoms-haein-sovereign-ai-cluster-operational-insights"),
      image: "/sites/penguinsolutions/news-08.webp",
      alt: "SK Telecom’s Haein Sovereign AI Cluster",
    },
    {
      category: "Media",
      date: "July 29, 2026",
      headline: "CEO Kash Shaikh Joins Morgan Brennan on CNBC's Morning Call",
      href: "https://www.cnbc.com/video/2026/07/29/penguin-solutions-ceo-memory-is-the-new-compute-in-the-ai-era.html",
      image: "/sites/penguinsolutions/news-09.webp",
      alt: "CNBC Exclusive",
    },
    {
      category: "News",
      date: "June 25, 2026",
      headline: "Penguin Solutions Expands ClusterWareAI Operating System Software",
      href: "https://ir.penguinsolutions.com/news/news-details/2026/Penguin-Solutions-Expands-ClusterWareAI-Operating-System-Software-for-AI-Factories-with-AI-Powered-Operations-and-Automated-Remediation/default.aspx",
      image: "/sites/penguinsolutions/news-10.webp",
      alt: "ClusterWareAI Agent",
    },
    {
      category: "News",
      date: "June 23, 2026",
      headline: "Penguin Solutions Becomes an NVIDIA AI Factory Specialized Partner",
      href: "https://ir.penguinsolutions.com/news/news-details/2026/Penguin-Solutions-Becomes-an-NVIDIA-AI-Factory-Specialized-Partner/default.aspx",
      image: "/sites/penguinsolutions/news-11.webp",
      alt: "AI Factory",
    },
    {
      category: "News",
      date: "June 2, 2026",
      headline: "Dell Technologies Names Global Alliances Americas AI Partner of the Year",
      href: "https://ir.penguinsolutions.com/news/news-details/2026/Penguin-Solutions-Recognized-as-Dell-Technologies-Global-Alliances-Americas-AI-Partner-of-the-Year/default.aspx",
      image: "/sites/penguinsolutions/news-12.webp",
      alt: "Dell award presentation",
    },
    {
      category: "Blog",
      date: "May 21, 2026",
      headline: "Scaling the Memory Wall: HBM, CXL, and the New GPU Playbook",
      href: "https://www.datacenterknowledge.com/data-center-hardware/scaling-the-memory-wall-hbm-cxl-and-the-new-gpu-playbook",
      image: "/sites/penguinsolutions/news-13.webp",
      alt: "HBM rendering",
    },
    {
      category: "News",
      date: "April 20, 2026",
      headline: "Penguin Solutions Featured on USA Today’s Climate Leaders 2026",
      href: "https://www.usatoday.com/story/news/nation/2026/04/20/americas-climate-leaders-2026-list/89604420007/",
      image: "/sites/penguinsolutions/news-14.webp",
      alt: "Penguin on top of world",
    },
    {
      category: "News",
      date: "March 17, 2026",
      headline: "Penguin Solutions Powers Deepgram's Enterprise Voice AI Infrastructure",
      href: "https://ir.penguinsolutions.com/news/news-details/2026/Penguin-Solutions-Selected-by-Deepgram-to-Enable-Deployment-of-Optimized-AI-Inference-Infrastructure-for-Enterprise-Voice-AI/default.aspx",
      image: "/sites/penguinsolutions/news-15.webp",
      alt: "Penguin Solutions Selected by Deepgram",
    },
    {
      category: "News",
      date: "March 16, 2026",
      headline: "Penguin Solutions Introduces First Production-Ready CXL-Based KV Cache Server",
      href: "https://ir.penguinsolutions.com/news/news-details/2026/Penguin-Solutions-Introduces-Industrys-First-Production-Ready-CXL-Based-KV-Cache-Server/default.aspx",
      image: "/sites/penguinsolutions/news-16.webp",
      alt: "CXL-Based KV Cache Server",
    },
    {
      category: "News",
      date: "February 2, 2026",
      headline: "Penguin Solutions Announces CEO Transition",
      href: "https://ir.penguinsolutions.com/news/news-details/2026/Penguin-Solutions-Announces-CEO-Transition/default.aspx",
      image: "/sites/penguinsolutions/news-17.webp",
      alt: "Kash Shaikh Appointed as President and CEO and as a Director of Penguin Solutions",
    },
    {
      category: "News",
      date: "December 8, 2025",
      headline: "Sandia Announces Spectra Supercomputer Installed by Penguin Solutions",
      href: "https://newsreleases.sandia.gov/not-the-largest-supercomputer-but-maybe-the-most-interesting/",
      image: "/sites/penguinsolutions/news-18.webp",
      alt: "Spectra Supercomputer",
    },
    {
      category: "News",
      date: "August 5, 2025",
      headline: "SK Telecom Launches Sovereign AI Infrastructure, Powered by NVIDIA",
      href: "https://news.sktelecom.com/en/2056",
      image: "/sites/penguinsolutions/news-19.webp",
      alt: "Haein Cluster Server Room",
    },
    {
      category: "Media",
      date: "June 13, 2025",
      headline: "Five Critical Design Considerations for AI Infrastructure",
      href: toSourceHref("/resources/ebooks/five-critical-design-considerations-for-ai-infrastructure"),
      image: "/sites/penguinsolutions/news-20.webp",
      alt: "Two pages in overlay spread",
    },
    {
      category: "News",
      date: "May 6, 2025",
      headline: "Penguin Solutions Signs Agreement with CDW Expanding Customer Reach",
      href: "https://ir.penguinsolutions.com/news/news-details/2025/Penguin-Solutions-Signs-Agreement-with-CDW-Expanding-Customer-Reach-for-AI-Infrastructure-Offerings/default.aspx",
      image: "/sites/penguinsolutions/news-21.webp",
      alt: "CDW Partnership",
    },
    {
      category: "News",
      date: "April 7, 2025",
      headline: "Stratus ztC Endurance Named “HPC Solution of the Year”",
      href: "https://ir.penguinsolutions.com/news/news-details/2025/Stratus-ztC-Endurance-Named-HPC-Solution-of-the-Year-in-the-Data-Breakthrough-Awards-Program/default.aspx",
      image: "/sites/penguinsolutions/news-22.webp",
      alt: "Badge award image",
    },
    {
      category: "News",
      date: "March 25, 2025",
      headline: "Penguin Solutions' OriginAI Honored as a Winner in the 2025 AI Excellence Awards",
      href: "https://ir.penguinsolutions.com/news/news-details/2025/Penguin-Solutions-OriginAI-Honored-as-a-Winner-in-the-2025-Artificial-Intelligence-Excellence-Awards/default.aspx",
      image: "/sites/penguinsolutions/news-23.webp",
      alt: "AI Award",
    },
    {
      category: "News",
      date: "March 4, 2025",
      headline: "Rebellions Partners on Strategic Collaboration Initiative",
      href: "https://ir.penguinsolutions.com/news/news-details/2025/Rebellions-Partners-on-Strategic-Collaboration-Initiative-to-Advance-Global-AI-Data-Center-Ecosystem/default.aspx",
      image: "/sites/penguinsolutions/news-24.webp",
      alt: "Executives from Penguin, Rebellions, and SK-Telecom Sign Deal",
    },
    {
      category: "Media",
      date: "January 17, 2025",
      headline: "Mark Seamans Discusses Simplifying AI Complexity with Data Management",
      href: "https://hammerspace.com/episode-79-simplifying-ai-complexity-with-data-management-w-mark-seamans/",
      image: "/sites/penguinsolutions/news-25.webp",
      alt: "Mark Seamans podcast interview cover about simplifying AI Complexity",
    },
    {
      category: "News",
      date: "January 9, 2025",
      headline: "Penguin Solutions Signs AI Data Center Collaboration Agreement with SK Telecom and SK hynix",
      href: "https://ir.penguinsolutions.com/news/news-details/2025/Penguin-Solutions-Signs-AI-Data-Center-Collaboration-Agreement-with-SK-Telecom-and-SK-hynix/default.aspx",
      image: "/sites/penguinsolutions/news-26.webp",
      alt: "Penguin Executive and Partners Closing a Deal",
    },
    {
      category: "News",
      date: "November 19, 2024",
      headline: "OriginAI Infrastructure Now Available with Additional GPUs and Enhanced Cluster Management Capabilities",
      href: "https://ir.penguinsolutions.com/news/news-details/2024/Penguin-Solutions-OriginAI-Infrastructure-Now-Available-with-Additional-GPUs-and-Enhanced-Cluster-Management-Capabilities/default.aspx",
      image: "/sites/penguinsolutions/news-27.webp",
      alt: "Origin AI Infrastructure",
    },
    {
      category: "News",
      date: "November 18, 2024",
      headline: "Penguin Solutions Accelerates Time to Value for AI Factories",
      href: "https://ir.penguinsolutions.com/news/news-details/2024/Penguin-Solutions-Accelerates-Time-to-Value-for-AI-Factories/default.aspx",
      image: "/sites/penguinsolutions/news-28.webp",
      alt: "Penguin and Dell Showcase Promo",
    },
    {
      category: "News",
      date: "July 11, 2024",
      headline: "Penguin Solutions Selected as the Managed Services Partner for Voltage Park’s NVIDIA Clusters",
      href: "https://ir.penguinsolutions.com/news/news-details/2024/Penguin-Solutions-Selected-as-the-Managed-Services-Partner-for-Voltage-Parks-NVIDIA-Clusters/default.aspx",
      image: "/sites/penguinsolutions/news-29.webp",
      alt: "Voltage Park Data Center",
    },
    {
      category: "Media",
      date: "May 8, 2024",
      headline: "Sandia Partners With NextSilicon and Penguin Solutions to Deliver ‘First of its Kind’ Runtime Reconfigurable Accelerator Technology",
      href: "https://www.sandia.gov/research/news/sandia-partners-with-nextsilicon-and-penguin-solutions-to-deliver-first-of-its-kind-runtime-reconfigurable-accelerator-technology/",
      image: "/sites/penguinsolutions/news-30.webp",
      alt: "Sandia Vanguard Supercomputer News",
    },
    {
      category: "Media",
      date: "April 15, 2024",
      headline: "AI Makes Mark on Engineering Education",
      href: "https://www.designnews.com/artificial-intelligence/ai-makes-mark-on-engineering-education",
      image: "/sites/penguinsolutions/news-31.webp",
      alt: "AI Laboratory",
    },
    {
      category: "Media",
      date: "April 10, 2024",
      headline: "Georgia Tech Unveils New AI Makerspace in Collaboration with NVIDIA",
      href: "https://coe.gatech.edu/news/2024/04/georgia-tech-unveils-new-ai-makerspace-collaboration-nvidia",
      image: "/sites/penguinsolutions/news-32.webp",
      alt: "Georgia Tech AI Makerspace",
    },
    {
      category: "Blog",
      date: "February 19, 2024",
      headline: "The Infrastructure Behind the Outputs: Cloud and HPC Unlock the Power of AI",
      href: toSourceHref("/resources/blog/the-infrastructure-behind-the-outputs-cloud-and-hpc-unlock-the-power-of-ai"),
      image: "/sites/penguinsolutions/news-33.webp",
      alt: "AI Chip on a Circuit Board",
    },
    {
      category: "Media",
      date: "January 22, 2024",
      headline: "Shell Deploys Cooling Immersion Pods in Texas Data Center",
      href: "https://www.datacenterdynamics.com/en/news/shell-deploys-grc-cooling-immersion-pods-in-texas-data-center/",
      image: "/sites/penguinsolutions/news-34.webp",
      alt: "Immersion Cooling Tank",
    },
    {
      category: "Media",
      date: "April 27, 2023",
      headline: "Supercomputing Platform From Penguin Solutions Installed at DoD Site",
      href: "https://militaryembedded.com/ai/big-data/supercomputing-platform-from-penguin-computing-installed-at-dod-site",
      image: "/sites/penguinsolutions/news-35.webp",
      alt: "DOD Supercomputer",
    },
    {
      category: "Media",
      date: "January 24, 2022",
      headline: "Meta Is Building the World’s Fastest AI Supercomputer",
      href: "https://www.datacenterknowledge.com/ai-data-centers/meta-is-building-the-world-s-fastest-ai-supercomputer",
      image: "/sites/penguinsolutions/news-36.webp",
      alt: "META Data Center for AI",
    },
  ] satisfies NewsItem[],
};

export const EXPERTS_CTA_DATA = {
  eyebrow: "Request a Callback",
  heading: "Talk to Our Experts",
  paragraphs: [
    "Whether you’re struggling with AI solution design, build, deployment, or management—in your data center or in the cloud—Penguin Solutions can help.",
    "Partner with Penguin Solutions and get on track to your improve AI advantage.",
  ],
  ctaLabel: "Let's Talk",
  ctaHref: toSourceHref("/en-us/contact-us"),
  videoSrc: "/sites/penguinsolutions/experts-bg.mp4",
};

export const FOOTER_DATA = {
  heading: "The AI Factory Platform Company",
  paragraphs: [
    "Penguin Solutions is the AI Factory Platform Company. We design, build, and manage next-generation data centers for enterprises, sovereign AI initiatives, and AI cloud providers.",
    "With deep design expertise at the intersection of data center AI infrastructure and memory solutions, our Full-Stack AI Factory Platform combines differentiated infrastructure software, advanced memory, compute systems, end-to-end services, and industry-leading partner technologies to help customers accelerate deployment, optimize token economics, and maximize the return on their AI investments.",
  ],
  socials: [
    { label: "Visit us on LinkedIn", href: "https://www.linkedin.com/company/penguinsolutions", id: "linkedin" as const },
    { label: "Visit us on X (Twitter)", href: "https://x.com/WeAre_Penguin", id: "x" as const },
    { label: "Visit us on Youtube", href: "https://www.youtube.com/@penguinsolutions3104", id: "youtube" as const },
  ],
  getInTouch: {
    heading: "Get in touch",
    phone: "1-415-954-2800",
    phoneHref: "tel:1-415-954-2800",
    addressLine1: "45800 Northport Loop W.",
    addressLine2: "Fremont, CA 94538",
    addressHref: "https://maps.app.goo.gl/hW77JFWLgkhda4Ci6",
    links: [
      { label: "Contact Us", href: toSourceHref("/en-us/contact-us") },
      { label: "Investor Relations", href: "mailto:ir@penguinsolutions.com" },
      { label: "Public Relations", href: "mailto:pr@penguinsolutions.com" },
      { label: "Media Kit", href: toSourceHref("/en-us/company/media-kit") },
      {
        label: "Ethics, Compliance and Helpline",
        href: "https://secure.ethicspoint.com/domain/media/en/gui/80518/index.html",
      },
    ],
  },
  partners: {
    heading: "Partners",
    links: [
      { label: "Program Overview", href: toSourceHref("/en-us/partners/partner-program-overview") },
      { label: "Alliance Partners", href: toSourceHref("/en-us/partners/partner-program-alliance-partners") },
      { label: "Channel Partners", href: toSourceHref("/en-us/partners/partner-program-channel-partners") },
      { label: "System Integrators", href: toSourceHref("/en-us/partners/partner-program-system-integrators") },
      { label: "Partner Directory", href: toSourceHref("/partners/partner-program-directory") },
      { label: "Partner Login", href: "https://partner.stratus.com/login" },
    ],
  },
  company: {
    heading: "Company",
    links: [
      { label: "About Us", href: toSourceHref("/en-us/company/about-us") },
      { label: "Investors", href: "https://ir.penguinsolutions.com/investors/default.aspx" },
      { label: "Careers", href: toSourceHref("/en-us/company/careers") },
      { label: "Support", href: toSourceHref("/en-us/support") },
      { label: "Third Party Onboarding", href: "https://smartm.navexone.com/assessments/login" },
      {
        label: "Terms and Conditions",
        href: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/6764ab25fa3a044c0a11503a_Penguin-Solutions-Web-Terms-and-Conditions_rev-October-2021.pdf",
      },
      {
        label: "Registered Trademarks",
        href: "https://cdn.prod.website-files.com/6764579f0a24e5a0083f25bb/68edc92fd3073f2188f665a3_Penguin-Solutions-Registered-Trademarks.pdf",
      },
      { label: "CbCR Compliance", href: toSourceHref("/en-us/cbcr-compliance") },
      { label: "Privacy Policy", href: toSourceHref("/en-us/privacy-policy") },
    ],
  },
  legal: {
    copyright: "© 2026 Penguin Solutions. All rights reserved.",
    links: [
      { label: "Hey AI, Learn About Us", href: toSourceHref("/en-us/llm-info") },
      { label: "Privacy Rights Request Center", href: toSourceHref("/en-us/do-not-sell-or-share-information") },
      { label: "Cookie Preferences", href: "#footer" },
    ],
  },
};
