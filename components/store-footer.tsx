"use client";

import Image from "next/image";
import Link from "next/link";
import { categories } from "../lib/store-data";
import { categoryLabel } from "../lib/i18n";
import { useLanguage } from "./language";

export function StoreFooter() {
  const { language, t } = useLanguage();
  const featuredCategories = categories.slice(0, 5);

  return (
    <footer className="site-footer-v3">
      <div className="footer-cta-v3">
        <div>
          <span className="kicker-v3">Karatekas.eu</span>
          <h2>Karate equipment for athletes, families and clubs.</h2>
        </div>
        <Link className="button-v3 secondary" href="/catalog">
          {t.openCatalog}
        </Link>
      </div>

      <div className="footer-main-v3">
        <div className="footer-brand-v3">
          <Link className="footer-logo-v3" href="/" aria-label="Karatekas Gear">
            <Image alt="" className="brand-logo-v2" height={54} src="/karatekas-mark.png" width={54} />
            <span>
              <strong>Karatekas.eu</strong>
              <small>{t.brandSubline}</small>
            </span>
          </Link>
          <p>
            Premium karate equipment, B2B club pricing, secure checkout and
            Baltic delivery through trusted shipping partners.
          </p>
        </div>

        <div className="footer-links-v3">
          <div>
            <strong>Shop</strong>
            <Link href="/catalog">{t.navCatalog}</Link>
            <Link href="/catalog?promo=1">{t.discountedOnly}</Link>
            <Link href="/cart">{t.navCart}</Link>
          </div>
          <div>
            <strong>Categories</strong>
            {featuredCategories.map((category) => (
              <Link key={category} href={`/catalog?category=${encodeURIComponent(category)}`}>
                {categoryLabel(category, language)}
              </Link>
            ))}
          </div>
          <div>
            <strong>Service</strong>
            <span>Omniva / DPD / Unisend</span>
            <span>Latvia / Lithuania / Estonia</span>
            <span>Montonio card checkout</span>
            <span>B2B invoice payment</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
