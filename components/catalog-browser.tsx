"use client";

import { useEffect, useMemo, useState } from "react";
import { categories, pricedVariation, products, type Product, type UserRole } from "../lib/store-data";
import { categoryLabel, productDescription } from "../lib/i18n";
import {
  applyPromoPrice,
  usePromoPrices,
  usePromoRules,
  type PromoPriceMap,
  type PromoRule,
} from "../lib/promotions";
import { useLanguage } from "./language";
import { ProductCard } from "./product-card";
import { ProductSearchSuggestions } from "./product-search-suggestions";
import { useDemoSession } from "./session";

const allValue = "__all";
type SortMode = "featured" | "price-asc" | "price-desc" | "name";

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
  promoRules: PromoRule[],
) {
  return product.variations.some((variation) => {
    const price = applyPromoPrice(
      pricedVariation(product, variation, role),
      variation.id,
      role,
      promoPrices,
      promoRules,
      { productId: product.id, brand: product.brand },
    );

    return Boolean(price.discount || price.hasPromo);
  });
}

function lowestProductPrice(
  product: Product,
  role: UserRole,
  promoPrices: PromoPriceMap,
  promoRules: PromoRule[],
) {
  return Math.min(
    ...product.variations.map((variation) =>
      applyPromoPrice(
        pricedVariation(product, variation, role),
        variation.id,
        role,
        promoPrices,
        promoRules,
        { productId: product.id, brand: product.brand },
      ).final,
    ),
  );
}

export function CatalogBrowser() {
  const { role } = useDemoSession();
  const { language, t } = useLanguage();
  const promoPrices = usePromoPrices();
  const promoRules = usePromoRules();
  const brands = Array.from(new Set(products.map((product) => product.brand)));
  const initialFilters = readCatalogParams(brands);
  const [query, setQuery] = useState(initialFilters.query);
  const [category, setCategory] = useState(initialFilters.category);
  const [brand, setBrand] = useState(initialFilters.brand);
  const [promoOnly, setPromoOnly] = useState(initialFilters.promoOnly);
  const [sort, setSort] = useState<SortMode>("featured");

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
        !promoOnly || hasDiscountedVariation(product, role, promoPrices, promoRules);
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
  }, [brand, category, language, promoOnly, promoPrices, promoRules, query, role]);
  const visibleProducts = useMemo(() => {
    const next = [...filteredProducts];

    if (sort === "name") {
      return next.sort((left, right) => left.name.localeCompare(right.name));
    }

    if (sort === "price-asc" || sort === "price-desc") {
      return next.sort((left, right) => {
        const leftPrice = lowestProductPrice(left, role, promoPrices, promoRules);
        const rightPrice = lowestProductPrice(right, role, promoPrices, promoRules);

        return sort === "price-asc" ? leftPrice - rightPrice : rightPrice - leftPrice;
      });
    }

    return next;
  }, [filteredProducts, promoPrices, promoRules, role, sort]);

  return (
    <div className="catalog-workspace-v3">
      <aside className="filter-dock-v3 filters-panel">
        <div className="filters-head-v3">
          <span className="kicker-v3">{t.filters}</span>
          <h2>Refine your kit</h2>
          <p>Search by product, brand, category, SKU or variation.</p>
        </div>
        <div className="search-field">
          <label>
            {t.search}
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.searchPlaceholder}
            />
          </label>
          <ProductSearchSuggestions query={query} />
        </div>
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
      <section className="catalog-shelf-v3 catalog-results" aria-label={t.navCatalog}>
        <div className="catalog-toolbar-v3">
          <div className="catalog-result-copy-v3">
            <span>{visibleProducts.length} results</span>
            <strong>
              {category === allValue ? "All karate equipment" : categoryLabel(category, language)}
            </strong>
          </div>
          <label>
            Sort
            <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
              <option value="featured">Featured</option>
              <option value="price-asc">Price low to high</option>
              <option value="price-desc">Price high to low</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>

        <div className="catalog-chip-row-v3">
          <button
            className={category === allValue ? "active" : ""}
            onClick={() => setCategory(allValue)}
            type="button"
          >
            {t.all}
          </button>
          {categories.map((item) => (
            <button
              className={category === item ? "active" : ""}
              key={item}
              onClick={() => setCategory(item)}
              type="button"
            >
              {categoryLabel(item, language)}
            </button>
          ))}
        </div>

        {visibleProducts.length ? (
          <div className="product-grid product-grid-v3 catalog-grid-v3">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} role={role} />
            ))}
          </div>
        ) : (
          <div className="empty-state catalog-empty">
            <strong>No products found</strong>
            <span>Try another category, brand or search phrase.</span>
          </div>
        )}
      </section>
    </div>
  );
}
