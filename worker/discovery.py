"""Passive discovery for the scan worker.

Everything here is pure logic with injected I/O (`http_get`, `dns_lookup`) so it
can be unit-tested without touching the network. The concrete adapters live in
adapters.py; worker.py wires them to the discover/resolve phases.

Sources (§06.5): certificate transparency (crt.sh) + a small DNS wordlist for
subdomains, DNS records for the root, and RDAP (the JSON successor to WHOIS).
"""

import json
import re
import time

MAX_SUBDOMAINS = 200
# Bounds so one huge/slow domain cannot tie a worker up for minutes.
MAX_RESOLUTIONS = 80
RESOLVE_BUDGET_SECONDS = 30.0

COMMON_SUBDOMAINS = [
    "www", "api", "app", "dev", "staging", "test", "admin", "mail", "smtp", "imap",
    "pop", "ns1", "ns2", "cdn", "static", "assets", "blog", "shop", "store",
    "portal", "dashboard", "docs", "support", "help", "git", "gitlab", "jenkins",
    "vpn", "remote", "ftp", "cpanel", "webmail", "mx", "db", "redis", "monitor",
    "status", "ci", "beta", "demo",
]

# Words teams really name environments with (§06.5). Mutation discovery is the
# classic complement to CT logs: it finds hosts that were never certified.
PERMUTATION_WORDS = [
    "dev", "staging", "stage", "uat", "test", "qa", "prod", "internal",
    "intranet", "corp", "old", "new", "legacy", "backup", "sso", "auth",
    "vpn", "admin", "demo", "beta", "alpha", "pilot", "sandbox", "internal2",
]

PERMUTATION_PATTERNS = ("%s.%s.%s", "%s-%s.%s", "%s-%s.%s")  # dev.api | api-dev | dev-api
MAX_PERMUTATIONS = 400

_LABEL = r"[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?"
_NAME_RE = re.compile(r"^(%s\.)+%s$" % (_LABEL, _LABEL))
_LABEL_ONLY_RE = re.compile(r"^%s$" % _LABEL)


def normalise_domain(domain):
    d = (domain or "").strip().lower()
    d = re.sub(r"^https?://", "", d)
    d = d.split("/")[0].split(":")[0]
    return d.rstrip(".")


def is_subdomain(name, domain):
    """True only for a strict, well-formed subdomain of `domain`."""
    if not name or not domain or name == domain:
        return False
    if not name.endswith("." + domain):
        return False
    return bool(_NAME_RE.match(name))


def parse_ct_names(payload, domain):
    """crt.sh JSON -> set of unique subdomains of `domain`. Tolerates bad input."""
    out = set()
    try:
        rows = json.loads(payload)
    except (ValueError, TypeError):
        return out
    if not isinstance(rows, list):
        return out
    for row in rows:
        if not isinstance(row, dict):
            continue
        raw = str(row.get("name_value", ""))
        for token in raw.replace(",", "\n").split():
            name = token.strip().lower().rstrip(".")
            if name.startswith("*."):
                name = name[2:]
            if is_subdomain(name, domain):
                out.add(name)
    return out


def _vcard_fn(vcard):
    try:
        for item in vcard[1]:
            if item[0] == "fn":
                return item[3]
    except (IndexError, TypeError):
        pass
    return None


def parse_rdap(payload):
    """RDAP JSON -> {registered, registrar} (best-effort)."""
    try:
        data = json.loads(payload)
    except (ValueError, TypeError):
        return {}
    if not isinstance(data, dict):
        return {}
    whois = {}
    for event in data.get("events") or []:
        if isinstance(event, dict) and event.get("eventAction") == "registration":
            whois["registered"] = event.get("eventDate")
    for entity in data.get("entities") or []:
        if isinstance(entity, dict) and "registrar" in (entity.get("roles") or []):
            whois["registrar"] = _vcard_fn(entity.get("vcardArray") or [])
    return whois


def permutation_candidates(domain, known_subdomains, max_candidates=MAX_PERMUTATIONS):
    """Naming-pattern mutations of known subdomains (dev.api, api-dev, devapi…).

    Pure and bounded: the caller resolves these through the same budgeted loop
    as every other candidate, so a large CT set cannot stall the worker.
    """
    domain = normalise_domain(domain)
    if not domain:
        return []
    labels = set()
    for name in known_subdomains or ():
        label = (name or "").split(".")[0]
        if label and len(label) <= 24 and _LABEL_ONLY_RE.match(label):
            labels.add(label)
    if not labels:
        return []
    out = set()
    for label in sorted(labels):
        for word in PERMUTATION_WORDS:
            if word == label:
                continue
            out.add("%s.%s.%s" % (word, label, domain))
            out.add("%s-%s.%s" % (word, label, domain))
            out.add("%s-%s.%s" % (label, word, domain))
    return sorted(out)[:max_candidates]


def candidate_subdomains(domain, ct_names):
    """Priority-ordered candidates: CT findings first, then the wordlist, then
    mutations of known names within the remaining budget — so a large mutation
    set can never displace real certificate data."""
    ct = sorted(set(ct_names))
    wordlist = ["%s.%s" % (label, domain) for label in COMMON_SUBDOMAINS]
    perms = permutation_candidates(domain, ct_names)
    seen = set()
    out = []
    for name in ct + wordlist + perms:
        if name not in seen:
            seen.add(name)
            out.append(name)
    return out[:MAX_SUBDOMAINS]


def discover(domain, http_get, dns_lookup, max_resolutions=MAX_RESOLUTIONS, budget_seconds=RESOLVE_BUDGET_SECONDS):
    """Return {"domain", "records", "whois", "subdomains"}. Never raises.

    http_get(url) -> (status:int, body:str)
    dns_lookup(name, rtype) -> list[str]   (rtype in A/AAAA/MX/NS/TXT)

    Candidate resolution is bounded by `max_resolutions` and a wall-clock budget
    so a domain with hundreds of CT entries cannot stall the worker.
    """
    domain = normalise_domain(domain)
    result = {"domain": domain, "records": {}, "whois": {}, "subdomains": []}
    if not domain:
        return result

    for rtype in ("A", "AAAA", "MX", "NS", "TXT"):
        try:
            result["records"][rtype] = dns_lookup(domain, rtype)
        except Exception:  # noqa: BLE001 - a missing record type is normal
            result["records"][rtype] = []

    ct_names = set()
    try:
        status, body = http_get("https://crt.sh/?q=%25." + domain + "&output=json")
        if status == 200:
            ct_names = parse_ct_names(body, domain)
    except Exception:  # noqa: BLE001
        pass

    try:
        status, body = http_get("https://rdap.org/domain/" + domain)
        if status == 200:
            result["whois"] = parse_rdap(body)
    except Exception:  # noqa: BLE001
        pass

    found = []
    perms = set(permutation_candidates(domain, ct_names))
    started = time.monotonic()
    resolutions = 0
    for name in candidate_subdomains(domain, ct_names):
        if resolutions >= max_resolutions or (time.monotonic() - started) > budget_seconds:
            break
        resolutions += 1
        try:
            ips = dns_lookup(name, "A")
        except Exception:  # noqa: BLE001
            ips = []
        if ips:
            source = "ct" if name in ct_names else ("mutation" if name in perms else "wordlist")
            found.append({
                "fqdn": name,
                "ips": ips,
                "source": source,
            })
    result["subdomains"] = found
    return result
