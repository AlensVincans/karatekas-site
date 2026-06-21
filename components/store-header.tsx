"use client";

import Link from "next/link";
import { useDemoSession } from "./session";

export function StoreHeader() {
  const { session, logout } = useDemoSession();
  const isAdmin = session?.role === "admin";
  const isB2B = session?.role === "b2b" || isAdmin;

  return (
    <header className="topbar">
      <div className="nav-shell">
        <Link className="brand-mark" href="/" aria-label="Karatekas Gear">
          <span className="brand-icon">KG</span>
          <span>
            Karatekas Gear
            <small>экипировка для карате</small>
          </span>
        </Link>

        <nav aria-label="Основная навигация">
          <Link href="/catalog">Каталог</Link>
          <Link href="/cart">Корзина</Link>
          {isB2B ? <Link href="/b2b">B2B цены</Link> : null}
          {isAdmin ? <Link href="/admin">Админка</Link> : null}
        </nav>

        <div className="user-nav">
          {session ? (
            <>
              <Link className="account-chip" href="/account">
                <span>{session.role === "admin" ? "Admin" : session.role === "b2b" ? "B2B" : "Клиент"}</span>
                {session.name}
              </Link>
              <button className="ghost-button" onClick={logout} type="button">
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link className="ghost-button" href="/login">
                Вход
              </Link>
              <Link className="primary-link" href="/register">
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
