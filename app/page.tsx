"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useLanguage } from "../components/language";
import { PromoCarousel } from "../components/promo-carousel";
import { useDemoSession } from "../components/session";
import { categoryLabel, money, productTitle, type Language } from "../lib/i18n";
import { productImages, useProductImages } from "../lib/product-media";
import {
  available,
  categories as seedCategories,
  products as seedProducts,
  pricedVariation,
  type Product,
  type UserRole,
} from "../lib/store-data";
import {
  applyPromoPrice,
  usePromoPrices,
  usePromoRules,
  type PromoPriceMap,
  type PromoRule,
} from "../lib/promotions";

type HomeMerchandising = {
  bestSellerIds: string[];
  bestSellerCounts: Record<string, number>;
  bestSellerSource: "orders" | "stock";
  newProductIds: string[];
};

const emptyMerchandising: HomeMerchandising = {
  bestSellerIds: [],
  bestSellerCounts: {},
  bestSellerSource: "stock",
  newProductIds: [],
};

const copy = {
  ru: {
    promo: "Акции",
    heroKicker: "Karatekas.eu / Karate Equipment",
    heroTitle: "Экипировка для карате, которую удобно выбрать и быстро получить.",
    heroText:
      "Кимоно, защита, пояса, перчатки и тренировочный инвентарь для спортсменов, родителей и клубов. Актуальные остатки, B2C/B2B цены и доставка по Балтии.",
    shopNow: "Открыть каталог",
    sale: "Скидочные товары",
    bestKicker: "Покупают чаще всего",
    bestTitle: "Хиты магазина по реальным заказам",
    bestFallback: "Пока заказов мало, показываем самые доступные товары на складе.",
    bestText:
      "Этот блок обновляется по истории заказов и помогает быстро найти позиции, которые чаще всего берут для тренировок и клубных закупок.",
    newKicker: "Новинки",
    newTitle: "Свежие поступления и недавно добавленные товары",
    newText: "Быстрый доступ к новым позициям каталога без перегруза главной страницы.",
    buildKicker: "Конструктор покупки",
    buildTitle: "Соберите комплект под задачу",
    buildText: "Не нужно угадывать с разделом: выберите сценарий и сразу откройте нужные товары.",
    categoriesKicker: "Категории",
    categoriesTitle: "Быстрый вход в каталог",
    categoriesText: "Короткие пути к основным разделам экипировки.",
    ready: "В наличии",
    readyTitle: "Готово к отправке на этой неделе",
    products: "товаров",
    brands: "брендов",
    inStock: "единиц доступно",
    delivery: "доставка LV / LT / EE",
    viewAll: "Все товары",
    items: "товаров",
    trustedGear: "Проверенная экипировка",
    trustedGearText: "Товары для тренировок и соревнований от брендов, ориентированных на карате.",
    benefits: [
      ["Быстрая доставка", "Пакоматы, курьер и самовывоз для Латвии, Литвы и Эстонии."],
      ["Качественная экипировка", "Подборка товаров для тренировок, соревнований и клубных закупок."],
      ["Безопасная оплата", "Карта, 3D Secure, Apple Pay, Google Pay и счета для клубов."],
      ["B2B условия", "После подтверждения клуб видит закупочные цены и может оформлять счета."],
    ],
    kitCards: [
      ["Для первого кимоно", "Размеры для детей и взрослых, базовые модели и белые пояса.", "/catalog?category=Kimono"],
      ["Защита для спарринга", "Перчатки, футы, жилеты и шлемы для тренировок и стартов.", "/catalog?category=Protective%20Equipment"],
      ["Пояса и аксессуары", "То, что часто забывают добавить к основному заказу.", "/catalog?category=Belts"],
    ],
  },
  lv: {
    promo: "Akcijas",
    heroKicker: "Karatekas.eu / Karate Equipment",
    heroTitle: "Karatē ekipējums, ko ir viegli izvēlēties un ātri saņemt.",
    heroText:
      "Kimono, aizsargi, jostas, cimdi un treniņu inventārs sportistiem, vecākiem un klubiem. Aktuāli atlikumi, B2C/B2B cenas un piegāde Baltijā.",
    shopNow: "Atvērt katalogu",
    sale: "Akcijas preces",
    bestKicker: "Visbiežāk pērk",
    bestTitle: "Veikala hiti pēc reāliem pasūtījumiem",
    bestFallback: "Kamēr pasūtījumu vēl ir maz, rādām noliktavā pieejamākās preces.",
    bestText:
      "Bloks tiek atjaunots pēc pasūtījumu vēstures un palīdz ātri atrast populārākās treniņu un klubu pirkumu preces.",
    newKicker: "Jaunumi",
    newTitle: "Jaunākās preces katalogā",
    newText: "Ātra piekļuve svaigi pievienotām pozīcijām bez pārslogotas sākumlapas.",
    buildKicker: "Pirkuma konstruktors",
    buildTitle: "Sakārtojiet komplektu pēc vajadzības",
    buildText: "Izvēlieties scenāriju un uzreiz atveriet pareizās preces.",
    categoriesKicker: "Kategorijas",
    categoriesTitle: "Ātrā ieeja katalogā",
    categoriesText: "Īsi ceļi uz galvenajām ekipējuma sadaļām.",
    ready: "Noliktavā",
    readyTitle: "Gatavs nosūtīšanai šonedēļ",
    products: "preces",
    brands: "zīmoli",
    inStock: "vienības pieejamas",
    delivery: "piegāde LV / LT / EE",
    viewAll: "Visas preces",
    items: "preces",
    trustedGear: "Uzticams ekipējums",
    trustedGearText: "Treniņu un sacensību preces no karatē zīmoliem.",
    benefits: [
      ["Ātra piegāde", "Paku automāti, kurjers un pašizņemšana Latvijā, Lietuvā un Igaunijā."],
      ["Kvalitatīvs ekipējums", "Preces treniņiem, sacensībām un klubu iepirkumiem."],
      ["Droša apmaksa", "Karte, 3D Secure, Apple Pay, Google Pay un rēķini klubiem."],
      ["B2B nosacījumi", "Pēc apstiprināšanas klubs redz iepirkuma cenas un var saņemt rēķinus."],
    ],
    kitCards: [
      ["Pirmajam kimono", "Izmēri bērniem un pieaugušajiem, bāzes modeļi un baltās jostas.", "/catalog?category=Kimono"],
      ["Sparinga aizsargi", "Cimdi, kāju aizsargi, vestes un ķiveres treniņiem.", "/catalog?category=Protective%20Equipment"],
      ["Jostas un aksesuāri", "Mazās lietas, ko bieži pievieno galvenajam pasūtījumam.", "/catalog?category=Belts"],
    ],
  },
  en: {
    promo: "Offers",
    heroKicker: "Karatekas.eu / Karate Equipment",
    heroTitle: "Karate equipment that is easy to choose and fast to receive.",
    heroText:
      "Gi, protection, belts, gloves and training gear for athletes, parents and clubs. Live stock, B2C/B2B pricing and Baltic delivery.",
    shopNow: "Open catalog",
    sale: "Sale products",
    bestKicker: "Most bought",
    bestTitle: "Store best sellers from real orders",
    bestFallback: "While order history is still light, we show the strongest in-stock products.",
    bestText:
      "This section updates from order history, helping customers find the products most often bought for training and club orders.",
    newKicker: "New arrivals",
    newTitle: "Freshly added equipment",
    newText: "A clean route to the latest catalog positions without overloading the storefront.",
    buildKicker: "Shopping builder",
    buildTitle: "Build a kit by use case",
    buildText: "Pick the scenario and jump straight into the right product set.",
    categoriesKicker: "Categories",
    categoriesTitle: "Quick catalog entry",
    categoriesText: "Short paths into the main equipment groups.",
    ready: "In stock",
    readyTitle: "Ready to ship this week",
    products: "products",
    brands: "brands",
    inStock: "units available",
    delivery: "delivery LV / LT / EE",
    viewAll: "All products",
    items: "items",
    trustedGear: "Trusted gear",
    trustedGearText: "Competition and training products from karate-focused brands.",
    benefits: [
      ["Fast delivery", "Parcel machines, courier delivery and store pickup across Latvia, Lithuania and Estonia."],
      ["Quality gear", "Products selected for training, competition and club purchasing."],
      ["Secure checkout", "Card payments, 3D Secure, Apple Pay, Google Pay and club invoices."],
      ["B2B terms", "Approved clubs see wholesale prices and can place invoice orders."],
    ],
    kitCards: [
      ["First karate gi", "Kids and adult sizes, entry models and white belts.", "/catalog?category=Kimono"],
      ["Sparring protection", "Gloves, foot guards, body protectors and helmets for training.", "/catalog?category=Protective%20Equipment"],
      ["Belts and extras", "The small things that often belong in the main order.", "/catalog?category=Belts"],
    ],
  },
  et: {
    promo: "Pakkumised",
    heroKicker: "Karatekas.eu / Karate Equipment",
    heroTitle: "Karate varustus, mida on lihtne valida ja kiire saada.",
    heroText:
      "Gi, kaitsed, vööd, kindad ja treeningvarustus sportlastele, vanematele ja klubidele. Reaalne laoseis, B2C/B2B hinnad ja Balti tarne.",
    shopNow: "Ava kataloog",
    sale: "Soodustusega tooted",
    bestKicker: "Enim ostetud",
    bestTitle: "Poe hitid päris tellimuste põhjal",
    bestFallback: "Kuni tellimuste ajalugu on väike, näitame tugevaima laoseisuga tooteid.",
    bestText:
      "See blokk uueneb tellimuste ajaloo järgi ja aitab leida kõige sagedamini ostetud treeningu- ja klubitooteid.",
    newKicker: "Uued tooted",
    newTitle: "Värskelt lisatud varustus",
    newText: "Kiire tee uusimate kataloogitoodeteni ilma avalehte üle koormamata.",
    buildKicker: "Ostukonstruktor",
    buildTitle: "Koosta komplekt vajaduse järgi",
    buildText: "Vali stsenaarium ja liigu kohe õigesse tootevalikusse.",
    categoriesKicker: "Kategooriad",
    categoriesTitle: "Kiire sisenemine kataloogi",
    categoriesText: "Lühiteed peamistesse varustuse rühmadesse.",
    ready: "Laos",
    readyTitle: "Sel nädalal saatmiseks valmis",
    products: "toodet",
    brands: "brändi",
    inStock: "ühikut saadaval",
    delivery: "tarne LV / LT / EE",
    viewAll: "Kõik tooted",
    items: "toodet",
    trustedGear: "Usaldusväärne varustus",
    trustedGearText: "Treeningu ja võistluse tooted karatebrändidelt.",
    benefits: [
      ["Kiire tarne", "Pakiautomaadid, kuller ja ise järele tulemine Lätis, Leedus ja Eestis."],
      ["Kvaliteetne varustus", "Tooted treeninguks, võistlusteks ja klubitellimusteks."],
      ["Turvaline makse", "Kaardid, 3D Secure, Apple Pay, Google Pay ja klubiarved."],
      ["B2B tingimused", "Kinnitatud klubid näevad hulgihindu ja saavad tellida arvega."],
    ],
    kitCards: [
      ["Esimene karate gi", "Laste ja täiskasvanute suurused, baasmudelid ja valged vööd.", "/catalog?category=Kimono"],
      ["Sparringukaitsed", "Kindad, jalakaitsed, vestid ja kiivrid treeninguks.", "/catalog?category=Protective%20Equipment"],
      ["Vööd ja lisad", "Väikesed asjad, mis käivad sageli põhitellimusega kaasa.", "/catalog?category=Belts"],
    ],
  },
  lt: {
    promo: "Akcijos",
    heroKicker: "Karatekas.eu / Karate Equipment",
    heroTitle: "Karatė įranga, kurią lengva pasirinkti ir greitai gauti.",
    heroText:
      "Kimono, apsaugos, diržai, pirštinės ir treniruočių inventorius sportininkams, tėvams ir klubams. Aktualūs likučiai, B2C/B2B kainos ir pristatymas Baltijoje.",
    shopNow: "Atidaryti katalogą",
    sale: "Akcijų prekės",
    bestKicker: "Dažniausiai perkama",
    bestTitle: "Parduotuvės hitai pagal tikrus užsakymus",
    bestFallback: "Kol užsakymų istorija dar nedidelė, rodome geriausiai sandėlyje prieinamas prekes.",
    bestText:
      "Šis blokas atsinaujina pagal užsakymų istoriją ir padeda rasti dažniausiai treniruotėms bei klubams perkamas prekes.",
    newKicker: "Naujienos",
    newTitle: "Naujausiai pridėta įranga",
    newText: "Greitas kelias į naujausias katalogo pozicijas neperkraunant pagrindinio puslapio.",
    buildKicker: "Pirkimo konstruktorius",
    buildTitle: "Sudėkite komplektą pagal poreikį",
    buildText: "Pasirinkite scenarijų ir iškart atidarykite tinkamas prekes.",
    categoriesKicker: "Kategorijos",
    categoriesTitle: "Greita įeiga į katalogą",
    categoriesText: "Trumpi keliai į pagrindines įrangos grupes.",
    ready: "Sandėlyje",
    readyTitle: "Paruošta siuntimui šią savaitę",
    products: "prekės",
    brands: "prekių ženklai",
    inStock: "vnt. yra",
    delivery: "pristatymas LV / LT / EE",
    viewAll: "Visos prekės",
    items: "prekių",
    trustedGear: "Patikima įranga",
    trustedGearText: "Treniruočių ir varžybų prekės iš karatė prekių ženklų.",
    benefits: [
      ["Greitas pristatymas", "Paštomatai, kurjeris ir atsiėmimas Latvijoje, Lietuvoje ir Estijoje."],
      ["Kokybiška įranga", "Prekės treniruotėms, varžyboms ir klubų užsakymams."],
      ["Saugus apmokėjimas", "Kortelės, 3D Secure, Apple Pay, Google Pay ir sąskaitos klubams."],
      ["B2B sąlygos", "Patvirtinti klubai mato didmenines kainas ir gali užsakyti pagal sąskaitą."],
    ],
    kitCards: [
      ["Pirmam kimono", "Dydžiai vaikams ir suaugusiesiems, baziniai modeliai ir balti diržai.", "/catalog?category=Kimono"],
      ["Sparingo apsaugos", "Pirštinės, pėdų apsaugos, liemenės ir šalmai treniruotėms.", "/catalog?category=Protective%20Equipment"],
      ["Diržai ir priedai", "Maži dalykai, kuriuos dažnai verta pridėti prie pagrindinio užsakymo.", "/catalog?category=Belts"],
    ],
  },
} as const;

