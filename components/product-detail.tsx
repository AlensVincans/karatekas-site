"use client";

import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { useState } from "react";
import { categoryLabel, colorLabel, money, productDescription, productTitle } from "../lib/i18n";
import {
  pricedVariation,
  products,
  type Product,
} from "../lib/store-data";
import { productImages, useProductImages } from "../lib/product-media";
import { availableStock, useInventoryLevels } from "../lib/inventory-client";
import { applyPromoPrice, usePromoPrices, usePromoRules } from "../lib/promotions";
import { useLanguage } from "./language";
import { ProductCard } from "./product-card";
import { useDemoSession } from "./session";
import { VariationPicker } from "./variation-picker";

type CartLine = {
  productId: string;
  variationId: string;
  qty: number;
};

const copy = {
  ru: {
    delivery: "Доставка",
    deliveryText: "Пакоматы, курьерская доставка или самовывоз.",
    returns: "Возврат",
    returnsText: "Неиспользованную экипировку можно обменять, если не подошел размер или цвет.",
    b2b: "B2B",
    b2bText: "Войдите, чтобы видеть розничную цену зачеркнутой и активную клубную цену.",
    details: "Детали товара",
    detailsTitle: "Для тренировок и соревнований по карате.",
    completeKit: "Соберите комплект",
  },
  lv: {
    delivery: "Piegāde",
    deliveryText: "Paku automāti, kurjers vai saņemšana uz vietas.",
    returns: "Atgriešana",
    returnsText: "Nelietotu ekipējumu var apmainīt, ja neder izmērs vai krāsa.",
    b2b: "B2B",
    b2bText: "Ieejiet, lai redzētu mazumtirdzniecības cenu pārsvītrotu un aktīvo kluba cenu.",
    details: "Preces detaļas",
    detailsTitle: "Karatē treniņiem un sacensībām.",
    completeKit: "Pabeidziet komplektu",
  },
  en: {
    delivery: "Delivery",
    deliveryText: "Parcel machines, courier delivery or self pickup.",
    returns: "Returns",
    returnsText: "Unused gear can be exchanged if size or color is wrong.",
    b2b: "B2B",
    b2bText: "Login to see crossed retail price and active club pricing.",
    details: "Product details",
    detailsTitle: "Built for karate training and competition.",
    completeKit: "Complete the kit",
  },
  et: {
    delivery: "Tarne",
    deliveryText: "Pakiautomaadid, kuller või ise järele tulemine.",
    returns: "Tagastus",
    returnsText: "Kasutamata varustust saab vahetada, kui suurus või värv ei sobi.",
    b2b: "B2B",
    b2bText: "Logi sisse, et näha jaehinda läbikriipsutatult ja aktiivset klubihinda.",
    details: "Toote andmed",
    detailsTitle: "Karate treeninguteks ja võistlusteks.",
    completeKit: "Täienda komplekti",
  },
  lt: {
    delivery: "Pristatymas",
    deliveryText: "Paštomatai, kurjeris arba atsiėmimas vietoje.",
    returns: "Grąžinimas",
    returnsText: "Nenaudotą įrangą galima pakeisti, jei netiko dydis arba spalva.",
    b2b: "B2B",
    b2bText: "Prisijunkite, kad matytumėte perbrauktą mažmeninę kainą ir aktyvią klubo kainą.",
    details: "Prekės informacija",
    detailsTitle: "Karatė treniruotėms ir varžyboms.",
    completeKit: "Užbaikite komplektą",
  },
} as const;

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
  const c = copy[language as keyof typeof copy] ?? copy.en;
  const promoPrices = usePromoPrices();
  const promoRules = usePromoRules();
  const { levels } = useInventoryLevels();
  const productImageMap = useProductImages();
  const [variationId, setVariationId] = useState(product.variations[0].id);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const title = productTitle(product, language);
  const variation =
    product.variations.find((item) => item.id === variationId) ?? product.variations[0];
  const activePrice = applyPromoPrice(
    pricedVariation(product, variation, role),
    variation.id,
    role,
    promoPrices,
    promoRules,
    { productId: product.id, brand: product.brand },
  );
  const availability = availableStock(variation, levels);
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
    <section className="pdp-page-v3">
      <div className="pdp-breadcrumb-v3">
        <span>{categoryLabel(product.category, language)}</span>
        <span>{product.brand}</span>
        <span>{variationTitle(variation, language)}</span>
      </div>

      <div className="pdp-layout-v3">
        <div className={canSwitchPhotos ? "pdp-gallery-v3" : "pdp-gallery-v3 single-image"}>
          {canSwitchPhotos ? (
            <div className="pdp-thumb-rail-v3" aria-label="Product images">
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

          <button
            aria-label={t.imageGallery}
            className={
              photo
                ? "pdp-main-image-v3 product-photo real-photo"
                : "pdp-main-image-v3 product-photo"
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
                <span className="pdp-image-count-v3">
                  {activePhotoIndex + 1} / {images.length}
                </span>
              </>
            ) : null}
          </button>
        </div>

        <aside className="pdp-buybox-v3">
          <div className="pdp-title-block-v3">
            <span className="kicker-v3">{product.brand}</span>
            <h1>{title}</h1>
            <p>{productDescription(product, language)}</p>
          </div>

          <div className="pdp-price-stock-v3">
            <div>
              {activePrice.compareAt ? (
                <span className="old-price">{money(activePrice.compareAt, language)}</span>
              ) : null}
              <strong>{money(activePrice.final, language)}</strong>
            </div>
            <span className={availability > 0 ? "stock-pill-v3 ok" : "stock-pill-v3"}>
              {availability} {t.available}
            </span>
          </div>

          <VariationPicker product={product} variationId={variation.id} onChange={setVariationId} />

          <div className="pdp-sku-strip-v3">
            <span>SKU {variation.sku}</span>
            <span>{variationTitle(variation, language)}</span>
          </div>

          <button
            className="button-v3 primary pdp-add-button-v3"
            disabled={availability === 0}
            onClick={addToCart}
            type="button"
          >
            {added ? t.added : `${t.addToCart} - ${money(activePrice.final, language)}`}
          </button>

          <div className="pdp-service-stack-v3">
            <div>
              <strong>{c.delivery}</strong>
              <span>{c.deliveryText}</span>
            </div>
            <div>
              <strong>{c.returns}</strong>
              <span>{c.returnsText}</span>
            </div>
            <div>
              <strong>{c.b2b}</strong>
              <span>{c.b2bText}</span>
            </div>
          </div>
        </aside>
      </div>

      <section className="pdp-info-v3">
        <div>
          <span className="kicker-v3">{c.details}</span>
          <h2>{c.detailsTitle}</h2>
        </div>
        <p>{product.description || productDescription(product, language)}</p>
        <div className="pdp-spec-grid-v3">
          <span>{categoryLabel(product.category, language)}</span>
          <span>{product.brand}</span>
          {product.specs.slice(0, 4).map((spec) => (
            <span key={spec}>{spec}</span>
          ))}
        </div>
      </section>

      <section className="pdp-related-v3">
        <div className="section-intro-v3">
          <span className="kicker-v3">{c.completeKit}</span>
          <h2>{t.similarProducts}</h2>
        </div>
        <div className="product-grid product-grid-v3 compact-grid-v3">
          {products
            .filter((item) => item.category === product.category && item.id !== product.id)
            .slice(0, 3)
            .map((item) => (
              <ProductCard key={item.id} product={item} role={role} />
            ))}
        </div>
      </section>
    </section>
  );
}
