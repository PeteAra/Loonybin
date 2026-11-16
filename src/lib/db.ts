import path from "node:path";

type Row = Record<string, unknown>;
type QueryFn = (text: string, params?: unknown[]) => Promise<Row[]>;

export type Database = {
  query: QueryFn;
  transaction<T>(fn: (query: QueryFn) => Promise<T>): Promise<T>;
};

const globalDb = globalThis as unknown as { __loonyDb?: Promise<Database> };

const schema = [
  `CREATE TABLE IF NOT EXISTS booking_requests (
    id TEXT PRIMARY KEY,
    check_in TEXT NOT NULL,
    check_out TEXT NOT NULL,
    guests INTEGER NOT NULL,
    guest_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL,
    amount_cents INTEGER,
    stripe_session_id TEXT,
    payment_url TEXT,
    hold_expires_at TEXT,
    receipt_sent INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS date_blocks (
    id TEXT PRIMARY KEY,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,
];

async function migrate(query: QueryFn) {
  for (const statement of schema) await query(statement);
}

async function openPglite(): Promise<Database> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdir } = await import("node:fs/promises");
  const dir = path.join(process.cwd(), ".data", "pglite");
  await mkdir(dir, { recursive: true });
  const db = new PGlite(dir);
  await db.waitReady;
  const query: QueryFn = async (text, params = []) => {
    const result = await db.query(text, params);
    return result.rows as Row[];
  };
  await migrate(query);
  return {
    query,
    transaction: (fn) =>
      db.transaction(async (tx) =>
        fn(async (text, params = []) => {
          const result = await tx.query(text, params);
          return result.rows as Row[];
        }),
      ),
  };
}

async function openNeon(databaseUrl: string): Promise<Database> {
  const { Pool, neonConfig } = await import("@neondatabase/serverless");
  const ws = (await import("ws")).default;
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: databaseUrl });
  const query: QueryFn = async (text, params = []) => {
    const result = await pool.query(text, params);
    return result.rows as Row[];
  };
  await migrate(query);
  return {
    query,
    transaction: async (fn) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await fn(async (text, params = []) => {
          const rows = await client.query(text, params);
          return rows.rows as Row[];
        });
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
  };
}

export function getDatabase() {
  if (!globalDb.__loonyDb) {
    globalDb.__loonyDb = process.env.DATABASE_URL ? openNeon(process.env.DATABASE_URL) : openPglite();
  }
  return globalDb.__loonyDb;
}
