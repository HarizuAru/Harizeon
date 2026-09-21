import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { sealSecret, unsealSecret, isSealed, signWebhook, sealConfig, openConfig, redactConfig } from "./seal";

const MK = "test-master-key-that-is-long-enough-1234";

describe("secret sealing (§11)", () => {
  test("round-trips and is not plaintext", () => {
    const sealed = sealSecret("https://hooks.slack.com/services/T/B/x", MK);
    assert.notStrictEqual(sealed, "https://hooks.slack.com/services/T/B/x");
    assert.ok(isSealed(sealed));
    assert.equal(unsealSecret(sealed, MK), "https://hooks.slack.com/services/T/B/x");
  });

  test("random IV: same input seals differently", () => {
    assert.notStrictEqual(sealSecret("same", MK), sealSecret("same", MK));
  });

  test("wrong master key fails", () => {
    assert.throws(() => unsealSecret(sealSecret("s", MK), "another-master-key-000000000000"));
  });

  test("tampering is detected (GCM tag)", () => {
    const parts = sealSecret("s", MK).split(".");
    parts[3] = Buffer.from("tampered").toString("base64url");
    assert.throws(() => unsealSecret(parts.join("."), MK));
  });

  test("malformed input rejected", () => {
    assert.throws(() => unsealSecret("nonsense", MK));
    assert.throws(() => unsealSecret("v2.a.b.c", MK));
  });
});

describe("channel config helpers", () => {
  test("sealConfig/openConfig round-trip", () => {
    const opened = openConfig(sealConfig({ webhook_url: "https://x.test/h", channel: "#alerts" }, MK), MK);
    assert.equal(opened.webhook_url, "https://x.test/h");
    assert.equal(opened.channel, "#alerts");
  });

  test("redactConfig masks every string and leaves structure", () => {
    const red = redactConfig({ webhook_url: "https://x.test/h", retries: 3 });
    assert.equal(red.webhook_url, "••••••••");
    assert.equal(red.retries, 3);
  });

  test("sealConfig is idempotent over already-sealed values", () => {
    const once = sealConfig({ webhook_url: "https://x.test/h" }, MK);
    const twice = sealConfig(once, MK);
    assert.equal(twice.webhook_url, once.webhook_url);
  });
});

describe("webhook signing (§08)", () => {
  test("deterministic and 64 hex chars", () => {
    const a = signWebhook("s", "1700000000", '{"x":1}');
    assert.equal(a, signWebhook("s", "1700000000", '{"x":1}'));
    assert.match(a, /^[0-9a-f]{64}$/);
  });

  test("timestamp, body or secret changes the signature", () => {
    const base = signWebhook("s", "1700000000", '{"x":1}');
    assert.notStrictEqual(base, signWebhook("s", "1700000001", '{"x":1}'));
    assert.notStrictEqual(base, signWebhook("s", "1700000000", '{"x":2}'));
    assert.notStrictEqual(base, signWebhook("t", "1700000000", '{"x":1}'));
  });
});
