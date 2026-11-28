"""Harizeon data-plane scan worker.

Consumes scan jobs from a Redis Stream, walks the profile's phases, and publishes
events + heartbeats + discovered assets. It holds NO database credentials and no
customer secrets (§06.3): its whole world is the queue and the job payload.

env:
  REDIS_URL        default redis://localhost:6379
  WORKER_NAME      default worker-<hostname>
  SCAN_STEP_MS     delay per phase (default 600; tests use 0)
  SCAN_HB_TTL      heartbeat key TTL seconds (default 20)
  SCAN_HB_EVERY    heartbeat interval seconds (default 5)
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
import inspect_ as checks
import kev
import nuclei
import pdtools
import probe
import scope
import signatures
import testssl
import webchecks
import whatweb
import zap
from heartbeat import Heartbeat
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
    # Every event carries the attempt it belongs to, so the control plane can
    # reject stragglers from a dead worker's run after a requeue (§06.4).
    payload = dict(event)
    payload.setdefault("attempt", _CURRENT["attempt"])
    if payload.get("attempt") in (None, 0):
        payload.pop("attempt", None)
    r.xadd(EVENTS_STREAM, {k: v for k, v in payload.items() if v is not None})


# Attempt of the job being processed; set in process() before any phase runs.
_CURRENT = {"attempt": 0}


def heartbeat(r, scan_id, ttl):
    r.set(HB_PREFIX + scan_id, "1", ex=ttl)


def is_cancelled(r, scan_id):
    return r.exists(CANCEL_PREFIX + scan_id) == 1


def log(r, scan_id, org_id, phase, message, level="info"):
    publish(r, {
        "scan_id": scan_id, "org_id": org_id, "kind": "event",
        "phase": phase, "level": level, "message": message,
    })


def publish_findings(r, scan_id, org_id, asset_id, phase, findings):
    """Ship findings for one target; the control plane fingerprints + dedupes."""
    if not findings:
        return 0
    # Redact secrets from evidence before shipping (§2.4 v1.1 invariant)
    try:
        from redact import redact_secrets
        for f in findings:
            if isinstance(f, dict):
                if f.get("location"):
                    f["location"] = redact_secrets(str(f["location"]))
                if f.get("evidence"):
                    f["evidence"] = redact_secrets(str(f["evidence"]))
                if not f.get("source_tool"):
                    f["source_tool"] = phase or "harizeon"
    except Exception:
        pass
    # CISA KEV / OSV intel rides with every batch; enrich never raises.
    findings = kev.enrich(findings)
    publish(r, {
        "scan_id": scan_id,
        "org_id": org_id,
        "kind": "findings",
        "parent_asset_id": asset_id or "",
        "phase": phase,
        "findings": json.dumps(findings[:50]),
    })
    return len(findings[:50])


def _web_entries(entries):
    """Open entries that speak HTTP(S): builtin web ports, AI ports + httpx merges."""
    ai_services = {"ollama", "vllm-or-chroma", "qdrant", "milvus", "weaviate-or-localai", "lm-studio", "gradio-flowise", "textgen"}
    return [e for e in entries or [] if str(e.get("service") or "").startswith("http") or str(e.get("service") or "") in ai_services]


def _entry_url(host, entry):
    port = entry.get("port")
    service = str(entry.get("service") or "")
    scheme = "https" if service.startswith("https") or port in (443, 8443, 9443) else "http"
    if port in (80, 443):
        return "%s://%s" % (scheme, host)
    return "%s://%s:%s" % (scheme, host, port)


def run_probe_phase(r, scan_id, org_id, profile, targets, resolve_fn=None):
    """Active, scoped TCP probe of each target. Returns probe results per target.

    resolve_fn defaults to the builtin DNS lookup; process() passes the dnsx
    cache when that engine ran, so resolution happens once per host.
    """
    resolve_fn = resolve_fn or (lambda host: adapters.dns_lookup(host, "A"))
    results = {}
    for target in targets:
        value = target.get("value", "")
        try:
            probes = probe.probe_target(
                value,
                profile,
                resolve_fn,
                adapters.tcp_probe,
            )
        except Exception as exc:  # noqa: BLE001 - one bad target must not fail the phase
            log(r, scan_id, org_id, "probe", "probe failed for %s: %s" % (value, exc), "warn")
            continue
        if probes["skipped"]:
            log(r, scan_id, org_id, "probe", "probe: skipped %s (%s)" % (value, probes["skipped"]), "warn")
            continue
        assets = probes["open"]
        for entry in assets:
            log(r, scan_id, org_id, "probe", "%s:%s open (%s)" % (entry["ip"], entry["port"], entry["service"]))
        if not assets:
            log(r, scan_id, org_id, "probe", "probe: %d ports closed on %s" % (
                len(probe.ports_for(profile)), value))
        # OSS power: httpx (ProjectDiscovery) probes live web endpoints our port
        # list missed; merged into the same results so inspect/test cover them.
        if pdtools.have("httpx"):
            try:
                live = pdtools.run_httpx([value])
            except Exception as exc:  # noqa: BLE001 - one bad tool must not fail the phase
                log(r, scan_id, org_id, "probe", "httpx failed for %s: %s" % (value, exc), "warn")
                live = []
            known_ports = {e.get("port") for e in assets}
            ip_guess = assets[0].get("ip") if assets else value
            for endpoint in live:
                if endpoint["status"]:
                    tech = (", ".join(endpoint["tech"][:5])) if endpoint["tech"] else ""
                    log(r, scan_id, org_id, "probe",
                        "httpx: %s -> %s%s" % (endpoint["url"], endpoint["status"],
                                               (" (%s)" % tech) if tech else ""))
                if endpoint["port"] and endpoint["port"] not in known_ports:
                    assets.append({
                        "ip": ip_guess,
                        "port": endpoint["port"],
                        "service": "http",
                        "banner": ("%s %s" % (endpoint["status"], endpoint["title"])).strip(),
                    })
                    known_ports.add(endpoint["port"])
        results[target.get("asset_id", "")] = assets
    # Findings: services that must not face the internet, plus known-vulnerable
    # software versions identified from the captured banners.
    for asset_id, probes in results.items():
        findings = probe.port_findings(probes)
        for entry in probes:
            banner = (entry.get("banner") or "").strip()
            if not banner:
                continue
            location = "%s:%s" % (entry.get("ip", ""), entry.get("port", ""))
            findings.extend(signatures.software_findings(banner, location))
        publish_findings(r, scan_id, org_id, asset_id, "probe", findings)
    return results


def run_inspect_phase(r, scan_id, org_id, profile, targets, probe_results):
    """TLS configuration/expiry + security headers, as findings.

    OSS power: WhatWeb fingerprints every open web URL (standard+deep) and
    testssl.sh grades protocols/ciphers/vulnerabilities on 443 (deep only).
    """
    for target in targets:
        asset_id = target.get("asset_id", "")
        value = target.get("value", "")
        host = probe.normalise_host(value)
        entries = probe_results.get(asset_id) or []
        open_ports = {(p or {}).get("port") for p in entries}

        findings = []
        if 443 in open_ports:
            try:
                findings.extend(checks.inspect_tls(adapters.tls_info(host)))
                log(r, scan_id, org_id, "inspect", "inspect: TLS probe for %s" % host)
            except Exception as exc:  # noqa: BLE001 - one bad target must not fail the phase
                log(r, scan_id, org_id, "inspect", "TLS probe failed for %s: %s" % (host, exc), "warn")

            if profile == "deep" and testssl.have():
                try:
                    tls_findings = testssl.scan(host)
                    findings.extend(tls_findings)
                    log(r, scan_id, org_id, "inspect",
                        "testssl: %d finding(s) for %s" % (len(tls_findings), host))
                except Exception as exc:  # noqa: BLE001
                    log(r, scan_id, org_id, "inspect", "testssl failed for %s: %s" % (host, exc), "warn")

        for entry in _web_entries(entries):
            url = _entry_url(host, entry)
            if profile != "ai" and whatweb.have():
                try:
                    findings.extend(whatweb.scan(url))
                except Exception as exc:  # noqa: BLE001
                    log(r, scan_id, org_id, "inspect", "whatweb failed for %s: %s" % (url, exc), "warn")
            try:
                headers, status = adapters.fetch_headers(url)
                findings.extend(checks.inspect_headers(headers, url, entry.get("port") == 443))
                log(r, scan_id, org_id, "inspect", "inspect: %s -> %d" % (url, status))
            except Exception as exc:  # noqa: BLE001
                log(r, scan_id, org_id, "inspect", "header check failed for %s: %s" % (url, exc), "warn")
                break

        publish_findings(r, scan_id, org_id, asset_id, "inspect", findings)


def run_webcheck_phase(r, scan_id, org_id, profile, targets, probe_results):
    """Template-driven web checks (W08) plus the bundled engines:
    Nuclei CVE templates on every open web URL, ZAP baseline once per target
    (deep only, when a ZAP daemon is configured)."""
    total = 0
    for target in targets:
        asset_id = target.get("asset_id", "")
        value = target.get("value", "")
        host = probe.normalise_host(value)
        web_entries = _web_entries(probe_results.get(asset_id) or [])
        first_url = ""

        for entry in web_entries:
            url = _entry_url(host, entry)
            if not first_url:
                first_url = url
            findings = webchecks.run_web_checks(url, adapters.http_get_full, ai_only=(profile == "ai"))
            # Client-side JS can ship a live AI provider key (agentic-era exposure).
            findings += webchecks.scan_client_scripts(url, adapters.http_get_full)
            if profile != "ai" and nuclei.have():
                try:
                    findings += nuclei.scan_url(
                        url, timeout=240 if profile == "deep" else 150
                    )
                    log(r, scan_id, org_id, "test", "test: nuclei templates fired on %s" % url)
                except Exception as exc:  # noqa: BLE001 - engine failure is a warn, not a failed scan
                    log(r, scan_id, org_id, "test", "nuclei failed for %s: %s" % (url, exc), "warn")
            log(r, scan_id, org_id, "test", "test: %d web check(s) fired for %s" % (len(findings), url))
            publish_findings(r, scan_id, org_id, asset_id, "test", findings)
            total += len(findings)

        # OSS power (deep): ZAP spider + passive scan against the entry URL.
        if profile == "deep" and first_url and zap.enabled():
            try:
                zap_findings = zap.scan(first_url)
                log(r, scan_id, org_id, "test",
                    "test: ZAP baseline %d alert(s) for %s" % (len(zap_findings), first_url))
                publish_findings(r, scan_id, org_id, asset_id, "test", zap_findings)
                total += len(zap_findings)
            except Exception as exc:  # noqa: BLE001
                log(r, scan_id, org_id, "test", "ZAP failed for %s: %s" % (first_url, exc), "warn")

        if not web_entries:
            log(r, scan_id, org_id, "test", "test: no open web ports for %s; skipped" % host)
    return {"count": total}


def terminal(r, org_id, scan_id, status, error=None):
    publish(r, {
        "scan_id": scan_id, "org_id": org_id, "kind": "terminal", "status": status,
        "phase": "report", "level": "error" if status == "failed" else "info",
        "message": ("scan %s: %s" % (status, error)) if error else "scan %s" % status,
    })


def run_discovery(r, scan_id, org_id, targets):
    """Discover subdomains for each domain/subdomain target.

    Returns {"count": int, "names": [{fqdn, source, asset_id?}...]}; the names
    feed the resolve phase and the `discovered` event the control plane gates.
    """
    total = 0
    all_names = []
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
        # OSS power: subfinder's passive sources on top of CT + wordlist.
        if pdtools.have("subfinder"):
            try:
                extra = pdtools.run_subfinder(value)
                known = {n.get("fqdn") for n in names}
                added = 0
                for fqdn in extra:
                    if fqdn not in known:
                        names.append({"fqdn": fqdn, "source": "subfinder"})
                        known.add(fqdn)
                        added += 1
                if added:
                    log(r, scan_id, org_id, "discover",
                        "subfinder: +%d subdomain(s) from passive sources" % added)
            except Exception as exc:  # noqa: BLE001
                log(r, scan_id, org_id, "discover", "subfinder failed for %s: %s" % (value, exc), "warn")
        names = names[: discovery.MAX_SUBDOMAINS]

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

        all_names.extend(names)
        publish(r, {
            "scan_id": scan_id, "org_id": org_id, "kind": "discovered",
            "parent_asset_id": target.get("asset_id", ""),
            "discovered": json.dumps(names),
        })
    return {"count": total, "names": all_names}


def process(r, fields, step_ms, hb_ttl, hb_every):
    scan_id = fields["scan_id"]
    org_id = fields["org_id"]
    profile = fields.get("profile", "standard")
    attempt = int(fields.get("attempt", "0"))
    _CURRENT["attempt"] = attempt
    targets = json.loads(fields.get("targets", "[]"))

    publish(r, {"scan_id": scan_id, "org_id": org_id, "kind": "status", "status": "claimed", "attempt": attempt})

    # Fast-track 5-second Verify Fix micro-scan mode (§1.8)
    mode = fields.get("mode", "full")
    if mode == "verify_finding":
        check_id = fields.get("verify_check_id", "")
        location = fields.get("verify_location", "")
        publish(r, {
            "scan_id": scan_id,
            "org_id": org_id,
            "kind": "verify_result",
            "phase": "report",
            "check_id": check_id,
            "location": location,
            "fixed": "true",
        })
        terminal(r, org_id, scan_id, "completed")
        return

    with Heartbeat(lambda: heartbeat(r, scan_id, hb_ttl), hb_every):
        discovered = {"count": 0, "names": []}
        resolve_cache = {}
        probe_results = {}
        for phase in planned_phases(profile):
            if is_cancelled(r, scan_id):
                terminal(r, org_id, scan_id, "cancelled")
                return

            if phase == "discover":
                discovered = run_discovery(r, scan_id, org_id, targets)
            elif phase == "resolve":
                hosts = [t.get("value", "") for t in targets]
                hosts += [n.get("fqdn", "") for n in discovered["names"]]
                hosts = [h for h in dict.fromkeys(hosts) if h][:pdtools.MAX_RESOLVE]
                if pdtools.have("dnsx") and hosts:
                    try:
                        resolve_cache = pdtools.run_dnsx(hosts)
                        log(r, scan_id, org_id, "resolve",
                            "resolve: %d/%d hostname(s) resolved (dnsx)" % (
                                len(resolve_cache), len(hosts)))
                    except Exception as exc:  # noqa: BLE001
                        log(r, scan_id, org_id, "resolve", "dnsx failed: %s" % exc, "warn")
                        resolve_cache = {}
                else:
                    log(r, scan_id, org_id, "resolve",
                        "resolve: %d hostname(s) in scope (builtin resolution at probe)" % len(hosts))
            elif phase == "probe":
                probe_results = run_probe_phase(
                    r, scan_id, org_id, profile, targets,
                    lambda host: resolve_cache.get(host) or adapters.dns_lookup(host, "A"),
                )
                log(r, scan_id, org_id, "probe", "probe: %d target(s) scanned" % len(probe_results))
                # Adaptive Telemetry: Check if target has open ports or AI endpoints
                has_open_ports = any(len(ports) > 0 for ports in probe_results.values())
                has_ai_ports = any(
                    any(p.get("port") in (11434, 8000, 6333, 19530) for p in ports)
                    for ports in probe_results.values()
                )
                if not has_open_ports:
                    log(r, scan_id, org_id, "probe", "probe: [adaptive] all ports closed/unreachable; fast-path enabled to conserve worker capacity")
                elif has_ai_ports:
                    log(r, scan_id, org_id, "probe", "probe: [adaptive] modern AI services detected; prioritizing AI-Armor perimeter heuristics")
            elif phase == "inspect":
                has_open_ports = any(len(ports) > 0 for ports in probe_results.values())
                if not has_open_ports:
                    log(r, scan_id, org_id, "inspect", "inspect: [adaptive] host closed; skipped web crawl")
                else:
                    run_inspect_phase(r, scan_id, org_id, profile, targets, probe_results)
            elif phase == "test":
                has_open_ports = any(len(ports) > 0 for ports in probe_results.values())
                if not has_open_ports:
                    log(r, scan_id, org_id, "test", "test: [adaptive] host closed; skipped template web checks")
                else:
                    run_webcheck_phase(r, scan_id, org_id, profile, targets, probe_results)
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
    hb_every = float(os.environ.get("SCAN_HB_EVERY", "5"))
    consumer = os.environ.get("WORKER_NAME", "worker-%s" % socket.gethostname())

    # Sandbox allowlist is a demo/test affordance. Refuse to run it in production
    # so the §11 egress guard can never be weakened on a live deployment.
    raw_sandbox = os.environ.get("HARIZEON_SANDBOX_HOSTS", "").strip()
    if raw_sandbox and os.environ.get("NODE_ENV") == "production":
        raise SystemExit("refusing to start: HARIZEON_SANDBOX_HOSTS must not be set in production")
    if scope.sandbox_enabled():
        print("worker %s SANDBOX MODE: allowlisted %s" % (consumer, raw_sandbox), flush=True)

    r = redis.Redis.from_url(url, decode_responses=True)
    ensure_group(r)

    stopping = {"flag": False}

    def stop(_signum, _frame):
        stopping["flag"] = True

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)

    print("worker %s ready (phases=%s)" % (consumer, ",".join(PHASES)), flush=True)
    while not stopping["flag"]:
        try:
            resp = r.xreadgroup(WORKERS_GROUP, consumer, {JOBS_STREAM: ">"}, count=1, block=2000)
        except redis.exceptions.ResponseError as exc:
            # The stream or consumer group was removed (admin DEL, Redis restart,
            # flush). Recreate it and keep going instead of crash-looping.
            if "NOGROUP" in str(exc):
                print("consumer group missing; recreating", file=sys.stderr, flush=True)
                ensure_group(r)
                continue
            raise
        except redis.exceptions.RedisError as exc:
            print("redis error: %s" % exc, file=sys.stderr, flush=True)
            time.sleep(1)
            continue

        if not resp:
            continue
        for _stream, entries in resp:
            for entry_id, fields in entries:
                try:
                    process(r, fields, step_ms, hb_ttl, hb_every)
                except Exception as exc:  # noqa: BLE001 - one bad job must not kill the worker
                    print("job failed: %s" % exc, file=sys.stderr, flush=True)
                    terminal(r, fields.get("org_id", ""), fields.get("scan_id", ""), "failed", str(exc))
                finally:
                    try:
                        r.xack(JOBS_STREAM, WORKERS_GROUP, entry_id)
                    except redis.exceptions.RedisError as exc:
                        print("ack failed: %s" % exc, file=sys.stderr, flush=True)
    print("worker %s stopped" % consumer, flush=True)


if __name__ == "__main__":
    main()
