import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  generateVerificationToken,
  dnsTxtHost,
  dnsTxtValue,
  httpFileUrl,
  checkDnsTxt,
  checkHttpFile,
  hostnameForVerification,
  methodAllowedForType,
  isPublicHost,
  VERIFY_TXT_PREFIX,
} from "./verify";

function fakeResponse(ok: boolean, status: number, text: string): Response {
  return { ok, status, text: async () => text } as unknown as Response;
}

describe("verification token + instructions", () => {
  test("token is 32 hex chars and unique", () => {
    const a = generateVerificationToken();
    const b = generateVerificationToken();
    assert.match(a, /^[0-9a-f]{32}$/);
    assert.notStrictEqual(a, b);
  });

  test("DNS instructions format", () => {
    assert.strictEqual(dnsTxtHost("example.com"), "_harizeon-verify.example.com");
    assert.strictEqual(dnsTxtValue("abc"), `${VERIFY_TXT_PREFIX}abc`);
  });

  test("HTTP file URL format", () => {
    assert.strictEqual(httpFileUrl("example.com"), "http://example.com/.well-known/harizeon-verification.txt");
  });
});

describe("checkDnsTxt", () => {
  test("matches an exact TXT record", async () => {
    const r = await checkDnsTxt("example.com", "tok123", async () => [["harizeon-site-verification=tok123"]]);
    assert.deepStrictEqual(r, { ok: true, reason: "matched" });
  });

  test("joins chunked TXT records before comparing", async () => {
    const r = await checkDnsTxt("example.com", "tok123", async () => [["harizeon-site-verific", "ation=tok123"]]);
    assert.deepStrictEqual(r, { ok: true, reason: "matched" });
  });

  test("mismatch when token differs", async () => {
    const r = await checkDnsTxt("example.com", "tok123", async () => [["harizeon-site-verification=other"]]);
    assert.deepStrictEqual(r, { ok: false, reason: "mismatch" });
  });

  test("not_found on ENOTFOUND / ENODATA", async () => {
    for (const code of ["ENOTFOUND", "ENODATA"]) {
      const err = Object.assign(new Error("dns"), { code });
      const r = await checkDnsTxt("example.com", "tok", async () => { throw err; });
      assert.deepStrictEqual(r, { ok: false, reason: "not_found" });
    }
  });

  test("dns_error on unexpected failure", async () => {
    const r = await checkDnsTxt("example.com", "tok", async () => { throw new Error("boom"); });
    assert.deepStrictEqual(r, { ok: false, reason: "dns_error" });
  });

  test("timeout on hanging resolver", async () => {
    const hanging = () => new Promise<string[][]>(() => {});
    const r = await checkDnsTxt("example.com", "tok", hanging, 50);
    assert.deepStrictEqual(r, { ok: false, reason: "timeout" });
  });
});

describe("checkHttpFile", () => {
  test("matches exact file content (whitespace tolerated)", async () => {
    const r = await checkHttpFile("http://x/.well-known/harizeon-verification.txt", "tok123",
      async () => fakeResponse(true, 200, "  tok123\n"));
    assert.deepStrictEqual(r, { ok: true, reason: "matched" });
  });

  test("mismatch on different content", async () => {
    const r = await checkHttpFile("http://x/f", "tok123", async () => fakeResponse(true, 200, "nope"));
    assert.deepStrictEqual(r, { ok: false, reason: "mismatch" });
  });

  test("http_404 surfaces the status", async () => {
    const r = await checkHttpFile("http://x/f", "tok", async () => fakeResponse(false, 404, ""));
    assert.deepStrictEqual(r, { ok: false, reason: "http_404" });
  });

  test("timeout on hanging fetch", async () => {
    const hanging = (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const e = new Error("aborted");
          e.name = "AbortError";
          reject(e);
        });
      });
    const r = await checkHttpFile("http://x/f", "tok", hanging, 50);
    assert.deepStrictEqual(r, { ok: false, reason: "timeout" });
  });

  test("fetch_error on network failure", async () => {
    const r = await checkHttpFile("http://x/f", "tok", async () => { throw new Error("conn refused"); });
    assert.deepStrictEqual(r, { ok: false, reason: "fetch_error" });
  });
});

describe("asset type / method matrix", () => {
  test("DNS TXT only for domain/subdomain", () => {
    assert.strictEqual(methodAllowedForType("dns_txt", "domain"), true);
    assert.strictEqual(methodAllowedForType("dns_txt", "subdomain"), true);
    assert.strictEqual(methodAllowedForType("dns_txt", "ip"), false);
    assert.strictEqual(methodAllowedForType("dns_txt", "url"), false);
    assert.strictEqual(methodAllowedForType("dns_txt", "bogus"), false);
  });

  test("HTTP file for domain/subdomain/url/ip", () => {
    for (const t of ["domain", "subdomain", "url", "ip"]) {
      assert.strictEqual(methodAllowedForType("http_file", t), true);
    }
    assert.strictEqual(methodAllowedForType("http_file", "bogus"), false);
  });

  test("hostname extraction", () => {
    assert.strictEqual(hostnameForVerification("domain", "example.com"), "example.com");
    assert.strictEqual(hostnameForVerification("url", "https://app.example.com:8443/a?b=c"), "app.example.com");
    assert.strictEqual(hostnameForVerification("url", "not a url"), null);
    assert.strictEqual(hostnameForVerification("ip", "203.0.113.44"), null);
  });
});

describe("isPublicHost (SSRF guard)", () => {
  test("allows public IPv4 + DNS names", () => {
    assert.strictEqual(isPublicHost("8.8.8.8"), true);
    assert.strictEqual(isPublicHost("1.1.1.1"), true);
    assert.strictEqual(isPublicHost("example.com"), true);
  });

  test("blocks private, loopback, link-local, CGNAT, TEST-NET, multicast", () => {
    for (const h of ["10.0.0.1", "172.16.5.4", "192.168.1.1", "127.0.0.1", "169.254.169.254",
      "100.64.0.1", "192.0.2.1", "198.51.100.7", "203.0.113.9", "224.0.0.1", "0.0.0.0"]) {
      assert.strictEqual(isPublicHost(h), false, h);
    }
  });

  test("blocks IPv6 non-global + metadata names", () => {
    for (const h of ["::1", "::", "fe80::1", "fc00::1", "ff02::1", "metadata.google.internal"]) {
      assert.strictEqual(isPublicHost(h), false, h);
    }
    assert.strictEqual(isPublicHost("2606:4700:4700::1111"), true);
  });
});
