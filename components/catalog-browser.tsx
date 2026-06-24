"use client";

import { useMemo, useState } from "react";
import { categories, products } from "../lib/store-data";
import { categoryLabel, productDescription } from "../lib/i18n";
import { useLanguage } from "./language";
import { ProductCard } from "./product-card";
import { useDemoSession } from "./session";

const allValue = "__all";

export function CatalogBrowser() {
  const { role } = useDemoSession();
  const { language, t } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(() => {
    if (typeof window === "undefined") {
      return allValue;
    }

    const current = new URLSearchParams(window.location.search).get("category");
    return current && categories.some((item) => item === current) ? current : allValue;
  });
  const [brand, setBrand] = useState(allValue);
  const brands = Array.from(new Set(products.map((product) => product.brand)));

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const categoryMatch = category === allValue || product.category === category;
      const brandMatch = brand === allValue || product.brand === brand;
      const textMatch =
        !normalizedQuery ||
        [
          product.name,
          product.brand,
          product.category,
          categoryLabel(product.category, language),
          product.description,
          productDescription(product, language),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return categoryMatch && brandMatch && textMatch;
    });
  }, [brand, category, language, query]);

  return (
    <div className="page-grid">
      <aside className="filters-panel">
        <h2>{t.filters}</h2>
        <label>
          {t.search}
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.searchPlaceholder}
          />
        </label>
        <label>
          {t.category}
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value={allValue}>{t.all}</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {categoryLabel(item, language)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.brand}
          <select value={brand} onChange={(event) => setBrand(event.target.value)}>
            <option value={allValue}>{t.all}</option>
            {brands.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <div className="account-note">
          {role === "b2b" || role === "admin"
            ? t.b2bActive
            : t.retailActive}
        </div>
      </aside>
      <section className="product-grid" aria-label={t.navCatalog}>
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} role={role} />
        ))}
      </section>
    </div>
  );
}
