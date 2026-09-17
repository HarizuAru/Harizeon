import { randomBytes, createHash, timingSafeEqual } from "node:crypto";

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function hashToken(token: string): string {
  return sha256Hex(token);
}

/**
 * Generate an API key with the format `hrz_{env}_{32-char-secret}`.
 * Returns the full key (shown once), the visible prefix, and the stored hash.
 */
export function generateApiKey(env: "live" | "test" = "live"): {
  key: string;
  prefix: string;
  hash: string;
} {
  const secret = randomBytes(24).toString("base64url"); // 32 chars
  const key = `hrz_${env}_${secret}`;
  const prefix = key.slice(0, 13); // hrz_live_XXXX or hrz_test_XXXX
  return { key, prefix, hash: sha256Hex(key) };
}

/**
 * Constant-time comparison of two hex strings.
 */
export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBuf = Buffer.from(a, "hex");
  const bBuf = Buffer.from(b, "hex");
  return timingSafeEqual(aBuf, bBuf);
}