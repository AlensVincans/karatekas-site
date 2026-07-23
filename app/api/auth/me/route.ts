import { ensureCsrfCookie, getSessionUser } from "../../../../lib/server-auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();

  if (user) {
    await ensureCsrfCookie();
  }

  return Response.json({ user });
}
