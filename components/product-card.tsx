"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { pricedVariation } from "../lib/pricing";
import type { Product, UserRole } from "../lib/store-data";
import { categoryLabel, money, productDescription, productTitle } from "../lib/i18n";
import { productImages, useProductImages } from "../lib/product-media";
import { applyPromoPrice, usePromoPrices, usePromoRules } from "../lib/promotions";
import {
  availableStock,
  useInventoryLevels,
} from "../lib/inventory-client";
import { readCartLines, writeCartLines } from "../lib/cart-client";
import { useLanguage } from "./language";
import { VariationPicker } from "./variation-picker";

const cardCopy = {
  ru: { sale: "Акция", inStock: "В наличии", order: "Под заказ", promo: "Промо" },
  lv: { sale: "Akcija", inStock: "Noliktavā", order: "Pēc pasūtījuma", promo: "Promo" },
  en: { sale: "Sale", inStock: "In stock", order: "Order", promo: "Promo" },
  et: { sale: "Soodus", inStock: "Laos", order: "Tellimisel", promo: "Promo" },
  lt: { sale: "Akcija", inStock: "Sandėlyje", order: "Pagal užsakymą", promo: "Promo" },
} as const;

export function ProductCard({ product, role }: { product: Product; role: UserRole }) {
  const { language, t } = useLanguage();
  const c = cardCopy[language as keyof typeof cardCopy] ?? cardCopy.en;
  const promoPrices = usePromoPrices();
  const promoRules = usePromoRules();
  const { levels } = useInventoryLevels();
  const productImageMap = useProductImages();
  const firstAvailableVariation = useMemo(
    () =>
      product.variations.find((item) => availableStock(item, levels) > 0) ??
      product.variations[0],
    [levels, product.variations],
  );
  const [variationId, setVariationId] = useState(firstAvailableVariation.id);
  const [added, setAdded] = useState(false);
  const title = productTitle(product, language);
  const variation =
    product.variations.find((item) => item.id === variationId) ?? firstAvailableVariation;
  const price = applyPromoPrice(
    pricedVariation(product, variation, role),
    variation.id,
    role,
    promoPrices,
    promoRules,
    { productId: product.id, brand: product.brand },
  );
  const availability = availableStock(variation, levels);
  const photo = productImages(product, productImageMap)[0];
  const isDiscounted = Boolean(price.hasPromo || price.discount);
  const badge = isDiscounted
    ? c.sale
    : price.isB2B
      ? "B2B"
      : availability > 0
        ? c.inStock
        : c.order;
  const photoStyle = photo
    ? ({ backgroundImage: `url("${photo}")` } as CSSProperties)
    : ({
        "--sheet-x": product.sheetX,
        "--sheet-y": product.sheetY,
      } as CSSProperties);

  function addToCart() {
    const cart = readCartLines();
    const found = cart.find(
      (item) => item.productId === product.id && item.variationId === variation.id,
    );
    const next = found
      ? cart.map((item) =>
          item === found ? { ...item, qty: item.qty + 1 } : item,
        )
      : [...cart, { productId: product.id, variationId: variation.id, qty: 1 }];

    writeCartLines(next);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  return (
    <article
      className={
        isDiscounted
          ? "product-card product-card-sale product-card-v3"
          : "product-card product-card-v3"
      }
    >
      <div className="product-media-v3">
        <Link
          aria-label={title}
          className={photo ? "product-photo real-photo" : "product-photo"}
          href={`/product/${product.id}`}
          style={photoStyle}
        />
        <div className="product-badges">
          <span className={isDiscounted ? "product-badge sale" : "product-badge"}>
            {badge}
          </span>
          {product.category === "WUKF" ? (
            <span className="product-badge dark">WUKF</span>
          ) : null}
        </div>
      </div>

      <div className="product-content-v3">
        <div className="product-taxonomy-v3">
          <span>{product.brand}</span>
          <small>{categoryLabel(product.category, language)}</small>
        </div>
        <Link className="product-title-v3" href={`/product/${product.id}`}>
          {title}
        </Link>
        <p className="product-excerpt-v3">{productDescription(product, language)}</p>

        <div className="product-option-row-v3">
          <VariationPicker product={product} variationId={variation.id} onChange={setVariationId} />
        </div>

        <div className="product-meta-v3">
          <span>SKU {variation.sku}</span>
          <span>
            <span className={availability > 20 ? "ok-dot" : "warn-dot"} />
            {availability} {t.available}
          </span>
        </div>

        <div className="product-buy-row-v3">
          <div className="price-stack">
            {price.compareAt ? (
              <span className="old-price">{money(price.compareAt, language)}</span>
            ) : null}
            <strong>{money(price.final, language)}</strong>
            {price.hasPromo ? (
              <span className="discount-label">{c.promo}</span>
            ) : price.discount ? (
              <span className="discount-label">
                {price.discount.type === "percent"
                  ? `-${price.discount.value}%`
                  : `-${money(price.discount.value, language)}`}
              </span>
            ) : null}
          </div>
          <button
            aria-label={`${t.addToCart}: ${title}`}
            disabled={availability === 0}
            onClick={addToCart}
            type="button"
          >
            {added ? t.added : t.addToCart}
          </button>
        </div>
      </div>
    </article>
  );
}
