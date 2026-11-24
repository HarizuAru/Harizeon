"""Tests for Harizeon AI-Armor (AIA) pure evaluation engine."""

import unittest
from ai_armor import (
    evaluate_ollama,
    evaluate_vllm,
    evaluate_chroma,
    evaluate_qdrant,
    evaluate_weaviate,
    evaluate_milvus,
    evaluate_agent_endpoint,
    find_leaked_ai_keys_expanded,
    redact_secret,
    AI_CHECKS,
)


class TestAiArmorEvaluators(unittest.TestCase):
    def test_evaluate_ollama(self):
        # Valid Ollama tags response
        valid = {
            "status": 200,
            "body": '{"models":[{"name":"llama3:latest","modified_at":"2026-05-01T00:00:00Z","digest":"sha256:abc12345"}]}',
            "headers": {"content-type": "application/json"},
        }
        self.assertTrue(evaluate_ollama(valid))

        # 404 or missing fields
        self.assertFalse(evaluate_ollama({"status": 404, "body": "Not found", "headers": {}}))
        self.assertFalse(evaluate_ollama({"status": 200, "body": '{"models":[]}', "headers": {}}))

    def test_evaluate_vllm(self):
        valid = {
            "status": 200,
            "body": '{"object":"list","data":[{"id":"mistralai/Mistral-7B-Instruct-v0.2","object":"model"}]}',
            "headers": {"content-type": "application/json"},
        }
        self.assertTrue(evaluate_vllm(valid))
        self.assertFalse(evaluate_vllm({"status": 200, "body": '{"message":"hello"}', "headers": {}}))

    def test_evaluate_chroma(self):
        valid = {
            "status": 200,
            "body": '"0.4.22"',
            "headers": {"content-type": "application/json"},
        }
        self.assertTrue(evaluate_chroma(valid))

        valid_json = {
            "status": 200,
            "body": '{"version":"0.5.1"}',
            "headers": {"content-type": "application/json"},
        }
        self.assertTrue(evaluate_chroma(valid_json))
        self.assertFalse(evaluate_chroma({"status": 200, "body": '{"status":"ok"}', "headers": {}}))

    def test_evaluate_qdrant(self):
        valid = {
            "status": 200,
            "body": '{"result":{"collections":[{"name":"legal_rag_docs"}]},"status":"ok","time":0.001}',
            "headers": {"content-type": "application/json"},
        }
        self.assertTrue(evaluate_qdrant(valid))
        self.assertFalse(evaluate_qdrant({"status": 200, "body": '{"collections":"forbidden"}', "headers": {}}))

    def test_evaluate_weaviate(self):
        valid = {
            "status": 200,
            "body": '{"hostname":"http://[::]:8080","version":"1.24.1","modules":{"text2vec-openai":{}}}',
            "headers": {"content-type": "application/json"},
        }
        self.assertTrue(evaluate_weaviate(valid))
        self.assertFalse(evaluate_weaviate({"status": 200, "body": '{"version":"1.0"}', "headers": {}}))

    def test_evaluate_milvus(self):
        valid_v2 = {
            "status": 200,
            "body": '{"code":200,"data":{"healthy":true}}',
            "headers": {"content-type": "application/json"},
        }
        self.assertTrue(evaluate_milvus(valid_v2))

        valid_v1 = {
            "status": 200,
            "body": '{"status":"ok"}',
            "headers": {"content-type": "application/json"},
        }
        self.assertTrue(evaluate_milvus(valid_v1))
        self.assertFalse(evaluate_milvus({"status": 500, "body": "error", "headers": {}}))

    def test_evaluate_agent_endpoint(self):
        # Flowise / Langflow workflows
        valid_flowise = {
            "status": 200,
            "body": '[{"id":"chat-bot-1","name":"CustomerAgent","nodes":[{"id":"prompt-1"}]}]',
            "headers": {"content-type": "application/json"},
        }
        self.assertTrue(evaluate_agent_endpoint(valid_flowise))

        # Model Context Protocol (MCP) SSE handshake
        valid_mcp_sse = {
            "status": 200,
            "body": "event: endpoint\ndata: /messages?sessionId=abc-123\n\n",
            "headers": {"content-type": "text/event-stream"},
        }
        self.assertTrue(evaluate_agent_endpoint(valid_mcp_sse))
        self.assertFalse(evaluate_agent_endpoint({"status": 200, "body": "<html>Homepage</html>", "headers": {"content-type": "text/html"}}))


