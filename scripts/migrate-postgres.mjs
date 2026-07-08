import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(root, "..");
const migrationsDir = path.join(projectRoot, "db", "migrations");

function databaseUrl() {
  const value = process.env.DATABASE_URL?.trim();

  if (!value) {
    throw new Error("DATABASE_URL is required to run PostgreSQL migrations.");
  }

  return /[?&]sslmode=/i.test(value)
    ? value
    : `${value}${value.includes("?") ? "&" : "?"}sslmode=require`;
}

async function main() {
  const pool = new Pool({
    connectionString: databaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();

  try {
    await client.query("begin");
    await client.query(`
      create table if not exists kg_migrations (
        id text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const applied = await client.query(
        "select 1 from kg_migrations where id = $1",
        [file],
      );

      if (applied.rowCount) {
        console.log(`skip ${file}`);
        continue;
      }

      const sql = await readFile(path.join(migrationsDir, file), "utf8");

      console.log(`apply ${file}`);
      await client.query(sql);
      await client.query("insert into kg_migrations (id) values ($1)", [file]);
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
