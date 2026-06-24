"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { categoryLabel, colorLabel, money, productDescription } from "../lib/i18n";
import {
  available,
  margin,
  pricedVariation,
  products,
  type Product,
  unitCost,
} from "../lib/store-data";
import { useLanguage } from "./language";
import { ProductCard } from "./product-card";
import { useDemoSession } from "./session";
import { VariationPicker } from "./variation-picker";

type CartLine = {
  productId: string;
  variationId: string;
  qty: number;
};

function readCart() {
  try {
    return JSON.parse(window.localStorage.getItem("bc_cart") ?? "[]") as CartLine[];
  } catch {
    return [];
  }
}

function variationTitle(
  variation: Product["variations"][number],
  language: ReturnType<typeof useLanguage>["language"],
) {
  const parts = [
    variation.color ? colorLabel(variation.color, language) : undefined,
    variation.size,
  ].filter(Boolean);

  return parts.join(" / ") || variation.name;
}

export function ProductDetail({ product }: { product: Product }) {
  const { role } = useDemoSession();
  const { language, t } = useLanguage();
  const [variationId, setVariationId] = useState(product.variations[0].id);
  const [added, setAdded] = useState(false);
  const variation =
    product.variations.find((item) => item.id === variationId) ?? product.variations[0];
  const userPrice = pricedVariation(product, variation, "user");
  const b2bPrice = pricedVariation(product, variation, "b2b");
  const activePrice = pricedVariation(product, variation, role);
  const photo = product.images?.[0];
  const photoStyle = photo
    ? ({ backgroundImage: `url("${photo}")` } as CSSProperties)
    : ({
        "--sheet-x": product.sheetX,
        "--sheet-y": product.sheetY,
      } as CSSProperties);

  function addToCart() {
    const cart = readCart();
    const found = cart.find(
      (item) => item.productId === product.id && item.variationId === variation.id,
    );
    const next = found
      ? cart.map((item) =>
          item === found ? { ...item, qty: item.qty + 1 } : item,
        )
      : [...cart, { productId: product.id, variationId: variation.id, qty: 1 }];

    window.localStorage.setItem("bc_cart", JSON.stringify(next));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  return (
    <section className="section-shell">
      <div className="product-detail">
        <div
          className={photo ? "product-photo detail-photo real-photo" : "product-photo detail-photo"}
          style={photoStyle}
        />
        <div className="detail-copy">
          <span className="eyebrow">{product.brand}</span>
          <h1>{product.name}</h1>
          <p>{productDescription(product, language)}</p>
          <VariationPicker product={product} variationId={variation.id} onChange={setVariationId} />
          <div className="detail-prices">
            <div>
              <span>B2C</span>
              <strong>{money(userPrice.final, language)}</strong>
            </div>
            <div>
              <span>B2B</span>
              <strong>{money(b2bPrice.final, language)}</strong>
            </div>
          </div>
          <div className="spec-list">
            <span>{categoryLabel(product.category, language)}</span>
            <span>SKU {variation.sku}</span>
            <span>{variationTitle(variation, language)}</span>
          </div>
          <button
            className="wide-button inline-button"
            disabled={available(variation.stock) === 0}
            onClick={addToCart}
            type="button"
          >
            {added ? t.added : `${t.addToCart} · ${money(activePrice.final, language)}`}
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t.variation}</th>
              <th>SKU</th>
              <th>B2C</th>
              <th>B2B</th>
              <th>{t.available}</th>
              <th>{t.batch}</th>
              <th>{t.cost}</th>
              <th>{t.marginB2B}</th>
            </tr>
          </thead>
          <tbody>
            {product.variations.map((item) => (
              <tr key={item.id}>
                <td>{variationTitle(item, language)}</td>
                <td>{item.sku}</td>
                <td>{money(item.b2c, language)}</td>
                <td>{money(item.b2b, language)}</td>
                <td>{available(item.stock)}</td>
                <td>{item.stock.lots[0]?.batch ?? "-"}</td>
                <td>{money(unitCost(item.stock), language)}</td>
                <td>{money(margin(item.b2b, item.stock), language)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-heading">
        <h2>{t.similarProducts}</h2>
      </div>
      <div className="product-grid">
        {products
          .filter((item) => item.category === product.category && item.id !== product.id)
          .slice(0, 2)
          .map((item) => (
            <ProductCard key={item.id} product={item} role={role} />
          ))}
      </div>
    </section>
  );
}
