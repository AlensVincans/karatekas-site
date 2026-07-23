import { authenticateAuthUser } from "../../../../lib/auth-store";
import { rateLimit, rateLimitByEmail } from "../../../../lib/rate-limit";
import { setSessionCookie } from "../../../../lib/server-auth";

export const runtime = "nodejs";

type LoginPayload = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const ipLimited = rateLimit(request, {
    key: "auth:login:ip",
    limit: 20,
    windowMs: 15 * 60_000,
  });

  if (ipLimited) {
    return ipLimited;
  }

  let payload: LoginPayload;

  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return Response.json({ ok: false, error: "Invalid login payload." }, { status: 400 });
  }

  const emailLimited = rateLimitByEmail(request, payload.email ?? "", {
    key: "auth:login:email",
    limit: 8,
    windowMs: 15 * 60_000,
  });

  if (emailLimited) {
    return emailLimited;
  }

  const result = await authenticateAuthUser(payload.email ?? "", payload.password ?? "");

  if (!result.ok) {
    return Response.json({ ok: false, code: result.code, error: result.error }, { status: 401 });
  }

  await setSessionCookie(result.user);

  return Response.json({ ok: true, user: result.user });
}
