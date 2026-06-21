"use client";

import { useEffect, useMemo, useState } from "react";
import { demoUsers, type DemoUser, type UserRole } from "../lib/store-data";

const usersKey = "bc_registered_users";
const sessionKey = "bc_session";
const sessionChangeEvent = "bc-session-change";

export type SessionUser = Omit<DemoUser, "password">;
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
  const [session, setSession] = useState<SessionUser | null>(() => readSession());
  const [registeredUsers, setRegisteredUsers] = useState<StoredUser[]>(() =>
    readStoredUsers(),
  );

  useEffect(() => {
    function syncFromStorage() {
      setSession(readSession());
      setRegisteredUsers(readStoredUsers());
    }

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(sessionChangeEvent, syncFromStorage);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(sessionChangeEvent, syncFromStorage);
    };
  }, []);

  const allUsers = useMemo(
    () => [...demoUsers, ...registeredUsers],
    [registeredUsers],
  );

  function persistSession(user: SessionUser | null) {
    setSession(user);

    if (user) {
      window.localStorage.setItem(sessionKey, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(sessionKey);
    }

    notifySessionChange();
  }

  function login(email: string, password: string) {
    const user = allUsers.find(
      (candidate) =>
        candidate.email.toLowerCase() === email.trim().toLowerCase() &&
        candidate.password === password,
    );

    if (!user) {
      return { ok: false, message: "Неверный email или пароль." };
    }

    if (!user.emailConfirmed) {
      return { ok: false, message: "Email ещё не подтверждён." };
    }

    persistSession(withoutPassword(user));
    return { ok: true, message: "Вход выполнен." };
  }

  function register(input: {
    name: string;
    email: string;
    password: string;
    role: Extract<UserRole, "user" | "b2b">;
    company?: string;
    vatNumber?: string;
  }) {
    const email = input.email.trim().toLowerCase();

    if (allUsers.some((user) => user.email.toLowerCase() === email)) {
      return { ok: false, message: "Пользователь с таким email уже есть." };
    }

    const user: StoredUser = {
      id: `usr-${Date.now()}`,
      name: input.name.trim() || email,
      email,
      password: input.password,
      role: input.role,
      company: input.company,
      vatNumber: input.vatNumber,
      creditLimit: input.role === "b2b" ? 2500 : undefined,
      paymentTerms:
        input.role === "b2b" ? ["card", "invoice", "defer15"] : ["card"],
      emailConfirmed: true,
    };

    const nextUsers = [...registeredUsers, user];
    setRegisteredUsers(nextUsers);
    window.localStorage.setItem(usersKey, JSON.stringify(nextUsers));
    persistSession(withoutPassword(user));

    return { ok: true, message: "Регистрация выполнена. Email подтверждён." };
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
