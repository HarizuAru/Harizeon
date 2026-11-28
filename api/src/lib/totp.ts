import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isSealed, sealSecret, unsealSecret } from "./seal";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(secret: string): Buffer {
  const clean = secret.replace(/[\s=-]+/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];

  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) {
      throw new Error("Invalid Base32 TOTP secret");
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(out);
}

/** Generate a 160-bit cryptographically random Base32 TOTP secret. */
export function generateTotpSecret(numBytes = 20): string {
  return base32Encode(randomBytes(numBytes));
}

/** Build an RFC / Google Authenticator compatible otpauth:// URI. */
export function buildOtpAuthUri(params: {
  secret: string;
  email: string;
  issuer?: string;
}): string {
  const issuer = params.issuer ?? "Harizeon";
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(params.email)}`;
  return `otpauth://totp/${label}?secret=${encodeURIComponent(params.secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/** Compute the 6-digit RFC 6238 TOTP code for a given timestamp. */
export function generateTotpCode(
  secret: string,
  atMs = Date.now(),
  stepSec = 30,
  digits = 6,
): string {
  const key = base32Decode(secret);
  const counter = Math.floor(atMs / 1000 / stepSec);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac("sha1", key).update(counterBuf).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const mod = 10 ** digits;
  return String(binary % mod).padStart(digits, "0");
}

/**
 * Constant-time TOTP verification across a ±window (default ±1 step = ±30s).
 */
export function verifyTotpCode(
  secret: string,
  code: string,
  window = 1,
  atMs = Date.now(),
  stepSec = 30,
): boolean {
  const normalized = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;
  const candidateBuf = Buffer.from(normalized, "utf8");

  for (let delta = -window; delta <= window; delta += 1) {
    const expected = generateTotpCode(secret, atMs + delta * stepSec * 1000, stepSec, 6);
    const expectedBuf = Buffer.from(expected, "utf8");
    if (candidateBuf.length === expectedBuf.length && timingSafeEqual(candidateBuf, expectedBuf)) {
      return true;
    }
  }
  return false;
}

export function sealMfaSecret(secret: string, masterKey?: string): string {
  return masterKey ? sealSecret(secret, masterKey) : secret;
}

export function openMfaSecret(stored: string, masterKey?: string): string {
  if (isSealed(stored)) {
    return unsealSecret(stored, masterKey);
  }
  return stored;
}
