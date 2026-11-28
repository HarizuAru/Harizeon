"""Executable Worker Security Regression Suite (Audit Checklist §4.3)."""
import os
from unittest.mock import MagicMock, patch
import pytest

from worker.scope import is_public_ip, is_in_domain_scope
from worker.redact import redact_secrets
from worker.models import NormalizedFinding, ScanJob
from worker.main import execute_full_scan
from worker.adapters.base import SAFE_ENV


@pytest.mark.parametrize("blocked_ip", [
    "127.0.0.1",
    "10.0.0.1",
    "172.16.0.10",
    "192.168.1.1",
    "100.64.0.1",        # RFC 6598 CGNAT
    "169.254.169.254",   # AWS/GCP/Azure Cloud Metadata
    "0.0.0.0",
    "::1",
    "fc00::1",           # IPv6 Unique Local
    "fe80::1",           # IPv6 Link-Local
])
def test_ssrf_blocks_non_public_ips(blocked_ip: str):
    assert is_public_ip(blocked_ip) is False


def test_public_ip_allowed():
    assert is_public_ip("1.1.1.1") is True
    assert is_public_ip("93.184.216.34") is True


def test_domain_scope_blocks_lookalikes():
    assert is_in_domain_scope("api.harizeon.com", "harizeon.com") is True
    assert is_in_domain_scope("evilharizeon.com", "harizeon.com") is False
    assert is_in_domain_scope("harizeon.com.evil.tld", "harizeon.com") is False


def test_secret_redaction_masks_credentials():
    raw = "OPENAI_API_KEY=sk-proj-abc1234567890xyz987654\nDB_PASSWORD=SuperSecretPass123!"
    redacted = redact_secrets(raw)
    assert "sk-proj-abc1234567890xyz987654" not in redacted
    assert "SuperSecretPass123!" not in redacted
    assert "[REDACTED]" in redacted


def test_secret_redaction_masks_extended_tokens_pems_and_uris():
    ghp = "ghp_" + "1234567890abcdefghijklmnopqrstuvwxyz"
    gh_pat = "github_pat_" + "11ABCDEFG0123456789_abcdefghijklmnop"
    slack = "xoxb-" + "123456789012-" + "1234567890123-" + "abcdefghijklmnopqrstuvwx"
    jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
    pem = "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAsecretkeymaterial\n-----END RSA PRIVATE KEY-----"
    uri = "https://deploy:SuperSecretUriPass99@git.example.com/repo.git"

    for raw_secret in (ghp, gh_pat, slack, jwt, "MIIEowIBAAKCAQEAsecretkeymaterial", "SuperSecretUriPass99"):
        sample = {
            ghp: ghp,
            gh_pat: gh_pat,
            slack: slack,
            jwt: jwt,
            "MIIEowIBAAKCAQEAsecretkeymaterial": pem,
            "SuperSecretUriPass99": uri,
        }[raw_secret]
        cleaned = redact_secrets(sample)
        assert raw_secret not in cleaned
        assert "[REDACTED]" in cleaned


def test_normalized_finding_payload_redacts_location_and_evidence():
    finding = NormalizedFinding(
        asset_id="ast-1",
        check_id="http.exposed_secret",
        source_tool="nuclei",
        title="Leaked credentialed repository URL",
        severity="high",
        location="https://ci-bot:ghp_1234567890abcdefghijklmnopqrstuvwxyz@git.example.com/.env",
        evidence="Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4ifQ.signatureTokenValueHere",
    )
    payload = finding.to_event_payload()
    assert "ghp_1234567890abcdefghijklmnopqrstuvwxyz" not in payload["location"]
    assert "[REDACTED]" in payload["location"]
    assert "signatureTokenValueHere" not in payload["evidence"]
    assert "[REDACTED]" in payload["evidence"]


def test_docker_compose_enforces_redis_acl_users():
    compose_path = os.path.join(os.path.dirname(__file__), "..", "..", "docker-compose.yml")
    with open(compose_path, "r", encoding="utf-8") as f:
        compose = f.read()
    assert "--aclfile" in compose
    assert "/usr/local/etc/redis/users.acl" in compose
    assert "redis://harizeon_api:" in compose
    assert "redis://harizeon_worker:" in compose


def test_subprocess_env_contains_no_secrets():
    for forbidden in ("DATABASE_URL", "REDIS_URL", "AWS_SECRET_ACCESS_KEY", "API_KEY"):
        assert forbidden not in SAFE_ENV


def test_dockerfile_pins_exact_tool_versions():
    dockerfile_path = os.path.join(os.path.dirname(__file__), "..", "Dockerfile")
    with open(dockerfile_path, "r", encoding="utf-8") as f:
        dockerfile_content = f.read()
    assert "@latest" not in dockerfile_content, "Worker Dockerfile must pin exact binary tags, never @latest"
    assert "USER scanner" in dockerfile_content


def test_scanjob_contract_accepts_api_profile_and_stream_fields():
    job = ScanJob.from_stream_fields({
        "scan_id": "scn-api-1",
        "org_id": "11111111-1111-1111-1111-111111111111",
        "profile": "api",
        "attempt": "0",
        "targets": '[{"asset_id": "ast-1", "type": "domain", "value": "api.example.com", "verification_token": "tok_0123456789abcdef", "verification_method": "http_file"}]',
    })
    assert job.profile == "api"
    assert job.asset_id == "ast-1"
    assert job.target_domain == "api.example.com"
    assert job.verification_token == "tok_0123456789abcdef"
    assert job.verification_method == "http_file"


def test_http_verification_path_standardized():
    scope_path = os.path.join(os.path.dirname(__file__), "..", "scope.py")
    with open(scope_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "/.well-known/harizeon-verification.txt" in content
    assert "/.well-known/harizeon-verify.txt" not in content


def test_unverified_domain_aborts_before_any_adapter_runs():
    fake_redis = MagicMock()
    job = ScanJob(
        scan_id="scan-1",
        org_id="org-1",
        asset_id="asset-1",
        target_domain="unverified.example.my",
        verification_token="tok_valid_length_1234567890",
        verification_method="dns_txt",
    )

    with patch("worker.main.verify_ownership", return_value=False), \
         patch("worker.main.discover_subdomains") as mock_discover, \
         patch("worker.main.probe_http") as mock_probe:
        execute_full_scan(fake_redis, job)
        mock_discover.assert_not_called()
        mock_probe.assert_not_called()

    events = [call.args[1]["type"] for call in fake_redis.xadd.call_args_list]
    assert "failed" in events
    assert "completed" not in events
