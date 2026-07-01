"use client";

import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { useState } from "react";
import { categoryLabel, colorLabel, money, productDescription } from "../lib/i18n";
import {
  available,
  pricedVariation,
  products,
  type Product,
} from "../lib/store-data";
import { productImages, useProductImages } from "../lib/product-media";
import { applyPromoPrice, usePromoPrices } from "../lib/promotions";
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
  const promoPrices = usePromoPrices();
  const productImageMap = useProductImages();
  const [variationId, setVariationId] = useState(product.variations[0].id);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const variation =
    product.variations.find((item) => item.id === variationId) ?? product.variations[0];
  const activePrice = applyPromoPrice(
    pricedVariation(product, variation, role),
    variation.id,
    role,
    promoPrices,
  );
  const availability = available(variation.stock);
  const images = productImages(product, productImageMap);
  const activePhotoIndex = images[photoIndex] ? photoIndex : 0;
  const photo = images[activePhotoIndex];
  const canSwitchPhotos = images.length > 1;
  const photoStyle = photo
    ? ({ backgroundImage: `url("${photo}")` } as CSSProperties)
    : ({
        "--sheet-x": product.sheetX,
        "--sheet-y": product.sheetY,
      } as CSSProperties);

  function switchPhoto(direction: 1 | -1) {
    if (!canSwitchPhotos) {
      return;
    }

    setPhotoIndex((current) => {
      const safeCurrent = images[current] ? current : 0;

      return (safeCurrent + direction + images.length) % images.length;
    });
  }

  function clickMainPhoto(event: MouseEvent<HTMLButtonElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const direction = event.clientX - box.left < box.width / 2 ? -1 : 1;

    switchPhoto(direction);
  }

  function keyMainPhoto(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      switchPhoto(-1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      switchPhoto(1);
    }
  }

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
        <div className="product-gallery">
          <button
            aria-label={t.imageGallery}
            className={
              photo
                ? "product-photo detail-photo real-photo detail-photo-button"
                : "product-photo detail-photo detail-photo-button"
            }
            onClick={clickMainPhoto}
            onKeyDown={keyMainPhoto}
            style={photoStyle}
            type="button"
          >
            {canSwitchPhotos ? (
              <>
                <span className="gallery-zone left">{"<"}</span>
                <span className="gallery-zone right">{">"}</span>
              </>
            ) : null}
          </button>
          {canSwitchPhotos ? (
            <div className="gallery-count">
              {activePhotoIndex + 1} / {images.length}
            </div>
          ) : null}
          {canSwitchPhotos ? (
            <div className="product-thumbs" aria-label="Product images">
              {images.map((image, index) => (
                <button
                  className={image === photo ? "active" : ""}
                  key={`${image}-${index}`}
                  onClick={() => setPhotoIndex(index)}
                  style={{ backgroundImage: `url("${image}")` }}
                  type="button"
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{product.brand}</span>
          <h1>{product.name}</h1>
          <p>{productDescription(product, language)}</p>
          <VariationPicker product={product} variationId={variation.id} onChange={setVariationId} />
          <div className="detail-stock">
            <span className={availability > 20 ? "ok-dot" : "warn-dot"} />
            <div>
              <span>{t.available}</span>
              <strong>{availability}</strong>
            </div>
            <small>
              {variation.stock.reserved} {t.reserved}
            </small>
          </div>
          <div className="detail-price-line">
            {activePrice.compareAt ? (
              <span className="old-price">{money(activePrice.compareAt, language)}</span>
            ) : null}
            <strong>{money(activePrice.final, language)}</strong>
          </div>
          <div className="spec-list">
            <span>{categoryLabel(product.category, language)}</span>
            <span>SKU {variation.sku}</span>
            <span>{variationTitle(variation, language)}</span>
          </div>
          <button
            className="wide-button inline-button"
            disabled={availability === 0}
            onClick={addToCart}
            type="button"
          >
            {added ? t.added : `${t.addToCart} · ${money(activePrice.final, language)}`}
          </button>
        </div>
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
