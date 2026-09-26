import { test } from "node:test";
import assert from "node:assert/strict";

// email -> config reads env at import; unit tests run without a DB.
// The API key is set before import: config is parsed once, so this file tests
// the configured path end to end.
process.env.DATABASE_URL ??= "postgresql://unused/unused";
process.env.HARIZEON_EMAIL_API_KEY ??= "re_test_key";
process.env.HARIZEON_EMAIL_FROM ??= "Harizeon <alerts@harizeon.local>";

const { sendEmail, buildAuthUrl } = await import("./email");

test("posts to Resend with the bearer key", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: unknown, init: unknown) => {
    calls.push({ url: String(url), init: init as never });
    return { ok: true, status: 200 } as never;
  }) as never;
  try {
    await sendEmail({ to: "a@example.com", subject: "S", text: "T" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.resend.com/emails");
    const headers = (calls[0].init as { headers: Record<string, string> }).headers;
    assert.equal(headers.Authorization, "Bearer re_test_key");
    const body = JSON.parse((calls[0].init as { body: string }).body);
    assert.equal(body.to, "a@example.com");
    assert.equal(body.from, process.env.HARIZEON_EMAIL_FROM);
    assert.equal(body.text, "T");
  } finally {
    globalThis.fetch = original;
  }
});

test("HTTP failures throw honestly and never echo the provider body", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => ({ ok: false, status: 422, text: async () => "secret details" }) as never) as never;
  try {
    await assert.rejects(
      () => sendEmail({ to: "a@example.com", subject: "S", text: "T" }),
      (e: unknown) => /HTTP 422/.test((e as Error).message) && !(e as Error).message.includes("secret"),
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("buildAuthUrl joins the public base with the token", () => {
  assert.ok(buildAuthUrl("/verify-email", "tok").includes("/verify-email?token=tok"));
});
