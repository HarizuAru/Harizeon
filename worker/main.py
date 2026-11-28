from __future__ import annotations
import json
import os
from datetime import datetime, timezone
import redis

try:
    from worker.models import AssetSnapshot, NormalizedFinding, ScanJob
    from worker.scope import verify_ownership
    from worker.adapters.subfinder import discover_subdomains
    from worker.adapters.dns_email import resolve_and_audit_dns
    from worker.adapters.httpx_adapter import probe_http
    from worker.adapters.tlsx import inspect_tls
    from worker.adapters.nuclei import run_nuclei_checks
    from worker.adapters.mcp_scanner import scan_remote_mcp_servers
except ImportError:
    from models import AssetSnapshot, NormalizedFinding, ScanJob
    from scope import verify_ownership
    from adapters.subfinder import discover_subdomains
    from adapters.dns_email import resolve_and_audit_dns
    from adapters.httpx_adapter import probe_http
    from adapters.tlsx import inspect_tls
    from adapters.nuclei import run_nuclei_checks
    from adapters.mcp_scanner import scan_remote_mcp_servers

JOBS_STREAM = "harizeon:scans:jobs"
EVENTS_STREAM = "harizeon:scans:events"
CONSUMER_GROUP = "workers"

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def emit(r: redis.Redis, scan_id: str, org_id: str, event_type: str, phase: str, payload: dict) -> None:
    """Emit telemetry or results event into Redis stream."""
    r.xadd(EVENTS_STREAM, {
        "scan_id": scan_id,
        "org_id": org_id,
        "type": event_type,  # phase | log | finding | snapshot | verify_result | completed | failed
        "phase": phase,
        "at": now_iso(),
        "payload": json.dumps(payload),
    })

def execute_verify_fix(r: redis.Redis, job: ScanJob) -> None:
    """5-second single-check micro-scan for POST /v1/findings/:id/verify."""
    if not verify_ownership(job.target_domain, job.verification_token, job.verification_method):
        emit(r, job.scan_id, job.org_id, "failed", "verify", {"reason": "Ownership verification failed"})
        return

    still_vulnerable = False
    check_id = job.verify_check_id or ""
    loc = job.verify_location or f"https://{job.target_domain}"

    if check_id.startswith("nuclei:"):
        tpl_id = check_id.split(":", 1)[1]
        base = loc.split("?")[0]
        hits = run_nuclei_checks([base], job.asset_id, "standard", template_id_filter=tpl_id)
        still_vulnerable = len(hits) > 0
    elif check_id.startswith("tls-"):
        _, tls_hits = inspect_tls([job.target_domain], job.asset_id)
        still_vulnerable = any(h.check_id == check_id for h in tls_hits)
    elif check_id == "http-exposed-openapi-spec":
        still_vulnerable = False
        try:
            import urllib.request
            req = urllib.request.Request(loc, headers={"User-Agent": "HarizeonScanner/1.1"})
            with urllib.request.urlopen(req, timeout=4) as resp:
                if resp.status == 200:
                    still_vulnerable = True
        except Exception:
            still_vulnerable = False
    elif check_id.startswith("http-"):
        _, _, _, http_hits = probe_http([job.target_domain], job.asset_id, "quick")
        still_vulnerable = any(h.check_id == check_id for h in http_hits)

    emit(r, job.scan_id, job.org_id, "verify_result", "report", {
        "check_id": check_id,
        "location": loc,
        "fixed": not still_vulnerable,
    })

