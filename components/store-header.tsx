"use client";

import Link from "next/link";
import { useDemoSession } from "./session";

export function StoreHeader() {
  const { session, logout } = useDemoSession();

  return (
    <header className="topbar">
      <Link className="brand-mark" href="/">
        Baltic Commerce
      </Link>
      <nav>
        <Link href="/catalog">Каталог</Link>
        <Link href="/cart">Корзина</Link>
        <Link href="/b2b">B2B</Link>
        <Link href="/admin">Админка</Link>
      </nav>
      <div className="user-nav">
        {session ? (
          <>
            <Link className="role-pill" href="/account">
              {session.role.toUpperCase()} · {session.name}
            </Link>
            <button onClick={logout} type="button">
              Выйти
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Вход</Link>
            <Link className="primary-link" href="/register">
              Регистрация
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
