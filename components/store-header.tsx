"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { LanguageSelect, useLanguage } from "./language";
import { ProductSearchSuggestions } from "./product-search-suggestions";
import { useDemoSession } from "./session";
import { categories } from "../lib/store-data";
import { categoryLabel } from "../lib/i18n";

function SearchIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="m21 21-4.2-4.2m1.2-5.3a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path
        d="M6.5 8h13l-1.2 7.2a2 2 0 0 1-2 1.8H9.1a2 2 0 0 1-2-1.7L5.6 4H3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M9 21h.01M17 21h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return open ? (
    <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  ) : (
    <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

export function StoreHeader() {
  const { session, logout } = useDemoSession();
  const { language, t } = useLanguage();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = session?.role === "admin";

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalized = query.trim();
    setMobileOpen(false);
    window.location.href = normalized
      ? `/catalog?q=${encodeURIComponent(normalized)}`
      : "/catalog";
  }

  function logoutAndClose() {
    logout();
    setMobileOpen(false);
  }

  const searchForm = (variant: "desktop" | "mobile") => (
    <form className={`site-search ${variant}-search`} onSubmit={submitSearch}>
      <div className="search-field">
        <SearchIcon />
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
  );

  const userActions = (variant: "desktop" | "mobile") => (
    <div className={`user-nav ${variant}-user-nav`}>
      <LanguageSelect />
      {session ? (
        <>
          <Link className="account-chip" href="/account" onClick={() => setMobileOpen(false)}>
            <span>{session.role === "admin" ? "Admin" : session.role === "b2b" ? "B2B" : t.client}</span>
            {session.name}
          </Link>
          <button className="ghost-button" onClick={logoutAndClose} type="button">
            {t.logout}
          </button>
        </>
      ) : (
        <>
          <Link className="ghost-button" href="/login" onClick={() => setMobileOpen(false)}>
            {t.login}
          </Link>
          <Link className="primary-link" href="/register" onClick={() => setMobileOpen(false)}>
            {t.register}
          </Link>
        </>
      )}
    </div>
  );

  return (
    <header className="site-header-v2">
      <div className="nav-main-v2">
        <Link className="brand-lockup-v2" href="/" aria-label="Karatekas Gear">
          <Image
            alt=""
            className="brand-logo-v2"
            height={54}
            priority
            src="/karatekas-mark.png"
            width={54}
          />
          <span className="brand-wordmark-v2">
            <strong>Karatekas.eu</strong>
            <small>Karate Equipment</small>
          </span>
        </Link>

        <nav className="primary-nav-v2 desktop-nav" aria-label="Main navigation">
          <div className="catalog-hover-v2">
            <Link href="/catalog">{t.navCatalog}</Link>
            <nav className="category-rail-v2" aria-label="Product categories">
              {categories.map((category) => (
                <Link key={category} href={`/catalog?category=${encodeURIComponent(category)}`}>
                  {categoryLabel(category, language)}
                </Link>
              ))}
            </nav>
          </div>
          <Link href="/catalog?promo=1">{t.discountedOnly}</Link>
          {isAdmin ? <Link href="/admin">{t.navAdmin}</Link> : null}
        </nav>

        {searchForm("desktop")}

        <div className="header-actions-v2">
          <Link className="cart-link-v2" href="/cart" aria-label={t.navCart}>
            <CartIcon />
            <span>{t.navCart}</span>
          </Link>
          {userActions("desktop")}
          <button
            aria-expanded={mobileOpen}
            aria-label="Open menu"
            className="mobile-menu-button-v2"
            onClick={() => setMobileOpen((open) => !open)}
            type="button"
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>

        <div className={mobileOpen ? "mobile-menu-v2 open" : "mobile-menu-v2"}>
          {searchForm("mobile")}
          <nav aria-label="Mobile navigation">
            <Link href="/catalog" onClick={() => setMobileOpen(false)}>
              {t.navCatalog}
            </Link>
            {categories.map((category) => (
              <Link
                className="mobile-category-link-v2"
                href={`/catalog?category=${encodeURIComponent(category)}`}
                key={category}
                onClick={() => setMobileOpen(false)}
              >
                {categoryLabel(category, language)}
              </Link>
            ))}
            <Link href="/cart" onClick={() => setMobileOpen(false)}>
              {t.navCart}
            </Link>
            {isAdmin ? (
              <Link href="/admin" onClick={() => setMobileOpen(false)}>
                {t.navAdmin}
              </Link>
            ) : null}
          </nav>
          {userActions("mobile")}
        </div>
      </div>
    </header>
  );
}
