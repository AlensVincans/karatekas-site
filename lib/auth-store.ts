import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import path from "node:path";

import { demoUsers, type DemoUser, type PaymentMethod, type UserRole } from "./store-data";
import { dbQuery, hasDatabase } from "../db/postgres";

type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  company?: string;
  vatNumber?: string;
  creditLimit?: number;
  paymentTerms: PaymentMethod[];
  emailConfirmed: boolean;
  confirmationToken?: string;
  confirmationSentAt?: string;
  createdAt: string;
  updatedAt: string;
};

type AuthStore = {
  users: AuthUser[];
};

const confirmationTokenTtlMs = 48 * 60 * 60 * 1000;

export type B2BRequestStatus = "pending" | "approved" | "rejected";

export type B2BRequest = {
  id: string;
  userId?: string;
  email: string;
  companyName: string;
  registrationNumber: string;
  address: string;
  phone: string;
  status: B2BRequestStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicUser = Omit<DemoUser, "password"> & {
  firstName?: string;
  lastName?: string;
  b2bRequest?: B2BRequest;
};

export type RegisterUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Extract<UserRole, "user" | "b2b">;
  company?: string;
  vatNumber?: string;
};

function authStorePath() {
  return process.env.AUTH_USERS_FILE?.trim() || path.join(process.cwd(), "data", "users.json");
}

function emptyStore(): AuthStore {
  return { users: [] };
}

async function readStore(): Promise<AuthStore> {
  try {
    const file = await readFile(authStorePath(), "utf8");
    const parsed = JSON.parse(file) as Partial<AuthStore>;

    return Array.isArray(parsed.users) ? { users: parsed.users } : emptyStore();
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: AuthStore) {
  const file = authStorePath();
  const tempFile = `${file}.tmp`;

  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(tempFile, JSON.stringify(store, null, 2), "utf8");
  await rename(tempFile, file);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function iso(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return typeof value === "string" ? value : new Date().toISOString();
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const iterations = 120_000;
  const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("hex");

  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [scheme, iterationsText, salt, hash] = storedHash.split("$");

  if (scheme !== "pbkdf2" || !iterationsText || !salt || !hash) {
    return false;
  }

  const iterations = Number(iterationsText);
  const expected = Buffer.from(hash, "hex");
  const actual = pbkdf2Sync(password, salt, iterations, expected.length, "sha256");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function passwordPolicyError(password: string) {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }

  return null;
}

function publicUser(user: AuthUser): PublicUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: user.name,
    email: user.email,
    role: user.role,
    company: user.company,
    vatNumber: user.vatNumber,
    creditLimit: user.creditLimit,
    paymentTerms: user.paymentTerms,
    emailConfirmed: user.emailConfirmed,
  };
}

function publicUserWithRequest(user: AuthUser, request?: B2BRequest): PublicUser {
  return {
    ...publicUser(user),
    b2bRequest: request,
  };
}

function publicDemoUser(user: DemoUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    company: user.company,
    vatNumber: user.vatNumber,
    creditLimit: user.creditLimit,
    paymentTerms: user.paymentTerms,
    emailConfirmed: user.emailConfirmed,
  };
}

function demoUsersAllowed() {
  return process.env.NODE_ENV !== "production" && process.env.ENABLE_DEMO_USERS === "true";
}

function localAuthStoreAllowed() {
  return process.env.NODE_ENV !== "production";
}

function mapPublicUserRow(user: {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  role: UserRole;
  company: string | null;
  vat_number: string | null;
  credit_limit: string | null;
  payment_terms: PaymentMethod[];
  email_confirmed: boolean;
}): PublicUser {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    name: user.name,
    email: user.email,
    role: user.role,
    company: user.company ?? undefined,
    vatNumber: user.vat_number ?? undefined,
    creditLimit: user.credit_limit ? Number(user.credit_limit) : undefined,
    paymentTerms: user.payment_terms,
    emailConfirmed: user.email_confirmed,
  };
}

