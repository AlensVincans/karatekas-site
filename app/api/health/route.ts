import { dbQuery, hasDatabase } from "../../../db/postgres";

export const runtime = "nodejs";

async function count(sql: string) {
  const result = await dbQuery<{ count: string }>(sql);

  return Number(result.rows[0]?.count ?? 0);
}

export async function GET() {
  const sessionSecretConfigured = Boolean(process.env.SESSION_SECRET?.trim());

  if (!hasDatabase()) {
    return Response.json(
      {
        ok: process.env.NODE_ENV !== "production",
        database: "not_configured",
        auth: {
          sessionSecret: sessionSecretConfigured ? "configured" : "missing",
        },
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
    const confirmedUsers = await count("select count(*) from users where email_confirmed = true");
    const admins = await count("select count(*) from users where role = 'admin'");
    const pbkdf2Users = await count("select count(*) from users where password_hash like 'pbkdf2$%'");
    const authReady =
      sessionSecretConfigured &&
      users > 0 &&
      confirmedUsers > 0 &&
      admins > 0 &&
      pbkdf2Users > 0;

    return Response.json({
      ok: migrations > 0 && products > 0 && users > 0 && authReady,
      database: "ok",
      migrations,
      products,
      users,
      auth: {
        sessionSecret: sessionSecretConfigured ? "configured" : "missing",
        confirmedUsers,
        admins,
        pbkdf2Users,
        ready: authReady,
      },
      ready: migrations > 0 && products > 0 && users > 0 && authReady,
      action: !sessionSecretConfigured
        ? "Set SESSION_SECRET to a stable random value and redeploy."
        : products > 0 && users > 0 && confirmedUsers > 0 && admins > 0 && pbkdf2Users > 0
          ? undefined
          : "Run npm run db:migrate, npm run db:seed and npm run db:create-admin. Make sure users are email-confirmed and passwords use the current hash format.",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        database: "unavailable",
        auth: {
          sessionSecret: sessionSecretConfigured ? "configured" : "missing",
        },
        error: error instanceof Error ? error.message : "Database check failed.",
        action: "Check DATABASE_URL, sslmode=require, and run npm run db:migrate.",
      },
      { status: 503 },
    );
  }
}
