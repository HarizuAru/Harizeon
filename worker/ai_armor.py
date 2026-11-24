"""Harizeon AI-Armor (AIA) — Pure evaluation engine for AI attack surfaces.

Detects exposed model inference servers, vector databases, agent tool endpoints,
and client-side AI provider credentials in client JS bundles. Zero network I/O
and pure logic so it is unit-testable without a cluster.
"""

import json
import math
import re
from typing import Callable

Content = dict  # {"status": int, "body": str, "headers": dict}

MIN_KEY_ENTROPY = 3.0
PLACEHOLDER_MARKERS = ("example", "your", "xxx", "placeholder", "changeme", "redacted", "dummy", "sample")


def shannon_entropy(text: str) -> float:
    """Bits of information per character. 'aaaa...' -> ~0; random keys -> >4."""
    if not text:
        return 0.0
    counts: dict[str, int] = {}
    for ch in text:
        counts[ch] = counts.get(ch, 0) + 1
    n = len(text)
    return -sum((c / n) * math.log2(c / n) for c in counts.values())


def redact_secret(value: str) -> str:
    """Never echo a live credential into findings or logs."""
    if len(value) <= 12:
        return "…"
    return "%s…%s" % (value[:7], value[-4:])


# --- Inference Endpoint Evaluators -------------------------------------------

def evaluate_ollama(content: Content) -> bool:
    """Ollama GET /api/tags lists locally pulled models without auth."""
    if content.get("status") != 200:
        return False
    body = content.get("body") or ""
    return '"models"' in body and '"digest"' in body and '"modified_at"' in body


def evaluate_vllm(content: Content) -> bool:
    """vLLM / OpenAI-compatible GET /v1/models lists hosted LLM models."""
    if content.get("status") != 200:
        return False
    body = content.get("body") or ""
    return (
        ('"object":"list"' in body or '"object": "list"' in body)
        and '"data"' in body
        and '"id"' in body
    )


# --- Vector Database Evaluators ----------------------------------------------

def evaluate_chroma(content: Content) -> bool:
    """ChromaDB GET /api/v1/version exposes vector database version string."""
    if content.get("status") != 200:
        return False
    body = (content.get("body") or "").strip()
    # Chroma returns either a JSON string e.g. "0.4.22" or {"version": "..."}
    if re.match(r'^"0\.\d+\.\d+"$', body):
        return True
    return '"version"' in body and any(v in body for v in ("0.4.", "0.5.", "chroma"))


def evaluate_qdrant(content: Content) -> bool:
    """Qdrant GET /collections lists vector collections without authentication."""
    if content.get("status") != 200:
        return False
    body = content.get("body") or ""
    return '"collections"' in body and '"result"' in body


def evaluate_weaviate(content: Content) -> bool:
    """Weaviate GET /v1/meta lists meta configuration and module bindings."""
    if content.get("status") != 200:
        return False
    body = content.get("body") or ""
    return '"version"' in body and any(k in body for k in ('"hostname"', '"modules"', '"weaviate"'))


def evaluate_milvus(content: Content) -> bool:
    """Milvus GET /v2/vectordb/health or /api/v1/health exposes vector cluster health."""
    if content.get("status") != 200:
        return False
    body = content.get("body") or ""
    return (
        ('"code":200' in body or '"code": 200' in body)
        or ('"status":"ok"' in body or '"status": "ok"' in body)
        or ('"healthy":true' in body or '"healthy": true' in body)
    )


# --- Agent & MCP Endpoint Evaluators -----------------------------------------

def evaluate_agent_endpoint(content: Content) -> bool:
    """Flowise/Langflow workflows or Model Context Protocol (MCP) SSE endpoints."""
    if content.get("status") != 200:
        return False
    body = content.get("body") or ""
    headers = content.get("headers") or {}
    content_type = str(headers.get("content-type") or "").lower()

    # MCP Server-Sent Events handshake
    if "text/event-stream" in content_type:
        return True
    if "event: endpoint" in body or '"jsonrpc"' in body:
        return True

    # Flowise / Langflow workflow graph disclosure
    if '"nodes"' in body and any(k in body for k in ('edges', 'chatflow', 'flowise', 'prompt', 'nodes')):
        return True
    return False


# --- Client-Side AI Provider Credential Scanner ------------------------------

_PREFIXED_KEY_PATTERNS = [
    ("OpenAI", re.compile(r"\bsk-proj-([A-Za-z0-9_-]{20,})\b")),
    ("OpenAI", re.compile(r"\bsk-([A-Za-z0-9]{20,})\b")),
    ("Anthropic", re.compile(r"\bsk-ant-([A-Za-z0-9_-]{20,})\b")),
    ("Google Gemini", re.compile(r"\bAIza([0-9A-Za-z_-]{35,})\b")),
    ("DeepSeek", re.compile(r"\bsk-([a-f0-9]{32})\b")),
    ("Groq", re.compile(r"\bgsk_([A-Za-z0-9]{40,})\b")),
    ("Hugging Face", re.compile(r"\bhf_([A-Za-z0-9]{30,})\b")),
]

_CONTEXT_ANCHORED_PATTERNS = [
    ("Mistral", re.compile(r"\b([A-Za-z0-9]{32})\b"), ("mistral",)),
    ("Together AI", re.compile(r"\b([a-f0-9]{64})\b"), ("together",)),
    ("Cohere", re.compile(r"\b([A-Za-z0-9]{40})\b"), ("cohere",)),
]