const productTabCopy = {
  ru: { new: "Новинки", best: "Хиты продаж", top: "Рекомендуем", view: "Смотреть", sale: "Акция" },
  lv: { new: "Jaunumi", best: "Pirktākie", top: "Iesakām", view: "Skatīt", sale: "Akcija" },
  en: { new: "New Arrival", best: "Best Selling", top: "Recommended", view: "View", sale: "Sale" },
  et: { new: "Uued", best: "Enim ostetud", top: "Soovitame", view: "Vaata", sale: "Soodus" },
  lt: { new: "Naujienos", best: "Perkamiausi", top: "Rekomenduojame", view: "Peržiūrėti", sale: "Akcija" },
} as const;

const clubCtaCopy = {
  ru: {
    title: "У вас клуб боевых искусств?",
    text: "Подайте заявку на B2B-условия, чтобы видеть клубные цены и оформлять заказы по счету.",
    button: "Запросить B2B доступ",
  },
  lv: {
    title: "Vai jums ir cīņas mākslas klubs?",
    text: "Piesakieties B2B nosacījumiem, lai redzētu klubu cenas un pasūtītu ar rēķinu.",
    button: "Pieteikt B2B piekļuvi",
  },
  en: {
    title: "Own a martial arts club?",
    text: "Apply for B2B terms to see club pricing and place invoice orders.",
    button: "Apply for wholesale",
  },
  et: {
    title: "Kas teil on võitluskunstide klubi?",
    text: "Taotle B2B tingimusi, et näha klubihindu ja tellida arvega.",
    button: "Taotle B2B ligipääsu",
  },
  lt: {
    title: "Turite kovos menų klubą?",
    text: "Pateikite B2B užklausą, kad matytumėte klubų kainas ir užsakytumėte pagal sąskaitą.",
    button: "Prašyti B2B prieigos",
  },
} as const;

