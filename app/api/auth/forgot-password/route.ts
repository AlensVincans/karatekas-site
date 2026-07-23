import { issuePasswordReset } from "../../../../lib/auth-store";
import { sendPasswordResetEmail } from "../../../../lib/email";
import { rateLimit, rateLimitByEmail } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

type ForgotPasswordPayload = {
  email?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function originFromRequest(request: Request) {
  const configuredOrigin = process.env.APP_URL?.trim();

  if (configuredOrigin) {
    return configuredOrigin.replace(/\/$/, "");
  }

  const url = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (forwardedHost) {
    return `${forwardedProto || url.protocol.replace(":", "")}://${forwardedHost}`;
  }

  return url.origin;
}

export async function POST(request: Request) {
  const ipLimited = rateLimit(request, {
    key: "auth:forgot-password:ip",
    limit: 6,
    windowMs: 60 * 60_000,
  });

  if (ipLimited) {
    return ipLimited;
  }

  let payload: ForgotPasswordPayload;

  try {
    payload = (await request.json()) as ForgotPasswordPayload;
  } catch {
    return Response.json({ ok: false, error: "Invalid password reset payload." }, { status: 400 });
  }

  const email = clean(payload.email).toLowerCase();

  const emailLimited = rateLimitByEmail(request, email, {
    key: "auth:forgot-password:email",
    limit: 3,
    windowMs: 60 * 60_000,
  });

  if (emailLimited) {
    return emailLimited;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  const result = await issuePasswordReset(email);

  if (result.ok) {
    const resetUrl = `${originFromRequest(request)}/reset-password?token=${encodeURIComponent(
      result.passwordResetToken,
    )}`;

    try {
      await sendPasswordResetEmail({
        to: result.user.email,
        name: result.user.name,
        resetUrl,
      });
    } catch (error) {
      console.error("Password reset email failed", error instanceof Error ? error.message : error);

      return Response.json(
        { ok: false, error: "Could not send password reset email. Please try again later." },
        { status: 503 },
      );
    }
  }

  return Response.json({
    ok: true,
    message: "If this email is registered, a password reset link has been sent.",
  });
}
