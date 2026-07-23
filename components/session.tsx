"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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

type SessionContextValue = {
  session: SessionUser | null;
  role: UserRole;
  allUsers: SessionUser[];
  login: (email: string, password: string) => Promise<{
    ok: boolean;
    code?: string;
    message?: string;
  }>;
  register: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: Extract<UserRole, "user" | "b2b">;
    company?: string;
    vatNumber?: string;
  }) => Promise<{ ok: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshUsers: () => Promise<SessionUser[]>;
  ready: boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);

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

function useSessionStore(initialSession: SessionUser | null | undefined) {
  const hasInitialSessionSnapshot = initialSession !== undefined;
  const [session, setSession] = useState<SessionUser | null>(initialSession ?? null);
  const [allUsers, setAllUsers] = useState<SessionUser[]>([]);
  const [ready, setReady] = useState(hasInitialSessionSnapshot);

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
    if (hasInitialSessionSnapshot) {
      return undefined;
    }

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
  }, [hasInitialSessionSnapshot, refreshSession]);

  useEffect(() => {
    if (!hasInitialSessionSnapshot) {
      return undefined;
    }

    function syncFromServer() {
      void refreshSession();
    }

    window.addEventListener(sessionChangeEvent, syncFromServer);

    return () => {
      window.removeEventListener(sessionChangeEvent, syncFromServer);
    };
  }, [hasInitialSessionSnapshot, refreshSession]);

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
        code?: string;
        error?: string;
        message?: string;
      };

      if (!response.ok || !result.user) {
        return {
          ok: false,
          code: result.code,
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

export function SessionProvider({
  children,
  initialSession,
}: {
  children: ReactNode;
  initialSession: SessionUser | null;
}) {
  const value = useSessionStore(initialSession);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useDemoSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("SessionProvider is required before useDemoSession.");
  }

  return context;
}
