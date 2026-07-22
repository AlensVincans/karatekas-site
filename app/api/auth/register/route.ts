import { passwordPolicyError, registerAuthUser } from "../../../../lib/auth-store";
import { sendEmailConfirmation } from "../../../../lib/email";

export const runtime = "nodejs";

type RegisterPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: "user" | "b2b";
  company?: string;
  vatNumber?: string;
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
  let payload: RegisterPayload;

  try {
    payload = (await request.json()) as RegisterPayload;
  } catch {
    return Response.json({ ok: false, error: "Invalid registration payload." }, { status: 400 });
  }

  const firstName = clean(payload.firstName);
  const lastName = clean(payload.lastName);
  const email = clean(payload.email).toLowerCase();
  const password = clean(payload.password);
  const role = "user";

  if (!firstName || !lastName || !email || !password) {
    return Response.json({ ok: false, error: "Fill first name, last name, email and password." }, { status: 400 });
  }

  const policyError = passwordPolicyError(password);

  if (policyError) {
    return Response.json({ ok: false, error: policyError }, { status: 400 });
  }

  const result = await registerAuthUser({
    firstName,
    lastName,
    email,
    password,
    role,
    company: payload.company,
    vatNumber: payload.vatNumber,
  });

  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 409 });
  }

  const confirmUrl = `${originFromRequest(request)}/api/auth/confirm?token=${encodeURIComponent(result.confirmationToken)}`;

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
            ? `Account created, but confirmation email was not sent: ${error.message}`
            : "Account created, but confirmation email was not sent.",
      },
      { status: 503 },
    );
  }

  return Response.json({
    ok: true,
    message: "Registration created. Please confirm your email.",
  });
}
