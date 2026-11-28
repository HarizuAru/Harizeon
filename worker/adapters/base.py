from __future__ import annotations
import json
import subprocess
from dataclasses import dataclass
from typing import Any

MAX_OUTPUT_BYTES = 10 * 1024 * 1024  # 10 MB cap per binary invocation

SAFE_ENV = {
    "PATH": "/usr/local/bin:/usr/bin:/bin",
    "HOME": "/tmp/scanner-home",
    "XDG_CONFIG_HOME": "/tmp/scanner-home/.config",
    "XDG_CACHE_HOME": "/tmp/scanner-home/.cache",
}

@dataclass
class ToolResult:
    returncode: int
    records: list[dict[str, Any]]
    stderr: str

def run_jsonl_tool(
    cmd: list[str],
    *,
    stdin_lines: list[str] | None = None,
    timeout_sec: int = 120,
) -> ToolResult:
    """Run external tool binary with strict memory cap and JSONL parsing."""
    stdin_data = ("\n".join(stdin_lines) + "\n").encode("utf-8") if stdin_lines else None

    proc = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE if stdin_data else subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=SAFE_ENV,
    )
    try:
        stdout_bytes, stderr_bytes = proc.communicate(input=stdin_data, timeout=timeout_sec)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.communicate()
        raise TimeoutError(f"Tool timed out after {timeout_sec}s: {cmd[0]}")

    if len(stdout_bytes) > MAX_OUTPUT_BYTES:
        stdout_bytes = stdout_bytes[:MAX_OUTPUT_BYTES]

    records: list[dict[str, Any]] = []
    for line in stdout_bytes.decode("utf-8", errors="replace").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            parsed = json.loads(line)
            if isinstance(parsed, dict):
                records.append(parsed)
            elif isinstance(parsed, list):
                records.extend([item for item in parsed if isinstance(item, dict)])
        except json.JSONDecodeError:
            continue

    return ToolResult(
        returncode=proc.returncode,
        records=records,
        stderr=stderr_bytes.decode("utf-8", errors="replace")[:4000],
    )
