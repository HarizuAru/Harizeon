import pg from "pg";
import { config } from "./config";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: config.DB_POOL_MAX,
  // Fail fast instead of queueing requests forever when the DB is saturated.
  connectionTimeoutMillis: config.DB_CONNECT_TIMEOUT_MS,
  idleTimeoutMillis: config.DB_IDLE_TIMEOUT_MS,
  // Ignored when 0 (no server-side cap).
  statement_timeout: config.DB_STATEMENT_TIMEOUT_MS || undefined,
});

// An idle client erroring (DB restart, network blip) must not crash the process.
pool.on("error", (err) => {
  console.error("[db] idle client error:", err.message);
});

/** Minimal interface satisfied by both Pool and PoolClient for read queries. */
export type Queryable = Pick<pg.Pool | pg.PoolClient, "query">;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Run a callback inside a transaction with the org GUC set (RLS second net).
 * If orgId is provided, validates UUID format and sets `harizeon.org_id` for the transaction scope.
 * If orgId is null/undefined, leaves the GUC unset (default-deny for org-scoped tables).
 */
export async function withTx<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
  orgId?: string | null,
): Promise<T> {
  if (orgId && !UUID_RE.test(orgId)) {
    throw new Error("Invalid tenant orgId");
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (orgId) {
      await client.query("SELECT set_config('harizeon.org_id', $1, true)", [orgId]);
    }
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/**
 * One-off query without an explicit transaction (e.g., health checks).
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}
