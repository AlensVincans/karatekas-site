import type { Product } from "./store-data";

export const languages = [
  { code: "lv", label: "LV", name: "Latviešu" },
  { code: "en", label: "EN", name: "English" },
  { code: "ru", label: "RU", name: "Русский" },
  { code: "et", label: "ET", name: "Eesti" },
  { code: "lt", label: "LT", name: "Lietuvių" },
] as const;

export type Language = (typeof languages)[number]["code"];

export const defaultLanguage: Language = "lv";

export const dictionary = {
  ru: {
    brandSubline: "экипировка для карате",
    navCatalog: "Каталог",
    navCart: "Корзина",
    navB2B: "B2B цены",
    navAdmin: "Админка",
    login: "Вход",
    register: "Регистрация",
    logout: "Выйти",
    client: "Клиент",
    heroEyebrow: "Карате · клубы · быстрые поставки",
    heroTitle: "Экипировка для карате в розницу и для клубов",
    heroText:
      "Кимоно, пояса, защита, перчатки и тренировочный инвентарь с понятными B2C/B2B ценами, доставкой по Балтии и оплатой картой или по счёту.",
    openCatalog: "Открыть каталог",
    becomeClient: "Стать клиентом",
    products: "товаров",
    categories: "категорий",
    inStockUnits: "единиц на складе",
    clubSeason: "Клубный сезон",
    clubSeasonText:
      "Скидки на Kihon, защита для спаррингов и клубные закупки кимоно для залов в Латвии, Литве и Эстонии.",
    popular: "Популярное",
    popularTitle: "Ходовые позиции для тренировок",
    payment: "Оплата",
    paymentText: "Карты, 3D Secure, Apple Pay, Google Pay и оплата по счёту для клубов.",
    b2bTerms: "B2B условия",
    b2bTermsText: "После входа клуб видит розницу зачёркнутой и активную закупочную цену.",
    delivery: "Доставка",
    deliveryText: "Omniva, DPD, Unisend, Latvijas Pasts и курьерская доставка по Балтии.",
    catalogTitle: "Кимоно, пояса, защита и инвентарь для карате",
    filters: "Фильтры",
    search: "Поиск",
    searchPlaceholder: "товар, бренд, категория",
    category: "Категория",
    brand: "Бренд",
    discountedOnly: "Скидочные товары",
    all: "Все",
    available: "доступно",
    reserved: "в резерве",
    addToCart: "В корзину",
    added: "Добавлено",
    color: "Цвет",
    size: "Размер",
    option: "Вариант",
    buyInCatalog: "Купить в каталоге",
    similarProducts: "Похожие товары",
    imageGallery: "Картинки товара",
    variation: "Вариация",
    batch: "Партия",
    cost: "Себестоимость",
    marginB2B: "Маржа B2B",
  },
  lv: {
    brandSubline: "karatē ekipējums",
    navCatalog: "Katalogs",
    navCart: "Grozs",
    navB2B: "B2B cenas",
    navAdmin: "Administrācija",
    login: "Ieeja",
    register: "Reģistrācija",
    logout: "Iziet",
    client: "Klients",
    heroEyebrow: "Karatē · klubi · ātras piegādes",
    heroTitle: "Karatē ekipējums sportistiem un klubiem",
    heroText:
      "Kimono, jostas, aizsargi, cimdi un treniņu inventārs ar skaidrām B2C/B2B cenām, piegādi Baltijā un apmaksu ar karti vai rēķinu.",
    openCatalog: "Atvērt katalogu",
    becomeClient: "Kļūt par klientu",
    products: "preces",
    categories: "kategorijas",
    inStockUnits: "vienības noliktavā",
    clubSeason: "Klubu sezona",
    clubSeasonText:
      "Atlaides Kihon precēm, sparinga aizsargi un klubu kimono iepirkumi zālēm Latvijā, Lietuvā un Igaunijā.",
    popular: "Populāri",
    popularTitle: "Pieprasītas treniņu preces",
    payment: "Apmaksa",
    paymentText: "Kartes, 3D Secure, Apple Pay, Google Pay un apmaksa ar rēķinu klubiem.",
    b2bTerms: "B2B nosacījumi",
    b2bTermsText: "Pēc ieejas klubs redz mazumtirdzniecības cenu un aktīvo iepirkuma cenu.",
    delivery: "Piegāde",
    deliveryText: "Omniva, DPD, Unisend, Latvijas Pasts un kurjera piegāde Baltijā.",
    catalogTitle: "Kimono, jostas, aizsargi un inventārs karatē",
    filters: "Filtri",
    search: "Meklēt",
    searchPlaceholder: "prece, zīmols, kategorija",
    category: "Kategorija",
    brand: "Zīmols",
    discountedOnly: "Akcijas preces",
    all: "Visi",
    available: "pieejams",
    reserved: "rezervē",
    addToCart: "Grozā",
    added: "Pievienots",
    color: "Krāsa",
    size: "Izmērs",
    option: "Variants",
    buyInCatalog: "Pirkt katalogā",
    similarProducts: "Līdzīgas preces",
    imageGallery: "Preces attēli",
    variation: "Variācija",
    batch: "Partija",
    cost: "Pašizmaksa",
    marginB2B: "B2B marža",
  },
  en: {
    brandSubline: "karate equipment",
    navCatalog: "Catalog",
    navCart: "Cart",
    navB2B: "B2B prices",
    navAdmin: "Admin",
    login: "Login",
    register: "Register",
    logout: "Log out",
    client: "Client",
    heroEyebrow: "Karate · clubs · fast delivery",
    heroTitle: "Karate equipment for athletes and clubs",
    heroText:
      "Gi, belts, protection, gloves and training gear with clear B2C/B2B prices, Baltic delivery and card or invoice payment.",
    openCatalog: "Open catalog",
    becomeClient: "Become a client",
    products: "products",
    categories: "categories",
    inStockUnits: "units in stock",
    clubSeason: "Club season",
    clubSeasonText:
      "Kihon offers, sparring protection and club gi orders for dojos in Latvia, Lithuania and Estonia.",
    popular: "Popular",
    popularTitle: "Training essentials in stock",
    payment: "Payment",
    paymentText: "Cards, 3D Secure, Apple Pay, Google Pay and invoice payment for clubs.",
    b2bTerms: "B2B terms",
    b2bTermsText: "After login, clubs see retail crossed out and the active B2B price.",
    delivery: "Delivery",
    deliveryText: "Omniva, DPD, Unisend, Latvijas Pasts and courier delivery across the Baltics.",
    catalogTitle: "Gi, belts, protection and karate training gear",
    filters: "Filters",
    search: "Search",
    searchPlaceholder: "product, brand, category",
    category: "Category",
    brand: "Brand",
    discountedOnly: "Discounted products",
    all: "All",
    available: "available",
    reserved: "reserved",
    addToCart: "Add to cart",
    added: "Added",
    color: "Color",
    size: "Size",
    option: "Option",
    buyInCatalog: "Buy in catalog",
    similarProducts: "Similar products",
    imageGallery: "Product images",
    variation: "Variation",
    batch: "Batch",
    cost: "Cost",
    marginB2B: "B2B margin",
  },
  et: {
    brandSubline: "karate varustus",
    navCatalog: "Kataloog",
    navCart: "Ostukorv",
    navB2B: "B2B hinnad",
    navAdmin: "Admin",
    login: "Logi sisse",
    register: "Registreeru",
    logout: "Logi välja",
    client: "Klient",
    heroEyebrow: "Karate · klubid · kiire tarne",
    heroTitle: "Karate varustus sportlastele ja klubidele",
    heroText:
      "Gi, vööd, kaitsed, kindad ja treeningvarustus selgete B2C/B2B hindade, Balti tarne ning kaardi- või arvepõhise maksega.",
    openCatalog: "Ava kataloog",
    becomeClient: "Hakka kliendiks",
    products: "toodet",
    categories: "kategooriat",
    inStockUnits: "ühikut laos",
    clubSeason: "Klubihooaeg",
    clubSeasonText:
      "Kihon pakkumised, sparringukaitsed ja klubitellimused saalidele Lätis, Leedus ja Eestis.",
    popular: "Populaarne",
    popularTitle: "Treeningu põhivarustus laos",
    payment: "Makse",
    paymentText: "Kaardid, 3D Secure, Apple Pay, Google Pay ja klubidele arvega maksmine.",
    b2bTerms: "B2B tingimused",
    b2bTermsText: "Pärast sisselogimist näevad klubid jaehinda läbikriipsutatult ja aktiivset B2B hinda.",
    delivery: "Tarne",
    deliveryText: "Omniva, DPD, Unisend, Latvijas Pasts ja kuller üle Baltikumi.",
    catalogTitle: "Gi, vööd, kaitsed ja karate treeningvarustus",
    filters: "Filtrid",
    search: "Otsi",
    searchPlaceholder: "toode, bränd, kategooria",
    category: "Kategooria",
    brand: "Bränd",
    discountedOnly: "Soodustusega tooted",
    all: "Kõik",
    available: "saadaval",
    reserved: "reserveeritud",
    addToCart: "Lisa korvi",
    added: "Lisatud",
    color: "Värv",
    size: "Suurus",
    option: "Valik",
    buyInCatalog: "Osta kataloogist",
    similarProducts: "Sarnased tooted",
    imageGallery: "Toote pildid",
    variation: "Variatsioon",
    batch: "Partii",
    cost: "Omahind",
    marginB2B: "B2B marginaal",
  },
  lt: {
    brandSubline: "karatė įranga",
    navCatalog: "Katalogas",
    navCart: "Krepšelis",
    navB2B: "B2B kainos",
    navAdmin: "Admin",
    login: "Prisijungti",
    register: "Registruotis",
    logout: "Atsijungti",
    client: "Klientas",
    heroEyebrow: "Karatė · klubai · greitas pristatymas",
    heroTitle: "Karatė įranga sportininkams ir klubams",
    heroText:
      "Kimono, diržai, apsaugos, pirštinės ir treniruočių įranga su aiškiomis B2C/B2B kainomis, pristatymu Baltijos šalyse ir apmokėjimu kortele arba pagal sąskaitą.",
    openCatalog: "Atidaryti katalogą",
    becomeClient: "Tapti klientu",
    products: "prekių",
    categories: "kategorijų",
    inStockUnits: "vnt. sandėlyje",
    clubSeason: "Klubų sezonas",
    clubSeasonText:
      "Kihon pasiūlymai, sparingo apsaugos ir klubų kimono užsakymai salėms Latvijoje, Lietuvoje ir Estijoje.",
    popular: "Populiaru",
    popularTitle: "Treniruočių prekės sandėlyje",
    payment: "Apmokėjimas",
    paymentText: "Kortelės, 3D Secure, Apple Pay, Google Pay ir apmokėjimas pagal sąskaitą klubams.",
    b2bTerms: "B2B sąlygos",
    b2bTermsText: "Prisijungę klubai mato perbrauktą mažmeninę kainą ir aktyvią B2B kainą.",
    delivery: "Pristatymas",
    deliveryText: "Omniva, DPD, Unisend, Latvijas Pasts ir kurjeris Baltijos šalyse.",
    catalogTitle: "Kimono, diržai, apsaugos ir karatė treniruočių įranga",
    filters: "Filtrai",
    search: "Paieška",
    searchPlaceholder: "prekė, prekės ženklas, kategorija",
    category: "Kategorija",
    brand: "Prekės ženklas",
    discountedOnly: "Prekės su nuolaida",
    all: "Visos",
    available: "yra",
    reserved: "rezervuota",
    addToCart: "Į krepšelį",
    added: "Pridėta",
    color: "Spalva",
    size: "Dydis",
    option: "Variantas",
    buyInCatalog: "Pirkti kataloge",
    similarProducts: "Panašios prekės",
    imageGallery: "Prekės nuotraukos",
    variation: "Variacija",
    batch: "Partija",
    cost: "Savikaina",
    marginB2B: "B2B marža",
  },
} as const;

