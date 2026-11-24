# Design Document: Harizeon AI-Armor (`AIA`) — Agentic, LLM & AI Perimeter Protection

**Document Path:** `docs/superpowers/specs/2026-11-23-harizeon-ai-armor-design.md`  
**Date:** 2026-11-23  
**Status:** Ready for Final Approval  
**Target Milestone:** Harizeon v0.1+ Competitive Differentiator  
**Monetization & Entitlement Decision:** Enabled on ALL plans (`free`, `starter`, `growth`, `scale`, `enterprise`) as a viral acquisition wedge for AI startups.

---

## 1. Intent and the "Why"

### 1.1 The Market Problem
Traditional External Attack Surface Management (EASM) and vulnerability scanners (Detectify, Nessus, Acunetix, Qualys) were designed for the LAMP and classic cloud eras. They scan for Apache 2.4 path traversal, OpenSSH CVEs, and generic HTTP headers, but have **zero awareness of AI, LLM, or vector database infrastructure**.

Modern technology startups, SaaS providers, and AI builders are rapidly deploying generative AI features. In doing so, they are inadvertently exposing critical, high-value AI infrastructure directly to the public internet:
1. **Unauthenticated Inference APIs:** Developers spin up local or cloud inference engines (Ollama, vLLM, LocalAI, LM Studio, TGI) on public cloud VMs without reverse proxies or API key gates. Anyone on the internet can list private models, execute inference on the company's GPU compute, or trigger internal fine-tuned weights.
2. **Exposed Vector Databases & RAG Stores:** Vector databases powering Retrieval-Augmented Generation (ChromaDB, Qdrant, Milvus, Weaviate) are exposed on default ports. These databases store company proprietary knowledge bases, internal documentation, customer PII, and vector embeddings.
3. **Leaked AI Provider Tokens:** Front-end engineers building chat widgets or client-side GenAI features mistakenly embed high-privilege provider API keys (`sk-proj-...`, `sk-ant-...`, `AIza...`, `gsk_...`, DeepSeek `sk-...`) inside client JavaScript bundles.
4. **Exposed MCP & Agent Tool Endpoints:** Emerging agentic systems expose Model Context Protocol (MCP) server endpoints (`/mcp`, `/sse`) and agent orchestrator APIs (Flowise `/api/v1/prediction`, LangChain `/invoke`) that allow unauthenticated visitors to invoke internal tools and databases.

### 1.2 The Harizeon Solution
**Harizeon AI-Armor (`AIA`)** provides specialized, non-destructive external scanning and continuous perimeter protection tailored specifically for modern AI stacks. It provides AI startups and enterprises with immediate visibility into their AI attack surface before attackers or malicious agents can exploit it.

---

## 2. Goals, Non-Goals, and Anti-Goals

### 2.1 Goals
- **Pure Worker Evaluation Engine (`worker/ai_armor.py`):**
  - Implement zero-dependency, pure evaluators testable without a network or database.
  - Inference engine discovery: Ollama (`11434`), vLLM (`8000`), LocalAI (`8080`), LM Studio (`1234`), Text Generation Inference (`8080`).
  - Vector DB discovery: ChromaDB (`8000`), Qdrant (`6333`), Milvus (`19530`), Weaviate (`8080`).
  - Agent / MCP endpoint detection: LangChain / LangGraph (`/invoke`), Flowise (`/api/v1/prediction`), Model Context Protocol (`/mcp`, `/sse`).
  - Client-side AI token leak detection with Shannon entropy validation (expanding beyond OpenAI/Anthropic to include DeepSeek, Groq, Mistral, Together, Cohere, HuggingFace).
- **Dual-Mode Execution:**
  - Fast, dedicated `ai` profile: Runs in <30 seconds per target by probing only AI ports and testing AI endpoints/scripts.
  - Automatic `deep` scan inclusion: Comprehensive deep scans automatically run all AI-Armor checks alongside traditional network checks.
- **Strict Black & White Console UI (§10):**
  - Dedicated public service page at `/services/aia` detailing capabilities, risks, and compliance mapping.
  - Console Scan Launcher integration: Add `[AIA] AI-Armor Scan` profile option.
  - Findings view: Category `ai_exposure` with actionable, developer-friendly remediation instructions.
  - Compliance mapping: Map findings to OWASP Top 10 for LLMs (LLM01: Prompt Injection, LLM02: Sensitive Info Disclosure, LLM06: Excessive Agency) and ISO/IEC 42001 (Artificial Intelligence Management System).

