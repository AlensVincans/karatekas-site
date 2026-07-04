import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import path from "node:path";

import { demoUsers, type DemoUser, type PaymentMethod, type UserRole } from "./store-data";

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

export type PublicUser = Omit<DemoUser, "password"> & {
  firstName?: string;
  lastName?: string;
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

export async function listPublicUsers() {
  const store = await readStore();

  return [...demoUsers.map(publicDemoUser), ...store.users.map(publicUser)];
}

export async function registerAuthUser(input: RegisterUserInput) {
  const store = await readStore();
  const email = normalizeEmail(input.email);
  const policyError = passwordPolicyError(input.password);

  if (policyError) {
    return { ok: false as const, error: policyError };
  }

  const existingUser = store.users.find((user) => user.email.toLowerCase() === email);

  if (demoUsers.some((user) => user.email.toLowerCase() === email) || existingUser?.emailConfirmed) {
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
    role: input.role,
    company: input.company?.trim() || undefined,
    vatNumber: input.vatNumber?.trim() || undefined,
    creditLimit: input.role === "b2b" ? 2500 : undefined,
    paymentTerms: input.role === "b2b" ? ["card", "invoice", "defer15"] : ["card"],
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
  const store = await readStore();
  let confirmed: PublicUser | null = null;

  store.users = store.users.map((user) => {
    if (user.confirmationToken !== token) {
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

export async function authenticateAuthUser(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput);
  const store = await readStore();
  const user = store.users.find((candidate) => candidate.email.toLowerCase() === email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { ok: false as const, error: "Incorrect email or password." };
  }

  if (!user.emailConfirmed) {
    return { ok: false as const, error: "Email is not confirmed yet." };
  }

  return { ok: true as const, user: publicUser(user) };
}
