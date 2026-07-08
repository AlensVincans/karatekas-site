"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLanguage } from "../../components/language";
import { type SessionUser, useDemoSession } from "../../components/session";
import { categoryLabel, money } from "../../lib/i18n";
import {
  productImages,
  readProductImages,
  type ProductImageMap,
  writeProductImages,
} from "../../lib/product-media";
import {
  type ClientInventoryItem,
  useInventoryLevels,
} from "../../lib/inventory-client";
import {
  type PromoTargetType,
  type PromoRule,
  readPromoBanners,
  readPromoPrices,
  readPromoRules,
  type PromoBanner,
  type PromoPriceMap,
  writePromoBanners,
  writePromoPrices,
  writePromoRules,
} from "../../lib/promotions";
import { categories, products, type Product } from "../../lib/store-data";

type AdminVariation = {
  id: string;
  sku: string;
  color: string;
  size: string;
  b2c: number;
  b2b: number;
  discountB2c: string;
  discountB2b: string;
  stock: number;
  active: boolean;
};

type AdminProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  images: string[];
  active: boolean;
  variations: AdminVariation[];
};

type OrderPayment = "invoice15" | "card" | "invoice";
type OrderStatus = "in_process" | "paid" | "shipped" | "unpaid" | "completed";

type OrderRow = {
  id: string;
  client: string;
  email?: string;
  createdAt?: string;
  invoiceNumber?: string;
  invoiceIssuedAt?: string;
  total: number;
  subtotal?: number;
  vat?: number;
  shippingPrice?: number;
  payment: OrderPayment;
  status: OrderStatus;
  paymentStatus?: string;
  shippingMethodName?: string;
  pickupPointName?: string;
  shippingAddress?: Record<string, string | undefined>;
  shippingStatus?: string;
  trackingNumber?: string;
  trackingLink?: string;
  labelUrl?: string;
  labelFileId?: string;
  lines?: Array<{
    productName: string;
    variationName?: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
};

type ApiOrder = {
  id: string;
  createdAt?: string;
  invoiceNumber?: string;
  invoiceIssuedAt?: string;
  customer?: {
    name?: string;
    company?: string;
    email?: string;
  };
  totals?: {
    subtotal?: number;
    vat?: number;
    shipping?: number;
    total?: number;
  };
  paymentMethod?: "card" | "invoice" | "defer15";
  paymentStatus?: string;
  orderStatus?: OrderStatus;
  shippingMethodName?: string;
  pickupPointName?: string;
  shippingAddress?: Record<string, string | undefined>;
  shippingStatus?: string;
  trackingNumber?: string;
  trackingLink?: string;
  labelUrl?: string;
  labelFileId?: string;
  lines?: OrderRow["lines"];
};

const orderStatuses: OrderStatus[] = ["in_process", "paid", "shipped", "unpaid", "completed"];
const emptyStockItems: ClientInventoryItem[] = [];

const copy = {
  ru: {
    panel: "Админ-панель",
    closed: "Раздел закрыт",
    closedText: "Управление магазином доступно только администратору. Войдите в аккаунт с правами администратора.",
    login: "Войти",
    title: "Управление магазином",
    intro: "Товары, клиенты и заказы магазина экипировки без лишних экранов.",
    activeProducts: "Активные товары",
    clients: "Клиенты",
    stockAvailable: "Доступно на складе",
    categories: "Категории",
    products: "Товары",
    orders: "Заказы",
    promotions: "Акции",
    stockTab: "Склад",
    details: "Детали",
    invoiceNumber: "Счёт",
    invoicePdf: "PDF счёта",
    discountRules: "Скидки %",
    addDiscountRule: "Добавить скидку",
    discountScope: "Область",
    discountPercent: "Скидка %",
    audience: "Кому",
    productScope: "Товар",
    brandScope: "Бренд",
    bothAudience: "B2C и B2B",
    b2cAudience: "B2C",
    b2bAudience: "B2B",
    physicalStock: "Физический остаток",
    availableStock: "Доступно",
    search: "Поиск по названию, бренду, SKU, цвету или размеру",
    addProduct: "Добавить товар",
    addProductTitle: "Новый товар",
    saveProduct: "Сохранить товар",
    cancel: "Отмена",
    close: "Закрыть",
    editProduct: "Редактирование товара",
    saveHint: "Изменения применяются в этой демо-админке сразу.",
    product: "Товар",
    name: "Название",
    description: "Описание",
    images: "Картинки",
    addImages: "Добавить картинки",
    removeImage: "Удалить картинку",
    noImages: "Картинки не добавлены",
    brand: "Бренд",
    category: "Категория",
    sku: "SKU",
    color: "Цвет",
    size: "Размер",
    variant: "Вариация",
    variants: "Вариации",
    addVariation: "Добавить вариацию",
    removeVariation: "Удалить вариацию",
    retailPrice: "B2C цена",
    b2bPrice: "B2B цена",
    discountB2c: "Скидочная B2C",
    discountB2b: "Скидочная B2B",
    price: "Цена",
    stock: "Остаток",
    status: "Статус",
    active: "активен",
    hidden: "скрыт",
    edit: "Редактировать",
    delete: "Удалить",
    deleteConfirm: "Удалить товар",
    deleteBannerConfirm: "Удалить баннер",
    noDescription: "Описание не заполнено",
    noVariant: "без вариации",
    type: "Тип",
    company: "Компания",
    confirmed: "подтверждён",
    waitingEmail: "ожидает email",
    order: "Заказ",
    sum: "Сумма",
    payment: "Оплата",
    shipping: "Доставка",
    tracking: "Трекинг",
    label: "Label",
    banners: "Баннеры",
    addBanner: "Добавить баннер",
    bannerTitle: "Заголовок",
    bannerText: "Текст",
    bannerButton: "Кнопка",
    bannerImage: "Картинка акции",
    removeBannerImage: "Убрать картинку",
    bannerTarget: "Куда ведёт кнопка",
    targetDiscounts: "Скидочные товары",
    targetBrand: "Бренд",
    targetCategory: "Категория",
    activeBanner: "активен",
    noBanners: "Акций пока нет. Добавьте активный баннер, чтобы он появился на главной.",
    payments: {
      invoice15: "счёт, 15 дней",
      card: "карта",
      invoice: "счёт",
    },
    statuses: {
      in_process: "в процессе",
      paid: "оплачен",
      shipped: "отправлен",
      unpaid: "не оплачен",
      completed: "завершен",
    },
  },
  lv: {
    panel: "Administrācija",
    closed: "Sadaļa slēgta",
    closedText: "Veikala pārvaldība pieejama tikai administratoram. Ieejiet administratora kontā.",
    login: "Ieiet",
    title: "Veikala pārvaldība",
    intro: "Preces, klienti un pasūtījumi bez liekiem ekrāniem.",
    activeProducts: "Aktīvās preces",
    clients: "Klienti",
    stockAvailable: "Pieejams noliktavā",
    categories: "Kategorijas",
    products: "Preces",
    orders: "Pasūtījumi",
    promotions: "Akcijas",
    stockTab: "Noliktava",
    details: "Detaļas",
    invoiceNumber: "Rēķins",
    invoicePdf: "Rēķina PDF",
    discountRules: "Atlaides %",
    addDiscountRule: "Pievienot atlaidi",
    discountScope: "Līmenis",
    discountPercent: "Atlaide %",
    audience: "Kam",
    productScope: "Prece",
    brandScope: "Zīmols",
    bothAudience: "B2C un B2B",
    b2cAudience: "B2C",
    b2bAudience: "B2B",
    physicalStock: "Fiziskais atlikums",
    availableStock: "Pieejams",
    search: "Meklēt pēc nosaukuma, zīmola, SKU, krāsas vai izmēra",
    addProduct: "Pievienot preci",
    addProductTitle: "Jauna prece",
    saveProduct: "Saglabāt preci",
    cancel: "Atcelt",
    close: "Aizvērt",
    editProduct: "Preces rediģēšana",
    saveHint: "Izmaiņas šajā demo administrācijā tiek piemērotas uzreiz.",
    product: "Prece",
    name: "Nosaukums",
    description: "Apraksts",
    images: "Attēli",
    addImages: "Pievienot attēlus",
    removeImage: "Dzēst attēlu",
    noImages: "Attēli nav pievienoti",
    brand: "Zīmols",
    category: "Kategorija",
    sku: "SKU",
    color: "Krāsa",
    size: "Izmērs",
    variant: "Variācija",
    variants: "Variācijas",
    addVariation: "Pievienot variāciju",
    removeVariation: "Dzēst variāciju",
    retailPrice: "B2C cena",
    b2bPrice: "B2B cena",
    discountB2c: "Akcijas B2C",
    discountB2b: "Akcijas B2B",
    price: "Cena",
    stock: "Atlikums",
    status: "Statuss",
    active: "aktīvs",
    hidden: "slēpts",
    edit: "Rediģēt",
    delete: "Dzēst",
    deleteConfirm: "Dzēst preci",
    deleteBannerConfirm: "Dzēst baneri",
    noDescription: "Apraksts nav aizpildīts",
    noVariant: "bez variācijas",
    type: "Tips",
    company: "Uzņēmums",
    confirmed: "apstiprināts",
    waitingEmail: "gaida email",
    order: "Pasūtījums",
    sum: "Summa",
    payment: "Apmaksa",
    shipping: "Piegāde",
    tracking: "Tracking",
    label: "Label",
    banners: "Baneri",
    addBanner: "Pievienot baneri",
    bannerTitle: "Virsraksts",
    bannerText: "Teksts",
    bannerButton: "Poga",
    bannerImage: "Akcijas attēls",
    removeBannerImage: "Noņemt attēlu",
    bannerTarget: "Pogas mērķis",
    targetDiscounts: "Akcijas preces",
    targetBrand: "Zīmols",
    targetCategory: "Kategorija",
    activeBanner: "aktīvs",
    noBanners: "Akciju vēl nav. Pievienojiet aktīvu baneri, lai tas parādītos sākumlapā.",
    payments: {
      invoice15: "rēķins, 15 dienas",
      card: "karte",
      invoice: "rēķins",
    },
    statuses: {
      in_process: "procesā",
      paid: "apmaksāts",
      shipped: "nosūtīts",
      unpaid: "nav apmaksāts",
      completed: "pabeigts",
    },
  },
  en: {
    panel: "Admin",
    closed: "Section closed",
    closedText: "Store management is available only to an administrator. Sign in with an admin account.",
    login: "Login",
    title: "Store management",
    intro: "Products, clients and orders without extra screens.",
    activeProducts: "Active products",
    clients: "Clients",
    stockAvailable: "Available in stock",
    categories: "Categories",
    products: "Products",
    orders: "Orders",
    promotions: "Promotions",
    stockTab: "Stock",
    details: "Details",
    invoiceNumber: "Invoice",
    invoicePdf: "Invoice PDF",
    discountRules: "Discounts %",
    addDiscountRule: "Add discount",
    discountScope: "Scope",
    discountPercent: "Discount %",
    audience: "Audience",
    productScope: "Product",
    brandScope: "Brand",
    bothAudience: "B2C and B2B",
    b2cAudience: "B2C",
    b2bAudience: "B2B",
    physicalStock: "Physical stock",
    availableStock: "Available",
    search: "Search by name, brand, SKU, color or size",
    addProduct: "Add product",
    addProductTitle: "New product",
    saveProduct: "Save product",
    cancel: "Cancel",
    close: "Close",
    editProduct: "Edit product",
    saveHint: "Changes are applied immediately in this demo admin.",
    product: "Product",
    name: "Name",
    description: "Description",
    images: "Images",
    addImages: "Add images",
    removeImage: "Remove image",
    noImages: "No images added",
    brand: "Brand",
    category: "Category",
    sku: "SKU",
    color: "Color",
    size: "Size",
    variant: "Variation",
    variants: "Variations",
    addVariation: "Add variation",
    removeVariation: "Remove variation",
    retailPrice: "B2C price",
    b2bPrice: "B2B price",
    discountB2c: "Promo B2C",
    discountB2b: "Promo B2B",
    price: "Price",
    stock: "Stock",
    status: "Status",
    active: "active",
    hidden: "hidden",
    edit: "Edit",
    delete: "Delete",
    deleteConfirm: "Delete product",
    deleteBannerConfirm: "Delete banner",
    noDescription: "Description is empty",
    noVariant: "no variation",
    type: "Type",
    company: "Company",
    confirmed: "confirmed",
    waitingEmail: "waiting email",
    order: "Order",
    sum: "Total",
    payment: "Payment",
    shipping: "Delivery",
    tracking: "Tracking",
    label: "Label",
    banners: "Banners",
    addBanner: "Add banner",
    bannerTitle: "Title",
    bannerText: "Text",
    bannerButton: "Button",
    bannerImage: "Promotion image",
    removeBannerImage: "Remove image",
    bannerTarget: "Button target",
    targetDiscounts: "Discounted products",
    targetBrand: "Brand",
    targetCategory: "Category",
    activeBanner: "active",
    noBanners: "No promotions yet. Add an active banner to show it on the homepage.",
    payments: {
      invoice15: "invoice, 15 days",
      card: "card",
      invoice: "invoice",
    },
    statuses: {
      in_process: "in process",
      paid: "paid",
      shipped: "shipped",
      unpaid: "unpaid",
      completed: "completed",
    },
  },
} as const;

const adminDateLabels = {
  ru: "Дата",
  lv: "Datums",
  en: "Date",
  et: "Kuupaev",
  lt: "Data",
} as const;

const adminExtraCopy = {
  ru: {
    clientDetails: "Данные клиента",
    selectClient: "Нажмите на клиента, чтобы увидеть данные и прошлые заказы.",
    pastOrders: "Прошлые заказы",
    b2bRequest: "Запрос оптового клиента",
    companyName: "Компания",
    registrationNumber: "Регистрационный номер",
    address: "Адрес",
    phone: "Телефон",
    approve: "Подтвердить",
    reject: "Отклонить",
    noOrders: "Заказов пока нет.",
    orderUpdated: "Заказ сохранён.",
    actionSaved: "Решение сохранено.",
    actionFailed: "Не удалось сохранить.",
  },
  lv: {
    clientDetails: "Klienta dati",
    selectClient: "Noklikšķiniet uz klienta, lai redzētu datus un iepriekšējos pasūtījumus.",
    pastOrders: "Iepriekšējie pasūtījumi",
    b2bRequest: "Vairumtirdzniecības pieprasījums",
    companyName: "Uzņēmums",
    registrationNumber: "Reģistrācijas numurs",
    address: "Adrese",
    phone: "Tālrunis",
    approve: "Apstiprināt",
    reject: "Noraidīt",
    noOrders: "Pasūtījumu vēl nav.",
    orderUpdated: "Pasūtījums saglabāts.",
    actionSaved: "Lēmums saglabāts.",
    actionFailed: "Neizdevās saglabāt.",
  },
  en: {
    clientDetails: "Client details",
    selectClient: "Click a client to see details and previous orders.",
    pastOrders: "Previous orders",
    b2bRequest: "Wholesale request",
    companyName: "Company",
    registrationNumber: "Registration number",
    address: "Address",
    phone: "Phone",
    approve: "Approve",
    reject: "Reject",
    noOrders: "No orders yet.",
    orderUpdated: "Order saved.",
    actionSaved: "Decision saved.",
    actionFailed: "Could not save.",
  },
  et: {
    clientDetails: "Kliendi andmed",
    selectClient: "Klõpsa kliendil, et näha andmeid ja varasemaid tellimusi.",
    pastOrders: "Varasemad tellimused",
    b2bRequest: "Hulgikliendi taotlus",
    companyName: "Ettevõte",
    registrationNumber: "Registrikood",
    address: "Aadress",
    phone: "Telefon",
    approve: "Kinnita",
    reject: "Lükka tagasi",
    noOrders: "Tellimusi veel ei ole.",
    orderUpdated: "Tellimus salvestatud.",
    actionSaved: "Otsus salvestatud.",
    actionFailed: "Salvestamine ebaõnnestus.",
  },
  lt: {
    clientDetails: "Kliento duomenys",
    selectClient: "Spustelėkite klientą, kad matytumėte duomenis ir ankstesnius užsakymus.",
    pastOrders: "Ankstesni užsakymai",
    b2bRequest: "Didmeninio kliento užklausa",
    companyName: "Įmonė",
    registrationNumber: "Registracijos numeris",
    address: "Adresas",
    phone: "Telefonas",
    approve: "Patvirtinti",
    reject: "Atmesti",
    noOrders: "Užsakymų dar nėra.",
    orderUpdated: "Užsakymas išsaugotas.",
    actionSaved: "Sprendimas išsaugotas.",
    actionFailed: "Nepavyko išsaugoti.",
  },
} as const;

type CopyText = (typeof copy)[keyof typeof copy];

const initialOrders: OrderRow[] = [];

function statusFromApiOrder(order: ApiOrder): OrderStatus {
  if (order.orderStatus && orderStatuses.includes(order.orderStatus)) {
    return order.orderStatus;
  }

  if (order.shippingStatus === "label_created" || order.trackingNumber) {
    return "shipped";
  }

  if (order.paymentStatus === "paid") {
    return "paid";
  }

  if (order.paymentStatus === "unpaid" || order.paymentStatus === "cancelled") {
    return "unpaid";
  }

  return "in_process";
}

function paymentFromApiOrder(order: ApiOrder): OrderPayment {
  if (order.paymentMethod === "defer15") {
    return "invoice15";
  }

  if (order.paymentMethod === "card") {
    return "card";
  }

  return "invoice";
}

function mapApiOrder(order: ApiOrder): OrderRow {
  return {
    id: order.id,
    createdAt: order.createdAt || order.invoiceIssuedAt,
    invoiceNumber: order.invoiceNumber,
    invoiceIssuedAt: order.invoiceIssuedAt,
    client:
      order.customer?.company ||
      order.customer?.name ||
      order.customer?.email ||
      "Customer",
    email: order.customer?.email,
    total: order.totals?.total ?? 0,
    subtotal: order.totals?.subtotal,
    vat: order.totals?.vat,
    shippingPrice: order.totals?.shipping,
    payment: paymentFromApiOrder(order),
    status: statusFromApiOrder(order),
    paymentStatus: order.paymentStatus,
    shippingMethodName: order.pickupPointName || order.shippingMethodName,
    pickupPointName: order.pickupPointName,
    shippingAddress: order.shippingAddress,
    shippingStatus: order.shippingStatus,
    trackingNumber: order.trackingNumber,
    trackingLink: order.trackingLink,
    labelUrl: order.labelUrl,
    labelFileId: order.labelFileId,
    lines: order.lines,
  };
}

function createVariation(index = 1): AdminVariation {
  const stamp = `${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`;

  return {
    id: `var-${stamp}`,
    sku: `SKU-${stamp}-${index}`,
    color: "",
    size: "",
    b2c: 0,
    b2b: 0,
    discountB2c: "",
    discountB2b: "",
    stock: 0,
    active: true,
  };
}

function createProduct(name = ""): AdminProduct {
  const stamp = `${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`;

  return {
    id: `admin-product-${stamp}`,
    name,
    brand: "Karatekas",
    category: categories[0] ?? "Accessories",
    description: "",
    images: [],
    active: true,
    variations: [createVariation()],
  };
}

function productRows(sourceProducts: Product[] = products): AdminProduct[] {
  const promoPrices = readPromoPrices();
  const imageMap = readProductImages();

  return sourceProducts.map((product) => ({
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
    images: productImages(product, imageMap),
    active: true,
    variations: product.variations.map((variation) => ({
      id: variation.id,
      sku: variation.sku,
      color: variation.color ?? "",
      size: variation.size ?? "",
      b2c: variation.b2c,
      b2b: variation.b2b,
      discountB2c: promoPrices[variation.id]?.b2c?.toString() ?? "",
      discountB2b: promoPrices[variation.id]?.b2b?.toString() ?? "",
      stock: variation.stock.physical,
      active: true,
    })),
  }));
}

function adminProductToProduct(product: AdminProduct): Product {
  const base = products.find((item) => item.id === product.id);

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
    specs: base?.specs ?? [],
    tags: base?.tags ?? [],
    sheetX: base?.sheetX ?? "0%",
    sheetY: base?.sheetY ?? "0%",
    images: product.images,
    variations: product.variations.map((variation) => {
      const baseVariation = base?.variations.find((item) => item.id === variation.id);

      return {
        id: variation.id,
        sku: variation.sku,
        name: [variation.color, variation.size].filter(Boolean).join(" / ") || variation.sku,
        color: variation.color || undefined,
        size: variation.size || undefined,
        b2c: variation.b2c,
        b2b: variation.b2b,
        stock: {
          physical: Math.max(0, Math.floor(variation.stock || 0)),
          reserved: 0,
          expected: baseVariation?.stock.expected ?? 0,
          purchase: baseVariation?.stock.purchase ?? 0,
          shipping: baseVariation?.stock.shipping ?? 0,
          customs: baseVariation?.stock.customs ?? 0,
          vatRate: baseVariation?.stock.vatRate ?? 21,
          fx: baseVariation?.stock.fx ?? 1,
          lots: baseVariation?.stock.lots ?? [],
        },
      };
    }),
  };
}

