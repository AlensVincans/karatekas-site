"use client";

import { CatalogBrowser } from "../../components/catalog-browser";
import { useLanguage } from "../../components/language";
import { categories, products, warehouseTotals } from "../../lib/store-data";

export default function CatalogPage() {
  const { t } = useLanguage();
  const totals = warehouseTotals();

  return (
    <section className="catalog-page-v3">
      <div className="catalog-hero-v3">
        <div>
          <span className="kicker-v3">{t.navCatalog}</span>
          <h1>{t.catalogTitle}</h1>
          <p>
            Browse karate equipment by category, brand, discount and live stock.
            Filters stay in the URL, so returning from product pages keeps your selection.
          </p>
        </div>
        <div className="catalog-hero-stats-v3">
          <span>
            <strong>{products.length}</strong>
            products
          </span>
          <span>
            <strong>{categories.length}</strong>
            categories
          </span>
          <span>
            <strong>{totals.available}</strong>
            available
          </span>
        </div>
      </div>
      <CatalogBrowser />
    </section>
  );
}
