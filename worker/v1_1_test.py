"""Tests for Harizeon v1.1 Data Plane Worker and Scanner Adapters."""
import json
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch
import pytest

from worker.redact import redact_secrets
from worker.models import NormalizedFinding, ScanJob, AssetSnapshot
from worker.scope import is_public_ip, is_in_domain_scope, verify_ownership
from worker.drift import compute_drift_events
from worker.adapters.subfinder import discover_subdomains
from worker.adapters.dns_email import resolve_and_audit_dns, TAKEOVER_CNAME_SIGNATURES
from worker.adapters.httpx_adapter import probe_http
from worker.adapters.tlsx import inspect_tls
from worker.adapters.nuclei import run_nuclei_checks
from worker.adapters.mcp_scanner import scan_remote_mcp_servers
from worker.main import execute_verify_fix, execute_full_scan

# --- 1. Secret Redaction Tests ---
class TestSecretRedaction:
    def test_redacts_openai_key(self):
        text = "Found leaked key sk-proj-1234567890abcdef in response"
        redacted = redact_secrets(text)
        assert "[REDACTED]" in redacted
        assert "1234567890abcdef" not in redacted

    def test_redacts_anthropic_key(self):
        text = "ANTHROPIC_API_KEY=sk-ant-api03-abcdef123456"
        redacted = redact_secrets(text)
        assert "[REDACTED]" in redacted
        assert "abcdef123456" not in redacted

    def test_redacts_database_password(self):
        text = "DB_PASSWORD=SuperSecretPass123! in .env file"
        redacted = redact_secrets(text)
        assert "DB_PASSWORD=" in redacted
        assert "[REDACTED]" in redacted
        assert "SuperSecretPass123!" not in redacted

    def test_redacts_aws_access_key(self):
        text = "Disclosed AKIAIOSFODNN7EXAMPLE in bundle"
        redacted = redact_secrets(text)
        assert "[REDACTED]" in redacted
        assert "AKIAIOSFODNN7EXAMPLE" not in redacted

    def test_handles_empty_or_clean_text(self):
        assert redact_secrets("") == ""
        assert redact_secrets("Just a regular response header text") == "Just a regular response header text"

# --- 2. Unified Finding & Snapshot Models Tests ---
class TestModels:
    def test_finding_fingerprint_deterministic(self):
        f1 = NormalizedFinding(
            asset_id="ast-1",
            check_id="tls-weak-cipher",
            source_tool="tlsx",
            title="Weak Cipher Suite",
            severity="medium",
            location="tls://example.com:443",
        )
        f2 = NormalizedFinding(
            asset_id="ast-1",
            check_id="tls-weak-cipher",
            source_tool="tlsx",
            title="Different Title",
            severity="low",
            location="tls://example.com:443",
        )
        assert f1.fingerprint == f2.fingerprint
        assert len(f1.fingerprint) == 64

    def test_finding_to_event_payload_redacts_secrets(self):
        finding = NormalizedFinding(
            asset_id="ast-1",
            check_id="nuclei:exposed-dotenv-file",
            source_tool="nuclei",
            title="Exposed .env",
            severity="critical",
            location="https://example.com/.env",
            evidence="OPENAI_API_KEY=sk-proj-9876543210zyxwvuts",
        )
        payload = finding.to_event_payload()
        assert "[REDACTED]" in payload["evidence"]
        assert "9876543210zyxwvuts" not in payload["evidence"]
        assert payload["fingerprint"] == finding.fingerprint

    def test_scan_job_validation(self):
        job = ScanJob(
            scan_id="scn-001",
            org_id="org-001",
            asset_id="ast-001",
            target_domain="example.com",
            verification_token="hz-verify-token-123456789",
            profile="deep",
            mode="verify_finding",
            verify_check_id="tls-deprecated-protocol",
        )
        assert job.mode == "verify_finding"
        assert job.verify_check_id == "tls-deprecated-protocol"

