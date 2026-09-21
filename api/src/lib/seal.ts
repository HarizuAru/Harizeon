import { createHmac, scryptSync, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

function requireKey(mk: string | undefined): string {
  if (!mk) throw new Error("a master key is required to store or read channel secrets");
  return mk;
}

/** AES-256-GCM key derived from the master key with a documented fixed salt. */
function channelKey(mk: string): Buffer {
  return scryptSync(mk, "harizeon-channel-secrets", 32);
}

/** Envelope-encrypt a secret for storage at rest (§11): v1.<iv>.<tag>.<ciphertext>. */
export function sealSecret(plain: string, mk?: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", channelKey(requireKey(mk)), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${enc.toString("base64url")}`;
}

export function unsealSecret(sealed: string, mk?: string): string {
  const [version, ivB64, tagB64, dataB64] = (sealed ?? "").split(".");
  if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) {
    throw new Error("unknown sealed secret format");
  }
  const decipher = createDecipheriv("aes-256-gcm", channelKey(requireKey(mk)), Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64url")), decipher.final()]).toString("utf8");
}

export function isSealed(value: unknown): boolean {
  return typeof value === "string" && value.startsWith("v1.");
}

/** Outbound webhook signature (§08): HMAC-SHA256 of `<timestamp>.<raw body>` (hex). */
export function signWebhook(secret: string, timestamp: string, rawBody: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

/** Seal every string value in a config object (channel configs hold secrets). */
export function sealConfig(config: Record<string, unknown>, mk?: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config ?? {})) {
    out[k] = typeof v === "string" && !isSealed(v) ? sealSecret(v, mk) : v;
  }
  return out;
}

/** Open every sealed string value in a config object (for delivery). */
export function openConfig(config: Record<string, unknown>, mk?: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config ?? {})) {
    if (isSealed(v)) {
      try {
        out[k] = unsealSecret(v as string, mk);
      } catch {
        out[k] = "";
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Never expose secrets: mask every string value. */
export function redactConfig(config: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config ?? {})) {
    out[k] = typeof v === "string" && v ? "••••••••" : v;
  }
  return out;
}