const categoryLabels: Record<Language, Record<string, string>> = {
  ru: {
    Accessories: "Аксессуары",
    Belts: "Пояса",
    Kimono: "Кимоно",
    "Protective Equipment": "Защита",
    "Punching bags": "Мешки и манекены",
    Tatami: "Татами",
    WUKF: "WUKF",
    Equipment: "Экипировка",
  },
  lv: {
    Accessories: "Aksesuāri",
    Belts: "Jostas",
    Kimono: "Kimono",
    "Protective Equipment": "Aizsargi",
    "Punching bags": "Maisi un manekeni",
    Tatami: "Tatami",
    WUKF: "WUKF",
    Equipment: "Ekipējums",
  },
  en: {
    Accessories: "Accessories",
    Belts: "Belts",
    Kimono: "Gi",
    "Protective Equipment": "Protective equipment",
    "Punching bags": "Punching bags",
    Tatami: "Tatami",
    WUKF: "WUKF",
    Equipment: "Equipment",
  },
  et: {
    Accessories: "Aksessuaarid",
    Belts: "Vööd",
    Kimono: "Gi",
    "Protective Equipment": "Kaitsevarustus",
    "Punching bags": "Poksikotid",
    Tatami: "Tatami",
    WUKF: "WUKF",
    Equipment: "Varustus",
  },
  lt: {
    Accessories: "Aksesuarai",
    Belts: "Diržai",
    Kimono: "Kimono",
    "Protective Equipment": "Apsaugos",
    "Punching bags": "Bokso maišai",
    Tatami: "Tatami",
    WUKF: "WUKF",
    Equipment: "Įranga",
  },
};

