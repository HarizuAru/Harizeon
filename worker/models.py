from __future__ import annotations
import hashlib
import json
from typing import Any, Literal
from pydantic import BaseModel, Field, model_validator

try:
    from worker.redact import redact_secrets
except ImportError:
    from redact import redact_secrets

Severity = Literal["critical", "high", "medium", "low", "info"]
ScanProfile = Literal["quick", "standard", "deep", "ai", "api"]

class ScanJob(BaseModel):
    scan_id: str
    org_id: str
    asset_id: str = ""
    target_domain: str = ""
    verification_token: str = ""
    verification_method: Literal["dns_txt", "http_file"] = "dns_txt"
    profile: ScanProfile = "standard"
    attempt: int = 0
    targets: list[dict[str, Any]] = Field(default_factory=list)
    mode: Literal["full", "verify_finding"] = "full"
    verify_check_id: str | None = None
    verify_location: str | None = None
    mcp_endpoints: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def _populate_primary_target(self) -> ScanJob:
        if self.targets:
            primary = self.targets[0]
            if not self.asset_id and primary.get("asset_id"):
                self.asset_id = str(primary["asset_id"])
            if not self.target_domain and primary.get("value"):
                self.target_domain = str(primary["value"])
            if not self.verification_token and primary.get("verification_token"):
                self.verification_token = str(primary["verification_token"])
            method = primary.get("verification_method")
            if method in ("dns_txt", "http_file"):
                self.verification_method = method
        return self

    @classmethod
    def from_stream_fields(cls, fields: dict[str, str]) -> ScanJob:
        """Accept either legacy JSON `data` blob or control-plane flat stream maps."""
        if "data" in fields:
            return cls.model_validate_json(fields["data"])
        parsed: dict[str, Any] = dict(fields)
        for json_key in ("targets", "mcp_endpoints"):
            raw = parsed.get(json_key)
            if isinstance(raw, str):
                parsed[json_key] = json.loads(raw)
        return cls.model_validate(parsed)

class NormalizedFinding(BaseModel):
    asset_id: str
    check_id: str
    source_tool: str
    title: str
    severity: Severity
    location: str
    evidence: str = ""
    cwe_id: str | None = None
    cve_ids: list[str] = Field(default_factory=list)
    remediation: str = ""
    remediation_snippets: dict[str, str] = Field(default_factory=dict)
    raw_meta: dict[str, Any] = Field(default_factory=dict)

    @property
    def fingerprint(self) -> str:
        raw = f"{self.asset_id}:{self.check_id}:{self.location}".encode("utf-8")
        return hashlib.sha256(raw).hexdigest()

    def to_event_payload(self) -> dict[str, Any]:
        data = self.model_dump()
        data["location"] = redact_secrets(self.location)
        data["evidence"] = redact_secrets(self.evidence)
        data["fingerprint"] = self.fingerprint
        return data

class AssetSnapshot(BaseModel):
    asset_id: str
    hosts: list[str] = Field(default_factory=list)
    live_urls: list[str] = Field(default_factory=list)
    open_ports: dict[str, list[int]] = Field(default_factory=dict)
    tech_stack: dict[str, list[str]] = Field(default_factory=dict)
    tls_expiry_iso: dict[str, str] = Field(default_factory=dict)
