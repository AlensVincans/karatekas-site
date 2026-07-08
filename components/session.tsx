"use client";

import { useEffect, useMemo, useState } from "react";
import { demoUsers, type DemoUser, type UserRole } from "../lib/store-data";

const usersKey = "bc_registered_users";
const sessionKey = "bc_session";
const sessionChangeEvent = "bc-session-change";
const demoUsersEnabled =
  process.env.NEXT_PUBLIC_ENABLE_DEMO_USERS === "true" ||
  (process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_ENABLE_DEMO_USERS !== "false");
let browserHydrated = false;

export type SessionUser = Omit<DemoUser, "password"> & {
  firstName?: string;
  lastName?: string;
  b2bRequest?: {
    id: string;
    status: "pending" | "approved" | "rejected";
    companyName: string;
    registrationNumber: string;
    address: string;
    phone: string;
  };
};
type StoredUser = DemoUser;

function readStoredUsers(): StoredUser[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(usersKey) ?? "[]") as StoredUser[];
  } catch {
    return [];
  }
}

function readSession(): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem(sessionKey) ?? "null") as SessionUser | null;
  } catch {
    return null;
  }
}

function withoutPassword(user: DemoUser): SessionUser {
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

function notifySessionChange() {
  window.dispatchEvent(new Event(sessionChangeEvent));
}

export function useDemoSession() {
  const [session, setSession] = useState<SessionUser | null>(() =>
    browserHydrated ? readSession() : null,
  );
  const [registeredUsers, setRegisteredUsers] = useState<StoredUser[]>(() =>
    browserHydrated ? readStoredUsers() : [],
  );
  const [serverUsers, setServerUsers] = useState<SessionUser[]>([]);

  function refreshServerUsers() {
    fetch("/api/auth/users")
      .then((response) => response.json())
      .then((data: { users?: SessionUser[] }) => {
        if (Array.isArray(data.users)) {
          setServerUsers(data.users);
        }
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    function syncFromStorage() {
      browserHydrated = true;
      setSession(readSession());
      setRegisteredUsers(readStoredUsers());
    }

    syncFromStorage();
    refreshServerUsers();
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(sessionChangeEvent, syncFromStorage);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(sessionChangeEvent, syncFromStorage);
    };
  }, []);

  const allUsers = useMemo(() => {
    const unique = new Map<string, SessionUser>();
    const demoSessionUsers = demoUsersEnabled ? demoUsers.map(withoutPassword) : [];
    const storedSessionUsers = demoUsersEnabled
      ? registeredUsers.map(withoutPassword)
      : [];

    for (const user of [
      ...demoSessionUsers,
      ...storedSessionUsers,
      ...serverUsers,
    ]) {
      unique.set(user.email.toLowerCase(), user);
    }

    return Array.from(unique.values());
  }, [registeredUsers, serverUsers]);

  function persistSession(user: SessionUser | null) {
    setSession(user);

    if (user) {
      window.localStorage.setItem(sessionKey, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(sessionKey);
    }

    notifySessionChange();
  }

  async function login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const localUser = demoUsersEnabled
      ? [...demoUsers, ...registeredUsers].find(
          (candidate) =>
            candidate.email.toLowerCase() === normalizedEmail && candidate.password === password,
        )
      : undefined;

    if (localUser) {
      if (!localUser.emailConfirmed) {
        return { ok: false, message: "Email is not confirmed yet." };
      }

      persistSession(withoutPassword(localUser));
      return { ok: true, message: "Signed in." };
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        user?: SessionUser;
        error?: string;
        message?: string;
      };

      if (!response.ok || !result.user) {
        return {
          ok: false,
          message: result.error || result.message || "Incorrect email or password.",
        };
      }

      persistSession(result.user);
      return { ok: true, message: result.message || "Signed in." };
    } catch {
      return { ok: false, message: "Could not sign in. Try again later." };
    }
  }

  async function register(input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: Extract<UserRole, "user" | "b2b">;
    company?: string;
    vatNumber?: string;
  }) {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        return {
          ok: false,
          message: result.error || result.message || "Registration failed.",
        };
      }

      refreshServerUsers();
      return {
        ok: true,
        message: result.message || "Registration created. Please confirm your email.",
      };
    } catch {
      return { ok: false, message: "Registration failed. Try again later." };
    }
  }

  function logout() {
    persistSession(null);
  }

  return {
    session,
    role: session?.role ?? "user",
    allUsers,
    login,
    register,
    logout,
  };
}
