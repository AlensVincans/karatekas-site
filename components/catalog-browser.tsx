"use client";

import { useMemo, useState } from "react";
import { categories, products } from "../lib/store-data";
import { ProductCard } from "./product-card";
import { useDemoSession } from "./session";

export function CatalogBrowser() {
  const { role } = useDemoSession();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Все");
  const [brand, setBrand] = useState("Все");
  const brands = Array.from(new Set(products.map((product) => product.brand)));

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const categoryMatch = category === "Все" || product.category === category;
      const brandMatch = brand === "Все" || product.brand === brand;
      const textMatch =
        !normalizedQuery ||
        [product.name, product.brand, product.category, product.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return categoryMatch && brandMatch && textMatch;
    });
  }, [brand, category, query]);

  return (
    <div className="page-grid">
      <aside className="filters-panel">
        <h2>Фильтры</h2>
        <label>
          Поиск
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="товар, бренд, категория"
          />
        </label>
        <label>
          Категория
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option>Все</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Бренд
          <select value={brand} onChange={(event) => setBrand(event.target.value)}>
            <option>Все</option>
            {brands.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <div className="account-note">
          {role === "b2b" || role === "admin"
            ? "B2B-цены активны: розница показана зачёркнутой."
            : "Обычный пользователь видит розничную цену."}
        </div>
      </aside>
      <section className="product-grid" aria-label="Каталог товаров">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} role={role} />
        ))}
      </section>
    </div>
  );
}
