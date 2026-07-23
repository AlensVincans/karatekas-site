import { issueEmailConfirmation } from "../../../../lib/auth-store";
import { sendEmailConfirmation } from "../../../../lib/email";
import { rateLimit, rateLimitByEmail } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

type ResendPayload = {
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
    key: "auth:resend-confirmation:ip",
    limit: 6,
    windowMs: 60 * 60_000,
  });

  if (ipLimited) {
    return ipLimited;
  }

  let payload: ResendPayload;

  try {
    payload = (await request.json()) as ResendPayload;
  } catch {
    return Response.json({ ok: false, error: "Invalid confirmation payload." }, { status: 400 });
  }

  const email = clean(payload.email).toLowerCase();

  const emailLimited = rateLimitByEmail(request, email, {
    key: "auth:resend-confirmation:email",
    limit: 3,
    windowMs: 60 * 60_000,
  });

  if (emailLimited) {
    return emailLimited;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  const result = await issueEmailConfirmation(email);

  if (!result.ok) {
    return Response.json({
      ok: true,
      message: "If this email needs confirmation, a new confirmation link has been sent.",
    });
  }

  const confirmUrl = `${originFromRequest(request)}/api/auth/confirm?token=${encodeURIComponent(
    result.confirmationToken,
  )}`;

  try {
    await sendEmailConfirmation({
      to: result.user.email,
      name: result.user.name,
      confirmUrl,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? `Could not send confirmation email: ${error.message}`
            : "Could not send confirmation email.",
      },
      { status: 503 },
    );
  }

  return Response.json({
    ok: true,
    message: "Confirmation email sent. Please check your inbox.",
  });
}
