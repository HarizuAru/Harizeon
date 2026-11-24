"""Subprocess runners for the bundled OSS engines (§06.3).

Stdlib only — no redis/httpx at import time, so CI can run the unit tests
without installing anything. Callers gate on `available()` first; a missing
binary is normal on dev machines and in CI, and the built-in engines stay the
fallback everywhere.
"""

import json
import os
import shutil
import subprocess

DEFAULT_TIMEOUT = 120

# Local workspace tools path fallback for development environments
LOCAL_TOOLS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "tools", "bin")
)


class ToolError(RuntimeError):
    """A bundled engine failed or timed out. Callers log a warn line and move on."""


def resolve_binary(name: str):
    """Resolve binary either on PATH or in the local project tools directory."""
    which_path = shutil.which(name)
    if which_path:
        return which_path

    if os.path.isdir(LOCAL_TOOLS_DIR):
        for ext in ("", ".exe", ".cmd", ".bat"):
            candidate = os.path.join(LOCAL_TOOLS_DIR, name + ext)
            if os.path.isfile(candidate):
                return candidate

    return None


def available(name):
    return resolve_binary(name) is not None


def run(cmd, timeout=DEFAULT_TIMEOUT, input_text=None):
    """Run a tool and return stdout. Raises ToolError on missing/timeout/non-zero."""
    cmd = list(cmd)
    resolved = resolve_binary(cmd[0])
    if resolved:
        cmd[0] = resolved

    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            input=input_text,
        )
    except FileNotFoundError as exc:
        raise ToolError("%s is not installed" % cmd[0]) from exc
    except subprocess.TimeoutExpired as exc:
        raise ToolError("%s timed out after %ss" % (cmd[0], timeout)) from exc
    if proc.returncode != 0:
        raise ToolError(
            "%s exited %s: %s" % (cmd[0], proc.returncode, (proc.stderr or "").strip()[:300])
        )
    return proc.stdout or ""


def run_allow_fail(cmd, timeout=DEFAULT_TIMEOUT, input_text=None):
    """Run a tool that exits non-zero on some findings (testssl does); the
    caller inspects the output file instead. Returns (returncode, stdout, stderr).
    Only a missing binary or timeout raises ToolError."""
    cmd = list(cmd)
    resolved = resolve_binary(cmd[0])
    if resolved:
        cmd[0] = resolved

    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            input=input_text,
        )
    except FileNotFoundError as exc:
        raise ToolError("%s is not installed" % cmd[0]) from exc
    except subprocess.TimeoutExpired as exc:
        raise ToolError("%s timed out after %ss" % (cmd[0], timeout)) from exc
    return proc.returncode, proc.stdout or "", proc.stderr or ""


def json_lines(text):
    """Parse JSON Lines, skipping banner/junk lines. Returns dict rows only."""
    rows = []
    for line in (text or "").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            row = json.loads(line)
        except ValueError:
            continue
        if isinstance(row, dict):
            rows.append(row)
    return rows