function parseOptionalPrice(value: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function promoPricesFromProducts(items: AdminProduct[]): PromoPriceMap {
  return items.reduce<PromoPriceMap>((result, product) => {
    product.variations.forEach((variation) => {
      const b2c = parseOptionalPrice(variation.discountB2c);
      const b2b = parseOptionalPrice(variation.discountB2b);

      if (b2c || b2b) {
        result[variation.id] = { b2c, b2b };
      }
    });

    return result;
  }, {});
}

function productImageMapFromProducts(items: AdminProduct[]): ProductImageMap {
  return items.reduce<ProductImageMap>((result, product) => {
    const images = product.images.map((image) => image.trim()).filter(Boolean);

    if (images.length) {
      result[product.id] = images;
    }

    return result;
  }, {});
}

function readImageFiles(files: FileList | null) {
  if (!files?.length) {
    return Promise.resolve<string[]>([]);
  }

  return Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => resolve(String(reader.result ?? ""));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        }),
    ),
  );
}

function patchVariation(
  product: AdminProduct,
  variationId: string,
  patch: Partial<AdminVariation>,
) {
  return {
    ...product,
    variations: product.variations.map((variation) =>
      variation.id === variationId ? { ...variation, ...patch } : variation,
    ),
  };
}

function addVariation(product: AdminProduct) {
  return {
    ...product,
    variations: [...product.variations, createVariation(product.variations.length + 1)],
  };
}

