import { test, describe } from "node:test";
import assert from "node:assert/strict";

// password -> config reads env at import; unit tests run without a DB.
process.env.DATABASE_URL ??= "postgresql://unused/unused";

const { hashPassword, verifyPassword, validatePasswordPolicy } = await import("./password");

describe("password hashing (Argon2id)", () => {
  test("hash + verify roundtrip", async () => {
    const password = "correct-horse-battery-staple-123";
    const hash = await hashPassword(password);
    const ok = await verifyPassword(hash, password);
    assert.strictEqual(ok, true);
  });

  test("rejects wrong password", async () => {
    const hash = await hashPassword("correct-password");
    const ok = await verifyPassword(hash, "wrong-password");
    assert.strictEqual(ok, false);
  });

  test("hash uses Argon2id (algorithm=2) and expected params", async () => {
    const { parseOptions } = await import("@node-rs/argon2");
    const hash = await hashPassword("test-password-123");
    const opts = parseOptions(hash);
    assert.strictEqual(opts.algorithm, 2); // Argon2id
    assert.strictEqual(opts.memoryCost, 19456);
    assert.strictEqual(opts.timeCost, 2);
    assert.strictEqual(opts.parallelism, 1);
  });
});

describe("password policy", () => {
  test("accepts ≥12 chars", () => {
    const r = validatePasswordPolicy("a".repeat(12));
    assert.strictEqual(r.ok, true);
  });

  test("rejects <12 chars", () => {
    const r = validatePasswordPolicy("short");
    assert.strictEqual(r.ok, false);
    assert.match(r.reason ?? "", /at least 12/);
  });

  test("rejects >256 chars", () => {
    const r = validatePasswordPolicy("a".repeat(257));
    assert.strictEqual(r.ok, false);
    assert.match(r.reason ?? "", /too long/);
  });
});