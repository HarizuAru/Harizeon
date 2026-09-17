import pg from "pg";
import { config } from "./config";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
});

/** Minimal interface satisfied by both Pool and PoolClient for read queries. */
export type Queryable = Pick<pg.Pool | pg.PoolClient, "query">;

/**
 * Run a callback inside a transaction with the org GUC set (RLS second net).
 * If orgId is provided, sets `harizeon.org_id` for the transaction scope.
 * If orgId is null/undefined, leaves the GUC unset (default-deny for org-scoped tables).
 */
export async function withTx<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
  orgId?: string | null,
): Promise<T> {
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