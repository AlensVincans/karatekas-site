"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { categoryLabel, productDescription, productTitle } from "../lib/i18n";
import { productImages, useProductImages } from "../lib/product-media";
import { products as seedProducts, type Product } from "../lib/store-data";
import { useLanguage } from "./language";

function matchesProduct(product: Product, query: string, language: ReturnType<typeof useLanguage>["language"]) {
  const haystack = [
    product.name,
    productTitle(product, language),
    product.brand,
    product.category,
    categoryLabel(product.category, language),
    product.description,
    productDescription(product, language),
    product.variations
      .map((variation) => [variation.sku, variation.name, variation.color, variation.size].join(" "))
      .join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function ProductSearchSuggestions({
  query,
  onPick,
}: {
  query: string;
  onPick?: () => void;
}) {
  const { language } = useLanguage();
  const productImageMap = useProductImages();
  const [searchProducts, setSearchProducts] = useState<Product[]>(seedProducts);
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    let cancelled = false;

    fetch("/api/products")
      .then((response) => response.json())
      .then((data: { products?: Product[] }) => {
        if (!cancelled && Array.isArray(data.products) && data.products.length) {
          setSearchProducts(data.products);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return searchProducts
      .filter((product) => matchesProduct(product, normalizedQuery, language))
      .slice(0, 6);
  }, [language, normalizedQuery, searchProducts]);

  if (!suggestions.length) {
    return null;
  }

  return (
    <div className="search-suggestions">
      {suggestions.map((product) => {
        const [photo] = productImages(product, productImageMap);
        const photoStyle = photo
          ? ({ backgroundImage: `url("${photo}")` } as CSSProperties)
          : ({
              "--sheet-x": product.sheetX,
              "--sheet-y": product.sheetY,
            } as CSSProperties);

        return (
          <Link
            className="search-suggestion"
            href={`/product/${product.id}`}
            key={product.id}
            onMouseDown={onPick}
          >
            <span
              className={photo ? "suggestion-photo real-photo" : "suggestion-photo"}
              style={photoStyle}
            />
            <span>
              <strong>{productTitle(product, language)}</strong>
              <small>
                {product.brand} / {categoryLabel(product.category, language)}
              </small>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
