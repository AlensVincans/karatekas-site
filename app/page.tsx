"use client";

import Link from "next/link";
import { useLanguage } from "../components/language";
import { ProductCard } from "../components/product-card";
import { categoryLabel } from "../lib/i18n";
import { available, categories, products, warehouseTotals } from "../lib/store-data";

export default function Home() {
  const { language, t } = useLanguage();
  const totals = warehouseTotals();
  const featured = categories
    .map((category) =>
      products.find(
        (product) =>
          product.category === category &&
          product.variations.some((variation) => available(variation.stock) > 0),
      ),
    )
    .filter((product): product is (typeof products)[number] => Boolean(product))
    .slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">{t.heroEyebrow}</span>
          <h1>{t.heroTitle}</h1>
          <p>{t.heroText}</p>
          <div className="hero-actions">
            <Link href="/catalog">{t.openCatalog}</Link>
            <Link href="/register">{t.becomeClient}</Link>
          </div>
        </div>
        <div className="hero-metrics">
          <div>
            <strong>{products.length}</strong>
            <span>{t.products}</span>
          </div>
          <div>
            <strong>{categories.length}</strong>
            <span>{t.categories}</span>
          </div>
          <div>
            <strong>{totals.available}</strong>
            <span>{t.inStockUnits}</span>
          </div>
        </div>
      </section>

      <section className="quick-commerce">
        <div className="promo-banner">
          <strong>{t.clubSeason}</strong>
          <span>{t.clubSeasonText}</span>
        </div>
        <div className="category-rail">
          {categories.map((category) => (
            <Link key={category} href={`/catalog?category=${encodeURIComponent(category)}`}>
              {categoryLabel(category, language)}
            </Link>
          ))}
        </div>
      </section>

      <section className="section-shell">
        <div className="section-heading">
          <span className="eyebrow">{t.popular}</span>
          <h2>{t.popularTitle}</h2>
        </div>
        <div className="product-grid">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} role="user" />
          ))}
        </div>
      </section>

      <section className="trust-grid">
        <article>
          <h3>{t.payment}</h3>
          <p>{t.paymentText}</p>
        </article>
        <article>
          <h3>{t.b2bTerms}</h3>
          <p>{t.b2bTermsText}</p>
        </article>
        <article>
          <h3>{t.delivery}</h3>
          <p>{t.deliveryText}</p>
        </article>
      </section>
    </>
  );
}
