"""Harizeon data-plane scan worker (W04 skeleton).

Consumes scan jobs from a Redis Stream, walks the profile's phases, and publishes
events + heartbeats. It holds NO database credentials and no customer secrets
(§06.3): its whole world is the queue and the job payload.

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

from phases import PHASES, phase_message, planned_phases, progress_for_phase

JOBS_STREAM = "harizeon:scans:jobs"
EVENTS_STREAM = "harizeon:scans:events"
WORKERS_GROUP = "workers"
HB_PREFIX = "harizeon:scan:hb:"
CANCEL_PREFIX = "harizeon:scan:cancel:"


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


def terminal(r, org_id, scan_id, status, error=None):
    publish(
        r,
        {
            "scan_id": scan_id,
            "org_id": org_id,
            "kind": "terminal",
            "status": status,
            "phase": "report",
            "level": "error" if status == "failed" else "info",
            "message": ("scan %s: %s" % (status, error)) if error else "scan %s" % status,
        },
    )


def process(r, fields, step_ms, hb_ttl):
    scan_id = fields["scan_id"]
    org_id = fields["org_id"]
    profile = fields["profile"]
    attempt = int(fields.get("attempt", "0"))
    targets = json.loads(fields["targets"])

    publish(r, {"scan_id": scan_id, "org_id": org_id, "kind": "status", "status": "claimed", "attempt": attempt})

    for phase in planned_phases(profile):
        if is_cancelled(r, scan_id):
            terminal(r, org_id, scan_id, "cancelled")
            return
        heartbeat(r, scan_id, hb_ttl)
        publish(
            r,
            {
                "scan_id": scan_id,
                "org_id": org_id,
                "kind": "event",
                "phase": phase,
                "level": "info",
                "message": phase_message(phase, targets),
            },
        )
        publish(
            r,
            {
                "scan_id": scan_id,
                "org_id": org_id,
                "kind": "status",
                "status": "running",
                "phase": phase,
                "progress_pct": progress_for_phase(phase),
            },
        )
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