export async function listPublicUsers() {
  if (hasDatabase()) {
    const users = await dbQuery<{
      id: string;
      first_name: string;
      last_name: string;
      name: string;
      email: string;
      role: UserRole;
      company: string | null;
      vat_number: string | null;
      credit_limit: string | null;
      payment_terms: PaymentMethod[];
      email_confirmed: boolean;
    }>(
      "select id, first_name, last_name, name, email, role, company, vat_number, credit_limit, payment_terms, email_confirmed from users order by created_at desc",
    );
    const requests = await listB2BRequests();
    const requestsByEmail = new Map(requests.map((request) => [request.email.toLowerCase(), request]));

    return users.rows.map((user) => ({
      ...mapPublicUserRow(user),
      b2bRequest: requestsByEmail.get(user.email.toLowerCase()),
    }));
  }

  const store = await readStore();
  const fallbackUsers = demoUsersAllowed() ? demoUsers.map(publicDemoUser) : [];

  return [...fallbackUsers, ...store.users.map(publicUser)];
}

export async function getPublicUserById(id: string) {
  if (!id.trim()) {
    return null;
  }

  if (hasDatabase()) {
    const result = await dbQuery<{
      id: string;
      first_name: string;
      last_name: string;
      name: string;
      email: string;
      role: UserRole;
      company: string | null;
      vat_number: string | null;
      credit_limit: string | null;
      payment_terms: PaymentMethod[];
      email_confirmed: boolean;
    }>(
      `select id, first_name, last_name, name, email, role, company, vat_number,
        credit_limit, payment_terms, email_confirmed
       from users
       where id = $1
       limit 1`,
      [id],
    );
    const user = result.rows[0];

    if (!user) {
      return null;
    }

    const requests = await listB2BRequests();
    const b2bRequest = requests.find(
      (request) => request.email.toLowerCase() === user.email.toLowerCase(),
    );

    return {
      ...mapPublicUserRow(user),
      b2bRequest,
    };
  }

  const store = await readStore();
  const user = store.users.find((candidate) => candidate.id === id);

  if (user) {
    return publicUserWithRequest(user);
  }

  const demoUser = demoUsersAllowed()
    ? demoUsers.find((candidate) => candidate.id === id)
    : undefined;

  return demoUser ? publicDemoUser(demoUser) : null;
}

export async function setUserB2BAccess(input: {
  email: string;
  enabled: boolean;
  adminNote?: string;
}) {
  const email = normalizeEmail(input.email);

  if (!hasDatabase()) {
    const store = await readStore();
    let updated: PublicUser | null = null;

    store.users = store.users.map((user) => {
      if (user.email.toLowerCase() !== email) {
        return user;
      }

      const next: AuthUser = {
        ...user,
        role: input.enabled ? "b2b" : "user",
        creditLimit: input.enabled ? user.creditLimit ?? 2500 : undefined,
        paymentTerms: input.enabled ? ["card", "invoice", "defer15"] : ["card"],
        updatedAt: new Date().toISOString(),
      };

      updated = publicUser(next);
      return next;
    });

    if (updated) {
      await writeStore(store);
    }

    return updated;
  }

  const result = await dbQuery<{
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
    role: UserRole;
    company: string | null;
    vat_number: string | null;
    credit_limit: string | null;
    payment_terms: PaymentMethod[];
    email_confirmed: boolean;
  }>(
    `update users
     set role = $2,
         credit_limit = $3,
         payment_terms = $4::jsonb,
         updated_at = now()
     where lower(email) = lower($1)
     returning id, first_name, last_name, name, email, role, company, vat_number,
       credit_limit, payment_terms, email_confirmed`,
    [
      email,
      input.enabled ? "b2b" : "user",
      input.enabled ? 2500 : null,
      JSON.stringify(input.enabled ? ["card", "invoice", "defer15"] : ["card"]),
    ],
  );

  const user = result.rows[0];

  if (!user) {
    return null;
  }

  if (!input.enabled) {
    await dbQuery(
      `update b2b_requests
       set status = 'rejected',
           admin_note = $2,
           updated_at = now()
       where lower(email) = lower($1) and status in ('pending', 'approved')`,
      [email, input.adminNote?.trim() || "B2B access removed by admin."],
    );
  }

  const requests = await listB2BRequests();
  const request = requests.find((item) => item.email.toLowerCase() === email);

  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    name: user.name,
    email: user.email,
    role: user.role,
    company: user.company ?? undefined,
    vatNumber: user.vat_number ?? undefined,
    creditLimit: user.credit_limit ? Number(user.credit_limit) : undefined,
    paymentTerms: user.payment_terms,
    emailConfirmed: user.email_confirmed,
    b2bRequest: request,
  };
}

