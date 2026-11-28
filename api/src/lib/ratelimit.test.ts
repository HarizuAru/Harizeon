import { test } from "node:test";
import assert from "node:assert/strict";

// ratelimit -> config reads env at import; unit tests run without a DB.
process.env.DATABASE_URL ??= "postgresql://unused/unused";
process.env.RATE_LIMIT_ENABLED ??= "true";
process.env.RATE_LIMIT_AUTH_PER_MIN ??= "3";
process.env.RATE_LIMIT_PER_MIN ??= "3";

const { consume, consumeRedis, resetBuckets, sweep, rateLimit, WINDOW_MS } = await import("./ratelimit");

test("rate limit: allows up to the limit then blocks within the window", () => {
  resetBuckets();
  const t0 = 1_000_000;
  for (let i = 0; i < 3; i++) {
    assert.equal(consume("ip", 3, t0).allowed, true, `request ${i + 1} allowed`);
  }
  const blocked = consume("ip", 3, t0);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSec > 0 && blocked.retryAfterSec <= WINDOW_MS / 1000);
});

test("rate limit: window resets after it elapses", () => {
  resetBuckets();
  const t0 = 2_000_000;
  consume("ip", 1, t0);
  assert.equal(consume("ip", 1, t0).allowed, false);
  assert.equal(consume("ip", 1, t0 + WINDOW_MS).allowed, true, "new window allows again");
});

test("rate limit: buckets are independent per key", () => {
  resetBuckets();
  const t0 = 3_000_000;
  consume("a", 1, t0);
  assert.equal(consume("a", 1, t0).allowed, false);
  assert.equal(consume("b", 1, t0).allowed, true, "other key unaffected");
});

test("rate limit: sweep drops only expired windows", () => {
  resetBuckets();
  const t0 = 4_000_000;
  consume("old", 5, t0);
  consume("new", 5, t0 + WINDOW_MS); // starts a fresh window
  sweep(t0 + WINDOW_MS);
  assert.equal(consume("new", 5, t0 + WINDOW_MS).allowed, true);
  assert.equal(consume("new", 1, t0 + WINDOW_MS + 1).allowed, false, "surviving bucket keeps its count");
});

test("rate limit hook: credential endpoints 429 past the budget", async () => {
  resetBuckets();
  const reply = { header: () => {} } as never;

  // No principal on auth routes -> keyed by IP.
  for (let i = 0; i < 3; i++) await rateLimit({ url: "/v1/auth/login", ip: "9.9.9.9" } as never, reply);
  await assert.rejects(
    () => rateLimit({ url: "/v1/auth/login", ip: "9.9.9.9" } as never, reply),
    (e: unknown) => (e as { statusCode: number }).statusCode === 429,
  );
});

test("rate limit hook: authenticated users get independent budgets", async () => {
  resetBuckets();
  const reply = { header: () => {} } as never;
  const asUser = (userId: string) =>
    ({ url: "/v1/assets", ip: "10.0.0.1", auth: { userId, orgId: "o", actorType: "user" } }) as never;

  for (let i = 0; i < 3; i++) await rateLimit(asUser("user-a"), reply);
  await assert.rejects(
    () => rateLimit(asUser("user-a"), reply),
    (e: unknown) => (e as { statusCode: number }).statusCode === 429,
  );
  // A different user behind the same IP is unaffected.
  await rateLimit(asUser("user-b"), reply);
});

test("rate limit Redis: uses atomic INCR + PEXPIRE under rl:* prefix", async () => {
  const counts = new Map<string, number>();
  const expiries = new Map<string, number>();
  const mockRedis = {
    async incr(key: string) {
      const next = (counts.get(key) ?? 0) + 1;
      counts.set(key, next);
      return next;
    },
    async pexpire(key: string, ms: number) {
      expiries.set(key, ms);
      return 1;
    },
    async pttl(key: string) {
      return expiries.get(key) ?? 60_000;
    },
  };

  const replyHeaders: Record<string, unknown> = {};
  const reply = { header: (k: string, v: unknown) => { replyHeaders[k] = v; } } as never;
  const req = { url: "/v1/auth/login", ip: "1.2.3.4" } as never;

  const res1 = await consumeRedis(mockRedis, "1.2.3.4:auth", 2, 60_000);
  assert.equal(res1.allowed, true);
  assert.equal(expiries.get("rl:1.2.3.4:auth"), 60_000);

  counts.clear();
  expiries.clear();
  for (let i = 0; i < 3; i++) await rateLimit(req, reply, mockRedis);
  await assert.rejects(
    () => rateLimit(req, reply, mockRedis),
    (e: unknown) => (e as { statusCode: number }).statusCode === 429,
  );
  assert.ok(counts.has("rl:1.2.3.4:auth"));
  assert.equal(replyHeaders["Retry-After"], 60);
});
