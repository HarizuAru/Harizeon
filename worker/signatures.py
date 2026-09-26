"""Service identification and known-vulnerability matching (pure logic).

Turns a captured banner into (product, version), then checks that version
against a small, curated set of well-known CVEs with unambiguous version
ranges. Everything is injected-free so it is unit-testable without a network.

ponytail: the CVE set here is deliberately tiny and hand-curated — every entry
must be unambiguous (famous, exact affected range) because a wrong "critical"
costs trust. Extending it means adding a row of data, not new logic; a real
NVD/OSV feed is the upgrade path when the volume justifies it.
"""

import re


def parse_version(text):
    """'9.6p1' -> (9, 6, 1601); '1.0.1f' -> (1, 0, 1, 6).

    Letter grades map to alphabet position so '1.0.1a' < '1.0.1f' < '1.0.1g'
    compare correctly; OpenSSH-style 'pN' patch levels sort above their base.
    Comparison is therefore only meaningful within one product family — which is
    exactly how it is used.
    """
    if not text:
        return ()
    parts = []
    for chunk in re.split(r"[._\-+\s]", str(text).lower()):
        m = re.match(r"^(\d+)(.*)$", chunk)
        if not m:
            continue
        parts.append(int(m.group(1)))
        rest = m.group(2)
        if rest:
            letters = "".join(ch for ch in rest if ch.isalpha())
            digits = "".join(ch for ch in rest if ch.isdigit())
            value = (ord(letters[0]) - 96) * 100 if letters else 0
            if digits:
                value += int(digits)
            parts.append(value)
        if len(parts) >= 8:
            break
    return tuple(parts)


def _version_in(version_text, lo, hi_exclusive):
    v = parse_version(version_text)
    if not v:
        return False
    return parse_version(lo) <= v < parse_version(hi_exclusive)


# --- banner signatures ------------------------------------------------------

# (product, compiled regex capturing the version, version group)
SIGNATURES = [
    ("openssh", re.compile(r"SSH-[\d.]+-OpenSSH_([0-9][0-9a-zA-Z._]*)", re.I)),
    ("nginx", re.compile(r"nginx/(\d+(?:\.\d+)+)", re.I)),
    ("apache", re.compile(r"Apache/(\d+(?:\.\d+)+)", re.I)),
    ("openssl", re.compile(r"OpenSSL/(\d+(?:\.\d+)+[a-z]?)", re.I)),
    ("vsftpd", re.compile(r"vsFTPd[ /]?(\d+(?:\.\d+)+)", re.I)),
    ("proftpd", re.compile(r"ProFTPD[ /]?(\d+(?:\.\d+)+)", re.I)),
    ("postfix", re.compile(r"\bESMTP Postfix\b", re.I)),
]


def identify_banner(banner):
    """Banner text -> [{"product", "version"}]. Real banners often name several
    products ("Apache/2.4.49 (Unix) OpenSSL/1.0.1f"), so every confident match
    is returned."""
    banner = banner or ""
    out = []
    for product, pattern in SIGNATURES:
        m = pattern.search(banner)
        if not m:
            continue
        version = m.group(1) if m.groups() else None
        out.append({"product": product, "version": version})
    return out


# --- known-vulnerable versions ----------------------------------------------
#
# Each entry: affected range is [min, max_exclusive) in this product's own
# version ordering. Small and famous on purpose: these are unambiguous.

KNOWN_CVES = [
    {
        "product": "vsftpd",
        "cve_ids": ["CVE-2011-2523"],
        "min": "2.3.4", "max_exclusive": "2.3.5",
        "severity": "critical",
        "title": "vsFTPd 2.3.4 backdoor (CVE-2011-2523)",
        "description": "vsFTPd 2.3.4 shipped with an intentional backdoor: a '%:) ' login opens a root shell on port 6200. The banner shows this exact version is running.",
        "remediation": "Replace vsFTPd immediately (it is abandoned); any FTP service on this host must be treated as compromised and rebuilt.",
        "category": "vulnerable_software",
    },
    {
        "product": "apache",
        "cve_ids": ["CVE-2021-41773"],
        "min": "2.4.49", "max_exclusive": "2.4.50",
        "severity": "critical",
        "title": "Apache HTTP Server path traversal (CVE-2021-41773)",
        "description": "Apache 2.4.49 has a path-traversal flaw that can read files outside the web root, and can lead to remote code execution with mod_cgi enabled.",
        "remediation": "Upgrade Apache httpd to 2.4.50 or later (2.4.51+ fixes the follow-up regression) and review access logs for traversal attempts.",
        "category": "vulnerable_software",
    },
    {
        "product": "apache",
        "cve_ids": ["CVE-2021-42013"],
        "min": "2.4.49", "max_exclusive": "2.4.51",
        "severity": "critical",
        "title": "Apache HTTP Server path traversal regression (CVE-2021-42013)",
        "description": "Apache 2.4.49 and 2.4.50 are vulnerable to path traversal (and RCE with mod_cgi) even after the initial incomplete fix.",
        "remediation": "Upgrade Apache httpd to 2.4.51 or later.",
        "category": "vulnerable_software",
    },
    {
        "product": "nginx",
        "cve_ids": ["CVE-2021-23017"],
        "min": "0.6.18", "max_exclusive": "1.20.1",
        "severity": "high",
        "title": "nginx DNS resolver one-byte memory overwrite (CVE-2021-23017)",
        "description": "nginx versions 0.6.18 through 1.20.0 can be exploited via a forged DNS response to the built-in resolver, causing a one-byte memory overwrite that may lead to code execution or worker crash.",
        "remediation": "Upgrade nginx to 1.20.1 or later.",
        "category": "vulnerable_software",
    },
    {
        "product": "openssl",
        "cve_ids": ["CVE-2014-0160"],
        "min": "1.0.1", "max_exclusive": "1.0.1g",
        "severity": "critical",
        "title": "OpenSSL Heartbleed (CVE-2014-0160)",
        "description": "OpenSSL 1.0.1 through 1.0.1f leak up to 64kB of process memory per heartbeat, which can include private keys and session data.",
        "remediation": "Upgrade OpenSSL to 1.0.1g or later (and rotate any TLS keys that were exposed).",
        "category": "vulnerable_software",
    },
    {
        "product": "openssh",
        "cve_ids": ["CVE-2024-6387"],
        "min": "8.5p1", "max_exclusive": "9.8p1",
        "severity": "high",
        "title": "OpenSSH signal-handler race condition (CVE-2024-6387, regreSSHion)",
        "description": "OpenSSH 8.5p1 through 9.7p1 have a race in the SIGALRM handler that can lead to unauthenticated remote code execution as root on glibc-based systems.",
        "remediation": "Upgrade OpenSSH to 9.8p1 or later, or apply your distribution's patched build.",
        "category": "vulnerable_software",
    },
]


def cve_findings(product, version, location):
    """Findings for every known CVE affecting this exact product version."""
    out = []
    if not version:
        return out
    for entry in KNOWN_CVES:
        if entry["product"] != product:
            continue
        if not _version_in(version, entry["min"], entry["max_exclusive"]):
            continue
        out.append({
            "check_id": "svc.vulnerable_version",
            "location": location,
            "severity": entry["severity"],
            "title": entry["title"],
            "description": entry["description"],
            "remediation": entry["remediation"],
            "category": "vulnerable_software",
            "cve_ids": list(entry["cve_ids"]),
        })
    return out


def software_findings(banner, location):
    """One banner in, findings out: identify the software, then check its version."""
    findings = []
    for identified in identify_banner(banner):
        findings.extend(cve_findings(identified["product"], identified["version"], location))
    return findings
