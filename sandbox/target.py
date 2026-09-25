"""Intentionally-vulnerable target for Harizeon sandbox scans and demos.

It serves exactly the fixtures that make the safe-to-demo checks fire: an
exposed .git and .env, a downloadable SQL dump, Swagger UI, an unauthenticated
Ollama-shaped /api/tags, a client-side bundle carrying an obviously-fake but
correctly-shaped AI key, and none of the hardening headers.

Never deploy this outside a local sandbox network. It exists so the scanner has
something it is *allowed* to find (see HARIZEON_SANDBOX_HOSTS in worker/scope.py).
"""

import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# Shaped like a live key so web.leaked_ai_credentials matches it, but made up.
# Do not replace this with a real credential.
FAKE_OPENAI_KEY = "sk-proj-9fK2mQ7xR4tL8pZ1vN6wB3jH5cY0dS2gE7aU"

INDEX = """<!doctype html>
<html><head><title>Harizeon Sandbox Target</title></head>
<body>
<h1>Harizeon sandbox target</h1>
<p>This host is intentionally misconfigured.</p>
<script src="/app.js"></script>
</body></html>
"""

APP_JS = """// frontend bundle
window.__ENV__ = { OPENAI_API_KEY: "%s" };
console.log("sandbox bundle loaded");
""" % FAKE_OPENAI_KEY

OLLAMA_TAGS = (
    '{"models":[{"name":"llama3:latest","model":"llama3:latest",'
    '"modified_at":"2025-01-05T09:30:00.000000Z","size":4661224676,'
    '"digest":"365c0bd3c000a25d28ddbf732fe1c6add4bfb03d2d51feb2c5b1a0b1c0b1c0b1",'
    '"details":{"format":"gguf","family":"llama"}}]}'
)

SQL_DUMP = """-- PostgreSQL database dump
CREATE TABLE users (id serial primary key, email text, password_hash text);
INSERT INTO users (email, password_hash) VALUES ('demo@sandbox.local', 'not-a-real-hash');
"""

DOTENV = "APP_KEY=not-a-real-secret\nDB_HOST=127.0.0.1\nDB_PASSWORD=not-a-real-password\n"

SWAGGER = (
    '<!doctype html><html><head><title>Swagger UI</title></head>'
    '<body><div id="swagger-ui"></div>'
    '<script src="/swagger-ui-bundle.js"></script></body></html>'
)

ROUTES = {
    "/": (200, "text/html; charset=utf-8", INDEX),
    "/app.js": (200, "application/javascript", APP_JS),
    "/.git/HEAD": (200, "text/plain", "ref: refs/heads/main\n"),
    "/.env": (200, "text/plain", DOTENV),
    "/api/tags": (200, "application/json", OLLAMA_TAGS),
    "/backup.sql": (200, "application/sql", SQL_DUMP),
    "/swagger-ui.html": (200, "text/html", SWAGGER),
}


class Handler(BaseHTTPRequestHandler):
    server_version = "sandbox-demo/1.0"
    sys_version = ""

    def do_GET(self):  # noqa: N802 - stdlib naming
        path = self.path.split("?", 1)[0]
        status, ctype, body = ROUTES.get(path, (404, "text/plain", "not found\n"))
        payload = body.encode("utf-8")
        self.send_response(status)
        # Deliberately no HSTS / CSP / X-Content-Type-Options / X-Frame-Options.
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args):  # keep container output quiet
        pass


def main():
    port = int(os.environ.get("PORT", "80"))
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()


if __name__ == "__main__":
    main()
