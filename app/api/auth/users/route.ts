import { listPublicUsers } from "../../../../lib/auth-store";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ users: await listPublicUsers() });
}
