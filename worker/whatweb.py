"""WhatWeb technology fingerprinting in the inspect phase (standard + deep).

One info finding per URL listing every detected product + version, so the
report can say "your site runs PHP 7.4 (EOL)" instead of nothing. WhatWeb's
log-json output has existed as both an array and JSON Lines across versions;
the parser accepts either.
"""

import json
import os

import tools

BIN = os.environ.get("WHATWEB_BIN", "whatweb")
# Pure location metadata — no product/version signal.
SKIP_PLUGINS = {"Country", "IP"}
MAX_PARTS = 10


def have():
    return os.path.isfile(BIN) if os.path.sep in BIN else tools.available(BIN)


def _plugin_entries(data):
    """Yield (name, version_string) from any WhatWeb JSON shape."""
    docs = data if isinstance(data, list) else [data]
    for doc in docs:
        if not isinstance(doc, dict):
            continue
        plugins = doc.get("plugins")
        if not isinstance(plugins, dict):
            continue
        for name, body in plugins.items():
            if name in SKIP_PLUGINS:
                continue
            version = ""
            strings = []
            if isinstance(body, dict):
                raw_version = body.get("version")
                if isinstance(raw_version, list):
                    version = ".".join(str(v) for v in raw_version[:4])
                elif raw_version:
                    version = str(raw_version)
                raw_string = body.get("string")
                if isinstance(raw_string, list):
                    strings = [str(s) for s in raw_string[:2]]
                elif raw_string:
                    strings = [str(raw_string)]
            yield name, version, strings


def parse(text, url):
    data = None
    try:
        data = json.loads(text)
    except ValueError:
        rows = tools.json_lines(text)
        data = rows if rows else None
    if not data:
        return []

    parts = []
    raw = []
    for name, version, strings in _plugin_entries(data):
        label = "%s %s" % (name, version) if version else name
        parts.append(label.strip())
        raw.append({"name": name, "version": version, "strings": strings})
    if not parts:
        return []

    shown = parts[:MAX_PARTS]
    title = "Technology fingerprint: %s" % ", ".join(shown)
    if len(parts) > MAX_PARTS:
        title += " (+%d more)" % (len(parts) - MAX_PARTS)
    return [
        {
            "check_id": "web.fingerprint",
            "location": url[:300],
            "severity": "info",
            "title": title[:200],
            "description": ("Detected technologies: %s" % ", ".join(parts))[:2000],
            "remediation": (
                "Track every detected product's end-of-life date and upgrade "
                "before vendor support ends."
            ),
            "category": "fingerprint",
            "evidence": json.dumps(raw, separators=(",", ":"))[:800],
        }
    ]


def scan(url, run_fn=tools.run, timeout=60):
    out = run_fn([BIN, "--log-json", "-", "--color", "never", url], timeout=timeout)
    return parse(out, url)
