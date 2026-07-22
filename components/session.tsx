"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const sessionChangeEvent = "bc-session-change";

export type UserRole = "user" | "b2b" | "admin";
export type PaymentMethod = "card" | "invoice" | "defer15";

export type SessionUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  role: UserRole;
  company?: string;
  vatNumber?: string;
  creditLimit?: number;
  paymentTerms: PaymentMethod[];
  emailConfirmed: boolean;
  b2bRequest?: {
    id: string;
    status: "pending" | "approved" | "rejected";
    companyName: string;
    registrationNumber: string;
    address: string;
    phone: string;
  };
};

function notifySessionChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(sessionChangeEvent));
  }
}

async function readMe() {
  const response = await fetch("/api/auth/me", {
    cache: "no-store",
    credentials: "include",
  });
  const data = (await response.json().catch(() => ({}))) as {
    user?: SessionUser | null;
  };

  return response.ok ? data.user ?? null : null;
}

export function useDemoSession() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [allUsers, setAllUsers] = useState<SessionUser[]>([]);
  const [ready, setReady] = useState(false);

  const refreshSession = useCallback(async () => {
    const user = await readMe().catch(() => null);

    setSession(user);
    setReady(true);
    return user;
  }, []);

  const refreshServerUsers = useCallback(async () => {
    const current = session ?? (await refreshSession());

    if (current?.role !== "admin") {
      setAllUsers([]);
      return [];
    }

    const response = await fetch("/api/auth/users", {
      cache: "no-store",
      credentials: "include",
    });
    const data = (await response.json().catch(() => ({}))) as {
      users?: SessionUser[];
    };
    const users = response.ok && Array.isArray(data.users) ? data.users : [];

    setAllUsers(users);
    return users;
  }, [refreshSession, session]);

  useEffect(() => {
    let mounted = true;

    void readMe()
      .catch(() => null)
      .then((user) => {
        if (!mounted) {
          return;
        }

        setSession(user);
        setReady(true);
      });

    function syncFromServer() {
      void refreshSession();
    }

    window.addEventListener(sessionChangeEvent, syncFromServer);

    return () => {
      mounted = false;
      window.removeEventListener(sessionChangeEvent, syncFromServer);
    };
  }, [refreshSession]);

  useEffect(() => {
    let cancelled = false;

    if (session?.role !== "admin") {
      const timer = window.setTimeout(() => {
        if (!cancelled) {
          setAllUsers([]);
        }
      }, 0);

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    fetch("/api/auth/users", {
      cache: "no-store",
      credentials: "include",
    })
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }: { response: Response; data: { users?: SessionUser[] } }) => {
        if (!cancelled) {
          setAllUsers(response.ok && Array.isArray(data.users) ? data.users : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAllUsers([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session?.role]);

  async function login(email: string, password: string) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
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

      setSession(result.user);
      notifySessionChange();
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
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...input, role: "user" }),
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

      return {
        ok: true,
        message: result.message || "Registration created. Please confirm your email.",
      };
    } catch {
      return { ok: false, message: "Registration failed. Try again later." };
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => undefined);
    setSession(null);
    setAllUsers([]);
    notifySessionChange();
  }

  return useMemo(
    () => ({
      session,
      role: session?.role ?? "user",
      allUsers,
      login,
      register,
      logout,
      refreshUsers: refreshServerUsers,
      ready,
    }),
    [allUsers, ready, refreshServerUsers, session],
  );
}
