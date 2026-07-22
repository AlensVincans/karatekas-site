import { authenticateAuthUser } from "../../../../lib/auth-store";
import { setSessionCookie } from "../../../../lib/server-auth";

export const runtime = "nodejs";

type LoginPayload = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  let payload: LoginPayload;

  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return Response.json({ ok: false, error: "Invalid login payload." }, { status: 400 });
  }

  const result = await authenticateAuthUser(payload.email ?? "", payload.password ?? "");

  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 401 });
  }

  await setSessionCookie(result.user);

  return Response.json({ ok: true, user: result.user });
}
