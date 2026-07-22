import { getSessionUser } from "../../../../lib/server-auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();

  return Response.json({ user });
}
