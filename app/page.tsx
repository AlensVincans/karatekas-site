"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useLanguage } from "../components/language";
import { ProductCard } from "../components/product-card";
import { PromoCarousel } from "../components/promo-carousel";
import { useDemoSession } from "../components/session";
import { categoryLabel } from "../lib/i18n";
import { productImages, useProductImages } from "../lib/product-media";
import { available, categories, products, warehouseTotals } from "../lib/store-data";

export default function Home() {
  const { role } = useDemoSession();
  const { language, t } = useLanguage();
  const productImageMap = useProductImages();
  const totals = warehouseTotals();
  const stockedProducts = products.filter((product) =>
    product.variations.some((variation) => available(variation.stock) > 0),
  );
  const featured = categories
    .map((category) =>
      products.find(
        (product) =>
          product.category === category &&
          product.variations.some((variation) => available(variation.stock) > 0),
      ),
    )
    .filter((product): product is (typeof products)[number] => Boolean(product))
    .slice(0, 6);
  const bestSellers = [...stockedProducts]
    .sort(
      (left, right) =>
        right.variations.reduce((sum, variation) => sum + available(variation.stock), 0) -
        left.variations.reduce((sum, variation) => sum + available(variation.stock), 0),
    )
    .slice(0, 4);
  const heroProducts = bestSellers.slice(0, 3);
  const heroProduct = heroProducts[0] ?? featured[0] ?? products[0];
  const categoryTiles = categories.map((category) => {
    const product = stockedProducts.find((item) => item.category === category) ??
      products.find((item) => item.category === category);

    return { category, product };
  });

  function productPhotoStyle(product: (typeof products)[number] | undefined) {
    if (!product) {
      return undefined;
    }

    const [photo] = productImages(product, productImageMap);

    return photo
      ? ({ backgroundImage: `url("${photo}")` } as CSSProperties)
      : ({
          "--sheet-x": product.sheetX,
          "--sheet-y": product.sheetY,
        } as CSSProperties);
  }

  return (
    <div className="storefront-v3">
      <section className="home-hero-v3">
        <div className="hero-editorial-v3">
          <span className="kicker-v3">{t.heroEyebrow}</span>
          <h1>Premium karate equipment for athletes, clubs and dojos.</h1>
          <p>
            Shop gi, belts, protection, tatami and training gear with live stock,
            B2C/B2B pricing and Baltic delivery.
          </p>
          <div className="hero-actions-v3">
            <Link className="button-v3 primary" href="/catalog">Shop now</Link>
            <Link className="button-v3 secondary" href="/catalog?promo=1">View offers</Link>
          </div>
          <div className="hero-stats-v3">
            <div>
              <strong>{products.length}</strong>
              <span>{t.products}</span>
            </div>
            <div>
              <strong>{totals.available}</strong>
              <span>{t.inStockUnits}</span>
            </div>
            <div>
              <strong>LV / LT / EE</strong>
              <span>delivery markets</span>
            </div>
          </div>
        </div>

        <div className="hero-product-stage-v3">
          <Link className="hero-main-product-v3" href={`/product/${heroProduct.id}`}>
            <span className="hero-main-image-v3" style={productPhotoStyle(heroProduct)} />
            <span className="hero-main-copy-v3">
              <small>{heroProduct.brand}</small>
              <strong>{heroProduct.name}</strong>
              <em>{categoryLabel(heroProduct.category, language)}</em>
            </span>
          </Link>
          <div className="hero-stack-v3">
            {heroProducts.slice(1).map((product) => (
              <Link className="hero-mini-product-v3" href={`/product/${product.id}`} key={product.id}>
                <span style={productPhotoStyle(product)} />
                <strong>{product.name}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="category-mosaic-v3">
        <div className="section-intro-v3">
          <span className="kicker-v3">Shop the kit</span>
          <h2>Build a complete karate setup from one catalog.</h2>
          <p>Fast paths for parents, athletes, coaches and B2B club buyers.</p>
        </div>
        <div className="category-mosaic-grid-v3">
          {categoryTiles.map(({ category, product }, index) => (
            <Link
              className={index === 0 ? "category-tile-v3 featured" : "category-tile-v3"}
              href={`/catalog?category=${encodeURIComponent(category)}`}
              key={category}
            >
              <span className="category-tile-image-v3" style={productPhotoStyle(product)} />
              <span className="category-tile-copy-v3">
                <small>{products.filter((item) => item.category === category).length} items</small>
                <strong>{categoryLabel(category, language)}</strong>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="promo-story-v3">
        <div className="brand-story-v3">
          <span className="kicker-v3">Karatekas.eu</span>
          <h2>Equipment selected for real training days.</h2>
          <p>
            Clean retail shopping for families, structured B2B terms for clubs,
            and fulfillment built around parcel machines and courier delivery.
          </p>
          <div className="story-points-v3">
            <span>Competition ready</span>
            <span>Club friendly invoices</span>
            <span>Secure Montonio checkout</span>
          </div>
        </div>
        <PromoCarousel />
      </section>

      <section className="merch-section-v3">
        <div className="merch-copy-v3">
          <span className="kicker-v3">{t.popular}</span>
          <h2>{t.popularTitle}</h2>
          <p>High-demand products grouped from live catalog data and stock levels.</p>
          <Link className="button-v3 secondary dark" href="/catalog">View all products</Link>
        </div>
        <div className="product-grid-v3 featured-grid-v3">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} role={role} />
          ))}
        </div>
      </section>

      <section className="best-seller-band-v3">
        <div className="section-intro-v3">
          <span className="kicker-v3">Ready to ship</span>
          <h2>In-stock equipment for this week.</h2>
        </div>
        <div className="product-grid-v3 compact-grid-v3">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} role={role} />
          ))}
        </div>
      </section>

      <section className="benefit-lane-v3">
        {[
          ["Fast delivery", t.deliveryText],
          ["Trusted gear", "Competition and training products from karate-focused brands."],
          [t.payment, t.paymentText],
          [t.b2bTerms, t.b2bTermsText],
        ].map(([title, text], index) => (
          <article key={title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
