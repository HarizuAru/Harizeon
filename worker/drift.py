from __future__ import annotations
import json
from datetime import datetime, timezone
from typing import Any

try:
    from worker.models import AssetSnapshot
except ImportError:
    from models import AssetSnapshot

def compute_drift_events(
    prev_snapshot: AssetSnapshot | None,
    curr_snapshot: AssetSnapshot,
    scan_id: str,
    org_id: str,
) -> list[dict[str, Any]]:
    """Diff previous and current asset snapshots to generate attack surface drift events."""
    events: list[dict[str, Any]] = []
    now = datetime.now(timezone.utc)

    if prev_snapshot is not None:
        # 1. New Subdomain Detected
        prev_hosts = set(prev_snapshot.hosts)
        for host in curr_snapshot.hosts:
            if host not in prev_hosts:
                events.append({
                    "org_id": org_id,
                    "asset_id": curr_snapshot.asset_id,
                    "scan_id": scan_id,
                    "event_type": "NEW_SUBDOMAIN_DETECTED",
                    "severity": "low",
                    "summary": f"New unannounced host detected: {host}",
                    "details": {"host": host},
                    "created_at": now.isoformat(),
                })

        # 2. New Port Exposed
        prev_ports = prev_snapshot.open_ports or {}
        curr_ports = curr_snapshot.open_ports or {}
        for host, ports in curr_ports.items():
            prev_host_ports = set(prev_ports.get(host, []))
            for p in ports:
                if p not in prev_host_ports:
                    sev = "critical" if p in (21, 22, 23, 3306, 3389, 5432, 6379, 8000, 11434) else "medium"
                    events.append({
                        "org_id": org_id,
                        "asset_id": curr_snapshot.asset_id,
                        "scan_id": scan_id,
                        "event_type": "NEW_PORT_EXPOSED",
                        "severity": sev,
                        "summary": f"New open port {p} exposed on {host}",
                        "details": {"host": host, "port": p},
                        "created_at": now.isoformat(),
                    })

    # 3. Certificate Expiry within 30 days
    for host, exp_str in (curr_snapshot.tls_expiry_iso or {}).items():
        try:
            exp_dt = datetime.fromisoformat(exp_str.replace("Z", "+00:00"))
            days_left = (exp_dt - now).days
            if 0 <= days_left <= 30:
                events.append({
                    "org_id": org_id,
                    "asset_id": curr_snapshot.asset_id,
                    "scan_id": scan_id,
                    "event_type": "TLS_CERT_EXPIRING_SOON",
                    "severity": "high" if days_left <= 7 else "medium",
                    "summary": f"TLS certificate for {host} expires in {days_left} days",
                    "details": {"host": host, "expires_at": exp_str, "days_left": days_left},
                    "created_at": now.isoformat(),
                })
        except Exception:
            pass

    return events