const colorLabels: Record<Language, Record<string, string>> = {
  ru: {
    White: "Белый",
    Black: "Черный",
    Blue: "Синий",
    Red: "Красный",
    Pink: "Розовый",
    Green: "Зеленый",
    Yellow: "Желтый",
    Orange: "Оранжевый",
    Grey: "Серый",
    Skin: "Телесный",
  },
  lv: {
    White: "Balts",
    Black: "Melns",
    Blue: "Zils",
    Red: "Sarkans",
    Pink: "Rozā",
    Green: "Zaļš",
    Yellow: "Dzeltens",
    Orange: "Oranžs",
    Grey: "Pelēks",
    Skin: "Ādas krāsa",
  },
  en: {
    White: "White",
    Black: "Black",
    Blue: "Blue",
    Red: "Red",
    Pink: "Pink",
    Green: "Green",
    Yellow: "Yellow",
    Orange: "Orange",
    Grey: "Grey",
    Skin: "Skin",
  },
  et: {
    White: "Valge",
    Black: "Must",
    Blue: "Sinine",
    Red: "Punane",
    Pink: "Roosa",
    Green: "Roheline",
    Yellow: "Kollane",
    Orange: "Oranž",
    Grey: "Hall",
    Skin: "Nahavärv",
  },
  lt: {
    White: "Balta",
    Black: "Juoda",
    Blue: "Mėlyna",
    Red: "Raudona",
    Pink: "Rožinė",
    Green: "Žalia",
    Yellow: "Geltona",
    Orange: "Oranžinė",
    Grey: "Pilka",
    Skin: "Kūno spalva",
  },
};