const featuredTitleCopy = {
  ru: "Популярные товары",
  lv: "Izvēlētās preces",
  en: "Featured Products",
  et: "Esiletõstetud tooted",
  lt: "Atrinktos prekės",
} as const;

function productStock(product: Product) {
  return product.variations.reduce(
    (sum, variation) => sum + available(variation.stock),
    0,
  );
}

function preferredVariation(product: Product) {
  return (
    product.variations.find((variation) => available(variation.stock) > 0) ??
    product.variations[0]
  );
}

function HomeProductTile({
  product,
  role,
  language,
  imageStyle,
  badge,
  promoPrices,
  promoRules,
}: {
  product: Product;
  role: UserRole;
  language: Language;
  imageStyle?: CSSProperties;
  badge?: string;
  promoPrices: PromoPriceMap;
  promoRules: PromoRule[];
}) {
  const tabText = productTabCopy[language] ?? productTabCopy.en;
  const variation = preferredVariation(product);
  if (!variation) {
    return null;
  }

  const price = applyPromoPrice(
    pricedVariation(product, variation, role),
    variation.id,
    role,
    promoPrices,
    promoRules,
    { productId: product.id, brand: product.brand },
  );
  const isSale = Boolean(price.hasPromo || price.discount);

  return (
    <Link className="home-product-tile-v5" href={`/product/${product.id}`}>
      <span className="home-product-image-v5" style={imageStyle}>
        <span className="home-product-badges-v5">
          {badge ? <span>{badge}</span> : null}
          {isSale ? <span className="sale">{tabText.sale}</span> : null}
        </span>
      </span>
      <span className="home-product-meta-v5">{categoryLabel(product.category, language)}</span>
      <strong>{productTitle(product, language)}</strong>
      <span className="home-product-price-v5">
        {price.compareAt ? (
          <em>{money(price.compareAt, language)}</em>
        ) : null}
        <b>{money(price.final, language)}</b>
      </span>
      <span className="home-product-action-v5">{tabText.view}</span>
    </Link>
  );
}

