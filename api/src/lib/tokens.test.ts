import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { randomToken, sha256Hex, hashToken, generateApiKey, safeEqualHex } from "./tokens";

describe("token utilities", () => {
  test("randomToken generates unique values", () => {
    const a = randomToken();
    const b = randomToken();
    assert.notStrictEqual(a, b);
    assert.strictEqual(a.length, 43); // base64url of 32 bytes
  });

  test("sha256Hex is deterministic", () => {
    assert.strictEqual(sha256Hex("test"), sha256Hex("test"));
  });

  test("hashToken === sha256Hex", () => {
    assert.strictEqual(hashToken("my-token"), sha256Hex("my-token"));
  });

  test("generateApiKey format and prefix", () => {
    const { key, prefix, hash } = generateApiKey("live");
    assert.match(key, /^hrz_live_[A-Za-z0-9_-]{32}$/);
    assert.strictEqual(prefix, key.slice(0, 13));
    assert.strictEqual(hash, sha256Hex(key));
  });

  test("generateApiKey test env", () => {
    const { key } = generateApiKey("test");
    assert.match(key, /^hrz_test_[A-Za-z0-9_-]{32}$/);
  });

  test("safeEqualHex timing-safe comparison", () => {
    assert.strictEqual(safeEqualHex("aa", "aa"), true);
    assert.strictEqual(safeEqualHex("aa", "bb"), false);
  });
});