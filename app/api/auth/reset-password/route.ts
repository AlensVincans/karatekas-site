import { passwordPolicyError, resetAuthUserPassword } from "../../../../lib/auth-store";
import { rateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

type ResetPasswordPayload = {
  token?: string;
  password?: string;
  confirmPassword?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const ipLimited = rateLimit(request, {
    key: "auth:reset-password:ip",
    limit: 10,
    windowMs: 60 * 60_000,
  });

  if (ipLimited) {
    return ipLimited;
  }

  let payload: ResetPasswordPayload;

  try {
    payload = (await request.json()) as ResetPasswordPayload;
  } catch {
    return Response.json({ ok: false, error: "Invalid password reset payload." }, { status: 400 });
  }

  const token = clean(payload.token);
  const password = clean(payload.password);
  const confirmPassword = clean(payload.confirmPassword);
  const policyError = passwordPolicyError(password);

  if (!token) {
    return Response.json({ ok: false, error: "Password reset link is invalid or expired." }, { status: 400 });
  }

  if (policyError) {
    return Response.json({ ok: false, error: policyError }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return Response.json({ ok: false, error: "Passwords do not match." }, { status: 400 });
  }

  const result = await resetAuthUserPassword(token, password);

  if (!result.ok) {
    return Response.json({ ok: false, code: result.code, error: result.error }, { status: 400 });
  }

  return Response.json({ ok: true, message: "Password changed. You can sign in now." });
}
