import { Pool, type QueryResultRow } from "pg";

const globalForPool = globalThis as typeof globalThis & {
  __karatekasPgPool?: Pool;
};

function databaseUrl() {
  return process.env.DATABASE_URL?.trim() || "";
}

function connectionString() {
  const value = databaseUrl();

  if (!value) {
    return "";
  }

  if (/[?&]sslmode=/i.test(value)) {
    return value;
  }

  return `${value}${value.includes("?") ? "&" : "?"}sslmode=require`;
}

export function hasDatabase() {
  return Boolean(databaseUrl());
}

export function requireDatabaseUrl() {
  const url = connectionString();

  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return url;
}

export function getPool() {
  if (!hasDatabase()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!globalForPool.__karatekasPgPool) {
    globalForPool.__karatekasPgPool = new Pool({
      connectionString: requireDatabaseUrl(),
      ssl: { rejectUnauthorized: false },
    });
  }

  return globalForPool.__karatekasPgPool;
}

export async function dbQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  return getPool().query<T>(text, params);
}

export async function dbTransaction<T>(
  callback: (query: <Row extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ) => Promise<{ rows: Row[]; rowCount: number | null }>) => Promise<T>,
) {
  const client = await getPool().connect();

  try {
    await client.query("begin");
    const result = await callback((text, params = []) => client.query(text, params));
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
