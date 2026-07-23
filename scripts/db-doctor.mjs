import { readdir } from "node:fs/promises";
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
    throw new Error("DATABASE_URL is not configured.");
  }

  let url = /[?&]sslmode=/i.test(value)
    ? value
    : `${value}${value.includes("?") ? "&" : "?"}sslmode=require`;

  if (!/[?&]uselibpqcompat=/i.test(url)) {
    url = `${url}${url.includes("?") ? "&" : "?"}uselibpqcompat=true`;
  }

  return url;
}

function maskedTarget(value) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.username ? `${url.username}@` : ""}${url.host}${url.pathname}`;
  } catch {
    return "configured database";
  }
}

async function scalar(client, sql) {
  try {
    const result = await client.query(sql);
    return Number(result.rows[0]?.count ?? 0);
  } catch {
    return null;
  }
}

async function tableExists(client, tableName) {
  const result = await client.query(
    "select to_regclass($1) as table_name",
    [`public.${tableName}`],
  );

  return Boolean(result.rows[0]?.table_name);
}

async function main() {
  const connectionString = databaseUrl();
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  const expectedMigrations = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  try {
    const client = await pool.connect();

    try {
      await client.query("select 1");
      const migrationsTable = await tableExists(client, "kg_migrations");
      const appliedMigrations = migrationsTable
        ? (await client.query("select id from kg_migrations order by id")).rows.map((row) => row.id)
        : [];
      const missingMigrations = expectedMigrations.filter(
        (file) => !appliedMigrations.includes(file),
      );
      const counts = {
        users: await scalar(client, "select count(*) from users"),
        products: await scalar(client, "select count(*) from products where active = true"),
        stockLevels: await scalar(client, "select count(*) from stock_levels"),
        orders: await scalar(client, "select count(*) from orders"),
        siteSettings: await scalar(client, "select count(*) from site_settings"),
      };

      console.log(`database: ok (${maskedTarget(connectionString)})`);
      console.log(`migrations: ${appliedMigrations.length}/${expectedMigrations.length}`);
      if (missingMigrations.length) {
        console.log(`missing migrations: ${missingMigrations.join(", ")}`);
      }
      console.log(`counts: ${JSON.stringify(counts)}`);

      if (missingMigrations.length || !counts.products || !counts.users) {
        process.exitCode = 2;
      }
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