# --- 3. Scope & SSRF Defense Tests ---
class TestScopeAndSSRF:
    def test_is_public_ip(self):
        assert is_public_ip("8.8.8.8") is True
        assert is_public_ip("1.1.1.1") is True
        assert is_public_ip("10.0.0.1") is False
        assert is_public_ip("192.168.1.1") is False
        assert is_public_ip("127.0.0.1") is False
        assert is_public_ip("169.254.169.254") is False
        assert is_public_ip("100.64.0.1") is False
        assert is_public_ip("not-an-ip") is False

    def test_is_in_domain_scope(self):
        assert is_in_domain_scope("example.com", "example.com") is True
        assert is_in_domain_scope("api.example.com", "example.com") is True
        assert is_in_domain_scope("dev.api.example.com", "example.com") is True
        assert is_in_domain_scope("attacker-example.com", "example.com") is False
        assert is_in_domain_scope("evil.com", "example.com") is False

    def test_verify_ownership_gate(self):
        # Short tokens rejected unconditionally
        assert verify_ownership("example.com", "short", "dns_txt") is False

# --- 4. Perimeter Drift Diff Engine Tests ---
class TestDriftEngine:
    def test_detects_new_subdomain(self):
        prev = AssetSnapshot(
            asset_id="ast-1",
            hosts=["example.com", "api.example.com"],
        )
        curr = AssetSnapshot(
            asset_id="ast-1",
            hosts=["example.com", "api.example.com", "dev-gateway.example.com"],
        )
        events = compute_drift_events(prev, curr, "scn-1", "org-1")
        types = [e["event_type"] for e in events]
        assert "NEW_SUBDOMAIN_DETECTED" in types
        sub_ev = next(e for e in events if e["event_type"] == "NEW_SUBDOMAIN_DETECTED")
        assert sub_ev["details"]["host"] == "dev-gateway.example.com"

    def test_detects_new_open_port(self):
        prev = AssetSnapshot(
            asset_id="ast-1",
            hosts=["example.com"],
            open_ports={"example.com": [80, 443]},
        )
        curr = AssetSnapshot(
            asset_id="ast-1",
            hosts=["example.com"],
            open_ports={"example.com": [80, 443, 8443]},
        )
        events = compute_drift_events(prev, curr, "scn-1", "org-1")
        types = [e["event_type"] for e in events]
        assert "NEW_PORT_EXPOSED" in types
        port_ev = next(e for e in events if e["event_type"] == "NEW_PORT_EXPOSED")
        assert port_ev["details"]["port"] == 8443

    def test_detects_expiring_certificate(self):
        now = datetime.now(timezone.utc)
        exp_10d = (now + timedelta(days=10)).isoformat()
        curr = AssetSnapshot(
            asset_id="ast-1",
            hosts=["example.com"],
            tls_expiry_iso={"example.com": exp_10d},
        )
        events = compute_drift_events(None, curr, "scn-1", "org-1")
        types = [e["event_type"] for e in events]
        assert "TLS_CERT_EXPIRING_SOON" in types

    def test_no_drift_when_identical(self):
        snap = AssetSnapshot(
            asset_id="ast-1",
            hosts=["example.com"],
            open_ports={"example.com": [443]},
        )
        events = compute_drift_events(snap, snap, "scn-1", "org-1")
        assert len(events) == 0

# --- 5. Verify Fix Micro-Scan Tests ---
class TestVerifyFixMicroScan:
    @patch("worker.main.verify_ownership", return_value=True)
    def test_execute_verify_fix_fixed(self, mock_verify):
        mock_redis = MagicMock()
        job = ScanJob(
            scan_id="scn-micro-1",
            org_id="org-1",
            asset_id="ast-1",
            target_domain="example.com",
            verification_token="hz-verify-token-123456789",
            mode="verify_finding",
            verify_check_id="tls-cert-expired",
            verify_location="tls://example.com:443",
        )
        with patch("worker.main.inspect_tls", return_value=({}, [])):
            execute_verify_fix(mock_redis, job)

        assert mock_redis.xadd.called
        call_args = mock_redis.xadd.call_args[0][1]
        assert call_args["type"] == "verify_result"
        payload = json.loads(call_args["payload"])
        assert payload["fixed"] is True
        assert payload["check_id"] == "tls-cert-expired"

    @patch("worker.main.verify_ownership", return_value=False)
    def test_execute_verify_fix_fails_unverified(self, mock_verify):
        mock_redis = MagicMock()
        job = ScanJob(
            scan_id="scn-micro-2",
            org_id="org-1",
            asset_id="ast-1",
            target_domain="example.com",
            verification_token="hz-verify-token-123456789",
            mode="verify_finding",
            verify_check_id="tls-cert-expired",
        )
        execute_verify_fix(mock_redis, job)
        call_args = mock_redis.xadd.call_args[0][1]
        assert call_args["type"] == "failed"

