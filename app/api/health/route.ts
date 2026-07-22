import { dbQuery, hasDatabase } from "../../../db/postgres";

export const runtime = "nodejs";

export async function GET() {
  if (!hasDatabase()) {
    return Response.json({
      ok: true,
      database: "not_configured",
    });
  }

  try {
    await dbQuery("select 1");

    return Response.json({
      ok: true,
      database: "ok",
    });
  } catch {
    return Response.json(
      {
        ok: false,
        database: "unavailable",
      },
      { status: 503 },
    );
  }
}
