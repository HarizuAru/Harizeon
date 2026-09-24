import { randomBytes } from "node:crypto";
import { resolveTxt as defaultResolveTxt, lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const VERIFY_TXT_PREFIX = "harizeon-site-verification=";
export const VERIFY_HTTP_PATH = "/.well-known/harizeon-verification.txt";
export const VERIFY_HTTP_TIMEOUT_MS = 10_000;

/** 128-bit random token, hex-encoded (32 chars). */
export function generateVerificationToken(): string {
  return randomBytes(16).toString("hex");
}

/** `_harizeon-verify.example.com` */
export function dnsTxtHost(domain: string): string {
  return `_harizeon-verify.${domain}`;
}

/** `harizeon-site-verification=<token>` */
export function dnsTxtValue(token: string): string {
  return `${VERIFY_TXT_PREFIX}${token}`;
}

/** `http://<host>/.well-known/harizeon-verification.txt` (follows redirects). */
export function httpFileUrl(host: string): string {
  return `http://${host}${VERIFY_HTTP_PATH}`;
}

export type DnsResolver = (host: string) => Promise<string[][]>;

export const VERIFY_DNS_TIMEOUT_MS = 10_000;

export async function checkDnsTxt(
  domain: string,
  token: string,
  resolveTxt: DnsResolver = defaultResolveTxt,
  timeoutMs: number = VERIFY_DNS_TIMEOUT_MS,
): Promise<{ ok: boolean; reason: string }> {
  const expected = dnsTxtValue(token);
  let records: string[][];
  try {
    records = await Promise.race([
      resolveTxt(dnsTxtHost(domain)),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(Object.assign(new Error("dns timeout"), { code: "ETIMEOUT" })), timeoutMs),
      ),
    ]);
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException)?.code;
    if (code === "ENOTFOUND" || code === "ENODATA" || code === "ENOTIMP") {
      return { ok: false, reason: "not_found" };
    }
    if (code === "ETIMEOUT") return { ok: false, reason: "timeout" };
    return { ok: false, reason: "dns_error" };
  }
  // TXT records arrive chunked; join chunks per record before comparing.
  const joined = records.map((chunks) => chunks.join(""));
  if (joined.some((r) => r.trim() === expected)) {
    return { ok: true, reason: "matched" };
  }
  return { ok: false, reason: "mismatch" };
}

export type HttpFetcher = (url: string, init?: RequestInit) => Promise<Response>;

export async function checkHttpFile(
  url: string,
  token: string,
  fetcher: HttpFetcher = (u, init) => fetch(u, init),
  timeoutMs: number = VERIFY_HTTP_TIMEOUT_MS,
): Promise<{ ok: boolean; reason: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetcher(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Harizeon-Verify/0.1" },
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const text = (await res.text()).trim();
    if (text === token) return { ok: true, reason: "matched" };
    return { ok: false, reason: "mismatch" };
  } catch (e: unknown) {
    if ((e as Error)?.name === "AbortError") return { ok: false, reason: "timeout" };
    return { ok: false, reason: "fetch_error" };
  } finally {
    clearTimeout(timer);
  }
}

/** Hostname to verify for an asset (null when the type has no hostname). */
export function hostnameForVerification(type: string, value: string): string | null {
  if (type === "domain" || type === "subdomain") return value;
  if (type === "url") {
    try {
      return new URL(value).hostname;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Types whose ownership can be proven automatically (DNS TXT / HTTP file).
 * `ip` is deliberately excluded: §12.2 requires IP authorization to go through
 * manual review (reverse DNS + a signed authorization form), NOT automation.
 */
export function autoVerifiable(type: string): boolean {
  return type === "domain" || type === "subdomain" || type === "url";
}

export function requiresManualReview(type: string): boolean {
  return type === "ip";
}

/** DNS TXT only makes sense for hostnames; HTTP file where a web server answers. */
export function methodAllowedForType(method: string, type: string): boolean {
  if (!autoVerifiable(type)) return false;
  if (method === "dns_txt") return type === "domain" || type === "subdomain";
  if (method === "http_file") return true; // domain | subdomain | url
  return false;
}

const METADATA_HOSTS = new Set(["metadata.google.internal", "metadata.goog", "169.254.169.254"]);

function ipv4ToInt(ip: string): number {
  const p = ip.split(".").map(Number);
  return ((p[0] * 256 + p[1]) * 256 + p[2]) * 256 + p[3];
}

function inCidrV4(ip: string, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : ((~0 << (32 - bits)) >>> 0);
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}

/**
 * True only for publicly routable hosts. Used to guard server-side fetches
 * against SSRF (§11): the control plane must never fetch RFC1918/loopback/
 * link-local/metadata targets, even though response bytes never leave the
 * comparator. DNS names are allowed (only a match/mismatch bit is returned).
 */
export function isPublicHost(hostname: string): boolean {
  let host = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!host) return false;
  if (METADATA_HOSTS.has(host)) return false;

  const family = isIP(host);
  if (family === 4) {
    const blocked: Array<[string, number]> = [
      ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
      ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
      ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24],
      ["224.0.0.0", 4], ["240.0.0.0", 4],
    ];
    if (blocked.some(([b, n]) => inCidrV4(host, b, n))) return false;
    return true;
  }

  if (family === 6) {
    if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1);
    host = host.split("%")[0];
    if (host === "::1" || host === "::") return false;
    if (host.startsWith("::ffff:")) return isPublicHost(host.slice(7));
    const first = host.split(":")[0];
    if (first) {
      const n = parseInt(first, 16);
      if (!Number.isNaN(n)) {
        if (n >= 0xfe80 && n <= 0xfebf) return false; // link-local
        if (n >= 0xfc00 && n <= 0xfdff) return false; // unique-local
        if (n >= 0xff00 && n <= 0xffff) return false; // multicast
      }
    }
    return true;
  }

  return true;
}

export type LookupFn = (host: string) => Promise<Array<{ address: string }>>;

const defaultLookup: LookupFn = (host) => lookup(host, { all: true });

/**
 * SSRF (§11): a destination hostname must resolve ONLY to public addresses.
 * `isPublicHost` alone is defeated by a name pointing at 127.0.0.1 or an
 * internal host, so resolve and require every answer to be public.
 *
 * ponytail: this validates the resolution, not the connection — a name that
 * rebinds between this check and fetch() still slips through. Pin the socket
 * (custom undici lookup) if that window ever matters.
 */
export async function resolvesToPublicOnly(
  hostname: string,
  lookupFn: LookupFn = defaultLookup,
): Promise<boolean> {
  if (!isPublicHost(hostname)) return false; // literal private IP / metadata host
  const bare = hostname.trim().toLowerCase().replace(/\.$/, "").replace(/^\[|\]$/g, "");
  if (isIP(bare)) return true; // a public literal IP is already fully decided
  try {
    const answers = await lookupFn(bare);
    return answers.length > 0 && answers.every((a) => isPublicHost(a.address));
  } catch {
    return false; // cannot prove public -> refuse (fail closed)
  }
}
