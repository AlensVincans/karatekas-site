"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { LanguageSelect, useLanguage } from "./language";
import { ProductSearchSuggestions } from "./product-search-suggestions";
import { useDemoSession } from "./session";

export function StoreHeader() {
  const { session, logout } = useDemoSession();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const isAdmin = session?.role === "admin";

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalized = query.trim();
    window.location.href = normalized
      ? `/catalog?q=${encodeURIComponent(normalized)}`
      : "/catalog";
  }

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

        <form className="site-search" onSubmit={submitSearch}>
          <div className="search-field">
            <input
              aria-label={t.search}
              placeholder={t.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <ProductSearchSuggestions query={query} onPick={() => setQuery("")} />
          </div>
          <button type="submit">{t.search}</button>
        </form>

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
