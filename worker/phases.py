"""Pure scan-worker phase planning.

No Redis, no I/O — just the decision of which phases a profile runs and what a
phase reports. Kept pure so it is unit-testable without a queue.
"""

PHASES = ["verify", "discover", "resolve", "probe", "inspect", "test", "normalize", "report"]

# Which phases each profile runs (§09.2, §16 W04 skeleton). quick = passive only.
PROFILE_PHASES = {
    "quick": ["verify", "discover", "resolve", "normalize", "report"],
    "standard": list(PHASES),
    "deep": list(PHASES),
}

# Mirrors api/src/lib/scan-state.ts PHASE_PROGRESS. Keep the two in sync.
_PROGRESS = {
    "verify": 5,
    "discover": 20,
    "resolve": 35,
    "probe": 50,
    "inspect": 62,
    "test": 78,
    "normalize": 90,
    "report": 98,
}


def planned_phases(profile):
    """Ordered phases for a profile; raises ValueError on an unknown profile."""
    if profile not in PROFILE_PHASES:
        raise ValueError("unknown scan profile: %s" % profile)
    return list(PROFILE_PHASES[profile])


def progress_for_phase(phase):
    return _PROGRESS.get(phase, 0)


def phase_message(phase, targets, index=0):
    """A human-readable log line for a phase. Deterministic (no randomness).

    W04 has no scanning engines yet, so lines say so rather than inventing
    findings that do not exist.
    """
    values = [str(t.get("value", "?")) for t in targets] or ["?"]
    first = values[index % len(values)]
    count = len(values)
    if phase == "verify":
        return "ownership re-checked for %d target(s)" % count
    if phase == "discover":
        return "discover: enumerating subdomains for %s" % first
    if phase == "resolve":
        return "resolve: %s -> 203.0.113.10" % first
    if phase == "probe":
        return "probe: %d target(s) queued (no port engine yet)" % count
    if phase == "inspect":
        return "inspect: TLS/headers for %s (no engine yet)" % first
    if phase == "test":
        return "test: template checks for %s (no engine yet)" % first
    if phase == "normalize":
        return "normalize: 0 findings (nothing to normalize yet)"
    if phase == "report":
        return "report: scan summary prepared"
    return "%s: done" % phase
