import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildOtpAuthUri,
  generateTotpCode,
  generateTotpSecret,
  openMfaSecret,
  sealMfaSecret,
  verifyTotpCode,
} from "./totp";

test("totp: generates valid Base32 secrets and otpauth URIs", () => {
  const secret = generateTotpSecret();
  assert.match(secret, /^[A-Z2-7]{32}$/);
  const uri = buildOtpAuthUri({ secret, email: "alice@example.my" });
  assert.ok(uri.startsWith("otpauth://totp/Harizeon:alice%40example.my?"));
  assert.ok(uri.includes(`secret=${secret}`));
  assert.ok(uri.includes("issuer=Harizeon"));
});

test("totp: verifies current and adjacent 30s windows while rejecting stale codes", () => {
  const secret = generateTotpSecret();
  const baseMs = 1_700_000_000_000;
  const code = generateTotpCode(secret, baseMs);
  assert.match(code, /^\d{6}$/);

  assert.equal(verifyTotpCode(secret, code, 1, baseMs), true);
  assert.equal(verifyTotpCode(secret, code, 1, baseMs + 29_000), true);
  assert.equal(verifyTotpCode(secret, code, 1, baseMs - 29_000), true);
  assert.equal(verifyTotpCode(secret, code, 1, baseMs + 90_000), false);
  assert.equal(verifyTotpCode(secret, "12345", 1, baseMs), false);
  assert.equal(verifyTotpCode(secret, "abcdef", 1, baseMs), false);
});

test("totp: seals and opens MFA secrets when master key is provided", () => {
  const secret = generateTotpSecret();
  const mk = "test-master-key-for-mfa-secret-sealing-32";
  const sealed = sealMfaSecret(secret, mk);
  assert.ok(sealed.startsWith("v1."));
  assert.equal(openMfaSecret(sealed, mk), secret);
  assert.equal(openMfaSecret(secret), secret);
});
