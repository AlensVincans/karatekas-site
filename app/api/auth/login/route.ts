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

  let result: Awaited<ReturnType<typeof authenticateAuthUser>>;

  try {
    result = await authenticateAuthUser(payload.email ?? "", payload.password ?? "");
  } catch (error) {
    console.error("Login authentication failed", error instanceof Error ? error.message : error);

    return Response.json(
      {
        ok: false,
        code: "auth_unavailable",
        error: "Login service is unavailable. Please try again later.",
      },
      { status: 503 },
    );
  }

  if (!result.ok) {
    return Response.json({ ok: false, code: result.code, error: result.error }, { status: 401 });
  }

  try {
    await setSessionCookie(result.user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const missingSessionSecret = message.includes("SESSION_SECRET");

    console.error(
      "Login session creation failed",
      missingSessionSecret ? "SESSION_SECRET is missing" : message || error,
    );

    return Response.json(
      {
        ok: false,
        code: missingSessionSecret ? "session_secret_missing" : "session_unavailable",
        error: missingSessionSecret
          ? "Login session is not configured. Set SESSION_SECRET in the app environment."
          : "Login session could not be created. Please try again later.",
      },
      { status: 503 },
    );
  }

  return Response.json({ ok: true, user: result.user });
}
