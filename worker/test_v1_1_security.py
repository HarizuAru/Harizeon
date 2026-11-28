"""Mandatory Security & Quality Gates for Harizeon v1.1 (§7.3 Release Spec)."""
import os
import re
from unittest.mock import MagicMock, patch
import pytest

from worker.scope import is_public_ip, verify_ownership
from worker.redact import redact_secrets
from worker.models import ScanJob
from worker.main import execute_full_scan

# 1. SSRF Block Test (§7.3.1)
def test_ssrf_block_private_and_special_ips():
    """Assert is_public_ip() returns False for private, loopback, CGNAT, link-local, and IPv6."""
    blocked_ips = [
        "127.0.0.1",
        "10.0.0.5",
        "172.16.0.1",
        "192.168.1.1",
        "100.64.0.1",
        "169.254.169.254",
        "::1",
    ]
    for ip in blocked_ips:
        assert is_public_ip(ip) is False, f"Expected {ip} to be blocked by SSRF defense"

    # Assert public IPs pass
    assert is_public_ip("1.1.1.1") is True
    assert is_public_ip("8.8.8.8") is True
    assert is_public_ip("93.184.216.34") is True


# 2. Unverified Domain Rejection Test (§7.3.2)
@patch("worker.main.verify_ownership", return_value=False)
@patch("worker.main.discover_subdomains")
def test_unverified_domain_rejection(mock_discover, mock_verify):
    """Assert execute_full_scan() immediately fails at Phase 1 and runs 0 adapters if domain is unverified."""
    mock_redis = MagicMock()
    job = ScanJob(
        scan_id="scn-unverified",
        org_id="org-test",
        asset_id="ast-test",
        target_domain="unverified.example.com",
        verification_token="invalid-token",
        profile="standard",
    )
    execute_full_scan(mock_redis, job)

    # Must emit phase and then failed
    assert mock_redis.xadd.call_count == 2
    failed_call = mock_redis.xadd.call_args_list[1][0][1]
    assert failed_call["type"] == "failed"
    assert failed_call["phase"] == "verify"
    assert "Ownership verification failed" in failed_call["payload"]

    # Must NOT run subfinder or downstream scan adapters
    mock_discover.assert_not_called()


# 3. Secret Redaction Test (§7.3.3)
def test_secret_redaction_masks_raw_tokens():
    """Assert redact_secrets masks leaked API keys and never returns the raw token string."""
    raw_secret = "sk-proj-1234567890abcdef"
    evidence_text = f"OPENAI_API_KEY={raw_secret}"
    redacted = redact_secrets(evidence_text)

    assert "[REDACTED]" in redacted
    assert raw_secret not in redacted
    assert "1234567890abcdef" not in redacted


# 4. Container Hardening Policy Test (§7.3.4)
def test_container_hardening_policy():
    """Verify Dockerfile and docker-compose.yml enforce non-root user, read-only FS, and zero DATABASE_URL."""
    dockerfile_path = os.path.join(os.path.dirname(__file__), "Dockerfile")
    with open(dockerfile_path, "r", encoding="utf-8") as f:
        dockerfile_content = f.read()

    assert "USER scanner" in dockerfile_content
    assert 'ENTRYPOINT ["python", "-m", "worker.main"]' in dockerfile_content

    compose_path = os.path.join(os.path.dirname(__file__), "..", "docker-compose.yml")
    with open(compose_path, "r", encoding="utf-8") as f:
        compose_content = f.read()

    # Worker service block must enforce read_only, cap_drop ALL, and no DATABASE_URL
    worker_section_match = re.search(r"worker:\s*([\s\S]*?)(?=\n\s\s[a-z_]+:|$)", compose_content)
    assert worker_section_match is not None
    worker_section = worker_section_match.group(1)

    assert "read_only: true" in worker_section
    assert "cap_drop:\n      - ALL" in worker_section
    assert "no-new-privileges:true" in worker_section
    assert "DATABASE_URL" not in worker_section, "Worker container MUST NOT have access to DATABASE_URL"


# 5. Cross-Tenant RLS Policy Test (§7.3.5)
def test_cross_tenant_rls_policy():
    """Verify migration 0011 defines RLS isolation on drift_events and asset_snapshots."""
    migration_path = os.path.join(os.path.dirname(__file__), "..", "db", "migrations", "0011_v1_1_evidence_and_drift.sql")
    with open(migration_path, "r", encoding="utf-8") as f:
        migration_sql = f.read()

    assert "ALTER TABLE asset_snapshots ENABLE ROW LEVEL SECURITY;" in migration_sql
    assert "CREATE POLICY asset_snapshots_org_isolation ON asset_snapshots" in migration_sql
    assert "current_setting('harizeon.org_id', true)::uuid" in migration_sql

    assert "ALTER TABLE drift_events ENABLE ROW LEVEL SECURITY;" in migration_sql
    assert "CREATE POLICY drift_events_org_isolation ON drift_events" in migration_sql
