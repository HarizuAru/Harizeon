process.env.DATABASE_URL ??= "postgresql://test@localhost:5432/test";

import { test } from "node:test";
import assert from "node:assert/strict";
import type { Queryable } from "../db";

const { runRetentionPurge, resolveRetentionDays, DEFAULT_RETENTION_DAYS } = await import("./retention");

test("retention: resolveRetentionDays handles plan limits, defaults, and unlimited (-1)", () => {
  assert.equal(resolveRetentionDays({ org_id: "o1", limits: { retention_days: 14 } }), 14);
  assert.equal(resolveRetentionDays({ org_id: "o2", limits: { retention_days: -1 } }), null);
  assert.equal(resolveRetentionDays({ org_id: "o3", limits: {} }), DEFAULT_RETENTION_DAYS);
  assert.equal(resolveRetentionDays({ org_id: "o4", limits: null }), DEFAULT_RETENTION_DAYS);
  assert.equal(resolveRetentionDays({ org_id: "o5", limits: { retention_days: 0 } }), DEFAULT_RETENTION_DAYS);
});

test("retention: purges expired scan_events, asset_snapshots, and reports while preserving in-window rows", async () => {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const orgs = [
    { org_id: "11111111-1111-1111-1111-111111111111", limits: { retention_days: 14 } },
    { org_id: "22222222-2222-2222-2222-222222222222", limits: {} }, // defaults to 90 days
    { org_id: "33333333-3333-3333-3333-333333333333", limits: { retention_days: -1 } }, // unlimited
  ];

  const scans = [
    { id: "scn-1", org_id: orgs[0].org_id },
    { id: "scn-2", org_id: orgs[1].org_id },
    { id: "scn-3", org_id: orgs[2].org_id },
  ];

  let scanEvents = [
    { id: "se-expired", scan_id: "scn-1", created_at: new Date(now - 20 * dayMs) },
    { id: "se-fresh", scan_id: "scn-1", created_at: new Date(now - 5 * dayMs) },
    { id: "se-default-expired", scan_id: "scn-2", created_at: new Date(now - 100 * dayMs) },
    { id: "se-default-fresh", scan_id: "scn-2", created_at: new Date(now - 30 * dayMs) },
    { id: "se-unlimited-old", scan_id: "scn-3", created_at: new Date(now - 400 * dayMs) },
  ];

  let assetSnapshots = [
    { id: "snap-expired", org_id: orgs[0].org_id, created_at: new Date(now - 15 * dayMs) },
    { id: "snap-fresh", org_id: orgs[0].org_id, created_at: new Date(now - 2 * dayMs) },
    { id: "snap-unlimited-old", org_id: orgs[2].org_id, created_at: new Date(now - 500 * dayMs) },
  ];

  let reports = [
    { id: "rep-expired", org_id: orgs[0].org_id, created_at: new Date(now - 30 * dayMs) },
    { id: "rep-fresh", org_id: orgs[0].org_id, created_at: new Date(now - 10 * dayMs) },
    { id: "rep-default-fresh", org_id: orgs[1].org_id, created_at: new Date(now - 60 * dayMs) },
  ];

  const mockDb = {
    async query(sql: string, params: unknown[] = []) {
      if (sql.includes("FROM orgs o") && sql.includes("LEFT JOIN plans p")) {
        return { rows: orgs, rowCount: orgs.length };
      }
      const orgId = String(params[0]);
      const days = Number(params[1]);
      const cutoff = new Date(now - days * dayMs);

      if (sql.includes("DELETE FROM scan_events")) {
        const orgScanIds = new Set(scans.filter((s) => s.org_id === orgId).map((s) => s.id));
        const before = scanEvents.length;
        scanEvents = scanEvents.filter((row) => !(orgScanIds.has(row.scan_id) && row.created_at < cutoff));
        return { rows: [], rowCount: before - scanEvents.length };
      }

      if (sql.includes("DELETE FROM asset_snapshots")) {
        const before = assetSnapshots.length;
        assetSnapshots = assetSnapshots.filter((row) => !(row.org_id === orgId && row.created_at < cutoff));
        return { rows: [], rowCount: before - assetSnapshots.length };
      }

      if (sql.includes("DELETE FROM reports")) {
        const before = reports.length;
        reports = reports.filter((row) => !(row.org_id === orgId && row.created_at < cutoff));
        return { rows: [], rowCount: before - reports.length };
      }

      throw new Error(`Unexpected SQL: ${sql}`);
    },
  } as unknown as Queryable;

  const summary = await runRetentionPurge(mockDb);

  assert.equal(summary.orgsEvaluated, 3);
  assert.equal(summary.orgsUnlimited, 1);
  assert.equal(summary.deletedScanEvents, 2);
  assert.equal(summary.deletedAssetSnapshots, 1);
  assert.equal(summary.deletedReports, 1);

  assert.deepEqual(
    scanEvents.map((e) => e.id),
    ["se-fresh", "se-default-fresh", "se-unlimited-old"],
  );
  assert.deepEqual(
    assetSnapshots.map((s) => s.id),
    ["snap-fresh", "snap-unlimited-old"],
  );
  assert.deepEqual(
    reports.map((r) => r.id),
    ["rep-fresh", "rep-default-fresh"],
  );
});
