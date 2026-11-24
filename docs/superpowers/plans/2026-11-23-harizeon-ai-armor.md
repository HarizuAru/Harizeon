# Harizeon AI-Armor (`AIA`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Harizeon AI-Armor (`AIA`) — a specialized external attack surface management service and fast scan profile protecting against unauthenticated LLM inference APIs, exposed vector databases, unauthenticated agent/MCP tool execution endpoints, and client-side AI secret key leaks.

**Architecture:** A dual-mode scanning architecture where a modular, zero-dependency Python evaluation module (`worker/ai_armor.py`) executes both in a standalone, dedicated `ai` profile (<30s runtime, skipping heavy fuzzers) and automatically inside comprehensive `deep` scans. Fastify API controls quotas, scan creation, and check-level compliance mapping to OWASP Top 10 for LLMs and ISO 42001, while Next.js 16 surfaces a dedicated public service page (`/services/aia`) and console launch controls using brutalist pure black & white styling (§10).

**Tech Stack:** Python 3 (Worker data plane, unittest), Node.js / Fastify / TypeScript / PostgreSQL 16 (Control plane API), Next.js 16 (App Router + Turbopack + Tailwind v4).

**Spec:** [docs/superpowers/specs/2026-11-23-harizeon-ai-armor-design.md](file:///f:/project/Harizeon/docs/superpowers/specs/2026-11-23-harizeon-ai-armor-design.md)

## Global Constraints

- Pure black & white styling (§10): strictly no color (`--color-*: initial`). All badges, severity chips (`CRIT`, `HIGH`, `MED`, `LOW`), monospace IDs, and borders have radius 0.
- Control plane vs data plane (§06.1): The Fastify API owns database transactions and row-level security. The Python worker receives no database credentials; it communicates strictly via Redis Streams.
- Verified perimeter assets only (§12): Never probe unverified assets.
- Next.js 16 requirements: Async request APIs (`params`, `searchParams`, `cookies()`, `headers()`) must be awaited. Strict TypeScript.
- Safe non-destructive testing only (§12): Only benign metadata/health endpoints (`/api/tags`, `/v1/models`, `/collections`, `/api/v1/health`) are queried; no model weight downloading, prompt injections, or vector dumping.
- Secret redaction: Raw API keys must never be logged or saved unredacted; always redacted (`sk-proj-abc...xyz`).

## Review Focus

1. **Prefix-less false positives in minified JS:** Bare 32/40/64-character hashes in vendor bundles trigger false criticals -> Test verifies context proximity guard requires keywords like `mistral` or `apiKey` within 40 characters.
2. **Quota validation on `ai` scan launch:** An account launching an `ai` profile scan gets rejected if `plans.limits.profiles` lacks `'ai'` -> Test verifies `assertScanAllowed` allows `ai` on `free`, `starter`, `growth`, `scale`, and `enterprise` plans.
3. **Execution time budget (<30s):** The `ai` profile mistakenly runs Nuclei or WhatWeb and times out -> Test verifies `worker.py` drops Nuclei, WhatWeb, and testssl when `profile == "ai"`.
4. **AI port HTTP detection:** Non-standard ports like `11434` (Ollama) or `6333` (Qdrant) are skipped by `_web_entries` -> Test verifies `worker/probe.py` marks `AI_PORTS` as HTTP-capable.
5. **Fine-grained compliance categorization:** All AI findings collapse into a generic default instead of OWASP LLM controls -> Test verifies `web.leaked_ai_credentials` maps to `LLM02` and `ai.unauth_agent_endpoint` maps to `LLM06`.

---

### Task 1: Database Migration & API Profile Validation

**Files:**
- Create: `db/migrations/0010_ai_armor.sql`
- Modify: `api/src/lib/queue.ts:12-20`
- Modify: `api/src/lib/quota.ts:1-40`
- Modify: `api/src/routes/scans.ts:11-15`
- Modify: `api/src/routes/schedules.ts:26-33`
- Test: `api/src/services/scanService.test.ts`
- Test: `api/src/lib/quota.test.ts`

**Interfaces:**
- Consumes: Existing `scan_profile` Postgres ENUM, `CreateScanBody` schema, `assertScanAllowed`.
- Produces: `ScanProfile = "quick" | "standard" | "deep" | "ai"`, updated `plans.limits` containing `["quick", "ai", ...]`.

- [ ] **Step 1: Write failing API quota test for `'ai'` profile**

In `api/src/services/scanService.test.ts`, add:
```typescript
test("createScan allows 'ai' profile on free plan", async () => {
  const allowed = assertScanAllowed(
    { profiles: ["quick", "ai"], max_assets: 1, scans_per_month: 1 },
    "ai",
    0
  );
  assert.equal(allowed.ok, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test api/src/services/scanService.test.ts`  
Expected: FAIL or type error on `"ai"` not assignable to `ScanProfile`.

- [ ] **Step 3: Implement database migration `db/migrations/0010_ai_armor.sql`**

```sql
-- 0010: Add 'ai' scan profile for Harizeon AI-Armor
ALTER TYPE scan_profile ADD VALUE IF NOT EXISTS 'ai';

-- Entitlement: Enable 'ai' scan profile across all tiers as a viral acquisition wedge
UPDATE plans 
SET limits = jsonb_set(limits, '{profiles}', limits->'profiles' || '["ai"]'::jsonb)
WHERE NOT (limits->'profiles' @> '["ai"]'::jsonb);
```

- [ ] **Step 4: Update API profile types and Zod schemas**

In `api/src/lib/queue.ts`:
```typescript
export type ScanProfile = "quick" | "standard" | "deep" | "ai";
```
In `api/src/routes/scans.ts`:
```typescript
const CreateScanBody = z.object({
  asset_ids: z.array(z.string().uuid()).min(1).max(50),
  profile: z.enum(["quick", "standard", "deep", "ai"]),
});
```
In `api/src/routes/schedules.ts`:
```typescript
profile?: "quick" | "standard" | "deep" | "ai";
```

- [ ] **Step 5: Run API test suite to verify passing**

Run: `npm test` inside `api/`  
Expected: PASS (all tests pass).

---

### Task 2: Worker AI-Armor Evaluation Engine (`worker/ai_armor.py`)

**Files:**
- Create: `worker/ai_armor.py`
- Create: `worker/ai_armor_test.py`

**Interfaces:**
- Consumes: `Content = dict` (`status`, `body`, `headers`) from webchecks/adapters.
- Produces: `evaluate_ai_endpoint(url, content) -> list[dict]`, `find_leaked_ai_keys_expanded(text) -> list[tuple[str, str]]`, `AI_CHECKS: list[dict]`.

- [ ] **Step 1: Write comprehensive failing tests for AI-Armor signatures**

In `worker/ai_armor_test.py`, test:
- Ollama `/api/tags` detection.
- vLLM `/v1/models` detection.
- ChromaDB `/api/v1/version` detection.
- Qdrant `/collections` detection.
- Weaviate `/v1/meta` detection.
- Milvus `/v2/vectordb/health` detection.
- Flowise / LangChain `/api/v1/flows` and `/mcp` SSE streams.
- DeepSeek, Groq, Mistral, Together, OpenAI `sk-proj-`, Anthropic `sk-ant-` key extraction.
- Context proximity requirement for prefix-less keys (assert bare SHA-256 hash without keyword is ignored).

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest worker/ai_armor_test.py`  
Expected: FAIL (ModuleNotFoundError: No module named 'ai_armor').

- [ ] **Step 3: Implement `worker/ai_armor.py`**

Implement pure functions:
- `evaluate_ollama(content: dict) -> bool`
- `evaluate_vllm(content: dict) -> bool`
- `evaluate_chroma(content: dict) -> bool`
- `evaluate_qdrant(content: dict) -> bool`
- `evaluate_weaviate(content: dict) -> bool`
- `evaluate_milvus(content: dict) -> bool`
- `evaluate_agent_endpoint(content: dict) -> bool`
- `find_leaked_ai_keys_expanded(text: str) -> list[tuple[str, str]]` with Shannon entropy > 3.0 and keyword proximity window (40 chars) for prefix-less patterns.
- Export `AI_CHECKS` registry with metadata (`check_id`, `path`, `evaluator`, `severity`, `title`, `description`, `remediation`, `cwe_id`, `category="ai_exposure"`).

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest worker/ai_armor_test.py`  
Expected: PASS.

---

### Task 3: Worker Scan & Phase Integration

**Files:**
- Modify: `worker/probe.py:16-55`
- Modify: `worker/phases.py:10-35`
- Modify: `worker/worker.py:140-270, 360-400`
- Modify: `worker/webchecks.py:22-136`
- Test: `worker/probe_test.py`
- Test: `worker/test_worker.py`

**Interfaces:**
- Consumes: `worker/ai_armor.py` (`AI_CHECKS`, `find_leaked_ai_keys_expanded`).
- Produces: `PROFILE_PHASES["ai"]`, `AI_PORTS`, AI port detection in `probe.py`, bypassed heavy scans in `worker.py` when `profile == "ai"`.

- [ ] **Step 1: Write failing test for `ai` profile phase planning & port selection**

In `worker/test_worker.py`:
```python
def test_ai_profile_phases_and_ports(self):
    phases = phases.planned_phases("ai")
    self.assertIn("probe", phases)
    self.assertIn("test", phases)
    self.assertNotIn("discover", phases)
    ports = probe.ports_for("ai")
    self.assertIn((11434, "ollama"), ports)
    self.assertIn((6333, "qdrant"), ports)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest worker/test_worker.py`  
Expected: FAIL with ValueError: unknown scan profile: ai.

- [ ] **Step 3: Update `worker/phases.py` and `worker/probe.py`**

1. In `worker/phases.py`:
```python
PROFILE_PHASES = {
    "quick": ["verify", "discover", "resolve", "normalize", "report"],
    "standard": list(PHASES),
    "deep": list(PHASES),
    "ai": ["verify", "resolve", "probe", "inspect", "test", "normalize", "report"],
}
```
2. In `worker/probe.py`:
Define `AI_PORTS = [(11434, "ollama"), (8000, "vllm-or-chroma"), (6333, "qdrant"), (19530, "milvus"), (8080, "weaviate-or-localai"), (1234, "lm-studio"), (7860, "gradio-flowise"), (5000, "textgen")]`.
Update `ports_for(profile)`:
```python
if profile == "ai":
    return list(AI_PORTS)
if profile == "deep":
    return list(EXTENDED_PORTS + AI_PORTS)
return list(COMMON_PORTS)
```
Update `_web_entries` to treat AI ports as HTTP web targets.

3. In `worker/worker.py`:
In `run_inspect_phase` and `run_test_phase`:
When `profile == "ai"`, skip WhatWeb, testssl, Nuclei, and generic web checks; run only `ai_armor` checks and JS token scanning.

- [ ] **Step 4: Run worker test suite to verify passing**

Run: `python -m unittest discover -s worker -p "*_test.py"`  
Expected: PASS (all tests pass).

---

### Task 4: Compliance & Governance Mapping (`api/src/lib/compliance.ts`)

**Files:**
- Modify: `api/src/lib/compliance.ts:18-60`
- Test: `api/src/lib/compliance.test.ts`

**Interfaces:**
- Consumes: Findings with `category: "ai_exposure"` and specific `check_id`s.
- Produces: OWASP Top 10 for LLMs (`LLM01`, `LLM02`, `LLM06`) and ISO/IEC 42001 control mappings.

- [ ] **Step 1: Write failing test for OWASP LLM Top 10 control mapping**

In `api/src/lib/compliance.test.ts`:
```typescript
test("maps AI vector exposure to OWASP LLM02 and agent endpoint to LLM06", () => {
  const results = mapFindingsToControls([
    { id: "1", title: "ChromaDB Exposed", severity: "high", status: "open", asset: "a", checkId: "ai.vector_db_exposure", category: "ai_exposure" },
    { id: "2", title: "Flowise Endpoint", severity: "high", status: "open", asset: "a", checkId: "ai.unauth_agent_endpoint", category: "ai_exposure" },
  ]);
  const owasp = results.find(r => r.framework === "OWASP Top 10 for LLMs");
  assert.ok(owasp);
  assert.ok(owasp.controls.some(c => c.control === "LLM02"));
  assert.ok(owasp.controls.some(c => c.control === "LLM06"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test api/src/lib/compliance.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement check-specific mapping in `api/src/lib/compliance.ts`**

Define `CHECK_CONTROL_MAP`:
```typescript
const CHECK_CONTROL_MAP: Record<string, ComplianceControlRef[]> = {
  "web.leaked_ai_credentials": [
    { framework: "OWASP Top 10 for LLMs", control: "LLM02", title: "Sensitive Information Disclosure" },
    { framework: "ISO/IEC 42001:2023", control: "A.6.2", title: "Data protection for AI systems" },
    { framework: "SOC 2", control: "CC6.1", title: "Logical access credentials" },
  ],
  "ai.vector_db_exposure": [
    { framework: "OWASP Top 10 for LLMs", control: "LLM02", title: "Sensitive Information Disclosure" },
    { framework: "ISO/IEC 42001:2023", control: "A.6.2", title: "Data protection for AI systems" },
    { framework: "SOC 2", control: "CC6.6", title: "Boundary protection" },
  ],
  "ai.unauth_model_api": [
    { framework: "OWASP Top 10 for LLMs", control: "LLM01", title: "Prompt Injection and Model Abuse" },
    { framework: "ISO/IEC 42001:2023", control: "A.8.4", title: "AI system resource access control" },
    { framework: "ISO/IEC 27001:2022", control: "A.8.20", title: "Networks security" },
  ],
  "ai.unauth_agent_endpoint": [
    { framework: "OWASP Top 10 for LLMs", control: "LLM06", title: "Excessive Agency" },
    { framework: "ISO/IEC 42001:2023", control: "A.8.5", title: "AI agent authorization controls" },
    { framework: "SOC 2", control: "CC6.6", title: "Boundary protection" },
  ],
};
```
Fall back to `CONTROL_MAP[category]` if check ID is not specifically mapped.

- [ ] **Step 4: Run compliance tests to verify passing**

Run: `node --import tsx --test api/src/lib/compliance.test.ts`  
Expected: PASS.

---

### Task 5: Web Console & Public Matrix Integration

**Files:**
- Create: `web/src/app/services/aia/page.tsx`
- Modify: `web/src/app/services/page.tsx:16-85`
- Modify: `web/src/app/services/[code]/page.tsx:10-120`
- Modify: `web/src/components/new-scan-form.tsx:10-53`
- Modify: `web/src/app/page.tsx:30-44`
- Modify: `web/src/components/dashboard-calendar-heatmap.tsx:50-60`
- Modify: `web/src/components/scans-duration-histogram.tsx:550-670`
- Test: Next.js build & ESLint

**Interfaces:**
- Consumes: `profile: "ai"` option in UI forms, `/services/aia` public route.
- Produces: Public documentation for Harizeon AI-Armor, `[AIA]` profile selection in scan launcher, updated service matrix.

- [ ] **Step 1: Add `[ai]` profile option to `web/src/components/new-scan-form.tsx`**

```typescript
const PROFILES: [string, string][] = [
  ["quick", "quick · ~2 min · passive only"],
  ["standard", "standard · ~10 min · passive + ports + TLS + web"],
  ["deep", "deep · ~45 min · standard + broader range"],
  ["ai", "ai · ~30s · Harizeon AI-Armor (LLM, Vector DB & Agent endpoints)"],
];
```

- [ ] **Step 2: Add Harizeon AI-Armor (`AIA`) to `AVAILABLE_SERVICES` in `web/src/app/services/page.tsx`**

Register `AIA` under available services:
```typescript
{
  code: "AIA",
  name: "Harizeon AI-Armor",
  href: "/services/aia",
  description: "Specialized attack surface scanning for LLM inference endpoints, vector databases, agentic MCP servers, and leaked AI provider keys.",
  features: [
    "Unauthenticated LLM inference detection (Ollama, vLLM, LocalAI, LM Studio)",
    "Vector DB & RAG storage discovery (ChromaDB, Qdrant, Milvus, Weaviate)",
    "Client-side AI API key leak detection (OpenAI, Anthropic, Gemini, DeepSeek, Groq, Mistral)",
    "Agent tool execution & Model Context Protocol (MCP) endpoint exposure",
    "OWASP Top 10 for LLMs and ISO/IEC 42001 compliance control mapping",
  ],
}
```

- [ ] **Step 3: Create dedicated public route `web/src/app/services/aia/page.tsx`**

Build the public technical specification page for Harizeon AI-Armor adhering strictly to pure black & white brutalism (§10):
- Threat vectors breakdown (Model endpoints, Vector DBs, Leaked keys, Agent tools).
- Architecture diagram in ASCII / SVG monochrome.
- OWASP Top 10 for LLMs compliance table.
- Direct CTA: `Launch 30s AI Scan →`.

- [ ] **Step 4: Register `aia` in `SERVICE_REGISTRY` in `web/src/app/services/[code]/page.tsx`**

Add `aia` key so `/services/aia` resolves seamlessly both directly and via canonical code lookup.

- [ ] **Step 5: Run Next.js lint and typecheck**

Run: `npm --prefix web run lint && npm --prefix web run build`  
Expected: 0 errors, all 39+ routes compiled cleanly.

---

### Task 6: Full Verification & Integration Test Suite

**Files:**
- Test: All worker tests (`python -m unittest discover -s worker -p "*_test.py"`)
- Test: All API tests (`npm test` in `api/`)
- Test: Full web build (`npm run build` in `web/`)

- [ ] **Step 1: Execute Python Worker test suite**

Run: `python -m unittest discover -s worker -p "*_test.py"`  
Expected: All tests pass (including new `ai_armor_test.py`, `probe_test.py`, `test_worker.py`).

- [ ] **Step 2: Execute Control-Plane API test suite**

Run: `npm test` inside `api/`  
Expected: All tests pass (including quota, scans, compliance).

- [ ] **Step 3: Execute Web Console ESLint and Turbopack Build**

Run: `npm --prefix web run lint && npm --prefix web run build`  
Expected: ESLint exits 0; Turbopack builds all pages with 0 TypeScript/compilation errors.

- [ ] **Step 4: Verify Live Scan Integration on `http://localhost:3000`**

Verify that navigating to `/scans/new` presents the `[ai]` profile option and `/services/aia` renders the public AI-Armor landing page.