function removeVariation(product: AdminProduct, variationId: string) {
  if (product.variations.length <= 1) {
    return product;
  }

  return {
    ...product,
    variations: product.variations.filter((variation) => variation.id !== variationId),
  };
}

function productStock(product: AdminProduct) {
  if (!product.active) {
    return 0;
  }

  return product.variations.reduce(
    (sum, variation) => sum + (variation.active ? Math.max(0, variation.stock) : 0),
    0,
  );
}

function productPriceRange(
  product: AdminProduct,
  key: "b2c" | "b2b",
  language: Parameters<typeof money>[1],
) {
  const prices = product.variations.map((variation) => variation[key]);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return min === max ? money(min, language) : `${money(min, language)} - ${money(max, language)}`;
}

function variationSummary(product: AdminProduct, fallback: string) {
  const labels = product.variations
    .map((variation) => [variation.color, variation.size].filter(Boolean).join(" / "))
    .filter(Boolean);

  return labels.slice(0, 3).join(", ") || fallback;
}

function formatOrderDate(value: string | undefined, language: Parameters<typeof money>[1]) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

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

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ProductForm({
  product,
  c,
  language,
  onProductChange,
  onVariationChange,
  onAddVariation,
  onRemoveVariation,
  footer,
}: {
  product: AdminProduct;
  c: CopyText;
  language: Parameters<typeof money>[1];
  onProductChange: (patch: Partial<AdminProduct>) => void;
  onVariationChange: (variationId: string, patch: Partial<AdminVariation>) => void;
  onAddVariation: () => void;
  onRemoveVariation: (variationId: string) => void;
  footer: ReactNode;
}) {
  const brandSuggestions = useMemo(
    () =>
      Array.from(new Set([...products.map((item) => item.brand), product.brand].filter(Boolean)))
        .sort((left, right) => left.localeCompare(right)),
    [product.brand],
  );
  const categorySuggestions = useMemo(
    () => Array.from(new Set([...categories, product.category].filter(Boolean))),
    [product.category],
  );
  const brandListId = `brand-options-${product.id}`;
  const categoryListId = `category-options-${product.id}`;

  async function addImageFiles(files: FileList | null) {
    const nextImages = (await readImageFiles(files)).filter(Boolean);

    if (nextImages.length) {
      onProductChange({ images: [...product.images, ...nextImages] });
    }
  }

  function removeImage(index: number) {
    onProductChange({ images: product.images.filter((_, imageIndex) => imageIndex !== index) });
  }

  return (
    <div className="admin-inline-editor">
      <div className="admin-form-grid">
        <label>
          {c.name}
          <input
            value={product.name}
            onChange={(event) => onProductChange({ name: event.target.value })}
          />
        </label>
        <label>
          {c.brand}
          <input
            list={brandListId}
            value={product.brand}
            onChange={(event) => onProductChange({ brand: event.target.value })}
          />
          <datalist id={brandListId}>
            {brandSuggestions.map((brand) => (
              <option key={brand} value={brand} />
            ))}
          </datalist>
        </label>
        <label>
          {c.category}
          <input
            list={categoryListId}
            value={product.category}
            onChange={(event) => onProductChange({ category: event.target.value })}
          />
          <datalist id={categoryListId}>
            {categorySuggestions.map((category) => (
              <option key={category} label={categoryLabel(category, language)} value={category} />
            ))}
          </datalist>
        </label>
      </div>

      <label className="admin-full-field">
        {c.description}
        <textarea
          value={product.description}
          onChange={(event) => onProductChange({ description: event.target.value })}
        />
      </label>

      <div className="image-editor">
        <div className="variation-editor-head">
          <h4>{c.images}</h4>
          <label className="file-action">
            {c.addImages}
            <input
              accept="image/*"
              multiple
              type="file"
              onChange={async (event) => {
                await addImageFiles(event.currentTarget.files);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
        {product.images.length ? (
          <div className="image-thumb-grid">
            {product.images.map((image, index) => (
              <div className="image-thumb-item" key={`${image}-${index}`}>
                <div
                  className="image-thumb-preview"
                  style={{ backgroundImage: `url("${image}")` }}
                />
                <button
                  aria-label={c.removeImage}
                  className="table-action danger"
                  onClick={() => removeImage(index)}
                  type="button"
                >
                  {c.delete}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">{c.noImages}</p>
        )}
      </div>

      <label className="switch-row">
        <input
          checked={product.active}
          type="checkbox"
          onChange={(event) => onProductChange({ active: event.target.checked })}
        />
        {product.active ? c.active : c.hidden}
      </label>

      <div className="variation-editor">
        <div className="variation-editor-head">
          <h4>{c.variants}</h4>
          <button className="table-action" onClick={onAddVariation} type="button">
            {c.addVariation}
          </button>
        </div>

        {product.variations.map((variation) => (
          <div className="variation-editor-row" key={variation.id}>
            <label>
              {c.sku}
              <input
                value={variation.sku}
                onChange={(event) => onVariationChange(variation.id, { sku: event.target.value })}
              />
            </label>
            <label>
              {c.color}
              <input
                value={variation.color}
                onChange={(event) => onVariationChange(variation.id, { color: event.target.value })}
              />
            </label>
            <label>
              {c.size}
              <input
                value={variation.size}
                onChange={(event) => onVariationChange(variation.id, { size: event.target.value })}
              />
            </label>
            <label>
              {c.retailPrice}
              <input
                min={0}
                type="number"
                value={variation.b2c}
                onChange={(event) => onVariationChange(variation.id, { b2c: Number(event.target.value) })}
              />
            </label>
            <label>
              {c.b2bPrice}
              <input
                min={0}
                type="number"
                value={variation.b2b}
                onChange={(event) => onVariationChange(variation.id, { b2b: Number(event.target.value) })}
              />
            </label>
            <label>
              {c.discountB2c}
              <input
                min={0}
                step="0.01"
                type="number"
                value={variation.discountB2c}
                onChange={(event) =>
                  onVariationChange(variation.id, { discountB2c: event.target.value })
                }
              />
            </label>
            <label>
              {c.discountB2b}
              <input
                min={0}
                step="0.01"
                type="number"
                value={variation.discountB2b}
                onChange={(event) =>
                  onVariationChange(variation.id, { discountB2b: event.target.value })
                }
              />
            </label>
            <label>
              {c.stock}
              <input
                min={0}
                type="number"
                value={variation.stock}
                onChange={(event) => onVariationChange(variation.id, { stock: Number(event.target.value) })}
              />
            </label>
            <label className="switch-row">
              <input
                checked={variation.active}
                type="checkbox"
                onChange={(event) => onVariationChange(variation.id, { active: event.target.checked })}
              />
              {variation.active ? c.active : c.hidden}
            </label>
            <button
              className="table-action danger"
              disabled={product.variations.length <= 1}
              onClick={() => onRemoveVariation(variation.id)}
              type="button"
            >
              {c.removeVariation}
            </button>
          </div>
        ))}
      </div>

      <div className="admin-form-actions">{footer}</div>
    </div>
  );
}

export default function AdminPage() {
  const { session, allUsers } = useDemoSession();
  const { language } = useLanguage();
  const c = copy[language as keyof typeof copy] ?? copy.en;
  const extra = adminExtraCopy[language as keyof typeof adminExtraCopy] ?? adminExtraCopy.en;
  const dateLabel = adminDateLabels[language as keyof typeof adminDateLabels] ?? adminDateLabels.en;
  const {
    items: inventoryItems,
    levels: inventoryLevels,
    setLevels: setInventoryLevels,
  } = useInventoryLevels();
  const [tab, setTab] = useState<
    "products" | "clients" | "orders" | "promotions" | "stock"
  >("products");
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>(() => productRows());
  const [banners, setBanners] = useState<PromoBanner[]>(() => readPromoBanners());
  const [promoRules, setPromoRules] = useState<PromoRule[]>(() => readPromoRules());
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [draftProduct, setDraftProduct] = useState<AdminProduct>(() => createProduct());
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedClientEmail, setSelectedClientEmail] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeStockBrand, setActiveStockBrand] = useState("");
  const [stockQuery, setStockQuery] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [adminActionStatus, setAdminActionStatus] = useState("");
  const productPersistTimer = useRef<number | null>(null);
  const availableTotal = inventoryItems.length
    ? inventoryItems.reduce((sum, item) => sum + item.available, 0)
    : adminProducts.reduce((sum, product) => sum + productStock(product), 0);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/products")
      .then((response) => response.json())
      .then((data: { products?: Product[] }) => {
        if (!cancelled && Array.isArray(data.products) && data.products.length) {
          setAdminProducts(productRows(data.products));
        }
      })
      .catch(() => undefined);

    fetch("/api/orders")
      .then((response) => response.json())
      .then((data: { orders?: ApiOrder[] }) => {
        if (!cancelled && Array.isArray(data.orders)) {
          setOrders(data.orders.map(mapApiOrder));
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return adminProducts;
    }

    return adminProducts.filter((product) =>
      [
        product.name,
        product.brand,
        product.category,
        product.description,
        product.variations.map((variation) =>
          [variation.sku, variation.color, variation.size].join(" "),
        ).join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [adminProducts, query]);
  const brandOptions = useMemo(
    () =>
      Array.from(new Set(adminProducts.map((product) => product.brand).filter(Boolean))).sort(),
    [adminProducts],
  );
  const stockGroups = useMemo(() => {
    const groups = inventoryItems.reduce<Record<string, ClientInventoryItem[]>>(
      (result, item) => {
        result[item.brand] = [...(result[item.brand] ?? []), item];
        return result;
      },
      {},
    );

    return Object.entries(groups).sort(([left], [right]) => left.localeCompare(right));
  }, [inventoryItems]);
  const selectedStockGroup =
    stockGroups.find(([brand]) => brand === activeStockBrand) ?? stockGroups[0];
  const selectedStockBrand = selectedStockGroup?.[0] ?? "";
  const selectedStockItems = selectedStockGroup?.[1] ?? emptyStockItems;
  const selectedStockRows = useMemo(() => {
    const normalizedQuery = stockQuery.trim().toLowerCase();
    const rows = selectedStockItems.reduce<
      Record<
        string,
        {
          productName: string;
          category: string;
          items: ClientInventoryItem[];
        }
      >
    >((result, item) => {
      result[item.productId] = result[item.productId] ?? {
        productName: item.productName,
        category: item.category,
        items: [],
      };
      result[item.productId].items.push(item);
      return result;
    }, {});

    return Object.values(rows).sort((left, right) =>
      left.productName.localeCompare(right.productName),
    ).filter((row) => {
      if (!normalizedQuery) {
        return true;
      }

      return [
        row.productName,
        row.category,
        categoryLabel(row.category, language),
        ...row.items.flatMap((item) => [item.color, item.size, item.sku]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [language, selectedStockItems, stockQuery]);
  const selectedClient = useMemo(
    () =>
      allUsers.find(
        (user) => user.email.toLowerCase() === selectedClientEmail?.toLowerCase(),
      ) ?? null,
    [allUsers, selectedClientEmail],
  );
  const selectedClientOrders = useMemo(() => {
    if (!selectedClient) {
      return [];
    }

    return orders.filter(
      (order) => order.email?.toLowerCase() === selectedClient.email.toLowerCase(),
    );
  }, [orders, selectedClient]);

  if (session?.role !== "admin") {
    return (
      <section className="section-shell narrow">
        <span className="eyebrow">{c.panel}</span>
        <h1>{c.closed}</h1>
        <p>{c.closedText}</p>
        <Link className="wide-button inline-button" href="/login">
          {c.login}
        </Link>
      </section>
    );
  }

  function scheduleProductPersistence(next: AdminProduct[]) {
    if (typeof window === "undefined") {
      return;
    }

    if (productPersistTimer.current) {
      window.clearTimeout(productPersistTimer.current);
    }

    productPersistTimer.current = window.setTimeout(() => {
      void fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: next.map(adminProductToProduct) }),
      });
    }, 650);
  }

  function setProductsWithPromos(updater: (items: AdminProduct[]) => AdminProduct[]) {
    setAdminProducts((items) => {
      const next = updater(items);

      writePromoPrices(promoPricesFromProducts(next));
      writeProductImages(productImageMapFromProducts(next));
      scheduleProductPersistence(next);

      return next;
    });
  }

  function setBannersAndSave(next: PromoBanner[]) {
    setBanners(next);
    writePromoBanners(next);
  }

  function setPromoRulesAndSave(next: PromoRule[]) {
    setPromoRules(next);
    writePromoRules(next);
  }

  function createPromoRule(): PromoRule {
    const stamp = `${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`;

    return {
      id: `promo-rule-${stamp}`,
      scope: "brand",
      target: brandOptions[0] ?? "",
      percent: 10,
      audience: "both",
      active: true,
    };
  }

  function updatePromoRule(ruleId: string, patch: Partial<PromoRule>) {
    setPromoRulesAndSave(
      promoRules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)),
    );
  }

  async function updateStockLevel(item: ClientInventoryItem, physical: number) {
    const nextPhysical = Math.max(0, Math.floor(physical || 0));
    const nextItem = {
      ...item,
      physical: nextPhysical,
      reserved: 0,
      available: nextPhysical,
    };

    setInventoryLevels({
      ...inventoryLevels,
      [item.variationId]: nextItem,
    });

    const response = await fetch("/api/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variationId: item.variationId,
        physical: nextPhysical,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      levels?: Record<string, ClientInventoryItem>;
    };

    if (data.levels) {
      setInventoryLevels(data.levels);
    }
  }

  function initialTargetValue(targetType: PromoTargetType) {
    if (targetType === "brand") {
      return brandOptions[0] ?? "";
    }

    if (targetType === "category") {
      return categories[0] ?? "";
    }

    return "";
  }

  function createBanner(): PromoBanner {
    const stamp = `${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`;

    return {
      id: `banner-${stamp}`,
      title: c.promotions,
      text: "",
      buttonText: c.products,
      image: "",
      targetType: "discounts",
      targetValue: "",
      active: true,
    };
  }

  function addBanner() {
    setBannersAndSave([createBanner(), ...banners]);
    setTab("promotions");
  }

  function updateBanner(bannerId: string, patch: Partial<PromoBanner>) {
    setBannersAndSave(
      banners.map((banner) =>
        banner.id === bannerId ? { ...banner, ...patch } : banner,
      ),
    );
  }

  function updateBannerTarget(bannerId: string, targetType: PromoTargetType) {
    updateBanner(bannerId, {
      targetType,
      targetValue: initialTargetValue(targetType),
    });
  }

  async function updateBannerImage(bannerId: string, files: FileList | null) {
    const [image] = await readImageFiles(files);

    if (image) {
      updateBanner(bannerId, { image });
    }
  }

  function deleteBanner(banner: PromoBanner) {
    if (!window.confirm(`${c.deleteBannerConfirm}: ${banner.title}?`)) {
      return;
    }

    setBannersAndSave(banners.filter((item) => item.id !== banner.id));
  }

  function updateProduct(productId: string, patch: Partial<AdminProduct>) {
    setProductsWithPromos((items) =>
      items.map((product) =>
        product.id === productId ? { ...product, ...patch } : product,
      ),
    );
  }

  function updateProductVariation(
    productId: string,
    variationId: string,
    patch: Partial<AdminVariation>,
  ) {
    setProductsWithPromos((items) =>
      items.map((product) =>
        product.id === productId ? patchVariation(product, variationId, patch) : product,
      ),
    );
  }

  function deleteProduct(product: AdminProduct) {
    if (!window.confirm(`${c.deleteConfirm}: ${product.name}?`)) {
      return;
    }

    setProductsWithPromos((items) => items.filter((item) => item.id !== product.id));

    if (editProductId === product.id) {
      setEditProductId(null);
    }
  }

  function openAddForm() {
    setDraftProduct(createProduct());
    setShowAddForm(true);
    setEditProductId(null);
    setTab("products");
  }

  function saveDraftProduct() {
    const product = {
      ...draftProduct,
      name: draftProduct.name.trim() || c.addProductTitle,
    };

    setProductsWithPromos((items) => [product, ...items]);
    setDraftProduct(createProduct());
    setShowAddForm(false);
  }

  async function sendAdminTestEmail() {
    setEmailStatus("Sending test email...");

    try {
      const response = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };

      setEmailStatus(response.ok ? "Test email sent." : result.error || "Email failed.");
    } catch {
      setEmailStatus("Email failed.");
    }
  }

  async function sendB2BReminderEmails() {
    setEmailStatus("Sending B2B reminders...");

    try {
      const response = await fetch("/api/admin/email-reminders", {
        method: "POST",
      });
      const result = (await response.json().catch(() => ({}))) as {
        sent?: number;
        error?: string;
      };

      setEmailStatus(
        response.ok
          ? `B2B reminders sent: ${result.sent ?? 0}.`
          : result.error || "Reminders failed.",
      );
    } catch {
      setEmailStatus("Reminders failed.");
    }
  }

  async function updateOrderPatch(orderId: string, patch: Partial<ApiOrder>) {
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const result = (await response.json().catch(() => ({}))) as {
        order?: ApiOrder;
        error?: string;
      };

      if (!response.ok || !result.order) {
        throw new Error(result.error || "Order update failed.");
      }

      setOrders((items) =>
        items.map((item) => (item.id === orderId ? mapApiOrder(result.order!) : item)),
      );
      setAdminActionStatus(extra.orderUpdated);
    } catch {
      setAdminActionStatus(extra.actionFailed);
    }
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    setOrders((items) =>
      items.map((item) => (item.id === orderId ? { ...item, status } : item)),
    );
    await updateOrderPatch(orderId, { orderStatus: status });
  }

  async function reviewB2BRequest(user: SessionUser, approved: boolean) {
    if (!user.b2bRequest) {
      return;
    }

    try {
      const response = await fetch("/api/admin/b2b-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.b2bRequest.id, approved }),
      });

      if (!response.ok) {
        throw new Error("B2B request update failed.");
      }

      setAdminActionStatus(extra.actionSaved);
      window.setTimeout(() => window.location.reload(), 450);
    } catch {
      setAdminActionStatus(extra.actionFailed);
    }
  }

  return (
    <section className="section-shell admin-page">
      <div className="section-heading admin-heading">
        <span className="eyebrow">{c.panel}</span>
        <h1>{c.title}</h1>
        <p>{c.intro}</p>
      </div>

      <div className="admin-stats compact">
        <div>
          <span>{c.activeProducts}</span>
          <strong>{adminProducts.filter((product) => product.active).length}</strong>
        </div>
        <div>
          <span>{c.clients}</span>
          <strong>{allUsers.length}</strong>
        </div>
        <div>
          <span>{c.stockAvailable}</span>
          <strong>{availableTotal}</strong>
        </div>
        <div>
          <span>{c.categories}</span>
          <strong>{categories.length}</strong>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-tabs">
          <button
            className={tab === "products" ? "active" : ""}
            onClick={() => setTab("products")}
            type="button"
          >
            {c.products}
          </button>
          <button
            className={tab === "clients" ? "active" : ""}
            onClick={() => setTab("clients")}
            type="button"
          >
            {c.clients}
          </button>
          <button
            className={tab === "orders" ? "active" : ""}
            onClick={() => setTab("orders")}
            type="button"
          >
            {c.orders}
          </button>
          <button
            className={tab === "stock" ? "active" : ""}
            onClick={() => setTab("stock")}
            type="button"
          >
            {c.stockTab}
          </button>
          <button
            className={tab === "promotions" ? "active" : ""}
            onClick={() => setTab("promotions")}
            type="button"
          >
            {c.promotions}
          </button>
        </div>

        {tab === "products" ? (
          <div className="admin-actions">
            <button className="primary-link" onClick={openAddForm} type="button">
              {c.addProduct}
            </button>
            <input
              className="admin-search"
              placeholder={c.search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        ) : null}

        <div className="admin-email-actions">
          <button className="table-action" onClick={() => void sendAdminTestEmail()} type="button">
            SMTP test
          </button>
          <button
            className="table-action"
            onClick={() => void sendB2BReminderEmails()}
            type="button"
          >
            B2B reminders
          </button>
          {emailStatus ? <span>{emailStatus}</span> : null}
        </div>
      </div>

      {tab === "products" && showAddForm ? (
        <div className="tool-panel admin-editor">
          <h3>{c.addProductTitle}</h3>
          <ProductForm
            product={draftProduct}
            c={c}
            language={language}
            onProductChange={(patch) =>
              setDraftProduct((product) => ({ ...product, ...patch }))
            }
            onVariationChange={(variationId, patch) =>
              setDraftProduct((product) => patchVariation(product, variationId, patch))
            }
            onAddVariation={() => setDraftProduct((product) => addVariation(product))}
            onRemoveVariation={(variationId) =>
              setDraftProduct((product) => removeVariation(product, variationId))
            }
            footer={
              <>
                <button className="wide-button inline-button" onClick={saveDraftProduct} type="button">
                  {c.saveProduct}
                </button>
                <button
                  className="table-action"
                  onClick={() => setShowAddForm(false)}
                  type="button"
                >
                  {c.cancel}
                </button>
              </>
            }
          />
        </div>
      ) : null}

      {tab === "products" ? (
        <div className="table-wrap admin-table">
          <table>
            <thead>
              <tr>
                <th>{c.product}</th>
                <th>{c.category}</th>
                <th>{c.variants}</th>
                <th>{c.price}</th>
                <th>{c.stock}</th>
                <th>{c.status}</th>
                <th>{c.edit}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <Fragment key={product.id}>
                  <tr className={editProductId === product.id ? "selected-row" : ""}>
                    <td>
                      <strong>{product.name}</strong>
                      <span>
                        {product.brand} · {product.description || c.noDescription}
                      </span>
                    </td>
                    <td>{categoryLabel(product.category, language)}</td>
                    <td>
                      {product.variations.length}
                      <span>{variationSummary(product, c.noVariant)}</span>
                    </td>
                    <td>
                      {productPriceRange(product, "b2c", language)}
                      <span>{productPriceRange(product, "b2b", language)}</span>
                    </td>
                    <td>{productStock(product)}</td>
                    <td>
                      <span className={product.active ? "status-pill ok" : "status-pill"}>
                        {product.active ? c.active : c.hidden}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="table-action"
                          onClick={() => {
                            setEditProductId((current) =>
                              current === product.id ? null : product.id,
                            );
                            setShowAddForm(false);
                          }}
                          type="button"
                        >
                          {editProductId === product.id ? c.close : c.edit}
                        </button>
                        <button
                          className="table-action danger"
                          onClick={() => deleteProduct(product)}
                          type="button"
                        >
                          {c.delete}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {editProductId === product.id ? (
                    <tr className="admin-editor-row">
                      <td colSpan={7}>
                        <ProductForm
                          product={product}
                          c={c}
                          language={language}
                          onProductChange={(patch) => updateProduct(product.id, patch)}
                          onVariationChange={(variationId, patch) =>
                            updateProductVariation(product.id, variationId, patch)
                          }
                          onAddVariation={() =>
                            setProductsWithPromos((items) =>
                              items.map((item) =>
                                item.id === product.id ? addVariation(item) : item,
                              ),
                            )
                          }
                          onRemoveVariation={(variationId) =>
                            setProductsWithPromos((items) =>
                              items.map((item) =>
                                item.id === product.id
                                  ? removeVariation(item, variationId)
                                  : item,
                              ),
                            )
                          }
                          footer={
                            <>
                              <span className="quiet">{c.saveHint}</span>
                              <button
                                className="table-action"
                                onClick={() => setEditProductId(null)}
                                type="button"
                              >
                                {c.close}
                              </button>
                            </>
                          }
                        />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "promotions" ? (
        <div className="tool-panel admin-editor">
          <div className="variation-editor-head">
            <h3>{c.discountRules}</h3>
            <button
              className="primary-link"
              onClick={() => setPromoRulesAndSave([...promoRules, createPromoRule()])}
              type="button"
            >
              {c.addDiscountRule}
            </button>
          </div>

          {promoRules.length ? (
            <div className="promo-rule-list">
              {promoRules.map((rule) => (
                <div className="promo-rule-row" key={rule.id}>
                  <label>
                    {c.discountScope}
                    <select
                      value={rule.scope}
                      onChange={(event) => {
                        const scope = event.target.value as PromoRule["scope"];
                        updatePromoRule(rule.id, {
                          scope,
                          target:
                            scope === "brand"
                              ? brandOptions[0] ?? ""
                              : adminProducts[0]?.id ?? "",
                        });
                      }}
                    >
                      <option value="brand">{c.brandScope}</option>
                      <option value="product">{c.productScope}</option>
                    </select>
                  </label>
                  <label>
                    {rule.scope === "brand" ? c.brand : c.product}
                    <select
                      value={rule.target}
                      onChange={(event) =>
                        updatePromoRule(rule.id, { target: event.target.value })
                      }
                    >
                      {rule.scope === "brand"
                        ? brandOptions.map((brand) => (
                            <option key={brand} value={brand}>
                              {brand}
                            </option>
                          ))
                        : adminProducts.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                    </select>
                  </label>
                  <label>
                    {c.discountPercent}
                    <input
                      min={1}
                      max={100}
                      type="number"
                      value={rule.percent}
                      onChange={(event) =>
                        updatePromoRule(rule.id, {
                          percent: Math.max(1, Math.min(100, Number(event.target.value) || 1)),
                        })
                      }
                    />
                  </label>
                  <label>
                    {c.audience}
                    <select
                      value={rule.audience}
                      onChange={(event) =>
                        updatePromoRule(rule.id, {
                          audience: event.target.value as PromoRule["audience"],
                        })
                      }
                    >
                      <option value="both">{c.bothAudience}</option>
                      <option value="user">{c.b2cAudience}</option>
                      <option value="b2b">{c.b2bAudience}</option>
                    </select>
                  </label>
                  <label className="switch-row">
                    <input
                      checked={rule.active}
                      type="checkbox"
                      onChange={(event) =>
                        updatePromoRule(rule.id, { active: event.target.checked })
                      }
                    />
                    {rule.active ? c.active : c.hidden}
                  </label>
                  <button
                    className="table-action danger"
                    onClick={() =>
                      setPromoRulesAndSave(promoRules.filter((item) => item.id !== rule.id))
                    }
                    type="button"
                  >
                    {c.delete}
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="variation-editor-head">
            <h3>{c.banners}</h3>
            <button className="primary-link" onClick={addBanner} type="button">
              {c.addBanner}
            </button>
          </div>

          {banners.length ? (
            <div className="banner-list">
              {banners.map((banner) => (
                <div className="banner-editor-row" key={banner.id}>
                  <label>
                    {c.bannerTarget}
                    <select
                      value={banner.targetType ?? "discounts"}
                      onChange={(event) =>
                        updateBannerTarget(banner.id, event.target.value as PromoTargetType)
                      }
                    >
                      <option value="discounts">{c.targetDiscounts}</option>
                      <option value="brand">{c.targetBrand}</option>
                      <option value="category">{c.targetCategory}</option>
                    </select>
                  </label>
                  {banner.targetType === "brand" ? (
                    <label>
                      {c.brand}
                      <select
                        value={banner.targetValue ?? ""}
                        onChange={(event) =>
                          updateBanner(banner.id, { targetValue: event.target.value })
                        }
                      >
                        {brandOptions.map((brand) => (
                          <option key={brand} value={brand}>
                            {brand}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {banner.targetType === "category" ? (
                    <label>
                      {c.category}
                      <select
                        value={banner.targetValue ?? ""}
                        onChange={(event) =>
                          updateBanner(banner.id, { targetValue: event.target.value })
                        }
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {categoryLabel(category, language)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <div className="banner-image-editor">
                    <label className="file-action">
                      {c.bannerImage}
                      <input
                        accept="image/*"
                        type="file"
                        onChange={async (event) => {
                          await updateBannerImage(banner.id, event.currentTarget.files);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    {banner.image ? (
                      <div className="banner-image-preview">
                        <div
                          className="banner-preview-image"
                          style={{ backgroundImage: `url("${banner.image}")` }}
                        />
                        <button
                          className="table-action danger"
                          onClick={() => updateBanner(banner.id, { image: "" })}
                          type="button"
                        >
                          {c.removeBannerImage}
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <label className="switch-row">
                    <input
                      checked={banner.active}
                      type="checkbox"
                      onChange={(event) =>
                        updateBanner(banner.id, { active: event.target.checked })
                      }
                    />
                    {c.activeBanner}
                  </label>
                  <button
                    className="table-action danger"
                    onClick={() => deleteBanner(banner)}
                    type="button"
                  >
                    {c.delete}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">{c.noBanners}</p>
          )}
        </div>
      ) : null}

      {tab === "clients" ? (
        <div className="admin-client-layout">
          <div className="table-wrap admin-table">
            <table>
              <thead>
                <tr>
                  <th>{c.clients}</th>
                  <th>Email</th>
                  <th>{c.type}</th>
                  <th>{c.company}</th>
                  <th>{c.status}</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((user) => (
                  <tr
                    className={
                      selectedClient?.email === user.email ? "clickable-row active" : "clickable-row"
                    }
                    key={user.id}
                    onClick={() => setSelectedClientEmail(user.email)}
                  >
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role === "b2b" ? "B2B" : user.role === "admin" ? "Admin" : "B2C"}</td>
                    <td>{user.company ?? "-"}</td>
                    <td>
                      <span className={user.emailConfirmed ? "status-pill ok" : "status-pill"}>
                        {user.emailConfirmed ? c.confirmed : c.waitingEmail}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="admin-client-card">
            {selectedClient ? (
              <>
                <span className="eyebrow">{extra.clientDetails}</span>
                <h3>{selectedClient.name}</h3>
                <div className="client-data-grid">
                  <span>Email</span>
                  <strong>{selectedClient.email}</strong>
                  <span>{c.type}</span>
                  <strong>
                    {selectedClient.role === "b2b"
                      ? "B2B"
                      : selectedClient.role === "admin"
                        ? "Admin"
                        : "B2C"}
                  </strong>
                  <span>{c.company}</span>
                  <strong>{selectedClient.company ?? "-"}</strong>
                  <span>PVN / VAT</span>
                  <strong>{selectedClient.vatNumber ?? "-"}</strong>
                </div>

                {selectedClient.b2bRequest ? (
                  <div className="b2b-request-box">
                    <span className="eyebrow">{extra.b2bRequest}</span>
                    <strong>{selectedClient.b2bRequest.status}</strong>
                    <div className="client-data-grid">
                      <span>{extra.companyName}</span>
                      <strong>{selectedClient.b2bRequest.companyName}</strong>
                      <span>{extra.registrationNumber}</span>
                      <strong>{selectedClient.b2bRequest.registrationNumber}</strong>
                      <span>{extra.address}</span>
                      <strong>{selectedClient.b2bRequest.address}</strong>
                      <span>{extra.phone}</span>
                      <strong>{selectedClient.b2bRequest.phone}</strong>
                    </div>
                    {selectedClient.b2bRequest.status === "pending" ? (
                      <div className="admin-inline-actions">
                        <button
                          className="wide-button inline-button"
                          onClick={() => void reviewB2BRequest(selectedClient, true)}
                          type="button"
                        >
                          {extra.approve}
                        </button>
                        <button
                          className="table-action danger"
                          onClick={() => void reviewB2BRequest(selectedClient, false)}
                          type="button"
                        >
                          {extra.reject}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="client-orders-list">
                  <h4>{extra.pastOrders}</h4>
                  {selectedClientOrders.length ? (
                    selectedClientOrders.map((order) => (
                      <button
                        className="client-order-row"
                        key={order.id}
                        onClick={() => {
                          setTab("orders");
                          setExpandedOrderId(order.id);
                        }}
                        type="button"
                      >
                        <span>
                          {order.invoiceNumber ?? order.id}
                          <small>{formatOrderDate(order.createdAt, language)}</small>
                        </span>
                        <strong>{money(order.total, language)}</strong>
                      </button>
                    ))
                  ) : (
                    <p className="empty-state">{extra.noOrders}</p>
                  )}
                </div>
              </>
            ) : (
              <p className="empty-state">{extra.selectClient}</p>
            )}
            {adminActionStatus ? <p className="status-box">{adminActionStatus}</p> : null}
          </aside>
        </div>
      ) : null}

      {tab === "stock" ? (
        <div className="stock-compact-panel">
          <div className="stock-topline">
            <div className="stock-brand-tabs">
              {stockGroups.map(([brand, items]) => (
                <button
                  className={brand === selectedStockBrand ? "active" : ""}
                  key={brand}
                  onClick={() => setActiveStockBrand(brand)}
                  type="button"
                >
                  {brand}
                  <span>{items.length}</span>
                </button>
              ))}
            </div>
            <input
              className="admin-search stock-search"
              placeholder={`${c.search.split(",")[0]}...`}
              value={stockQuery}
              onChange={(event) => setStockQuery(event.target.value)}
            />
          </div>
          <div className="table-wrap admin-table stock-compact-table">
            <table>
              <thead>
                <tr>
                  <th>{c.product}</th>
                  <th>{c.variants}</th>
                </tr>
              </thead>
              <tbody>
                {selectedStockRows.map((row) => (
                  <tr key={`${selectedStockBrand}-${row.productName}`}>
                    <td>
                      <strong>{row.productName}</strong>
                      <span>
                        {categoryLabel(row.category, language)} · {row.items.length}
                      </span>
                    </td>
                    <td className="stock-variant-cell">
                      <div className="stock-variant-grid">
                        {row.items.map((item) => (
                          <div className="stock-variant-token" key={item.variationId}>
                            <span className="stock-variant-title">
                              {[item.color, item.size].filter(Boolean).join(" / ") || "-"}
                            </span>
                            <input
                              aria-label={`${item.productName} ${item.color ?? ""} ${item.size ?? ""}`}
                              min={0}
                              type="number"
                              value={item.physical}
                              onChange={(event) =>
                                void updateStockLevel(item, Number(event.target.value))
                              }
                            />
                            <small>{item.available} {c.availableStock}</small>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "orders" ? (
        <div className="table-wrap admin-table">
          <table>
            <thead>
              <tr>
                <th>{c.order}</th>
                <th>{dateLabel}</th>
                <th>{c.invoiceNumber}</th>
                <th>{c.clients}</th>
                <th>{c.sum}</th>
                <th>{c.payment}</th>
                <th>{c.shipping}</th>
                <th>{c.tracking}</th>
                <th>{c.label}</th>
                <th>{c.status}</th>
                <th>{c.details}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <Fragment key={order.id}>
                  <tr>
                    <td>{order.id}</td>
                    <td>{formatOrderDate(order.createdAt, language)}</td>
                    <td>
                      {order.invoiceNumber ?? "-"}
                      <span>
                        <a
                          href={`/api/orders/${order.id}/invoice`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {c.invoicePdf}
                        </a>
                      </span>
                    </td>
                    <td>
                      {order.client}
                      <span>{order.email ?? "-"}</span>
                    </td>
                    <td>{money(order.total, language)}</td>
                    <td>{c.payments[order.payment]}</td>
                    <td>
                      {order.shippingMethodName ?? "-"}
                      <span>{order.shippingStatus ?? "-"}</span>
                    </td>
                    <td>
                      {order.trackingLink ? (
                        <a href={order.trackingLink} rel="noreferrer" target="_blank">
                          {order.trackingNumber ?? order.trackingLink}
                        </a>
                      ) : (
                        order.trackingNumber ?? "-"
                      )}
                    </td>
                    <td>
                      {order.labelUrl ? (
                        <a href={order.labelUrl} rel="noreferrer" target="_blank">
                          PDF
                        </a>
                      ) : (
                        order.labelFileId ?? "-"
                      )}
                    </td>
                    <td>
                      <select
                        className={`order-status-select status-${order.status}`}
                        value={order.status}
                        onChange={(event) =>
                          void updateOrderStatus(order.id, event.target.value as OrderStatus)
                        }
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {c.statuses[status]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="table-action"
                        onClick={() =>
                          setExpandedOrderId((current) =>
                            current === order.id ? null : order.id,
                          )
                        }
                        type="button"
                      >
                        {expandedOrderId === order.id ? c.close : c.details}
                      </button>
                    </td>
                  </tr>
                  {expandedOrderId === order.id ? (
                    <tr className="order-details-row">
                      <td colSpan={11}>
                        <div className="order-details-grid">
                          <div>
                            <h4>{c.products}</h4>
                            <div className="order-line-list">
                              {(order.lines ?? []).map((line, index) => (
                                <div className="order-line-item" key={`${order.id}-${index}`}>
                                  <strong>{line.productName}</strong>
                                  <span>
                                    {[line.variationName, line.sku]
                                      .filter(Boolean)
                                      .join(" - ") || c.noVariant}
                                  </span>
                                  <span>
                                    {line.quantity} x {money(line.unitPrice, language)} ={" "}
                                    {money(line.total, language)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4>{c.shipping}</h4>
                            <p className="empty-state">
                              {order.shippingMethodName ?? "-"}
                              {order.pickupPointName ? ` / ${order.pickupPointName}` : ""}
                            </p>
                            <p className="empty-state">
                              {[
                                order.shippingAddress?.streetAddress,
                                order.shippingAddress?.locality,
                                order.shippingAddress?.postalCode,
                                order.shippingAddress?.country,
                              ]
                                .filter(Boolean)
                                .join(", ") || "-"}
                            </p>
                            <div className="order-edit-grid">
                              <label>
                                Payment
                                <select
                                  value={order.paymentStatus ?? "pending"}
                                  onChange={(event) =>
                                    void updateOrderPatch(order.id, {
                                      paymentStatus: event.target.value,
                                    })
                                  }
                                >
                                  <option value="pending">pending</option>
                                  <option value="paid">paid</option>
                                  <option value="failed">failed</option>
                                  <option value="cancelled">cancelled</option>
                                </select>
                              </label>
                              <label>
                                {c.shipping}
                                <select
                                  value={order.shippingStatus ?? "pending"}
                                  onChange={(event) =>
                                    void updateOrderPatch(order.id, {
                                      shippingStatus: event.target.value,
                                    })
                                  }
                                >
                                  <option value="pending">pending</option>
                                  <option value="ready_for_pickup">ready_for_pickup</option>
                                  <option value="ready_to_ship">ready_to_ship</option>
                                  <option value="shipment_created">shipment_created</option>
                                  <option value="label_created">label_created</option>
                                  <option value="failed">failed</option>
                                </select>
                              </label>
                              <label>
                                {c.tracking}
                                <input
                                  defaultValue={order.trackingNumber ?? ""}
                                  onBlur={(event) =>
                                    void updateOrderPatch(order.id, {
                                      trackingNumber: event.target.value,
                                    })
                                  }
                                />
                              </label>
                              <label>
                                Tracking URL
                                <input
                                  defaultValue={order.trackingLink ?? ""}
                                  onBlur={(event) =>
                                    void updateOrderPatch(order.id, {
                                      trackingLink: event.target.value,
                                    })
                                  }
                                />
                              </label>
                            </div>
                          </div>
                          <div>
                            <h4>{c.sum}</h4>
                            <div className="metric-row">
                              <span>Subtotal</span>
                              <strong>{money(order.subtotal ?? 0, language)}</strong>
                            </div>
                            <div className="metric-row">
                              <span>PVN</span>
                              <strong>{money(order.vat ?? 0, language)}</strong>
                            </div>
                            <div className="metric-row">
                              <span>{c.shipping}</span>
                              <strong>{money(order.shippingPrice ?? 0, language)}</strong>
                            </div>
                            <div className="metric-row">
                              <span>{c.sum}</span>
                              <strong>{money(order.total, language)}</strong>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
