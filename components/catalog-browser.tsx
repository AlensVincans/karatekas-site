"use client";

import { useEffect, useMemo, useState } from "react";
import { categories, pricedVariation, products, type Product, type UserRole } from "../lib/store-data";
import { categoryLabel, productDescription } from "../lib/i18n";
import { applyPromoPrice, usePromoPrices, type PromoPriceMap } from "../lib/promotions";
import { useLanguage } from "./language";
import { ProductCard } from "./product-card";
import { useDemoSession } from "./session";

const allValue = "__all";

function readCatalogParams(brands: string[]) {
  if (typeof window === "undefined") {
    return {
      query: "",
      category: allValue,
      brand: allValue,
      promoOnly: false,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  const brand = params.get("brand");

  return {
    query: params.get("q") ?? "",
    category: category && categories.some((item) => item === category) ? category : allValue,
    brand: brand && brands.some((item) => item === brand) ? brand : allValue,
    promoOnly: params.get("promo") === "1",
  };
}

function hasDiscountedVariation(
  product: Product,
  role: UserRole,
  promoPrices: PromoPriceMap,
) {
  return product.variations.some((variation) => {
    const price = applyPromoPrice(
      pricedVariation(product, variation, role),
      variation.id,
      role,
      promoPrices,
    );

    return Boolean(price.discount || price.hasPromo);
  });
}

export function CatalogBrowser() {
  const { role } = useDemoSession();
  const { language, t } = useLanguage();
  const promoPrices = usePromoPrices();
  const brands = Array.from(new Set(products.map((product) => product.brand)));
  const initialFilters = readCatalogParams(brands);
  const [query, setQuery] = useState(initialFilters.query);
  const [category, setCategory] = useState(initialFilters.category);
  const [brand, setBrand] = useState(initialFilters.brand);
  const [promoOnly, setPromoOnly] = useState(initialFilters.promoOnly);

  useEffect(() => {
    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("q", query.trim());
    }

    if (category !== allValue) {
      params.set("category", category);
    }

    if (brand !== allValue) {
      params.set("brand", brand);
    }

    if (promoOnly) {
      params.set("promo", "1");
    }

    const nextUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState(window.history.state, "", nextUrl);
  }, [brand, category, promoOnly, query]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const categoryMatch = category === allValue || product.category === category;
      const brandMatch = brand === allValue || product.brand === brand;
      const promoMatch =
        !promoOnly || hasDiscountedVariation(product, role, promoPrices);
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

      return categoryMatch && brandMatch && promoMatch && textMatch;
    });
  }, [brand, category, language, promoOnly, promoPrices, query, role]);

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
        <label className="check-row compact-check">
          <input
            checked={promoOnly}
            type="checkbox"
            onChange={(event) => setPromoOnly(event.target.checked)}
          />
          {t.discountedOnly}
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