### 2.2 Non-Goals
- **Adversarial Red-Teaming / Jailbreaking:** Harizeon does not send malicious prompt-injection payloads, toxic prompts, or attempt model jailbreaks.
- **Data Scraping / Vector Exfiltration:** Harizeon never dumps or downloads vector records or embeddings; it only detects unauthenticated reachability.
- **Active Model Weight Download:** Harizeon never downloads gigabytes of GGUF/Safetensors weights from detected endpoints.

### 2.3 Anti-Goals
- **No Heavy GPU Load / Denial-of-Service:** Probing must never generate heavy completion tokens or exhaust victim GPU VRAM. Only lightweight metadata/tags/version queries are permitted.
- **No Unredacted Secret Storage:** Leaked API keys must always be redacted (`sk-proj-abc...xyz`) before storing as evidence, emitting via SSE, or displaying in the UI.

---

## 3. Constraints & Architectural Rules

1. **Control Plane vs Data Plane (§06.1):**
   - Fastify API owns database transactions and row-level security (`harizeon.org_id`).
   - Python worker runs in total data-plane isolation with zero database credentials; it communicates strictly via Redis Streams.
2. **Pure Black & White Brutalism (§10):**
   - Strictly zero color (`--color-*: initial`). Severity chips use monochrome indicators (`CRIT`, `HIGH`, `MED`, `LOW`), monospace identifiers, and sharp borders (radius 0).
3. **Verified Perimeter Only (§12):**
   - Active scanning is only permitted on verified assets belonging to the authenticated tenant.
4. **Next.js 16 Compatibility:**
   - App Router, async server components, Turbopack, strict TypeScript, ESLint 9 flat config.

---

## 4. Approaches Considered

### Approach 1: In-Place Extension of Standard/Deep Scans
- Add AI checks as sub-routines of existing `probe` and `test` phases without introducing a new profile or service page.
- *Trade-off:* Zero schema changes, but offers no marketing hook or fast 30s audit for AI builders.

### Approach 2: Standalone Service Only
- Introduce a separate `ai` profile that is exclusively run on-demand.
- *Trade-off:* Excellent for AI startups, but enterprise users running standard/deep scans miss out on discovering shadow AI exposures on their assets.

### Approach 3: Dual Mode (Selected)
- Build a modular `ai_armor.py` engine in the worker.
- Provide a dedicated, ultra-fast `ai` scan profile (~20s) in the console launcher and API.
- Automatically execute the full AI-Armor check set during all `deep` scans.
- Add `/services/aia` to the public matrix and update compliance reporting.
- *Why Selected:* Gives Harizeon an immediate competitive wedge against legacy scanners while strengthening core enterprise coverage.

---

## 5. System Design & Technical Specification

### 5.1 Worker Architecture (`worker/`)

#### 5.1.1 Modular Engine (`worker/ai_armor.py`)
Encapsulates all AI-specific detection logic:
1. **Ports Monitored for AI Profile:**
   - `11434`: Ollama inference API
   - `8000`: vLLM / ChromaDB / FastAPI AI endpoints
   - `6333`: Qdrant REST API
   - `19530`: Milvus REST/gRPC gateway
   - `8080`: Weaviate / LocalAI
   - `1234`: LM Studio
   - `7860`: Gradio / Flowise / Langflow
   - `5000`: Text Generation WebUI / Oobabooga

2. **Endpoint Evaluation Signatures:**
   - `Ollama API`: `GET /api/tags` -> checks for `"models"` and `"digest"`.
   - `vLLM / OpenAI Compatible`: `GET /v1/models` -> checks for `"object": "list"` and `"id": "..."`.
   - `ChromaDB`: `GET /api/v1/version` -> checks for semantic version string and Chroma fingerprint.
   - `Qdrant`: `GET /collections` -> checks for `"result": {"collections": ...}`.
   - `Weaviate`: `GET /v1/meta` -> checks for `"version"` and `"hostname"`.
   - `Milvus`: `GET /v2/vectordb/health` or `GET /api/v1/health` -> checks for `{"code": 200, ...}`.
   - `Flowise / Langflow`: `GET /api/v1/flows` or `GET /api/v1/prediction` -> unauthenticated workflow exposure.
   - `MCP / Agent SSE`: `GET /mcp` or `GET /sse` -> Model Context Protocol handshake response or event-stream header.

3. **Probing Topology:**
   - If an AI port (e.g., `11434`, `6333`, `19530`, `8000`, `8080`) is open, probe its service-specific signature.
   - On standard web ports (`80` / `443`), probe common web-facing agentic endpoints (`/v1/models`, `/api/v1/flows`, `/mcp`, `/sse`) and scan client JS for leaked keys.
   - Map AI ports in `worker/probe.py` so they are recognized as HTTP-capable web entries.

