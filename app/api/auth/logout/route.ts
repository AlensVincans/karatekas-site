import { clearSessionCookie } from "../../../../lib/server-auth";

export const runtime = "nodejs";

export async function POST() {
  await clearSessionCookie();

  return Response.json({ ok: true });
}
