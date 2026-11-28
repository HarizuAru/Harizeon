import re

PEM_PRIVATE_KEY_PATTERN = re.compile(
    r"-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----[\s\S]*?(?:-----END (?:[A-Z0-9 ]+ )?PRIVATE KEY-----|$)"
)
CREDENTIALED_URI_PATTERN = re.compile(r"(://)([^/\s:@]+):([^/\s@]+)(@)")

SECRET_PATTERNS = [
    re.compile(r"(?i)(APP_KEY|DB_PASSWORD|AWS_SECRET_ACCESS_KEY|STRIPE_SECRET|OPENAI_API_KEY|ANTHROPIC_API_KEY|JWT_SECRET|DATABASE_URL|SECRET_KEY)\s*=\s*([^\s'\"#]+)"),
    re.compile(r"(sk-proj-[A-Za-z0-9_-]{12,}|sk-ant-[A-Za-z0-9_-]{12,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35})"),
    re.compile(r"(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,})"),
    re.compile(r"(eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)"),
]


def redact_secrets(text: str, max_len: int = 600) -> str:
    """Mask credentials, private keys, JWTs, and leaked API tokens from forensic telemetry."""
    if not text:
        return ""
    cleaned = PEM_PRIVATE_KEY_PATTERN.sub(
        "-----BEGIN PRIVATE KEY-----[REDACTED]-----END PRIVATE KEY-----",
        text,
    )
    cleaned = CREDENTIALED_URI_PATTERN.sub(r"\1\2:***[REDACTED]***\4", cleaned)
    for pat in SECRET_PATTERNS:
        def _mask(match: re.Match) -> str:
            if match.lastindex and match.lastindex >= 2:
                key, val = match.group(1), match.group(2)
                preview = f"{val[:2]}***[REDACTED]***{val[-2:]}" if len(val) > 6 else "***[REDACTED]***"
                return f"{key}={preview}"
            val = match.group(0)
            return f"{val[:4]}***[REDACTED]***{val[-2:]}"
        cleaned = pat.sub(_mask, cleaned)
    return cleaned[:max_len]