4. **Expanded Leaked Key Signatures & Proximity Guard:**
   - Distinctive Prefix Keys (Global Regex):
     - OpenAI: `sk-[A-Za-z0-9]{20,}` and `sk-proj-[A-Za-z0-9_-]{20,}`
     - Anthropic: `sk-ant-[A-Za-z0-9_-]{20,}`
     - Google Gemini: `AIza[0-9A-Za-z_-]{35}`
     - DeepSeek: `sk-[a-f0-9]{32}`
     - Groq: `gsk_[A-Za-z0-9]{40,}`
     - Hugging Face: `hf_[A-Za-z0-9]{30,}`
   - Prefix-less Keys (Context-Anchored Regex):
     - Mistral, Together AI, Cohere: Require proximity keywords (e.g. `mistral`, `together`, `cohere`, `apiKey`) within a 40-character window to eliminate false positives on hash digests.
   - *Entropy Gate:* Shannon entropy > 3.0 on variable segment to eliminate mock/dummy constants.

#### 5.1.2 Phases & Profile (`worker/phases.py`)
```python
PROFILE_PHASES = {
    "quick": ["verify", "discover", "resolve", "normalize", "report"],
    "standard": list(PHASES),
    "deep": list(PHASES),
    "ai": ["verify", "resolve", "probe", "inspect", "test", "normalize", "report"],
}
```
In the `ai` profile:
- Subdomain discovery is skipped for speed (scans verified target directly).
- Heavy engines (Nuclei, WhatWeb, testssl) and generic web checks (`.git`, `phpinfo`, `backup.sql`) are bypassed.
- `probe` checks only `AI_PORTS`.
- `test` runs strictly `ai_armor` endpoint evaluators and JS bundle scanner.
- Execution budget is guaranteed <30s.

---

### 5.2 Control Plane & API (`api/`)

#### 5.2.1 Database Migration (`db/migrations/0010_ai_armor.sql`)
```sql
-- 0010: Add 'ai' scan profile for Harizeon AI-Armor
ALTER TYPE scan_profile ADD VALUE IF NOT EXISTS 'ai';

-- Entitlement: Enable 'ai' scan profile across all tiers (free, starter, growth, scale, enterprise)
-- Acts as a viral acquisition wedge so any developer can run a 30s AI security check on their asset.
UPDATE plans 
SET limits = jsonb_set(limits, '{profiles}', limits->'profiles' || '["ai"]'::jsonb)
WHERE NOT (limits->'profiles' @> '["ai"]'::jsonb);
```

#### 5.2.2 Fastify Validation (`api/src/routes/scans.ts` & `schedules.ts`)
Update `CreateScanBody` and `schedules` schemas:
```typescript
const CreateScanBody = z.object({
  asset_ids: z.array(z.string().uuid()).min(1).max(50),
  profile: z.enum(["quick", "standard", "deep", "ai"]),
});
```

#### 5.2.3 Check-Specific Compliance Mapping (`api/src/lib/compliance.ts`)
Add fine-grained check ID mappings to OWASP Top 10 for LLMs alongside category-level defaults:
- `web.leaked_ai_credentials` -> OWASP LLM02 (Sensitive Information Disclosure)
- `ai.vector_db_exposure` -> OWASP LLM02 (Sensitive Information Disclosure) & ISO 42001 A.6.2
- `ai.unauth_model_api` -> OWASP LLM01 (Prompt Injection / Model Abuse) & ISO 42001 A.8.4
- `ai.unauth_agent_endpoint` -> OWASP LLM06 (Excessive Agency) & ISO 42001 A.8.5

---

### 5.3 Web Console & Public Matrix (`web/`)

1. **Public Services Matrix (`web/src/app/services/page.tsx` & `/services/[code]/page.tsx`):**
   - Add `AIA` (Harizeon AI-Armor) to `AVAILABLE_SERVICES` with code `AIA`.
   - Detail features: Vector DB exposures, inference API protection, client JS key leakage, agent tool exposure, OWASP LLM Top 10 mapping.
2. **New Scan Form (`web/src/components/new-scan-form.tsx`):**
   - Add option: `["ai", "ai · ~30s · Harizeon AI-Armor (LLM, Vector DB & Agent endpoints)"]`.
3. **Scan Filters & Dashboards:**
   - Update scan profile filters to support `ai`.
   - Add `AIA` badge marker on finding details.

---

## 6. What's Left to the Builder

The builder can make standard low-level implementation calls on:
1. Exact HTTP connect timeouts (e.g. 2.0s vs 2.5s) for AI endpoint probes to maintain <30s execution.
2. Order of regex pattern matching in `find_leaked_ai_keys()`.
3. Layout spacing and copy typography on `/services/aia` adhering to existing brutalist styling.
4. Unit test mock fixtures in `worker/ai_armor_test.py`.
