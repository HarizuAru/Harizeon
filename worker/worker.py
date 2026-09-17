"""Harizeon data-plane scan worker.

Consumes scan jobs from a Redis Stream, walks the profile's phases, and publishes
events + heartbeats + discovered assets. It holds NO database credentials and no
customer secrets (§06.3): its whole world is the queue and the job payload.

env:
  REDIS_URL        default redis://localhost:6379
  WORKER_NAME      default worker-<hostname>
  SCAN_STEP_MS     delay per phase (default 600; tests use 0)
  SCAN_HB_TTL      heartbeat key TTL seconds (default 20)
"""

import json
import os
import signal
import socket
import sys
import time

import redis

import adapters
import discovery
from phases import PHASES, phase_message, planned_phases, progress_for_phase

JOBS_STREAM = "harizeon:scans:jobs"
EVENTS_STREAM = "harizeon:scans:events"
WORKERS_GROUP = "workers"
HB_PREFIX = "harizeon:scan:hb:"
CANCEL_PREFIX = "harizeon:scan:cancel:"

DISCOVERABLE = ("domain", "subdomain")


def ensure_group(r):
    try:
        r.xgroup_create(JOBS_STREAM, WORKERS_GROUP, id="$", mkstream=True)
    except redis.ResponseError as exc:
        if "BUSYGROUP" not in str(exc):
            raise


def publish(r, event):
    r.xadd(EVENTS_STREAM, {k: v for k, v in event.items() if v is not None})


def heartbeat(r, scan_id, ttl):
    r.set(HB_PREFIX + scan_id, "1", ex=ttl)


def is_cancelled(r, scan_id):
    return r.exists(CANCEL_PREFIX + scan_id) == 1


def log(r, scan_id, org_id, phase, message, level="info"):
    publish(r, {
        "scan_id": scan_id, "org_id": org_id, "kind": "event",
        "phase": phase, "level": level, "message": message,
    })


def terminal(r, org_id, scan_id, status, error=None):
    publish(r, {
        "scan_id": scan_id, "org_id": org_id, "kind": "terminal", "status": status,
        "phase": "report", "level": "error" if status == "failed" else "info",
        "message": ("scan %s: %s" % (status, error)) if error else "scan %s" % status,
    })


def run_discovery(r, scan_id, org_id, targets):
    """Discover subdomains for each domain/subdomain target. Returns a count."""
    total = 0
    for target in targets:
        if target.get("type") not in DISCOVERABLE:
            continue
        value = target.get("value", "")
        try:
            result = discovery.discover(value, adapters.http_get, adapters.dns_lookup)
        except Exception as exc:  # noqa: BLE001 - one bad target must not fail the phase
            log(r, scan_id, org_id, "discover", "discovery failed for %s: %s" % (value, exc), "warn")
            continue

        names = result["subdomains"]
        total += len(names)
        records = result["records"]
        log(r, scan_id, org_id, "discover", "discover: %d subdomain(s) for %s" % (len(names), value))
        log(r, scan_id, org_id, "discover", "dns: A=%d AAAA=%d MX=%d NS=%d TXT=%d" % (
            len(records.get("A", [])), len(records.get("AAAA", [])),
            len(records.get("MX", [])), len(records.get("NS", [])),
            len(records.get("TXT", [])),
        ))
        if result["whois"].get("registered"):
            log(r, scan_id, org_id, "discover", "whois: registered %s" % result["whois"]["registered"])
        for entry in names[:5]:
            log(r, scan_id, org_id, "discover", "found %s (%s)" % (entry["fqdn"], entry["source"]))

        publish(r, {
            "scan_id": scan_id, "org_id": org_id, "kind": "discovered",
            "parent_asset_id": target.get("asset_id", ""),
            "discovered": json.dumps(names),
        })
    return total


def process(r, fields, step_ms, hb_ttl):
    scan_id = fields["scan_id"]
    org_id = fields["org_id"]
    profile = fields["profile"]
    attempt = int(fields.get("attempt", "0"))
    targets = json.loads(fields["targets"])

    publish(r, {"scan_id": scan_id, "org_id": org_id, "kind": "status", "status": "claimed", "attempt": attempt})

    discovered_total = 0
    for phase in planned_phases(profile):
        if is_cancelled(r, scan_id):
            terminal(r, org_id, scan_id, "cancelled")
            return
        heartbeat(r, scan_id, hb_ttl)

        if phase == "discover":
            discovered_total = run_discovery(r, scan_id, org_id, targets)
        elif phase == "resolve":
            log(r, scan_id, org_id, "resolve", "resolve: %d hostname(s) resolved" % discovered_total)
        else:
            log(r, scan_id, org_id, phase, phase_message(phase, targets))

        publish(r, {
            "scan_id": scan_id, "org_id": org_id, "kind": "status", "status": "running",
            "phase": phase, "progress_pct": progress_for_phase(phase),
        })
        if step_ms:
            time.sleep(step_ms / 1000.0)

    terminal(r, org_id, scan_id, "completed")


def main():
    url = os.environ.get("REDIS_URL", "redis://localhost:6379")
    step_ms = float(os.environ.get("SCAN_STEP_MS", "600"))
    hb_ttl = int(os.environ.get("SCAN_HB_TTL", "20"))
    consumer = os.environ.get("WORKER_NAME", "worker-%s" % socket.gethostname())

    r = redis.Redis.from_url(url, decode_responses=True)
    ensure_group(r)

    stopping = {"flag": False}

    def stop(_signum, _frame):
        stopping["flag"] = True

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)

    print("worker %s ready (phases=%s)" % (consumer, ",".join(PHASES)), flush=True)
    while not stopping["flag"]:
        resp = r.xreadgroup(WORKERS_GROUP, consumer, {JOBS_STREAM: ">"}, count=1, block=2000)
        if not resp:
            continue
        for _stream, entries in resp:
            for entry_id, fields in entries:
                try:
                    process(r, fields, step_ms, hb_ttl)
                except Exception as exc:  # noqa: BLE001 - one bad job must not kill the worker
                    print("job failed: %s" % exc, file=sys.stderr, flush=True)
                    terminal(r, fields.get("org_id", ""), fields.get("scan_id", ""), "failed", str(exc))
                finally:
                    r.xack(JOBS_STREAM, WORKERS_GROUP, entry_id)
    print("worker %s stopped" % consumer, flush=True)


if __name__ == "__main__":
    main()
