"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useLanguage } from "../components/language";
import { ProductCard } from "../components/product-card";
import { PromoCarousel } from "../components/promo-carousel";
import { useDemoSession } from "../components/session";
import { categoryLabel, productTitle } from "../lib/i18n";
import { productImages, useProductImages } from "../lib/product-media";
import {
  available,
  categories as seedCategories,
  products as seedProducts,
  type Product,
} from "../lib/store-data";

const copy = {
  ru: {
    heroTitle: "Премиальная экипировка для каратистов, клубов и залов.",
    heroText:
      "Кимоно, пояса, защита, татами и тренировочный инвентарь с актуальными остатками, B2C/B2B ценами и доставкой по Балтии.",
    shopNow: "Купить сейчас",
    viewOffers: "Акции",
    deliveryMarkets: "страны доставки",
    shopKit: "Соберите комплект",
    categoryTitle: "Полная экипировка для карате в одном каталоге.",
    categoryText: "Быстрый подбор для родителей, спортсменов, тренеров и B2B-клубов.",
    items: "товаров",
    storyTitle: "Экипировка, выбранная для настоящих тренировок.",
    storyText:
      "Удобная розничная покупка для семей, структурированные B2B-условия для клубов и доставка через пакоматы или курьера.",
    storyPoints: ["Для соревнований", "Счета для клубов", "Безопасная оплата Montonio"],
    featuredText: "Популярные позиции из каталога с учетом наличия и вариаций.",
    viewAll: "Все товары",
    ready: "Готово к отправке",
    readyTitle: "Товары в наличии на этой неделе.",
    trustedGear: "Проверенная экипировка",
    trustedGearText: "Товары для тренировок и соревнований от брендов, ориентированных на карате.",
  },
  lv: {
    heroTitle: "Premium karatē ekipējums sportistiem, klubiem un zālēm.",
    heroText:
      "Kimono, jostas, aizsargi, tatami un treniņu inventārs ar aktuāliem atlikumiem, B2C/B2B cenām un piegādi Baltijā.",
    shopNow: "Pirkt tagad",
    viewOffers: "Akcijas",
    deliveryMarkets: "piegādes valstis",
    shopKit: "Sakārtojiet komplektu",
    categoryTitle: "Pilns karatē ekipējums vienā katalogā.",
    categoryText: "Ātra atlase vecākiem, sportistiem, treneriem un B2B klubiem.",
    items: "preces",
    storyTitle: "Ekipējums īstām treniņu dienām.",
    storyText:
      "Ērta mazumtirdzniecība ģimenēm, skaidri B2B nosacījumi klubiem un piegāde ar paku automātiem vai kurjeru.",
    storyPoints: ["Sacensībām gatavs", "Rēķini klubiem", "Droša Montonio apmaksa"],
    featuredText: "Pieprasītas kataloga preces ar aktuāliem atlikumiem un variācijām.",
    viewAll: "Visas preces",
    ready: "Gatavs nosūtīšanai",
    readyTitle: "Preces noliktavā šai nedēļai.",
    trustedGear: "Uzticams ekipējums",
    trustedGearText: "Treniņu un sacensību preces no karatē zīmoliem.",
  },
  en: {
    heroTitle: "Premium karate equipment for athletes, clubs and dojos.",
    heroText:
      "Shop gi, belts, protection, tatami and training gear with live stock, B2C/B2B pricing and Baltic delivery.",
    shopNow: "Shop now",
    viewOffers: "View offers",
    deliveryMarkets: "delivery markets",
    shopKit: "Shop the kit",
    categoryTitle: "Build a complete karate setup from one catalog.",
    categoryText: "Fast paths for parents, athletes, coaches and B2B club buyers.",
    items: "items",
    storyTitle: "Equipment selected for real training days.",
    storyText:
      "Clean retail shopping for families, structured B2B terms for clubs, and fulfillment built around parcel machines and courier delivery.",
    storyPoints: ["Competition ready", "Club friendly invoices", "Secure Montonio checkout"],
    featuredText: "High-demand products grouped from live catalog data and stock levels.",
    viewAll: "View all products",
    ready: "Ready to ship",
    readyTitle: "In-stock equipment for this week.",
    trustedGear: "Trusted gear",
    trustedGearText: "Competition and training products from karate-focused brands.",
  },
  et: {
    heroTitle: "Premium karate varustus sportlastele, klubidele ja saalidele.",
    heroText:
      "Gi, vööd, kaitsed, tatami ja treeningvarustus reaalajas laoseisu, B2C/B2B hindade ja Balti tarnega.",
    shopNow: "Osta kohe",
    viewOffers: "Pakkumised",
    deliveryMarkets: "tarneriigid",
    shopKit: "Vali komplekt",
    categoryTitle: "Täielik karate varustus ühest kataloogist.",
    categoryText: "Kiired valikud vanematele, sportlastele, treeneritele ja B2B klubidele.",
    items: "toodet",
    storyTitle: "Varustus päris treeningpäevadeks.",
    storyText:
      "Mugav jaemüük peredele, selged B2B tingimused klubidele ning tarne pakiautomaatide või kulleriga.",
    storyPoints: ["Võistlusvalmis", "Arved klubidele", "Turvaline Montonio makse"],
    featuredText: "Populaarsed kataloogitooted reaalajas laoseisu ja variatsioonidega.",
    viewAll: "Kõik tooted",
    ready: "Saatmiseks valmis",
    readyTitle: "Selle nädala laos olev varustus.",
    trustedGear: "Usaldusväärne varustus",
    trustedGearText: "Treeningu ja võistluse tooted karatebrändidelt.",
  },
  lt: {
    heroTitle: "Premium karatė įranga sportininkams, klubams ir salėms.",
    heroText:
      "Kimono, diržai, apsaugos, tatami ir treniruočių inventorius su aktualiais likučiais, B2C/B2B kainomis ir pristatymu Baltijoje.",
    shopNow: "Pirkti dabar",
    viewOffers: "Akcijos",
    deliveryMarkets: "pristatymo šalys",
    shopKit: "Sukurkite komplektą",
    categoryTitle: "Visa karatė įranga viename kataloge.",
    categoryText: "Greiti pasirinkimai tėvams, sportininkams, treneriams ir B2B klubams.",
    items: "prekių",
    storyTitle: "Įranga tikroms treniruočių dienoms.",
    storyText:
      "Patogus apsipirkimas šeimoms, aiškios B2B sąlygos klubams ir pristatymas paštomatais arba kurjeriu.",
    storyPoints: ["Paruošta varžyboms", "Sąskaitos klubams", "Saugus Montonio mokėjimas"],
    featuredText: "Populiarios katalogo prekės pagal aktualius likučius ir variacijas.",
    viewAll: "Visos prekės",
    ready: "Paruošta siuntimui",
    readyTitle: "Šios savaitės prekės sandėlyje.",
    trustedGear: "Patikima įranga",
    trustedGearText: "Treniruočių ir varžybų prekės iš karatė prekių ženklų.",
  },
} as const;