export const colorHex: Record<string, string> = {
  White: "#ffffff",
  Black: "#161616",
  "black matt": "#111111",
  "black satin": "#1f1f1f",
  Blue: "#0f61d6",
  Brown: "#7a4b2a",
  Red: "#d7252f",
  Pink: "#ef7aa7",
  Green: "#26824a",
  Yellow: "#f2c94c",
  Orange: "#f08a24",
  Grey: "#8b949e",
  Skin: "#d7a982",
  transparent:
    "repeating-conic-gradient(#f1f1f1 0% 25%, #ffffff 0% 50%) 50% / 8px 8px",
};

function colorPartHex(color: string) {
  const exact = colorHex[color];

  if (exact) {
    return exact;
  }

  const normalized = color.trim().toLowerCase();

  return (
    Object.entries(colorHex).find(([name]) => name.toLowerCase() === normalized)?.[1] ??
    "#d9dfdc"
  );
}

export function colorSwatch(color: string | undefined) {
  if (!color) {
    return "#d9dfdc";
  }

  const parts = color
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    const stops = parts.map((part, index) => {
      const start = (index / parts.length) * 100;
      const end = ((index + 1) / parts.length) * 100;

      return `${colorPartHex(part)} ${start}% ${end}%`;
    });

    return `linear-gradient(90deg, ${stops.join(", ")})`;
  }

  return colorPartHex(color);
}

export function categoryLabel(category: string, language: Language) {
  return categoryLabels[language][category] ?? category;
}

export function colorLabel(color: string | undefined, language: Language) {
  if (!color) {
    return "";
  }
  return colorLabels[language][color] ?? color;
}

