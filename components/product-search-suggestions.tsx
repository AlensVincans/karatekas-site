"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import { categoryLabel, productDescription } from "../lib/i18n";
import { productImages, useProductImages } from "../lib/product-media";
import { products, type Product } from "../lib/store-data";
import { useLanguage } from "./language";

function matchesProduct(product: Product, query: string, language: ReturnType<typeof useLanguage>["language"]) {
  const haystack = [
    product.name,
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
  const normalizedQuery = query.trim().toLowerCase();
  const suggestions = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return products
      .filter((product) => matchesProduct(product, normalizedQuery, language))
      .slice(0, 6);
  }, [language, normalizedQuery]);

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
              <strong>{product.name}</strong>
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