export default function Home() {
  const { role } = useDemoSession();
  const { language, t } = useLanguage();
  const c = copy[language as keyof typeof copy] ?? copy.en;
  const productImageMap = useProductImages();
  const [homeProducts, setHomeProducts] = useState<Product[]>(seedProducts);
  const homeCategories = useMemo(
    () =>
      Array.from(
        new Set([...seedCategories, ...homeProducts.map((product) => product.category)]),
      ).filter(Boolean),
    [homeProducts],
  );
  const totals = useMemo(
    () => ({
      available: homeProducts.reduce(
        (sum, product) =>
          sum +
          product.variations.reduce(
            (variationSum, variation) => variationSum + available(variation.stock),
            0,
          ),
        0,
      ),
    }),
    [homeProducts],
  );
  const stockedProducts = homeProducts.filter((product) =>
    product.variations.some((variation) => available(variation.stock) > 0),
  );
  const featured = homeCategories
    .map((category) =>
      homeProducts.find(
        (product) =>
          product.category === category &&
          product.variations.some((variation) => available(variation.stock) > 0),
      ),
    )
    .filter((product): product is Product => Boolean(product))
    .slice(0, 6);
  const bestSellers = [...stockedProducts]
    .sort(
      (left, right) =>
        right.variations.reduce((sum, variation) => sum + available(variation.stock), 0) -
        left.variations.reduce((sum, variation) => sum + available(variation.stock), 0),
    )
    .slice(0, 4);
  const heroProducts = bestSellers.slice(0, 3);
  const heroProduct = heroProducts[0] ?? featured[0] ?? homeProducts[0];
  const categoryTiles = homeCategories.map((category) => {
    const product = stockedProducts.find((item) => item.category === category) ??
      homeProducts.find((item) => item.category === category);

    return { category, product };
  });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/products")
      .then((response) => response.json())
      .then((data: { products?: Product[] }) => {
        if (!cancelled && Array.isArray(data.products) && data.products.length) {
          setHomeProducts(data.products);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  function productPhotoStyle(product: Product | undefined) {
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
          <h1>{c.heroTitle}</h1>
          <p>{c.heroText}</p>
          <div className="hero-actions-v3">
            <Link className="button-v3 primary" href="/catalog">{c.shopNow}</Link>
            <Link className="button-v3 secondary" href="/catalog?promo=1">{c.viewOffers}</Link>
          </div>
          <div className="hero-stats-v3">
            <div>
              <strong>{homeProducts.length}</strong>
              <span>{t.products}</span>
            </div>
            <div>
              <strong>{totals.available}</strong>
              <span>{t.inStockUnits}</span>
            </div>
            <div>
              <strong>LV / LT / EE</strong>
              <span>{c.deliveryMarkets}</span>
            </div>
          </div>
        </div>

        <div className="hero-product-stage-v3">
          <Link className="hero-main-product-v3" href={`/product/${heroProduct.id}`}>
            <span className="hero-main-image-v3" style={productPhotoStyle(heroProduct)} />
            <span className="hero-main-copy-v3">
              <small>{heroProduct.brand}</small>
              <strong>{productTitle(heroProduct, language)}</strong>
              <em>{categoryLabel(heroProduct.category, language)}</em>
            </span>
          </Link>
          <div className="hero-stack-v3">
            {heroProducts.slice(1).map((product) => (
              <Link className="hero-mini-product-v3" href={`/product/${product.id}`} key={product.id}>
                <span style={productPhotoStyle(product)} />
                <strong>{productTitle(product, language)}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="category-mosaic-v3">
        <div className="section-intro-v3">
          <span className="kicker-v3">{c.shopKit}</span>
          <h2>{c.categoryTitle}</h2>
          <p>{c.categoryText}</p>
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
                <small>{homeProducts.filter((item) => item.category === category).length} {c.items}</small>
                <strong>{categoryLabel(category, language)}</strong>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="promo-story-v3">
        <PromoCarousel />
      </section>

      <section className="merch-section-v3">
        <div className="merch-copy-v3">
          <span className="kicker-v3">{t.popular}</span>
          <h2>{t.popularTitle}</h2>
          <p>{c.featuredText}</p>
          <Link className="button-v3 secondary dark" href="/catalog">{c.viewAll}</Link>
        </div>
        <div className="product-grid-v3 featured-grid-v3">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} role={role} />
          ))}
        </div>
      </section>

      <section className="best-seller-band-v3">
        <div className="section-intro-v3">
          <span className="kicker-v3">{c.ready}</span>
          <h2>{c.readyTitle}</h2>
        </div>
        <div className="product-grid-v3 compact-grid-v3">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} role={role} />
          ))}
        </div>
      </section>

      <section className="benefit-lane-v3">
        {[
          [t.delivery, t.deliveryText],
          [c.trustedGear, c.trustedGearText],
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
