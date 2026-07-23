import { dbQuery, hasDatabase } from "../../../db/postgres";

export const runtime = "nodejs";

async function count(sql: string) {
  const result = await dbQuery<{ count: string }>(sql);

  return Number(result.rows[0]?.count ?? 0);
}

export async function GET() {
  if (!hasDatabase()) {
    return Response.json(
      {
        ok: process.env.NODE_ENV !== "production",
        database: "not_configured",
        action: "Set DATABASE_URL and run npm run db:migrate.",
      },
      { status: process.env.NODE_ENV === "production" ? 503 : 200 },
    );
  }

  try {
    await dbQuery("select 1");
    const migrations = await count("select count(*) from kg_migrations");
    const products = await count("select count(*) from products where active = true");
    const users = await count("select count(*) from users");

    return Response.json({
      ok: migrations > 0 && products > 0 && users > 0,
      database: "ok",
      migrations,
      products,
      users,
      ready: migrations > 0 && products > 0 && users > 0,
      action:
        products > 0 && users > 0
          ? undefined
          : "Run npm run db:migrate, npm run db:seed and npm run db:create-admin.",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        database: "unavailable",
        error: error instanceof Error ? error.message : "Database check failed.",
        action: "Check DATABASE_URL, sslmode=require, and run npm run db:migrate.",
      },
      { status: 503 },
    );
  }
}