def execute_full_scan(r: redis.Redis, job: ScanJob) -> None:
    # Phase 1: Verify cryptographic ownership
    emit(r, job.scan_id, job.org_id, "phase", "verify", {"progress_pct": 10})
    if not verify_ownership(job.target_domain, job.verification_token, job.verification_method):
        emit(r, job.scan_id, job.org_id, "failed", "verify", {"reason": "Ownership verification failed"})
        return

    # Phase 2: Discover subdomains
    emit(r, job.scan_id, job.org_id, "phase", "discover", {"progress_pct": 25})
    hosts = discover_subdomains(job.target_domain)

    # Phase 3: Resolve + SSRF scope drop + Email/Takeover checks
    emit(r, job.scan_id, job.org_id, "phase", "resolve", {"progress_pct": 40})
    in_scope_hosts, dns_findings = resolve_and_audit_dns(hosts, job.target_domain, job.asset_id)
    if not in_scope_hosts:
        emit(r, job.scan_id, job.org_id, "failed", "resolve", {"reason": "No public IPs resolved"})
        return

    all_findings: list[NormalizedFinding] = list(dns_findings)

    # Phase 4: Probe HTTP & Ports
    emit(r, job.scan_id, job.org_id, "phase", "probe", {"progress_pct": 55, "hosts": len(in_scope_hosts)})
    live_urls, open_ports, tech_stack, http_findings = probe_http(in_scope_hosts, job.asset_id, job.profile)
    all_findings.extend(http_findings)

    # Phase 5: Inspect TLS
    emit(r, job.scan_id, job.org_id, "phase", "inspect", {"progress_pct": 70, "live_urls": len(live_urls)})
    tls_expiry, tls_findings = inspect_tls(in_scope_hosts, job.asset_id)
    all_findings.extend(tls_findings)

    # Phase 6: Template Webchecks + Shadow-AI / MCP
    emit(r, job.scan_id, job.org_id, "phase", "test", {"progress_pct": 85})
    all_findings.extend(run_nuclei_checks(live_urls, job.asset_id, job.profile))
    if job.profile in ("ai", "deep") and job.mcp_endpoints:
        all_findings.extend(scan_remote_mcp_servers(job.mcp_endpoints, job.target_domain, job.asset_id))

    # Phase 7: Normalize, Deduplicate & Emit Snapshot
    emit(r, job.scan_id, job.org_id, "phase", "normalize", {"progress_pct": 95})
    seen: set[str] = set()
    for finding in all_findings:
        fp = finding.fingerprint
        if fp in seen:
            continue
        seen.add(fp)
        emit(r, job.scan_id, job.org_id, "finding", "normalize", finding.to_event_payload())

    snapshot = AssetSnapshot(
        asset_id=job.asset_id,
        hosts=in_scope_hosts,
        live_urls=live_urls,
        open_ports=open_ports,
        tech_stack=tech_stack,
        tls_expiry_iso=tls_expiry,
    )
    emit(r, job.scan_id, job.org_id, "snapshot", "normalize", snapshot.model_dump())

    # Phase 8: Signal Completion
    emit(r, job.scan_id, job.org_id, "completed", "report", {
        "progress_pct": 100,
        "hosts_scanned": len(in_scope_hosts),
        "unique_findings": len(seen),
    })

def main() -> None:
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    r = redis.Redis.from_url(
        redis_url,
        decode_responses=True,
        socket_timeout=15,
        socket_connect_timeout=5,
    )
    worker_id = os.environ.get("WORKER_ID", f"worker-{os.getpid()}")

    try:
        r.xgroup_create(JOBS_STREAM, CONSUMER_GROUP, id="0", mkstream=True)
    except redis.exceptions.ResponseError as exc:
        if "BUSYGROUP" not in str(exc):
            raise

    while True:
        messages = r.xreadgroup(CONSUMER_GROUP, worker_id, {JOBS_STREAM: ">"}, count=1, block=5000)
        if not messages:
            continue

        for _stream, entries in messages:
            for msg_id, fields in entries:
                try:
                    job = ScanJob.from_stream_fields(fields)
                    if job.mode == "verify_finding":
                        execute_verify_fix(r, job)
                    else:
                        execute_full_scan(r, job)
                except Exception as exc:
                    emit(
                        r,
                        fields.get("scan_id", "unknown"),
                        fields.get("org_id", "unknown"),
                        "failed",
                        "runtime",
                        {"error": str(exc)[:500]},
                    )
                finally:
                    r.xack(JOBS_STREAM, CONSUMER_GROUP, msg_id)

if __name__ == "__main__":
    main()
