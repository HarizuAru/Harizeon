import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  MemoryScanQueue,
  serialise,
  parseJob,
  parseEvent,
  type ScanJob,
  type WorkerEvent,
} from "./queue";

const job: ScanJob = {
  scan_id: "s1",
  org_id: "o1",
  profile: "quick",
  attempt: 0,
  targets: [{ asset_id: "a1", type: "domain", value: "example.com" }],
};

describe("queue field codecs (Redis stores flat string maps)", () => {
  test("job round-trips", () => {
    assert.deepEqual(parseJob(serialise(job as unknown as Record<string, unknown>)), job);
  });

  test("event round-trips", () => {
    const ev: WorkerEvent = {
      scan_id: "s1",
      org_id: "o1",
      kind: "event",
      phase: "probe",
      level: "info",
      message: "443 open (nginx)",
    };
    assert.deepEqual(parseEvent(serialise(ev as unknown as Record<string, unknown>)), ev);
  });

  test("malformed job is rejected", () => {
    assert.throws(() => parseJob({ scan_id: "s1" }));
    assert.throws(() => parseJob({}));
  });

  test("malformed event is rejected", () => {
    assert.throws(() => parseEvent({ kind: "nonsense", scan_id: "s1" }));
  });
});

describe("MemoryScanQueue honors the ScanQueue contract", () => {
  test("enqueue -> claim -> ack drains the job", async () => {
    const q = new MemoryScanQueue();
    await q.ready();
    await q.enqueue(job);
    const claimed = await q.claimJobs("w1", 10);
    assert.strictEqual(claimed.length, 1);
    assert.deepEqual(claimed[0].job, job);
    await q.ackJob(claimed[0].id);
    assert.strictEqual((await q.claimJobs("w1", 10)).length, 0);
  });

  test("publish -> consume -> ack drains the event", async () => {
    const q = new MemoryScanQueue();
    await q.ready();
    const ev: WorkerEvent = { scan_id: "s1", org_id: "o1", kind: "terminal", status: "completed" };
    await q.publish(ev);
    const got = await q.consumeEvents("i1", 10);
    assert.strictEqual(got.length, 1);
    assert.deepEqual(got[0].event, ev);
    await q.ackEvent(got[0].id);
    assert.strictEqual((await q.consumeEvents("i1", 10)).length, 0);
  });

  test("two consumers do not receive the same job", async () => {
    const q = new MemoryScanQueue();
    await q.ready();
    await q.enqueue(job);
    assert.strictEqual((await q.claimJobs("w1", 10)).length, 1);
    assert.strictEqual((await q.claimJobs("w2", 10)).length, 0);
  });

  test("heartbeat liveness and cancellation flag", async () => {
    const q = new MemoryScanQueue();
    await q.ready();
    assert.strictEqual(await q.isAlive("s1"), false);
    await q.setHeartbeat("s1", 60);
    assert.strictEqual(await q.isAlive("s1"), true);
    assert.strictEqual(await q.isCancelled("s1"), false);
    await q.requestCancel("s1");
    assert.strictEqual(await q.isCancelled("s1"), true);
  });
});