def find_leaked_ai_keys_expanded(text: str) -> list[tuple[str, str]]:
    """Return [(redacted_secret, provider)] for AI credentials discovered in `text`."""
    if not text:
        return []
    found: dict[str, str] = {}
    lowered = text.lower()

    # 1. Distinctive prefixed keys (global matching with entropy check)
    for provider, pattern in _PREFIXED_KEY_PATTERNS:
        for match in pattern.finditer(text):
            candidate = match.group(0)
            variable = match.group(1)
            if any(marker in candidate.lower() for marker in PLACEHOLDER_MARKERS):
                continue
            if shannon_entropy(variable) < MIN_KEY_ENTROPY:
                continue
            # Ignore false-positive example assignments
            start_ctx = max(0, match.start() - 25)
            if any(marker in lowered[start_ctx:match.start()] for marker in ("example", "your_")):
                continue
            found[redact_secret(candidate)] = provider

    # 2. Prefix-less keys requiring keyword proximity within 40 chars
    for provider, pattern, keywords in _CONTEXT_ANCHORED_PATTERNS:
        for match in pattern.finditer(text):
            candidate = match.group(0)
            variable = match.group(1)
            if any(marker in candidate.lower() for marker in PLACEHOLDER_MARKERS):
                continue
            if shannon_entropy(variable) < MIN_KEY_ENTROPY:
                continue

            # Look within 40 characters before and after the candidate for provider keywords
            window_start = max(0, match.start() - 40)
            window_end = min(len(text), match.end() + 40)
            surrounding = lowered[window_start:window_end]

            if not any(kw in surrounding for kw in keywords):
                continue
            if any(marker in surrounding for marker in ("example", "your_")):
                continue

            found[redact_secret(candidate)] = provider

    return sorted(found.items(), key=lambda kv: kv[1])


# --- AI Checks Registry ------------------------------------------------------

AI_CHECKS = [
    {
        "check_id": "ai.exposed_ollama",
        "path": "/api/tags",
        "evaluator": evaluate_ollama,
        "severity": "critical",
        "title": "Unauthenticated Ollama LLM endpoint exposed",
        "description": "An Ollama inference server is publicly accessible without authentication. Unauthorized parties can enumerate models and execute inference on your GPU resources.",
        "remediation": "Bind Ollama to 127.0.0.1 or place behind a reverse proxy with token authentication. Restrict port 11434 via firewall.",
        "cwe_id": "CWE-306",
        "category": "ai_exposure",
    },
    {
        "check_id": "ai.exposed_vllm",
        "path": "/v1/models",
        "evaluator": evaluate_vllm,
        "severity": "critical",
        "title": "Unauthenticated vLLM / OpenAI-compatible inference API exposed",
        "description": "A high-performance LLM inference endpoint (vLLM / LocalAI / LM Studio) is publicly reachable without authentication. Anyone can invoke model generation or inspect fine-tuned models.",
        "remediation": "Enable API key authentication (--api-key flag) or restrict access using an API gateway.",
        "cwe_id": "CWE-306",
        "category": "ai_exposure",
    },
    {
        "check_id": "ai.vector_db_chroma",
        "path": "/api/v1/version",
        "evaluator": evaluate_chroma,
        "severity": "high",
        "title": "Unauthenticated ChromaDB vector store exposed",
        "description": "A Chroma vector database is accessible over the internet without authentication. Vector embeddings, document chunks, and internal company context can be exfiltrated.",
        "remediation": "Enable Chroma token authentication or bind to a private network. Never expose port 8000 publicly without access control.",
        "cwe_id": "CWE-200",
        "category": "ai_exposure",
    },
    {
        "check_id": "ai.vector_db_qdrant",
        "path": "/collections",
        "evaluator": evaluate_qdrant,
        "severity": "high",
        "title": "Unauthenticated Qdrant vector database exposed",
        "description": "A Qdrant vector search engine is publicly reachable without an API key. Proprietary vectors, metadata, and customer RAG documents can be extracted.",
        "remediation": "Configure api_key in Qdrant's config.yaml and bind port 6333 to an internal VPC network.",
        "cwe_id": "CWE-200",
        "category": "ai_exposure",
    },
    {
        "check_id": "ai.vector_db_weaviate",
        "path": "/v1/meta",
        "evaluator": evaluate_weaviate,
        "severity": "high",
        "title": "Unauthenticated Weaviate vector engine exposed",
        "description": "Weaviate metadata endpoint is exposed without authentication, disclosing cluster configuration, host topology, and connected embedding modules.",
        "remediation": "Enable AUTHENTICATION_APIKEY_ENABLED=true in Weaviate environment variables.",
        "cwe_id": "CWE-200",
        "category": "ai_exposure",
    },
    {
        "check_id": "ai.vector_db_milvus",
        "path": "/v2/vectordb/health",
        "evaluator": evaluate_milvus,
        "severity": "high",
        "title": "Unauthenticated Milvus vector cluster exposed",
        "description": "Milvus vector database health and management gateway is exposed publicly. Vector collections and indices may be accessible to unauthorized callers.",
        "remediation": "Enable Milvus user authentication and restrict port 19530 to private subnet traffic.",
        "cwe_id": "CWE-200",
        "category": "ai_exposure",
    },
    {
        "check_id": "ai.unauth_agent_endpoint",
        "path": "/api/v1/flows",
        "evaluator": evaluate_agent_endpoint,
        "severity": "critical",
        "title": "Unauthenticated AI agent workflow or MCP endpoint exposed",
        "description": "An AI workflow manager (Flowise / Langflow) or Model Context Protocol (MCP) endpoint is exposed without authentication, allowing callers to inspect agent pipelines or execute tools.",
        "remediation": "Configure FLOWISE_USERNAME / FLOWISE_PASSWORD and require bearer token authentication for all agent tool execution endpoints.",
        "cwe_id": "CWE-306",
        "category": "ai_exposure",
    },
]
