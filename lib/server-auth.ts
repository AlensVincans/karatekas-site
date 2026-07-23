import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { getPublicUserById, type PublicUser } from "./auth-store";

export const sessionCookieName = "kg_session";
export const csrfCookieName = "kg_csrf";
export const csrfHeaderName = "x-csrf-token";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;

type SessionPayload = {
  userId: string;
  iat: number;
  exp: number;
};

export class AuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function sessionSecret() {
  const secret = process.env.SESSION_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production.");
  }

  return "dev-karatekas-session-secret-change-me";
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function encodeSession(payload: SessionPayload) {
  const body = base64Url(JSON.stringify(payload));

  return `${body}.${sign(body)}`;
}

function decodeSession(value: string | undefined): SessionPayload | null {
  if (!value) {
    return null;
  }

  const [body, signature] = value.split(".");

  if (!body || !signature || !safeEqual(signature, sign(body))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);

    if (!payload.userId || payload.exp <= now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    maxAge: sessionMaxAgeSeconds,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

function csrfCookieOptions() {
  return {
    httpOnly: false,
    maxAge: sessionMaxAgeSeconds,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

function createCsrfToken() {
  return randomBytes(32).toString("base64url");
}

function validCsrfToken(value: string | undefined): value is string {
  return typeof value === "string" && value.length >= 32;
}

export async function ensureCsrfCookie() {
  const store = await cookies();
  const existing = store.get(csrfCookieName)?.value;

  if (validCsrfToken(existing)) {
    return existing;
  }

  const token = createCsrfToken();

  store.set(csrfCookieName, token, csrfCookieOptions());

  return token;
}

export async function setSessionCookie(user: Pick<PublicUser, "id">) {
  const now = Math.floor(Date.now() / 1000);
  const store = await cookies();

  store.set(
    sessionCookieName,
    encodeSession({
      userId: user.id,
      iat: now,
      exp: now + sessionMaxAgeSeconds,
    }),
    cookieOptions(),
  );

  store.set(csrfCookieName, createCsrfToken(), csrfCookieOptions());
}

export async function clearSessionCookie() {
  const store = await cookies();

  store.set(sessionCookieName, "", {
    ...cookieOptions(),
    maxAge: 0,
  });
  store.set(csrfCookieName, "", {
    ...csrfCookieOptions(),
    maxAge: 0,
  });
}

export async function getSessionUser() {
  const store = await cookies();
  const payload = decodeSession(store.get(sessionCookieName)?.value);

  if (!payload) {
    return null;
  }

  return getPublicUserById(payload.userId);
}

export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    throw new AuthError(401, "Authentication required.");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "admin") {
    throw new AuthError(403, "Admin access required.");
  }

  return user;
}

export async function requireCsrf(request: Request) {
  const method = request.method.toUpperCase();

  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return;
  }

  const store = await cookies();
  const cookieToken = store.get(csrfCookieName)?.value;
  const headerToken = request.headers.get(csrfHeaderName) ?? undefined;

  if (!validCsrfToken(cookieToken) || !validCsrfToken(headerToken) || !safeEqual(cookieToken, headerToken)) {
    throw new AuthError(403, "CSRF validation failed.");
  }
}

export async function requireAdminMutation(request: Request) {
  const admin = await requireAdmin();

  await requireCsrf(request);

  return admin;
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ ok: false, error: error.message }, { status: error.status });
  }

  throw error;
}

export function isAdmin(user: PublicUser | null | undefined) {
  return user?.role === "admin";
}

export function isApprovedB2B(user: PublicUser | null | undefined) {
  return user?.role === "b2b" || user?.role === "admin";
}