# --- 6. Scanner Adapter Unit Tests ---
class TestScannerAdapters:
    @patch("worker.adapters.subfinder.run_jsonl_tool")
    def test_subfinder_discovery_in_scope(self, mock_tool):
        mock_tool.return_value = MagicMock(records=[
            {"host": "api.example.com"},
            {"host": "staging.example.com"},
            {"host": "malicious.com"},  # Out of scope!
        ])
        subdomains = discover_subdomains("example.com")
        assert "example.com" in subdomains
        assert "api.example.com" in subdomains
        assert "staging.example.com" in subdomains
        assert "malicious.com" not in subdomains

    @patch("worker.adapters.dns_email.run_jsonl_tool")
    def test_dns_email_takeover_detection(self, mock_tool):
        mock_tool.return_value = MagicMock(records=[
            {
                "host": "blog.example.com",
                "a": [],
                "aaaa": [],
                "cname": ["mysite.github.io"],
            }
        ])
        hosts, findings = resolve_and_audit_dns(["blog.example.com"], "example.com", "ast-1")
        takeover = next((f for f in findings if f.check_id == "dns-dangling-cname-takeover"), None)
        assert takeover is not None
        assert "GitHub Pages" in takeover.title
        assert takeover.severity == "high"

    @patch("worker.adapters.httpx_adapter.run_jsonl_tool")
    def test_httpx_missing_headers_and_redirect(self, mock_tool):
        mock_tool.return_value = MagicMock(records=[
            {
                "url": "http://example.com",
                "status_code": 200,
                "header": {},
            },
            {
                "url": "https://example.com",
                "status_code": 200,
                "header": {"server": "nginx"},
            },
        ])
        urls, ports, tech, findings = probe_http(["example.com"], "ast-1")
        check_ids = [f.check_id for f in findings]
        assert "http-no-tls-redirect" in check_ids
        assert "http-missing-security-headers" in check_ids

    @patch("worker.adapters.httpx_adapter.run_jsonl_tool")
    def test_httpx_api_schema_discovery(self, mock_tool):
        mock_tool.side_effect = [
            MagicMock(records=[
                {
                    "url": "https://api.example.com",
                    "status_code": 200,
                    "header": {"content-security-policy": "default-src 'self'"},
                }
            ]),
            MagicMock(records=[
                {
                    "url": "https://api.example.com/openapi.json",
                    "status_code": 200,
                    "content_type": "application/json",
                }
            ]),
        ]
        urls, ports, tech, findings = probe_http(["api.example.com"], "ast-1", profile="api")
        check_ids = [f.check_id for f in findings]
        assert "http-exposed-openapi-spec" in check_ids

    @patch("worker.adapters.tlsx.run_jsonl_tool")
    def test_tlsx_weak_protocol(self, mock_tool):
        mock_tool.return_value = MagicMock(records=[
            {
                "host": "example.com",
                "port": 443,
                "tls_version": "tls10",
                "cipher": "TLS_RSA_WITH_AES_128_CBC_SHA",
            }
        ])
        expiry, findings = inspect_tls(["example.com"], "ast-1")
        weak_finding = next((f for f in findings if f.check_id == "tls-deprecated-protocol"), None)
        assert weak_finding is not None
        assert "tls10" in weak_finding.title
