import { hash, verify } from "@node-rs/argon2";

/**
 * Hash a password with Argon2id (OWASP-recommended parameters).
 * Returns a PHC-encoded string containing salt, parameters, and hash.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
    outputLen: 32,
    algorithm: 2, // Argon2id
  });
}

/**
 * Verify a password against an Argon2id hash (PHC string).
 */
export async function verifyPassword(hashed: string, password: string): Promise<boolean> {
  return verify(hashed, password);
}

/**
 * Password policy (MVP): length ≥ 12, max 256.
 * Upgrade path: integrate zxcvbn or haveibeenpwned.
 */
export function validatePasswordPolicy(password: string): { ok: boolean; reason?: string } {
  if (password.length < 12) return { ok: false, reason: "Password must be at least 12 characters" };
  if (password.length > 256) return { ok: false, reason: "Password too long" };
  return { ok: true };
}