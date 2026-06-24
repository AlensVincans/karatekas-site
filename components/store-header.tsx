"use client";

import Link from "next/link";
import { LanguageSelect, useLanguage } from "./language";
import { useDemoSession } from "./session";

export function StoreHeader() {
  const { session, logout } = useDemoSession();
  const { t } = useLanguage();
  const isAdmin = session?.role === "admin";

  return (
    <header className="topbar">
      <div className="nav-shell">
        <Link className="brand-mark" href="/" aria-label="Karatekas Gear">
          <span className="brand-icon">KG</span>
          <span>
            Karatekas Gear
            <small>{t.brandSubline}</small>
          </span>
        </Link>

        <nav aria-label="Main navigation">
          <Link href="/catalog">{t.navCatalog}</Link>
          <Link href="/cart">{t.navCart}</Link>
          {isAdmin ? <Link href="/admin">{t.navAdmin}</Link> : null}
        </nav>

        <div className="user-nav">
          <LanguageSelect />
          {session ? (
            <>
              <Link className="account-chip" href="/account">
                <span>{session.role === "admin" ? "Admin" : session.role === "b2b" ? "B2B" : t.client}</span>
                {session.name}
              </Link>
              <button className="ghost-button" onClick={logout} type="button">
                {t.logout}
              </button>
            </>
          ) : (
            <>
              <Link className="ghost-button" href="/login">
                {t.login}
              </Link>
              <Link className="primary-link" href="/register">
                {t.register}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