const productNameGlossary: Record<Exclude<Language, "en">, Array<[RegExp, string]>> = {
  ru: [
    [/\bKarate Gi\b/gi, "кимоно для карате"],
    [/\bKimono\b/gi, "кимоно"],
    [/\bGi\b/gi, "кимоно"],
    [/\bBelt\b/gi, "пояс"],
    [/\bBelts\b/gi, "пояса"],
    [/\bGloves\b/gi, "перчатки"],
    [/\bFoot Protector\b/gi, "защита стопы"],
    [/\bShin Guard\b/gi, "защита голени"],
    [/\bBody Protector\b/gi, "защита корпуса"],
    [/\bChest Guard\b/gi, "защита груди"],
    [/\bHead Guard\b/gi, "шлем"],
    [/\bMouth Guard\b/gi, "капа"],
    [/\bHelmet\b/gi, "шлем"],
    [/\bKick Pad\b/gi, "макивара"],
    [/\bTarget\b/gi, "мишень"],
    [/\bBag\b/gi, "мешок"],
    [/\bProtector\b/gi, "защита"],
    [/\bProtection\b/gi, "защита"],
  ],
  lv: [
    [/\bKarate Gi\b/gi, "karatē kimono"],
    [/\bKimono\b/gi, "kimono"],
    [/\bGi\b/gi, "kimono"],
    [/\bBelt\b/gi, "josta"],
    [/\bBelts\b/gi, "jostas"],
    [/\bGloves\b/gi, "cimdi"],
    [/\bFoot Protector\b/gi, "pēdas aizsargs"],
    [/\bShin Guard\b/gi, "apakšstilba aizsargs"],
    [/\bBody Protector\b/gi, "ķermeņa aizsargs"],
    [/\bChest Guard\b/gi, "krūšu aizsargs"],
    [/\bHead Guard\b/gi, "galvas aizsargs"],
    [/\bMouth Guard\b/gi, "mutes aizsargs"],
    [/\bHelmet\b/gi, "ķivere"],
    [/\bKick Pad\b/gi, "sitienu spilvens"],
    [/\bTarget\b/gi, "mērķis"],
    [/\bBag\b/gi, "maiss"],
    [/\bProtector\b/gi, "aizsargs"],
    [/\bProtection\b/gi, "aizsardzība"],
  ],
  et: [
    [/\bKarate Gi\b/gi, "karate gi"],
    [/\bKimono\b/gi, "kimono"],
    [/\bBelt\b/gi, "vöö"],
    [/\bBelts\b/gi, "vööd"],
    [/\bGloves\b/gi, "kindad"],
    [/\bFoot Protector\b/gi, "jalakaitse"],
    [/\bShin Guard\b/gi, "säärekaitse"],
    [/\bBody Protector\b/gi, "kehakaitse"],
    [/\bChest Guard\b/gi, "rinnakaitse"],
    [/\bHead Guard\b/gi, "peakaitse"],
    [/\bMouth Guard\b/gi, "hambakaitse"],
    [/\bHelmet\b/gi, "kiiver"],
    [/\bKick Pad\b/gi, "löögipadi"],
    [/\bTarget\b/gi, "sihtmärk"],
    [/\bBag\b/gi, "kott"],
    [/\bProtector\b/gi, "kaitse"],
    [/\bProtection\b/gi, "kaitse"],
  ],
  lt: [
    [/\bKarate Gi\b/gi, "karatė kimono"],
    [/\bKimono\b/gi, "kimono"],
    [/\bGi\b/gi, "kimono"],
    [/\bBelt\b/gi, "diržas"],
    [/\bBelts\b/gi, "diržai"],
    [/\bGloves\b/gi, "pirštinės"],
    [/\bFoot Protector\b/gi, "pėdos apsauga"],
    [/\bShin Guard\b/gi, "blauzdos apsauga"],
    [/\bBody Protector\b/gi, "kūno apsauga"],
    [/\bChest Guard\b/gi, "krūtinės apsauga"],
    [/\bHead Guard\b/gi, "galvos apsauga"],
    [/\bMouth Guard\b/gi, "dantų kapa"],
    [/\bHelmet\b/gi, "šalmas"],
    [/\bKick Pad\b/gi, "smūgių pagalvė"],
    [/\bTarget\b/gi, "taikinys"],
    [/\bBag\b/gi, "maišas"],
    [/\bProtector\b/gi, "apsauga"],
    [/\bProtection\b/gi, "apsauga"],
  ],
};

export function productTitle(product: Product, language: Language) {
  if (language === "en") {
    return product.name;
  }

  const translated = productNameGlossary[language]?.reduce(
    (name, [pattern, replacement]) => name.replace(pattern, replacement),
    product.name,
  );

  return (translated || product.name).replace(/\s+/g, " ").trim();
}

export function productDescription(product: Product, language: Language) {
  const category = categoryLabel(product.category, language).toLowerCase();
  const title = productTitle(product, language);

  if (language === "lv") {
    return `${title} ${product.brand}: ${category} treniņiem, sacensībām un klubu iepirkumiem.`;
  }

  if (language === "en") {
    return `${title} by ${product.brand}: ${category} for training, competition and club orders.`;
  }

  if (language === "et") {
    return `${title} ${product.brand}: ${category} treeninguteks, võistlusteks ja klubitellimusteks.`;
  }

  if (language === "lt") {
    return `${title} ${product.brand}: ${category} treniruotėms, varžyboms ir klubų užsakymams.`;
  }

  return `${title} ${product.brand}: ${category} для тренировок, соревнований и клубных закупок.`;
}

export function money(value: number, language: Language) {
  const locale =
    language === "lv"
      ? "lv-LV"
      : language === "en"
        ? "en-GB"
        : language === "et"
          ? "et-EE"
          : language === "lt"
            ? "lt-LT"
            : "ru-RU";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
