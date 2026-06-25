"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import {
  available,
  pricedVariation,
  type Product,
  type UserRole,
} from "../lib/store-data";
import { categoryLabel, money, productDescription } from "../lib/i18n";
import { applyPromoPrice, usePromoPrices } from "../lib/promotions";
import { useLanguage } from "./language";
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

export function ProductCard({ product, role }: { product: Product; role: UserRole }) {
  const { language, t } = useLanguage();
  const promoPrices = usePromoPrices();
  const [variationId, setVariationId] = useState(product.variations[0].id);
  const [added, setAdded] = useState(false);
  const variation =
    product.variations.find((item) => item.id === variationId) ?? product.variations[0];
  const price = applyPromoPrice(
    pricedVariation(product, variation, role),
    variation.id,
    role,
    promoPrices,
  );
  const availability = available(variation.stock);
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
    <article className="product-card">
      <Link
        className={photo ? "product-photo real-photo" : "product-photo"}
        href={`/product/${product.id}`}
        style={photoStyle}
      />
      <div className="product-body">
        <div className="product-heading">
          <span>{product.brand}</span>
          <Link href={`/product/${product.id}`}>{product.name}</Link>
        </div>
        <p>{productDescription(product, language)}</p>
        <VariationPicker product={product} variationId={variation.id} onChange={setVariationId} />
        <div className="product-meta">
          <span>SKU {variation.sku}</span>
          <span>{categoryLabel(product.category, language)}</span>
        </div>
        <div className="stock-line">
          <span className={availability > 20 ? "ok-dot" : "warn-dot"} />
          {availability} {t.available} · {variation.stock.reserved} {t.reserved}
        </div>
        <div className="product-bottom">
          <div className="price-stack">
            {price.compareAt ? (
              <span className="old-price">{money(price.compareAt, language)}</span>
            ) : null}
            <strong>{money(price.final, language)}</strong>
            {price.hasPromo ? (
              <span className="discount-label">Promo</span>
            ) : price.discount ? (
              <span className="discount-label">
                {price.discount.type === "percent"
                  ? `-${price.discount.value}%`
                  : `-${money(price.discount.value, language)}`}
              </span>
            ) : null}
          </div>
          <button disabled={availability === 0} onClick={addToCart} type="button">
            {added ? t.added : t.addToCart}
          </button>
        </div>
      </div>
    </article>
  );
}