export default function Home() {
  const { role } = useDemoSession();
  const { language } = useLanguage();
  const c = copy[language as keyof typeof copy] ?? copy.en;
  const productImageMap = useProductImages();
  const promoPrices = usePromoPrices();
  const promoRules = usePromoRules();
  const [homeProducts, setHomeProducts] = useState<Product[]>(seedProducts);
  const [merchandising, setMerchandising] = useState<HomeMerchandising>(emptyMerchandising);
  const [productTab, setProductTab] = useState<"new" | "best" | "top">("new");

  const homeCategories = useMemo(
    () =>
      Array.from(
        new Set([...seedCategories, ...homeProducts.map((product) => product.category)]),
      ).filter(Boolean),
    [homeProducts],
  );

  const productMap = useMemo(
    () => new Map(homeProducts.map((product) => [product.id, product])),
    [homeProducts],
  );

  const stockedProducts = useMemo(
    () => homeProducts.filter((product) => productStock(product) > 0),
    [homeProducts],
  );

  const totals = useMemo(
    () => ({
      available: homeProducts.reduce((sum, product) => sum + productStock(product), 0),
      brands: new Set(homeProducts.map((product) => product.brand).filter(Boolean)).size,
    }),
    [homeProducts],
  );

  function productsByIds(ids: string[], fallback: Product[], limit: number) {
    const picked = ids
      .map((id) => productMap.get(id))
      .filter((product): product is Product => Boolean(product));
    const seen = new Set(picked.map((product) => product.id));
    const filled = [
      ...picked,
      ...fallback.filter((product) => !seen.has(product.id)),
    ];

    return filled.slice(0, limit);
  }

  const stockFallback = useMemo(
    () => [...stockedProducts].sort((left, right) => productStock(right) - productStock(left)),
    [stockedProducts],
  );
  const bestSellers = productsByIds(merchandising.bestSellerIds, stockFallback, 8);
  const newProducts = productsByIds(
    merchandising.newProductIds,
    [...homeProducts].reverse(),
    12,
  );
  const recommendedProducts = useMemo(
    () =>
      [...stockedProducts]
        .sort(
          (left, right) =>
            productStock(right) + right.variations.length * 3 -
            (productStock(left) + left.variations.length * 3),
        )
        .slice(0, 12),
    [stockedProducts],
  );
  const tabLabels = productTabCopy[language as keyof typeof productTabCopy] ?? productTabCopy.en;
  const clubCta = clubCtaCopy[language as keyof typeof clubCtaCopy] ?? clubCtaCopy.en;
  const featuredTitle =
    featuredTitleCopy[language as keyof typeof featuredTitleCopy] ?? featuredTitleCopy.en;
  const activeProducts =
    productTab === "new"
      ? newProducts
      : productTab === "best"
        ? bestSellers
        : recommendedProducts;
  const heroProducts = bestSellers.slice(0, 3);
  const heroProduct = heroProducts[0] ?? stockedProducts[0] ?? homeProducts[0];
  const categoryTiles = homeCategories.slice(0, 5).map((category) => {
    const product = stockedProducts.find((item) => item.category === category) ??
      homeProducts.find((item) => item.category === category);

    return { category, product };
  });
  const findBrandProduct = (brand: string, fallback: Product) =>
    stockedProducts.find((product) => product.brand.toLowerCase().includes(brand.toLowerCase())) ??
    homeProducts.find((product) => product.brand.toLowerCase().includes(brand.toLowerCase())) ??
    fallback;
  const brandTiles = [
    {
      className: "main",
      product: findBrandProduct("Smai", heroProduct),
      kicker: "WKF approved gear",
      title: "SMAI",
      text: c.heroText,
      href: "/catalog?brand=Smai",
    },
    {
      className: "small",
      product: findBrandProduct("Kihon", heroProduct),
      kicker: "Shop now",
      title: "Kihon",
      text: "",
      href: "/catalog?brand=Kihon",
    },
    {
      className: "small accent",
      product: findBrandProduct("Punok", heroProduct),
      kicker: "Shop now",
      title: "Punok",
      text: "",
      href: "/catalog?brand=Punok",
    },
    {
      className: "wide",
      product: findBrandProduct("Arawaza", heroProduct),
      kicker: "Designed for winners",
      title: "Arawaza",
      text: c.trustedGearText,
      href: "/catalog?brand=Arawaza",
    },
  ];

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

    fetch("/api/home-merchandising")
      .then((response) => response.json())
      .then((data: Partial<HomeMerchandising>) => {
        if (cancelled) {
          return;
        }

        setMerchandising({
          bestSellerIds: Array.isArray(data.bestSellerIds) ? data.bestSellerIds : [],
          bestSellerCounts: data.bestSellerCounts ?? {},
          bestSellerSource: data.bestSellerSource === "orders" ? "orders" : "stock",
          newProductIds: Array.isArray(data.newProductIds) ? data.newProductIds : [],
        });
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

  if (!heroProduct) {
    return null;
  }

  return (
    <div className="storefront-v3 storefront-home-v5">
      <section aria-label={c.promo} className="home-promo-top-v5">
        <PromoCarousel />
      </section>

      <section className="home-brand-showcase-v5">
        {brandTiles.map((tile) => (
          <Link className={`brand-tile-v5 ${tile.className}`} href={tile.href} key={tile.title}>
            <span className="brand-tile-image-v5" style={productPhotoStyle(tile.product)} />
            <span className="brand-tile-shade-v5" />
            <span className="brand-tile-copy-v5">
              <small>{tile.kicker}</small>
              <strong>{tile.title}</strong>
              {tile.text ? <p>{tile.text}</p> : null}
              <em>{c.shopNow}</em>
            </span>
          </Link>
        ))}
      </section>

      <section className="home-stat-strip-v5" aria-label={c.heroKicker}>
        <div><strong>{homeProducts.length}</strong><span>{c.products}</span></div>
        <div><strong>{totals.available}</strong><span>{c.inStock}</span></div>
        <div><strong>{totals.brands}</strong><span>{c.brands}</span></div>
        <div><strong>LV/LT/EE</strong><span>{c.delivery}</span></div>
      </section>

      <section className="home-category-showcase-v5">
        <div className="category-rack-v5">
          {categoryTiles.map(({ category, product }) => (
            <Link
              className="category-card-v5"
              href={`/catalog?category=${encodeURIComponent(category)}`}
              key={category}
            >
              <span className="category-card-image-v5" style={productPhotoStyle(product)} />
              <span className="category-card-copy-v5">
                <strong>{categoryLabel(category, language)}</strong>
                <small>{homeProducts.filter((item) => item.category === category).length} {c.items}</small>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-featured-products-v5">
        <div className="home-centered-head-v5">
          <span className="kicker-v3">{merchandising.bestSellerSource === "orders" ? c.bestKicker : c.ready}</span>
          <h2>{featuredTitle}</h2>
          <p>{merchandising.bestSellerSource === "orders" ? c.bestText : c.bestFallback}</p>
        </div>
        <div className="home-product-tabs-v5" role="tablist" aria-label="Featured products">
          {([
            ["new", tabLabels.new],
            ["best", tabLabels.best],
            ["top", tabLabels.top],
          ] as const).map(([id, label]) => (
            <button
              aria-selected={productTab === id}
              className={productTab === id ? "active" : ""}
              key={id}
              onClick={() => setProductTab(id)}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="home-product-mosaic-v5">
          {activeProducts.slice(0, 10).map((product) => (
            <HomeProductTile
              badge={
                productTab === "new"
                  ? tabLabels.new
                  : productTab === "best"
                    ? tabLabels.best
                    : undefined
              }
              imageStyle={productPhotoStyle(product)}
              key={product.id}
              language={language}
              product={product}
              promoPrices={promoPrices}
              promoRules={promoRules}
              role={role}
            />
          ))}
        </div>
      </section>

      <section className="home-kit-builder-v5">
        <div className="kit-builder-copy-v5">
          <span className="kicker-v3">{c.buildKicker}</span>
          <h2>{c.buildTitle}</h2>
          <p>{c.buildText}</p>
        </div>
        <div className="kit-builder-grid-v5">
          {c.kitCards.map(([title, text, href], index) => (
            <Link className="kit-builder-card-v5" href={href} key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{title}</strong>
              <p>{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-club-cta-v5">
        <h2>{clubCta.title}</h2>
        <p>{clubCta.text}</p>
        <Link href="/account">{clubCta.button}</Link>
      </section>

      <section className="home-benefits-v5">
        {c.benefits.map(([title, text], index) => (
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
