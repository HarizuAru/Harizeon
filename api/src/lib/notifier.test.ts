import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

// notifier -> email -> config reads env at import; unit tests run without a DB.
process.env.DATABASE_URL ??= "postgresql://unused/unused";

async function mod() {
  return await import("./notifier");
}

function webhookChannel(config: Record<string, unknown>, minSeverity = "high") {
  return { type: "webhook", config, min_severity: minSeverity };
}

describe("notifier SSRF guard (§11)", () => {
  test("rejects private, loopback, metadata, link-local and non-http", async () => {
    const { validateDestination } = await mod();
    for (const url of [
      "http://127.0.0.1/hook",
      "http://10.0.0.5/hook",
      "http://192.168.1.1/hook",
      "http://169.254.169.254/latest/meta-data",
      "http://100.64.0.1/hook",
      "ftp://example.com/x",
      "not-a-url",
    ]) {
      assert.ok(validateDestination(url), url);
    }
    assert.equal(validateDestination("https://hooks.slack.com/services/x"), null);
    assert.equal(validateDestination("https://user.example.org/hook"), null);
  });
});

describe("notifier delivery", () => {
  test("webhook POST is HMAC-signed over <timestamp>.<body>", async () => {
    const { deliver } = await mod();
    const calls: { url: string; init: { headers: Record<string, string>; body: string } }[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (url: unknown, init: unknown) => {
      calls.push({ url: String(url), init: init as never });
      return { ok: true, status: 200 } as never;
    }) as never;
    try {
      const result = await deliver(
        webhookChannel({ url: "https://hooks.example.org/abc", secret: "s3cret" }),
        { kind: "scan.completed", orgId: "o1", title: "T", message: "M", severity: "high" },
      );
      assert.equal(result.ok, true, result.error);
      assert.equal(calls.length, 1);
      const { headers, body } = calls[0].init;
      const ts = headers["X-Harizeon-Timestamp"];
      const expected = createHmac("sha256", "s3cret").update(`${ts}.${body}`).digest("hex");
      assert.equal(headers["X-Harizeon-Signature"], expected);
      assert.equal(JSON.parse(body).severity, "high");
    } finally {
      globalThis.fetch = original;
    }
  });

  test("below the channel threshold nothing is sent", async () => {
    const { deliver, meetsThreshold } = await mod();
    const original = globalThis.fetch;
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      return { ok: true, status: 200 } as never;
    }) as never;
    try {
      const result = await deliver(
        webhookChannel({ url: "https://hooks.example.org/abc" }, "critical"),
        { kind: "scan.completed", orgId: "o1", title: "T", message: "M", severity: "high" },
      );
      assert.equal(result.ok, true);
      assert.equal(called, false);
      assert.equal(meetsThreshold("critical", "high"), true);
      assert.equal(meetsThreshold("low", "high"), false);
    } finally {
      globalThis.fetch = original;
    }
  });

  test("force bypasses the threshold (the /channels/:id/test path)", async () => {
    const { deliver } = await mod();
    const original = globalThis.fetch;
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      return { ok: true, status: 200 } as never;
    }) as never;
    try {
      const result = await deliver(
        webhookChannel({ url: "https://hooks.example.org/abc" }, "critical"),
        { kind: "channel.test", orgId: "o1", title: "T", message: "M", severity: "critical" },
        { force: true },
      );
      assert.equal(result.ok, true);
      assert.equal(called, true);
    } finally {
      globalThis.fetch = original;
    }
  });

  test("a failing destination returns ok:false with the reason, never throws", async () => {
    const { deliver } = await mod();
    const original = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new Error("connection refused");
    }) as never;
    try {
      const result = await deliver(webhookChannel({ url: "https://hooks.example.org/abc" }), {
        kind: "channel.test",
        orgId: "o1",
        title: "T",
        message: "M",
        severity: "high",
      });
      assert.equal(result.ok, false);
      assert.match(result.error ?? "", /connection refused/);
    } finally {
      globalThis.fetch = original;
    }
  });

  test("email without an address is an error, not a silent success", async () => {
    const { deliver } = await mod();
    const result = await deliver({ type: "email", config: {}, min_severity: "high" }, {
      kind: "channel.test",
      orgId: "o1",
      title: "T",
      message: "M",
      severity: "high",
    });
    assert.equal(result.ok, false);
  });
});