export async function registerAuthUser(input: RegisterUserInput) {
  if (input.role === "b2b") {
    return { ok: false as const, error: "B2B accounts are approved by administrator after request." };
  }

  if (hasDatabase()) {
    const email = normalizeEmail(input.email);
    const policyError = passwordPolicyError(input.password);

    if (policyError) {
      return { ok: false as const, error: policyError };
    }

    const existing = await dbQuery<{ id: string; email_confirmed: boolean }>(
      "select id, email_confirmed from users where lower(email) = lower($1)",
      [email],
    );

    if (existing.rows[0]?.email_confirmed) {
      return { ok: false as const, error: "A user with this email already exists." };
    }

    if (existing.rows[0]) {
      await dbQuery("delete from users where id = $1", [existing.rows[0].id]);
    }

    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const name = [firstName, lastName].filter(Boolean).join(" ") || email;
    const now = new Date().toISOString();
    const confirmationToken = randomBytes(32).toString("hex");
    const user: AuthUser = {
      id: `usr-${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`,
      firstName,
      lastName,
      name,
      email,
      passwordHash: hashPassword(input.password),
      role: "user",
      company: undefined,
      vatNumber: undefined,
      creditLimit: undefined,
      paymentTerms: ["card"],
      emailConfirmed: false,
      confirmationToken,
      confirmationSentAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await dbQuery(
      `insert into users (
        id, first_name, last_name, name, email, password_hash, role, company,
        vat_number, credit_limit, payment_terms, email_confirmed,
        confirmation_token, confirmation_sent_at, created_at, updated_at
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16)`,
      [
        user.id,
        user.firstName,
        user.lastName,
        user.name,
        user.email,
        user.passwordHash,
        user.role,
        user.company,
        user.vatNumber,
        user.creditLimit,
        JSON.stringify(user.paymentTerms),
        user.emailConfirmed,
        user.confirmationToken,
        user.confirmationSentAt,
        user.createdAt,
        user.updatedAt,
      ],
    );

    return { ok: true as const, user: publicUser(user), confirmationToken };
  }

  if (!localAuthStoreAllowed()) {
    return { ok: false as const, error: "DATABASE_URL is required in production." };
  }

  const store = await readStore();
  const email = normalizeEmail(input.email);
  const policyError = passwordPolicyError(input.password);

  if (policyError) {
    return { ok: false as const, error: policyError };
  }

  const existingUser = store.users.find((user) => user.email.toLowerCase() === email);

  if (
    (demoUsersAllowed() && demoUsers.some((user) => user.email.toLowerCase() === email)) ||
    existingUser?.emailConfirmed
  ) {
    return { ok: false as const, error: "A user with this email already exists." };
  }

  if (existingUser) {
    store.users = store.users.filter((user) => user.email.toLowerCase() !== email);
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const name = [firstName, lastName].filter(Boolean).join(" ") || email;
  const now = new Date().toISOString();
  const confirmationToken = randomBytes(32).toString("hex");
  const user: AuthUser = {
    id: `usr-${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`,
    firstName,
    lastName,
    name,
    email,
    passwordHash: hashPassword(input.password),
    role: "user",
    company: undefined,
    vatNumber: undefined,
    creditLimit: undefined,
    paymentTerms: ["card"],
    emailConfirmed: false,
    confirmationToken,
    confirmationSentAt: now,
    createdAt: now,
    updatedAt: now,
  };

  store.users = [user, ...store.users];
  await writeStore(store);

  return { ok: true as const, user: publicUser(user), confirmationToken };
}

export async function confirmAuthUser(token: string) {
  if (hasDatabase()) {
    const result = await dbQuery<{
      id: string;
      first_name: string;
      last_name: string;
      name: string;
      email: string;
      role: UserRole;
      company: string | null;
      vat_number: string | null;
      credit_limit: string | null;
      payment_terms: PaymentMethod[];
      email_confirmed: boolean;
    }>(
      `update users
       set email_confirmed = true, confirmation_token = null, updated_at = now()
       where confirmation_token = $1
         and confirmation_sent_at > now() - interval '48 hours'
       returning id, first_name, last_name, name, email, role, company, vat_number, credit_limit, payment_terms, email_confirmed`,
      [token],
    );
    const user = result.rows[0];

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company ?? undefined,
      vatNumber: user.vat_number ?? undefined,
      creditLimit: user.credit_limit ? Number(user.credit_limit) : undefined,
      paymentTerms: user.payment_terms,
      emailConfirmed: user.email_confirmed,
    };
  }

  const store = await readStore();
  let confirmed: PublicUser | null = null;

  store.users = store.users.map((user) => {
    if (user.confirmationToken !== token) {
      return user;
    }

    if (
      !user.confirmationSentAt ||
      Date.now() - new Date(user.confirmationSentAt).getTime() > confirmationTokenTtlMs
    ) {
      return user;
    }

    const next = {
      ...user,
      emailConfirmed: true,
      confirmationToken: undefined,
      updatedAt: new Date().toISOString(),
    };

    confirmed = publicUser(next);
    return next;
  });

  if (!confirmed) {
    return null;
  }

  await writeStore(store);
  return confirmed;
}

export async function issueEmailConfirmation(emailInput: string) {
  const email = normalizeEmail(emailInput);
  const now = new Date().toISOString();
  const confirmationToken = randomBytes(32).toString("hex");

  if (!email) {
    return { ok: false as const, code: "not_found" as const, error: "Account not found." };
  }

  if (hasDatabase()) {
    const result = await dbQuery<{
      id: string;
      first_name: string;
      last_name: string;
      name: string;
      email: string;
      role: UserRole;
      company: string | null;
      vat_number: string | null;
      credit_limit: string | null;
      payment_terms: PaymentMethod[];
      email_confirmed: boolean;
    }>(
      `update users
       set confirmation_token = $2,
           confirmation_sent_at = now(),
           updated_at = now()
       where lower(email) = lower($1)
         and email_confirmed = false
       returning id, first_name, last_name, name, email, role, company, vat_number,
         credit_limit, payment_terms, email_confirmed`,
      [email, confirmationToken],
    );
    const user = result.rows[0];

    if (!user) {
      return { ok: false as const, code: "not_found" as const, error: "Account not found or already confirmed." };
    }

    return {
      ok: true as const,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company ?? undefined,
        vatNumber: user.vat_number ?? undefined,
        creditLimit: user.credit_limit ? Number(user.credit_limit) : undefined,
        paymentTerms: user.payment_terms,
        emailConfirmed: user.email_confirmed,
      },
      confirmationToken,
    };
  }

  if (!localAuthStoreAllowed()) {
    return { ok: false as const, code: "not_found" as const, error: "DATABASE_URL is required in production." };
  }

  const store = await readStore();
  let updated: AuthUser | null = null;

  store.users = store.users.map((user) => {
    if (user.email.toLowerCase() !== email || user.emailConfirmed) {
      return user;
    }

    updated = {
      ...user,
      confirmationToken,
      confirmationSentAt: now,
      updatedAt: now,
    };

    return updated;
  });

  if (!updated) {
    return { ok: false as const, code: "not_found" as const, error: "Account not found or already confirmed." };
  }

  await writeStore(store);

  return {
    ok: true as const,
    user: publicUser(updated),
    confirmationToken,
  };
}