class TestAiKeyLeakEngine(unittest.TestCase):
    def test_extract_prefixed_keys(self):
        # OpenAI, Anthropic, Gemini, DeepSeek, Groq, Hugging Face
        # Dynamically constructed synthetic test strings to avoid static scanner false positives
        mock_openai = "sk-proj-" + "".join("abcdefghijklmnopqrstuvwxyz0123456789"[i % 36] for i in range(48))
        mock_anthropic = "sk-ant-api03-" + "".join("abcdefghijklmnopqrstuvwxyz0123456789"[i % 36] for i in range(40))
        mock_gemini = "AIzaSy" + "".join("abcdefghijklmnopqrstuvwxyz0123456789"[i % 36] for i in range(35))
        mock_deepseek = "sk-" + "".join("0123456789abcdef"[i % 16] for i in range(32))
        mock_groq = "gsk_" + "".join("abcdefghijklmnopqrstuvwxyz0123456789"[i % 36] for i in range(45))
        mock_hf = "hf_" + "".join("abcdefghijklmnopqrstuvwxyz0123456789"[i % 36] for i in range(34))

        js = f"""
        const config = {{
            openai: "{mock_openai}",
            anthropic: "{mock_anthropic}",
            google: "{mock_gemini}",
            deepseek: "{mock_deepseek}",
            groq: "{mock_groq}",
            hf: "{mock_hf}",
        }};
        """
        found = find_leaked_ai_keys_expanded(js)
        providers = {provider for _, provider in found}
        self.assertIn("OpenAI", providers)
        self.assertIn("Anthropic", providers)
        self.assertIn("Google Gemini", providers)
        self.assertIn("DeepSeek", providers)
        self.assertIn("Groq", providers)
        self.assertIn("Hugging Face", providers)

    def test_prefixless_keys_require_proximity_guard(self):
        # A raw 32-char hex string (like an MD5 asset hash) without keyword proximity must be IGNORED
        benign_js = """
        const chunkHash = "d41d8cd98f00b204e9800998ecf8427e";
        const sha256Asset = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        """
        self.assertEqual(find_leaked_ai_keys_expanded(benign_js), [])

        # With mistral / together keyword proximity, it should be detected
        leaked_js = """
        const mistral_api_key = "a1b2c3d4e5f6789012345678abcdef01";
        const together_key = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        """
        found = find_leaked_ai_keys_expanded(leaked_js)
        providers = {provider for _, provider in found}
        self.assertIn("Mistral", providers)
        self.assertIn("Together AI", providers)

    def test_redact_secret(self):
        key = "sk-proj-9xK8LmP2qR4sT6vW8yZ0aBcDeFgHiJkLmNoPqRsTuVw"
        redacted = redact_secret(key)
        self.assertTrue(redacted.startswith("sk-proj"))
        self.assertTrue(redacted.endswith("uVw"))
        self.assertIn("…", redacted)
        self.assertNotIn("LmP2qR4sT6vW", redacted)


class TestAiChecksRegistry(unittest.TestCase):
    def test_registry_contains_required_checks(self):
        check_ids = [c["check_id"] for c in AI_CHECKS]
        self.assertIn("ai.exposed_ollama", check_ids)
        self.assertIn("ai.exposed_vllm", check_ids)
        self.assertIn("ai.vector_db_chroma", check_ids)
        self.assertIn("ai.vector_db_qdrant", check_ids)
        self.assertIn("ai.vector_db_weaviate", check_ids)
        self.assertIn("ai.vector_db_milvus", check_ids)
        self.assertIn("ai.unauth_agent_endpoint", check_ids)
        for c in AI_CHECKS:
            self.assertEqual(c["category"], "ai_exposure")
            self.assertIn(c["severity"], ("medium", "high", "critical"))


if __name__ == "__main__":
    unittest.main()
