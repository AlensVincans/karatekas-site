"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import {
  available,
  eur,
  pricedVariation,
  type Product,
  type UserRole,
} from "../lib/store-data";

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

export function ProductCard({ product, role }: { product: Product; role: UserRole }) {
  const [variationId, setVariationId] = useState(product.variations[0].id);
  const [added, setAdded] = useState(false);
  const variation =
    product.variations.find((item) => item.id === variationId) ?? product.variations[0];
  const price = pricedVariation(product, variation, role);
  const availability = available(variation.stock);
  const usesSelect = product.variations.length > 6;

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
    <article className="product-card">
      <Link
        className="product-photo"
        href={`/product/${product.id}`}
        style={
          {
            "--sheet-x": product.sheetX,
            "--sheet-y": product.sheetY,
          } as CSSProperties
        }
      />
      <div className="product-body">
        <div className="product-heading">
          <span>{product.brand}</span>
          <Link href={`/product/${product.id}`}>{product.name}</Link>
        </div>
        <p>{product.description}</p>
        {usesSelect ? (
          <select
            aria-label="Вариант товара"
            className="variation-select"
            value={variation.id}
            onChange={(event) => setVariationId(event.target.value)}
          >
            {product.variations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · SKU {item.sku}
              </option>
            ))}
          </select>
        ) : (
          <div className="variation-row">
            {product.variations.map((item) => (
              <button
                className={item.id === variation.id ? "active" : ""}
                key={item.id}
                onClick={() => setVariationId(item.id)}
                type="button"
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
        <div className="product-meta">
          <span>SKU {variation.sku}</span>
          <span>{product.category}</span>
        </div>
        <div className="stock-line">
          <span className={availability > 20 ? "ok-dot" : "warn-dot"} />
          {availability} доступно · {variation.stock.reserved} в резерве
        </div>
        <div className="product-bottom">
          <div className="price-stack">
            {price.isB2B ? <span className="old-price">{eur(price.retail)}</span> : null}
            <strong>{eur(price.final)}</strong>
            {price.discount ? (
              <span className="discount-label">
                {price.discount.type === "percent"
                  ? `-${price.discount.value}%`
                  : `-${eur(price.discount.value)}`}{" "}
                {price.discount.name}
              </span>
            ) : null}
          </div>
          <button disabled={availability === 0} onClick={addToCart} type="button">
            {added ? "Добавлено" : "В корзину"}
          </button>
        </div>
      </div>
    </article>
  );
}