export async function authenticateAuthUser(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput);

  if (hasDatabase()) {
    const result = await dbQuery<{
      id: string;
      first_name: string;
      last_name: string;
      name: string;
      email: string;
      password_hash: string;
      role: UserRole;
      company: string | null;
      vat_number: string | null;
      credit_limit: string | null;
      payment_terms: PaymentMethod[];
      email_confirmed: boolean;
    }>(
      "select id, first_name, last_name, name, email, password_hash, role, company, vat_number, credit_limit, payment_terms, email_confirmed from users where lower(email) = lower($1)",
      [email],
    );
    const user = result.rows[0];

    if (!user || !verifyPassword(password, user.password_hash)) {
      return { ok: false as const, error: "Incorrect email or password." };
    }

    if (!user.email_confirmed) {
      return {
        ok: false as const,
        code: "email_unconfirmed" as const,
        error: "Email is not confirmed yet.",
      };
    }

    return {
      ok: true as const,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company ?? undefined,
        vatNumber: user.vat_number ?? undefined,
        creditLimit: user.credit_limit ? Number(user.credit_limit) : undefined,
        paymentTerms: user.payment_terms,
        emailConfirmed: user.email_confirmed,
      },
    };
  }

  if (!localAuthStoreAllowed()) {
    return { ok: false as const, error: "DATABASE_URL is required in production." };
  }

  const store = await readStore();
  const user = store.users.find((candidate) => candidate.email.toLowerCase() === email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { ok: false as const, error: "Incorrect email or password." };
  }

  if (!user.emailConfirmed) {
    return {
      ok: false as const,
      code: "email_unconfirmed" as const,
      error: "Email is not confirmed yet.",
    };
  }

  return { ok: true as const, user: publicUser(user) };
}

function mapB2BRequest(row: {
  id: string;
  user_id: string | null;
  email: string;
  company_name: string;
  registration_number: string;
  address: string;
  phone: string;
  status: B2BRequestStatus;
  admin_note: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}): B2BRequest {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    email: row.email,
    companyName: row.company_name,
    registrationNumber: row.registration_number,
    address: row.address,
    phone: row.phone,
    status: row.status,
    adminNote: row.admin_note ?? undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export async function listB2BRequests() {
  if (!hasDatabase()) {
    return [];
  }

  const result = await dbQuery<{
    id: string;
    user_id: string | null;
    email: string;
    company_name: string;
    registration_number: string;
    address: string;
    phone: string;
    status: B2BRequestStatus;
    admin_note: string | null;
    created_at: Date;
    updated_at: Date;
  }>("select * from b2b_requests order by created_at desc");

  return result.rows.map(mapB2BRequest);
}

export async function createB2BRequest(input: {
  userId?: string;
  email: string;
  companyName: string;
  registrationNumber: string;
  address: string;
  phone: string;
}) {
  if (!hasDatabase()) {
    return {
      id: `b2b-${Date.now().toString(36)}`,
      userId: input.userId,
      email: normalizeEmail(input.email),
      companyName: input.companyName,
      registrationNumber: input.registrationNumber,
      address: input.address,
      phone: input.phone,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const email = normalizeEmail(input.email);
  const existing = await dbQuery<{ id: string }>(
    "select id from b2b_requests where lower(email) = lower($1) and status = 'pending'",
    [email],
  );

  if (existing.rows[0]) {
    return null;
  }

  const result = await dbQuery<{
    id: string;
    user_id: string | null;
    email: string;
    company_name: string;
    registration_number: string;
    address: string;
    phone: string;
    status: B2BRequestStatus;
    admin_note: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `insert into b2b_requests (
      id, user_id, email, company_name, registration_number, address, phone
    ) values ($1,$2,$3,$4,$5,$6,$7)
    returning *`,
    [
      `b2b-${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`,
      input.userId,
      email,
      input.companyName.trim(),
      input.registrationNumber.trim(),
      input.address.trim(),
      input.phone.trim(),
    ],
  );

  return mapB2BRequest(result.rows[0]);
}

export async function reviewB2BRequest(input: {
  id: string;
  status: Extract<B2BRequestStatus, "approved" | "rejected">;
  adminNote?: string;
}) {
  if (!hasDatabase()) {
    return null;
  }

  const updated = await dbQuery<{
    id: string;
    user_id: string | null;
    email: string;
    company_name: string;
    registration_number: string;
    address: string;
    phone: string;
    status: B2BRequestStatus;
    admin_note: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `update b2b_requests
     set status = $2, admin_note = $3, updated_at = now()
     where id = $1
     returning *`,
    [input.id, input.status, input.adminNote?.trim() || null],
  );
  const request = updated.rows[0];

  if (!request) {
    return null;
  }

  if (input.status === "approved") {
    await dbQuery(
      `update users
       set role = 'b2b',
           company = $2,
           vat_number = $3,
           credit_limit = 2500,
           payment_terms = '["card","invoice","defer15"]'::jsonb,
           updated_at = now()
       where lower(email) = lower($1)`,
      [request.email, request.company_name, request.registration_number],
    );
  }

  return mapB2BRequest(request);
}
