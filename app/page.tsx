"use client";

import { useMemo, useState, type CSSProperties } from "react";

type AccountType = "b2c" | "b2b";
type PaymentTerm = "card" | "invoice" | "defer15";
type DiscountAudience = AccountType | "both";
type DiscountScope = "brand" | "product" | "variation";
type DiscountType = "percent" | "fixed";

type StockLot = {
  batch: string;
  qty: number;
  purchase: number;
  shipping: number;
  customs: number;
  vatRate: number;
  fx: number;
  eta: string;
};

type Stock = {
  physical: number;
  reserved: number;
  expected: number;
  purchase: number;
  shipping: number;
  customs: number;
  vatRate: number;
  fx: number;
  lots: StockLot[];
};

type Variation = {
  id: string;
  sku: string;
  name: string;
  b2c: number;
  b2b: number;
  stock: Stock;
};

type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  tags: string[];
  sheetX: string;
  sheetY: string;
  variations: Variation[];
};

type DiscountRule = {
  id: string;
  name: string;
  scope: DiscountScope;
  target: string;
  type: DiscountType;
  value: number;
  audience: DiscountAudience;
  active: boolean;
};

type CartItem = {
  productId: string;
  variationId: string;
  qty: number;
};

const vatRate = 0.21;

const initialCategories = [
  "Инструменты",
  "Склад и маркировка",
  "Защита",
  "Складское оборудование",
  "Освещение",
  "Расходники",
];

const sheetPositions = [
  ["0%", "0%"],
  ["50%", "0%"],
  ["100%", "0%"],
  ["0%", "100%"],
  ["50%", "100%"],
  ["100%", "100%"],
];

const initialProducts: Product[] = [
  {
    id: "drill-bg18",
    name: "Аккумуляторная дрель BG-18",
    brand: "BaltGear",
    category: "Инструменты",
    description:
      "Комплект для монтажа и сервиса: дрель, кейс, зарядка и две батареи.",
    tags: ["топ продаж", "акция"],
    sheetX: "0%",
    sheetY: "0%",
    variations: [
      {
        id: "drill-2ah",
        sku: "BG18-2A",
        name: "18V, 2Ah",
        b2c: 149,
        b2b: 118,
        stock: {
          physical: 94,
          reserved: 19,
          expected: 120,
          purchase: 76,
          shipping: 4.2,
          customs: 1.8,
          vatRate: 21,
          fx: 1,
          lots: [
            {
              batch: "BG-2406-01",
              qty: 52,
              purchase: 72,
              shipping: 4.1,
              customs: 1.6,
              vatRate: 21,
              fx: 1,
              eta: "на складе",
            },
            {
              batch: "BG-2407-02",
              qty: 42,
              purchase: 80,
              shipping: 4.4,
              customs: 2,
              vatRate: 21,
              fx: 1,
              eta: "на складе",
            },
          ],
        },
      },
      {
        id: "drill-4ah",
        sku: "BG18-4A",
        name: "18V, 4Ah",
        b2c: 189,
        b2b: 151,
        stock: {
          physical: 37,
          reserved: 8,
          expected: 60,
          purchase: 99,
          shipping: 5.2,
          customs: 2.1,
          vatRate: 21,
          fx: 1,
          lots: [
            {
              batch: "BG-2406-04",
              qty: 37,
              purchase: 99,
              shipping: 5.2,
              customs: 2.1,
              vatRate: 21,
              fx: 1,
              eta: "на складе",
            },
          ],
        },
      },
    ],
  },
  {
    id: "scanner-m2",
    name: "Сканер штрихкодов NordScan M2",
    brand: "Nordline",
    category: "Склад и маркировка",
    description:
      "Ручной 1D/2D сканер для склада, кассы и приёмки поставок.",
    tags: ["B2B хит", "новинка"],
    sheetX: "50%",
    sheetY: "0%",
    variations: [
      {
        id: "scanner-usb",
        sku: "NS-M2-USB",
        name: "USB",
        b2c: 89,
        b2b: 68,
        stock: {
          physical: 126,
          reserved: 31,
          expected: 180,
          purchase: 41,
          shipping: 2.2,
          customs: 0.8,
          vatRate: 21,
          fx: 1,
          lots: [
            {
              batch: "NS-2405-11",
              qty: 84,
              purchase: 40,
              shipping: 2,
              customs: 0.7,
              vatRate: 21,
              fx: 1,
              eta: "на складе",
            },
          ],
        },
      },
      {
        id: "scanner-bt",
        sku: "NS-M2-BT",
        name: "Bluetooth",
        b2c: 119,
        b2b: 94,
        stock: {
          physical: 48,
          reserved: 12,
          expected: 90,
          purchase: 58,
          shipping: 2.7,
          customs: 1.1,
          vatRate: 21,
          fx: 1,
          lots: [
            {
              batch: "NS-2406-14",
              qty: 48,
              purchase: 58,
              shipping: 2.7,
              customs: 1.1,
              vatRate: 21,
              fx: 1,
              eta: "на складе",
            },
          ],
        },
      },
    ],
  },
  {
    id: "glasses-clear",
    name: "Защитные очки SafePro Clear",
    brand: "SafePro",
    category: "Защита",
    description:
      "Прозрачные очки с антицарапинным покрытием, упаковка для розницы.",
    tags: ["PVN 21%", "опт"],
    sheetX: "100%",
    sheetY: "0%",
    variations: [
      {
        id: "glasses-one",
        sku: "SP-CLEAR-1",
        name: "1 шт.",
        b2c: 12.9,
        b2b: 8.4,
        stock: {
          physical: 820,
          reserved: 140,
          expected: 1000,
          purchase: 4.9,
          shipping: 0.38,
          customs: 0.12,
          vatRate: 21,
          fx: 1,
          lots: [
            {
              batch: "SP-2406-80",
              qty: 820,
              purchase: 4.9,
              shipping: 0.38,
              customs: 0.12,
              vatRate: 21,
              fx: 1,
              eta: "на складе",
            },
          ],
        },
      },
      {
        id: "glasses-box",
        sku: "SP-CLEAR-24",
        name: "короб 24 шт.",
        b2c: 249,
        b2b: 172,
        stock: {
          physical: 54,
          reserved: 10,
          expected: 120,
          purchase: 102,
          shipping: 7,
          customs: 1.6,
          vatRate: 21,
          fx: 1,
          lots: [
            {
              batch: "SP-2406-BX",
              qty: 54,
              purchase: 102,
              shipping: 7,
              customs: 1.6,
              vatRate: 21,
              fx: 1,
              eta: "на складе",
            },
          ],
        },
      },
    ],
  },
  {
    id: "printer-lp420",
    name: "Термопринтер LabelPro 420",
    brand: "LabelPro",
    category: "Склад и маркировка",
    description:
      "Компактная печать этикеток для интернет-магазина, склада и сервиса.",
    tags: ["счета", "склад"],
    sheetX: "0%",
    sheetY: "100%",
    variations: [
      {
        id: "printer-basic",
        sku: "LP-420-B",
        name: "Basic",
        b2c: 219,
        b2b: 176,
        stock: {
          physical: 32,
          reserved: 9,
          expected: 50,
          purchase: 123,
          shipping: 6.8,
          customs: 2.9,
          vatRate: 21,
          fx: 1,
          lots: [
            {
              batch: "LP-2406-02",
              qty: 32,
              purchase: 123,
              shipping: 6.8,
              customs: 2.9,
              vatRate: 21,
              fx: 1,
              eta: "на складе",
            },
          ],
        },
      },
      {
        id: "printer-wifi",
        sku: "LP-420-W",
        name: "Wi-Fi",
        b2c: 269,
        b2b: 218,
        stock: {
          physical: 18,
          reserved: 4,
          expected: 40,
          purchase: 151,
          shipping: 7.4,
          customs: 3.2,
          vatRate: 21,
          fx: 1,
          lots: [
            {
              batch: "LP-2406-03",
              qty: 18,
              purchase: 151,
              shipping: 7.4,
              customs: 3.2,
              vatRate: 21,
              fx: 1,
              eta: "на складе",
            },
          ],
        },
      },
    ],
  },
  {
    id: "shelf-storeflex",
    name: "Стеллаж модульный StoreFlex",
    brand: "StoreFlex",
    category: "Складское оборудование",
    description:
      "Металлический модуль с полками для складов, магазинов и сервисов.",
    tags: ["доставка DPD", "B2B"],
    sheetX: "50%",
    sheetY: "100%",
    variations: [
      {
        id: "shelf-180",
        sku: "SF-180-90",
        name: "180 x 90 см",
        b2c: 98,
        b2b: 76,
        stock: {
          physical: 61,
          reserved: 17,
          expected: 80,
          purchase: 49,
          shipping: 8.6,
          customs: 1.9,
          vatRate: 21,
          fx: 1,
          lots: [
            {
              batch: "SF-2405-10",
              qty: 61,
              purchase: 49,
              shipping: 8.6,
              customs: 1.9,
              vatRate: 21,
              fx: 1,
              eta: "на складе",
            },
          ],
        },
      },
    ],
  },
  {
    id: "led-lumiq",
    name: "LED панель Lumiq 60x60",
    brand: "Lumiq",
    category: "Освещение",
    description:
      "Ровный офисный свет для торговых залов, складов и рабочих зон.",
    tags: ["энергоэффективно", "опт"],
    sheetX: "100%",
    sheetY: "100%",
    variations: [
      {
        id: "led-4000k",
        sku: "LQ-6060-4K",
        name: "4000K",
        b2c: 38,
        b2b: 29,
        stock: {
          physical: 240,
          reserved: 46,
          expected: 360,
          purchase: 16.7,
          shipping: 1.9,
          customs: 0.7,
          vatRate: 21,
          fx: 1,
          lots: [
            {
              batch: "LQ-2406-60",
              qty: 240,
              purchase: 16.7,
              shipping: 1.9,
              customs: 0.7,
              vatRate: 21,
              fx: 1,
              eta: "на складе",
            },
          ],
        },
      },
      {
        id: "led-3000k",
        sku: "LQ-6060-3K",
        name: "3000K",
        b2c: 39,
        b2b: 30,
        stock: {
          physical: 75,
          reserved: 14,
          expected: 160,
          purchase: 17.1,
          shipping: 1.9,
          customs: 0.7,
          vatRate: 21,
          fx: 1,
          lots: [
            {
              batch: "LQ-2406-61",
              qty: 75,
              purchase: 17.1,
              shipping: 1.9,
              customs: 0.7,
              vatRate: 21,
              fx: 1,
              eta: "на складе",
            },
          ],
        },
      },
    ],
  },
];

const initialDiscounts: DiscountRule[] = [
  {
    id: "disc-baltgear-b2c",
    name: "BaltGear summer",
    scope: "brand",
    target: "BaltGear",
    type: "percent",
    value: 12,
    audience: "b2c",
    active: true,
  },
  {
    id: "disc-printer-b2b",
    name: "Printer B2B bundle",
    scope: "product",
    target: "printer-lp420",
    type: "fixed",
    value: 35,
    audience: "b2b",
    active: true,
  },
  {
    id: "disc-scanner-both",
    name: "Scanner launch",
    scope: "variation",
    target: "scanner-usb",
    type: "percent",
    value: 7,
    audience: "both",
    active: true,
  },
];

const clients = [
  {
    name: "SIA Baltic Service",
    type: "B2B",
    email: "orders@baltic-service.lv",
    credit: "15 дней",
    limit: "EUR 4 500",
    status: "подтверждён",
  },
  {
    name: "Marta Ozola",
    type: "B2C",
    email: "marta@example.lv",
    credit: "предоплата",
    limit: "EUR 0",
    status: "double opt-in",
  },
  {
    name: "UAB North Retail",
    type: "B2B",
    email: "buy@north-retail.lt",
    credit: "15 дней",
    limit: "EUR 8 000",
    status: "ожидает PVN",
  },
];

const initialOrders = [
  {
    id: "ORD-2026-041",
    client: "SIA Baltic Service",
    channel: "B2B",
    total: 684,
    payment: "отсрочка 15 дней",
    status: "в резерве",
  },
  {
    id: "ORD-2026-042",
    client: "Marta Ozola",
    channel: "B2C",
    total: 157.3,
    payment: "карта 3D Secure",
    status: "оплачен",
  },
  {
    id: "ORD-2026-043",
    client: "UAB North Retail",
    channel: "B2B",
    total: 1240,
    payment: "счёт",
    status: "счёт создан",
  },
];

const deliveryOptions = [
  { id: "omniva", name: "Omniva", region: "Балтия", price: 3.49, eta: "1-2 дня" },
  { id: "dpd", name: "DPD", region: "Балтия / ЕС", price: 4.9, eta: "1-4 дня" },
  {
    id: "unisend",
    name: "Unisend",
    region: "Балтия",
    price: 2.99,
    eta: "1-3 дня",
  },
  {
    id: "pasts",
    name: "Latvijas Pasts",
    region: "Латвия / ЕС",
    price: 5.6,
    eta: "2-7 дней",
  },
  {
    id: "courier",
    name: "Курьер",
    region: "Рига / Балтия",
    price: 8.5,
    eta: "сегодня / завтра",
  },
];

function eur(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: value < 20 ? 2 : 0,
  }).format(value);
}

function available(stock: Stock) {
  return Math.max(0, stock.physical - stock.reserved);
}

function unitCost(stock: Stock) {
  return (stock.purchase + stock.shipping + stock.customs) * stock.fx;
}

function margin(price: number, stock: Stock) {
  return price - unitCost(stock);
}

function discountMatches(
  rule: DiscountRule,
  product: Product,
  variation: Variation,
  accountType: AccountType,
) {
  const audienceMatch = rule.audience === "both" || rule.audience === accountType;

  if (!rule.active || !audienceMatch) {
    return false;
  }

  if (rule.scope === "brand") {
    return rule.target === product.brand;
  }

  if (rule.scope === "product") {
    return rule.target === product.id;
  }

  return rule.target === variation.id;
}

function appliedDiscount(
  discounts: DiscountRule[],
  product: Product,
  variation: Variation,
  accountType: AccountType,
) {
  const priority: Record<DiscountScope, number> = {
    variation: 3,
    product: 2,
    brand: 1,
  };

  return discounts
    .filter((rule) => discountMatches(rule, product, variation, accountType))
    .sort((a, b) => priority[b.scope] - priority[a.scope])[0];
}

function pricedVariation(
  discounts: DiscountRule[],
  product: Product,
  variation: Variation,
  accountType: AccountType,
) {
  const base = accountType === "b2b" ? variation.b2b : variation.b2c;
  const discount = appliedDiscount(discounts, product, variation, accountType);
  const discountValue = discount
    ? discount.type === "percent"
      ? base * (discount.value / 100)
      : discount.value
    : 0;

  return {
    base,
    retail: variation.b2c,
    final: Math.max(0, base - discountValue),
    discount,
    discountValue,
  };
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => {
    const map: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '"': "&quot;",
    };
    return map[char];
  });
}

function safeId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

export default function Home() {
  const [accountType, setAccountType] = useState<AccountType>("b2c");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [discounts, setDiscounts] = useState<DiscountRule[]>(initialDiscounts);
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [selectedBrand, setSelectedBrand] = useState("Все");
  const [query, setQuery] = useState("");
  const [selectedVariations, setSelectedVariations] = useState<
    Record<string, string>
  >({});
  const [cart, setCart] = useState<CartItem[]>([
    { productId: "scanner-m2", variationId: "scanner-usb", qty: 2 },
  ]);
  const [paymentTerm, setPaymentTerm] = useState<PaymentTerm>("card");
  const [selectedDelivery, setSelectedDelivery] = useState("omniva");
  const [adminTab, setAdminTab] = useState("products");
  const [categoryDraft, setCategoryDraft] = useState("");
  const [importText, setImportText] = useState(
    "SKU;Название;Бренд;Категория;B2C;B2B;Остаток\nEX-100;Расходник тестовый;Nordline;Расходники;19.90;14.20;75",
  );
  const [importStatus, setImportStatus] = useState("");
  const [invoiceNoVat, setInvoiceNoVat] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState("");
  const [orders, setOrders] = useState(initialOrders);
  const [security, setSecurity] = useState({
    captcha: "hCaptcha",
    registrationLimit: "5",
    orderLimit: "12",
    doubleOptIn: true,
  });
  const [productDraft, setProductDraft] = useState({
    name: "",
    brand: "Nordline",
    category: initialCategories[0],
    sku: "",
    b2c: "49",
    b2b: "39",
    stock: "25",
  });
  const [discountDraft, setDiscountDraft] = useState({
    name: "Новая акция",
    scope: "brand" as DiscountScope,
    target: "Nordline",
    type: "percent" as DiscountType,
    value: "5",
    audience: "both" as DiscountAudience,
  });

  const isB2B = accountType === "b2b";
  const invoiceNo = "INV-2026-00042";
  const brands = useMemo(
    () => Array.from(new Set(products.map((product) => product.brand))),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const categoryMatch =
        selectedCategory === "Все" || product.category === selectedCategory;
      const brandMatch = selectedBrand === "Все" || product.brand === selectedBrand;
      const textMatch =
        !normalizedQuery ||
        [product.name, product.brand, product.category, product.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return categoryMatch && brandMatch && textMatch;
    });
  }, [products, query, selectedBrand, selectedCategory]);

  const cartLines = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        const variation = product?.variations.find(
          (candidate) => candidate.id === item.variationId,
        );

        if (!product || !variation) {
          return null;
        }

        const price = pricedVariation(discounts, product, variation, accountType);

        return {
          ...item,
          product,
          variation,
          price,
          lineTotal: price.final * item.qty,
        };
      })
      .filter(Boolean);
  }, [accountType, cart, discounts, products]);

  const selectedDeliveryOption =
    deliveryOptions.find((option) => option.id === selectedDelivery) ??
    deliveryOptions[0];

  const subtotal = cartLines.reduce((sum, line) => sum + line.lineTotal, 0);
  const tax = invoiceNoVat ? 0 : subtotal * vatRate;
  const total = subtotal + tax + selectedDeliveryOption.price;

  const warehouseTotals = useMemo(() => {
    return products.reduce(
      (totalValue, product) => {
        product.variations.forEach((variation) => {
          totalValue.physical += variation.stock.physical;
          totalValue.reserved += variation.stock.reserved;
          totalValue.expected += variation.stock.expected;
          totalValue.available += available(variation.stock);
          totalValue.inventoryCost += unitCost(variation.stock) * variation.stock.physical;
        });

        return totalValue;
      },
      { physical: 0, reserved: 0, available: 0, expected: 0, inventoryCost: 0 },
    );
  }, [products]);

  function chooseCategory(category: string) {
    setSelectedCategory(category);
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  }

  function selectedVariation(product: Product) {
    const selected = selectedVariations[product.id] ?? product.variations[0].id;
    return (
      product.variations.find((variation) => variation.id === selected) ??
      product.variations[0]
    );
  }

  function addToCart(product: Product) {
    const variation = selectedVariation(product);

    setCart((items) => {
      const found = items.find(
        (item) => item.productId === product.id && item.variationId === variation.id,
      );

      if (found) {
        return items.map((item) =>
          item === found ? { ...item, qty: item.qty + 1 } : item,
        );
      }

      return [...items, { productId: product.id, variationId: variation.id, qty: 1 }];
    });
  }

  function updateCartQty(productId: string, variationId: string, qty: number) {
    if (qty <= 0) {
      setCart((items) =>
        items.filter(
          (item) => item.productId !== productId || item.variationId !== variationId,
        ),
      );
      return;
    }

    setCart((items) =>
      items.map((item) =>
        item.productId === productId && item.variationId === variationId
          ? { ...item, qty }
          : item,
      ),
    );
  }

  function addCategory() {
    const nextCategory = categoryDraft.trim();

    if (!nextCategory || categories.includes(nextCategory)) {
      return;
    }

    setCategories((items) => [...items, nextCategory]);
    setProductDraft((draft) => ({ ...draft, category: nextCategory }));
    setCategoryDraft("");
  }

  function addManualProduct() {
    const name = productDraft.name.trim();
    const sku = productDraft.sku.trim() || `SKU-${products.length + 101}`;

    if (!name) {
      return;
    }

    const position = sheetPositions[products.length % sheetPositions.length];
    const b2c = Number(productDraft.b2c) || 0;
    const b2b = Number(productDraft.b2b) || Math.max(0, b2c * 0.78);
    const physical = Number(productDraft.stock) || 0;
    const productId = `${safeId(name)}-${Date.now()}`;

    setProducts((items) => [
      ...items,
      {
        id: productId,
        name,
        brand: productDraft.brand.trim() || "Custom",
        category: productDraft.category,
        description: "Позиция добавлена вручную из админ-панели.",
        tags: ["ручной ввод"],
        sheetX: position[0],
        sheetY: position[1],
        variations: [
          {
            id: `${productId}-base`,
            sku,
            name: "base",
            b2c,
            b2b,
            stock: {
              physical,
              reserved: 0,
              expected: 0,
              purchase: Math.max(1, b2b * 0.62),
              shipping: Math.max(0.5, b2b * 0.04),
              customs: Math.max(0.2, b2b * 0.015),
              vatRate: 21,
              fx: 1,
              lots: [
                {
                  batch: `MAN-${Date.now()}`,
                  qty: physical,
                  purchase: Math.max(1, b2b * 0.62),
                  shipping: Math.max(0.5, b2b * 0.04),
                  customs: Math.max(0.2, b2b * 0.015),
                  vatRate: 21,
                  fx: 1,
                  eta: "на складе",
                },
              ],
            },
          },
        ],
      },
    ]);
    setProductDraft((draft) => ({ ...draft, name: "", sku: "" }));
  }

  function importCsv() {
    const rows = importText
      .split(/\r?\n/)
      .slice(1)
      .map((row) => row.trim())
      .filter(Boolean);

    const imported = rows.flatMap((row, index) => {
      const [sku, name, brand, category, b2cRaw, b2bRaw, stockRaw] = row
        .split(/[;,]/)
        .map((cell) => cell.trim());

      if (!name) {
        return [];
      }

      const b2c = Number(b2cRaw.replace(",", ".")) || 0;
      const b2b = Number(b2bRaw.replace(",", ".")) || Math.max(0, b2c * 0.78);
      const physical = Number(stockRaw) || 0;
      const position = sheetPositions[(products.length + index) % sheetPositions.length];
      const productId = `${safeId(name)}-${Date.now()}-${index}`;

      return [
        {
          id: productId,
          name,
          brand: brand || "Import",
          category: category || "Расходники",
          description: "Импортировано из Excel/CSV.",
          tags: ["Excel"],
          sheetX: position[0],
          sheetY: position[1],
          variations: [
            {
              id: `${productId}-base`,
              sku: sku || `IMP-${index + 1}`,
              name: "base",
              b2c,
              b2b,
              stock: {
                physical,
                reserved: 0,
                expected: 0,
                purchase: Math.max(1, b2b * 0.6),
                shipping: Math.max(0.3, b2b * 0.04),
                customs: Math.max(0.1, b2b * 0.015),
                vatRate: 21,
                fx: 1,
                lots: [
                  {
                    batch: `IMP-${Date.now()}-${index}`,
                    qty: physical,
                    purchase: Math.max(1, b2b * 0.6),
                    shipping: Math.max(0.3, b2b * 0.04),
                    customs: Math.max(0.1, b2b * 0.015),
                    vatRate: 21,
                    fx: 1,
                    eta: "на складе",
                  },
                ],
              },
            },
          ],
        } satisfies Product,
      ];
    });

    if (!imported.length) {
      setImportStatus("Нет корректных строк для импорта.");
      return;
    }

    setProducts((items) => [...items, ...imported]);
    setCategories((items) =>
      Array.from(new Set([...items, ...imported.map((product) => product.category)])),
    );
    setImportStatus(`${imported.length} позиций загружено из Excel/CSV.`);
  }

  function addDiscount() {
    const value = Number(discountDraft.value);

    if (!discountDraft.name.trim() || !discountDraft.target.trim() || value <= 0) {
      return;
    }

    setDiscounts((items) => [
      ...items,
      {
        id: `discount-${Date.now()}`,
        name: discountDraft.name,
        scope: discountDraft.scope,
        target: discountDraft.target,
        type: discountDraft.type,
        value,
        audience: discountDraft.audience,
        active: true,
      },
    ]);
  }

  function downloadBlob(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportInvoice(format: "csv" | "xml") {
    if (!cartLines.length) {
      return;
    }

    if (format === "csv") {
      const header = "invoice;sku;name;qty;unit_price;line_total";
      const rows = cartLines.map((line) =>
        [
          invoiceNo,
          line.variation.sku,
          line.product.name,
          line.qty,
          line.price.final.toFixed(2),
          line.lineTotal.toFixed(2),
        ].join(";"),
      );

      downloadBlob(
        `${invoiceNo}.csv`,
        [header, ...rows].join("\n"),
        "text/csv;charset=utf-8",
      );
      setInvoiceStatus("CSV экспорт сформирован.");
      return;
    }

    const linesXml = cartLines
      .map(
        (line) =>
          `<line><sku>${escapeXml(line.variation.sku)}</sku><name>${escapeXml(
            line.product.name,
          )}</name><qty>${line.qty}</qty><unit>${line.price.final.toFixed(
            2,
          )}</unit><total>${line.lineTotal.toFixed(2)}</total></line>`,
      )
      .join("");

    downloadBlob(
      `${invoiceNo}.xml`,
      `<invoice number="${invoiceNo}" vat="${invoiceNoVat ? "0" : "21"}"><subtotal>${subtotal.toFixed(
        2,
      )}</subtotal><delivery>${selectedDeliveryOption.price.toFixed(
        2,
      )}</delivery><total>${total.toFixed(2)}</total><lines>${linesXml}</lines></invoice>`,
      "application/xml;charset=utf-8",
    );
    setInvoiceStatus("XML экспорт сформирован.");
  }

  function printInvoice() {
    setInvoiceStatus("PDF можно сохранить через системную печать.");
    window.print();
  }

  function renderPrice(product: Product, variation: Variation) {
    const price = pricedVariation(discounts, product, variation, accountType);
    const hasDiscount = price.discount && price.final < price.base;

    return (
      <div className="price-stack">
        {isB2B ? (
          <span className="old-price">{eur(price.retail)}</span>
        ) : hasDiscount ? (
          <span className="old-price">{eur(price.base)}</span>
        ) : null}
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
    );
  }

  function renderAdminContent() {
    if (adminTab === "products") {
      return (
        <div className="admin-layout">
          <div className="tool-panel">
            <h3>Категории</h3>
            <div className="inline-form">
              <input
                value={categoryDraft}
                onChange={(event) => setCategoryDraft(event.target.value)}
                placeholder="Новая категория"
              />
              <button onClick={addCategory} type="button">
                Добавить
              </button>
            </div>
            <div className="chip-list">
              {categories.map((category) => (
                <button
                  className="chip"
                  key={category}
                  onClick={() => chooseCategory(category)}
                  type="button"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="tool-panel">
            <h3>Товар вручную</h3>
            <div className="form-grid">
              <input
                value={productDraft.name}
                onChange={(event) =>
                  setProductDraft((draft) => ({ ...draft, name: event.target.value }))
                }
                placeholder="Название"
              />
              <input
                value={productDraft.brand}
                onChange={(event) =>
                  setProductDraft((draft) => ({ ...draft, brand: event.target.value }))
                }
                placeholder="Бренд"
              />
              <select
                value={productDraft.category}
                onChange={(event) =>
                  setProductDraft((draft) => ({
                    ...draft,
                    category: event.target.value,
                  }))
                }
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
              <input
                value={productDraft.sku}
                onChange={(event) =>
                  setProductDraft((draft) => ({ ...draft, sku: event.target.value }))
                }
                placeholder="SKU"
              />
              <input
                value={productDraft.b2c}
                onChange={(event) =>
                  setProductDraft((draft) => ({ ...draft, b2c: event.target.value }))
                }
                inputMode="decimal"
                placeholder="B2C"
              />
              <input
                value={productDraft.b2b}
                onChange={(event) =>
                  setProductDraft((draft) => ({ ...draft, b2b: event.target.value }))
                }
                inputMode="decimal"
                placeholder="B2B"
              />
              <input
                value={productDraft.stock}
                onChange={(event) =>
                  setProductDraft((draft) => ({ ...draft, stock: event.target.value }))
                }
                inputMode="numeric"
                placeholder="Остаток"
              />
              <button onClick={addManualProduct} type="button">
                Сохранить товар
              </button>
            </div>
          </div>

          <div className="tool-panel wide-panel">
            <h3>Excel / CSV</h3>
            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              rows={5}
            />
            <div className="panel-actions">
              <button onClick={importCsv} type="button">
                Импортировать
              </button>
              <span>{importStatus}</span>
            </div>
          </div>
        </div>
      );
    }

    if (adminTab === "warehouse") {
      return (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Физ.</th>
                <th>Резерв</th>
                <th>Доступно</th>
                <th>Ожидается</th>
                <th>Партия</th>
                <th>Себестоимость</th>
                <th>Маржа B2B</th>
              </tr>
            </thead>
            <tbody>
              {products.flatMap((product) =>
                product.variations.map((variation) => {
                  const lot = variation.stock.lots[0];
                  return (
                    <tr key={variation.id}>
                      <td>
                        <strong>{variation.sku}</strong>
                        <span>{product.name}</span>
                      </td>
                      <td>{variation.stock.physical}</td>
                      <td>{variation.stock.reserved}</td>
                      <td>{available(variation.stock)}</td>
                      <td>{variation.stock.expected}</td>
                      <td>{lot?.batch ?? "-"}</td>
                      <td>{eur(unitCost(variation.stock))}</td>
                      <td>{eur(margin(variation.b2b, variation.stock))}</td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (adminTab === "clients") {
      return (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Тип</th>
                <th>Email</th>
                <th>Оплата</th>
                <th>Лимит</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.email}>
                  <td>{client.name}</td>
                  <td>{client.type}</td>
                  <td>{client.email}</td>
                  <td>{client.credit}</td>
                  <td>{client.limit}</td>
                  <td>
                    <span className="status-pill">{client.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (adminTab === "orders") {
      return (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Заказ</th>
                <th>Клиент</th>
                <th>Канал</th>
                <th>Сумма</th>
                <th>Оплата</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.client}</td>
                  <td>{order.channel}</td>
                  <td>{eur(order.total)}</td>
                  <td>{order.payment}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(event) =>
                        setOrders((items) =>
                          items.map((item) =>
                            item.id === order.id
                              ? { ...item, status: event.target.value }
                              : item,
                          ),
                        )
                      }
                    >
                      <option>в резерве</option>
                      <option>оплачен</option>
                      <option>счёт создан</option>
                      <option>собран</option>
                      <option>отправлен</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (adminTab === "invoices") {
      return (
        <div className="admin-layout">
          <div className="tool-panel">
            <h3>Счета</h3>
            <label className="check-row">
              <input
                checked={invoiceNoVat}
                onChange={(event) => setInvoiceNoVat(event.target.checked)}
                type="checkbox"
              />
              Выставлять без PVN
            </label>
            <div className="stacked-actions">
              <button onClick={printInvoice} type="button">
                PDF / печать
              </button>
              <button onClick={() => exportInvoice("csv")} type="button">
                CSV
              </button>
              <button onClick={() => exportInvoice("xml")} type="button">
                XML
              </button>
              <button
                onClick={() =>
                  setInvoiceStatus(
                    `${invoiceNo} отправлен на email клиента и в архив счетов.`,
                  )
                }
                type="button"
              >
                Email
              </button>
            </div>
            <span className="quiet">{invoiceStatus}</span>
          </div>

          <div className="tool-panel wide-panel">
            <h3>Автонумерация</h3>
            <div className="metric-row">
              <span>Текущий счёт</span>
              <strong>{invoiceNo}</strong>
            </div>
            <div className="metric-row">
              <span>Следующий номер</span>
              <strong>INV-2026-00043</strong>
            </div>
            <div className="metric-row">
              <span>Накладная</span>
              <strong>DN-2026-00018</strong>
            </div>
          </div>
        </div>
      );
    }

    if (adminTab === "discounts") {
      const targetOptions =
        discountDraft.scope === "brand"
          ? brands
          : discountDraft.scope === "product"
            ? products.map((product) => product.id)
            : products.flatMap((product) =>
                product.variations.map((variation) => variation.id),
              );

      return (
        <div className="admin-layout">
          <div className="tool-panel">
            <h3>Новая скидка</h3>
            <div className="form-grid">
              <input
                value={discountDraft.name}
                onChange={(event) =>
                  setDiscountDraft((draft) => ({ ...draft, name: event.target.value }))
                }
                placeholder="Название"
              />
              <select
                value={discountDraft.scope}
                onChange={(event) =>
                  setDiscountDraft((draft) => ({
                    ...draft,
                    scope: event.target.value as DiscountScope,
                    target: "",
                  }))
                }
              >
                <option value="brand">бренд</option>
                <option value="product">товар</option>
                <option value="variation">вариация</option>
              </select>
              <select
                value={discountDraft.target}
                onChange={(event) =>
                  setDiscountDraft((draft) => ({
                    ...draft,
                    target: event.target.value,
                  }))
                }
              >
                <option value="">цель</option>
                {targetOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <select
                value={discountDraft.type}
                onChange={(event) =>
                  setDiscountDraft((draft) => ({
                    ...draft,
                    type: event.target.value as DiscountType,
                  }))
                }
              >
                <option value="percent">%</option>
                <option value="fixed">EUR</option>
              </select>
              <input
                value={discountDraft.value}
                onChange={(event) =>
                  setDiscountDraft((draft) => ({ ...draft, value: event.target.value }))
                }
                inputMode="decimal"
                placeholder="Значение"
              />
              <select
                value={discountDraft.audience}
                onChange={(event) =>
                  setDiscountDraft((draft) => ({
                    ...draft,
                    audience: event.target.value as DiscountAudience,
                  }))
                }
              >
                <option value="both">B2C + B2B</option>
                <option value="b2c">только B2C</option>
                <option value="b2b">только B2B</option>
              </select>
              <button onClick={addDiscount} type="button">
                Запустить
              </button>
            </div>
          </div>
          <div className="tool-panel wide-panel">
            <h3>Активные правила</h3>
            <div className="rule-list">
              {discounts.map((rule) => (
                <label className="rule-row" key={rule.id}>
                  <input
                    checked={rule.active}
                    onChange={(event) =>
                      setDiscounts((items) =>
                        items.map((item) =>
                          item.id === rule.id
                            ? { ...item, active: event.target.checked }
                            : item,
                        ),
                      )
                    }
                    type="checkbox"
                  />
                  <span>
                    <strong>{rule.name}</strong>
                    {rule.scope}: {rule.target} · {rule.audience} ·{" "}
                    {rule.type === "percent" ? `${rule.value}%` : eur(rule.value)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (adminTab === "supplies") {
      return (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Поставка</th>
                <th>Поставщик</th>
                <th>ETA</th>
                <th>Валюта</th>
                <th>Курс</th>
                <th>Доставка</th>
                <th>Таможня</th>
                <th>PVN</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>PO-2026-118</td>
                <td>Nordline EU</td>
                <td>28.06.2026</td>
                <td>EUR</td>
                <td>1.000</td>
                <td>{eur(420)}</td>
                <td>{eur(95)}</td>
                <td>21%</td>
              </tr>
              <tr>
                <td>PO-2026-119</td>
                <td>BaltGear Logistics</td>
                <td>04.07.2026</td>
                <td>USD</td>
                <td>0.92</td>
                <td>{eur(680)}</td>
                <td>{eur(150)}</td>
                <td>21%</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (adminTab === "costing") {
      return (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Товар</th>
                <th>Закупка</th>
                <th>Доставка</th>
                <th>Таможня</th>
                <th>Курс</th>
                <th>Себестоимость</th>
                <th>B2C прибыль</th>
                <th>B2B прибыль</th>
              </tr>
            </thead>
            <tbody>
              {products.flatMap((product) =>
                product.variations.map((variation) => (
                  <tr key={variation.id}>
                    <td>
                      <strong>{product.name}</strong>
                      <span>{variation.name}</span>
                    </td>
                    <td>{eur(variation.stock.purchase)}</td>
                    <td>{eur(variation.stock.shipping)}</td>
                    <td>{eur(variation.stock.customs)}</td>
                    <td>{variation.stock.fx.toFixed(3)}</td>
                    <td>{eur(unitCost(variation.stock))}</td>
                    <td>{eur(margin(variation.b2c, variation.stock))}</td>
                    <td>{eur(margin(variation.b2b, variation.stock))}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="admin-layout">
        <div className="tool-panel">
          <h3>Anti-spam</h3>
          <div className="form-grid">
            <select
              value={security.captcha}
              onChange={(event) =>
                setSecurity((value) => ({ ...value, captcha: event.target.value }))
              }
            >
              <option>hCaptcha</option>
              <option>reCAPTCHA</option>
              <option>honeypot + rate limit</option>
            </select>
            <input
              value={security.registrationLimit}
              onChange={(event) =>
                setSecurity((value) => ({
                  ...value,
                  registrationLimit: event.target.value,
                }))
              }
              inputMode="numeric"
              placeholder="Регистраций / IP"
            />
            <input
              value={security.orderLimit}
              onChange={(event) =>
                setSecurity((value) => ({ ...value, orderLimit: event.target.value }))
              }
              inputMode="numeric"
              placeholder="Заказов / IP"
            />
            <label className="check-row">
              <input
                checked={security.doubleOptIn}
                onChange={(event) =>
                  setSecurity((value) => ({
                    ...value,
                    doubleOptIn: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              Double opt-in
            </label>
          </div>
        </div>
        <div className="tool-panel wide-panel">
          <h3>Журнал</h3>
          <div className="security-log">
            <span>93.184.216.34</span>
            <strong>заказ разрешён</strong>
            <span>лимит {security.orderLimit}/час</span>
            <span>203.0.113.7</span>
            <strong>регистрация остановлена</strong>
            <span>honeypot заполнен</span>
            <span>198.51.100.21</span>
            <strong>email ожидает подтверждения</strong>
            <span>{security.captcha}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="store-shell">
      <header className="topbar screen-only">
        <a className="brand-mark" href="#home">
          Baltic Commerce
        </a>
        <nav>
          <a href="#catalog">Каталог</a>
          <a href="#checkout">Корзина</a>
          <a href="#admin">Админка</a>
        </nav>
        <div className="account-switch" role="group" aria-label="Тип клиента">
          <button
            className={accountType === "b2c" ? "active" : ""}
            onClick={() => {
              setAccountType("b2c");
              setPaymentTerm("card");
            }}
            type="button"
          >
            B2C
          </button>
          <button
            className={accountType === "b2b" ? "active" : ""}
            onClick={() => {
              setAccountType("b2b");
              setPaymentTerm("invoice");
            }}
            type="button"
          >
            B2B вход
          </button>
        </div>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <span className="eyebrow">Балтия · B2C · B2B · склад</span>
          <h1>Коммерческий каталог товаров с ценами, складом и счетами</h1>
          <p>
            Розничная витрина, B2B-кабинет, управляемые категории, скидки,
            партии, PVN, доставка и документы в одном интерфейсе.
          </p>
          <div className="hero-actions screen-only">
            <button onClick={() => chooseCategory("Склад и маркировка")} type="button">
              Склад и маркировка
            </button>
            <button onClick={() => chooseCategory("Инструменты")} type="button">
              Инструменты
            </button>
          </div>
        </div>
        <div className="hero-metrics">
          <div>
            <strong>{products.length}</strong>
            <span>товаров</span>
          </div>
          <div>
            <strong>{brands.length}</strong>
            <span>брендов</span>
          </div>
          <div>
            <strong>5</strong>
            <span>служб доставки</span>
          </div>
        </div>
      </section>

      <section className="quick-commerce screen-only">
        <div className="promo-banner">
          <strong>Акции</strong>
          <span>B2C скидка BaltGear · B2B скидка на LabelPro · запуск NordScan</span>
        </div>
        <div className="brand-rail">
          {brands.map((brand) => (
            <button
              className={selectedBrand === brand ? "active" : ""}
              key={brand}
              onClick={() => {
                setSelectedBrand(brand);
                document
                  .getElementById("catalog")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              type="button"
            >
              {brand}
            </button>
          ))}
        </div>
        <div className="category-rail">
          {categories.map((category) => (
            <button
              className={selectedCategory === category ? "active" : ""}
              key={category}
              onClick={() => chooseCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="commerce-grid screen-only" id="catalog">
        <aside className="filters-panel">
          <h2>Каталог</h2>
          <label>
            Поиск
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="бренд, SKU, товар"
            />
          </label>
          <label>
            Категория
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              <option>Все</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            Бренд
            <select
              value={selectedBrand}
              onChange={(event) => setSelectedBrand(event.target.value)}
            >
              <option>Все</option>
              {brands.map((brand) => (
                <option key={brand}>{brand}</option>
              ))}
            </select>
          </label>
          <div className="filter-summary">
            <span>Физический остаток</span>
            <strong>{warehouseTotals.physical}</strong>
            <span>Резерв</span>
            <strong>{warehouseTotals.reserved}</strong>
            <span>Доступно</span>
            <strong>{warehouseTotals.available}</strong>
            <span>Ожидается</span>
            <strong>{warehouseTotals.expected}</strong>
          </div>
        </aside>

        <section className="product-grid" aria-label="Товары">
          {filteredProducts.map((product) => {
            const variation = selectedVariation(product);
            const price = pricedVariation(discounts, product, variation, accountType);
            const availability = available(variation.stock);

            return (
              <article className="product-card" key={product.id}>
                <div
                  className="product-photo"
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
                    <strong>{product.name}</strong>
                  </div>
                  <p>{product.description}</p>
                  <div className="variation-row">
                    {product.variations.map((item) => (
                      <button
                        className={variation.id === item.id ? "active" : ""}
                        key={item.id}
                        onClick={() =>
                          setSelectedVariations((items) => ({
                            ...items,
                            [product.id]: item.id,
                          }))
                        }
                        type="button"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                  <div className="product-meta">
                    <span>SKU {variation.sku}</span>
                    <span>{product.category}</span>
                  </div>
                  <div className="stock-line">
                    <span className={availability > 20 ? "ok-dot" : "warn-dot"} />
                    {availability} доступно · {variation.stock.reserved} в резерве ·{" "}
                    {variation.stock.expected} ожидается
                  </div>
                  <div className="product-bottom">
                    {renderPrice(product, variation)}
                    <button
                      disabled={availability === 0}
                      onClick={() => addToCart(product)}
                      type="button"
                    >
                      В корзину
                    </button>
                  </div>
                  {price.discount ? (
                    <div className="discount-strip">
                      Скидка действует в каталоге, корзине и счёте.
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>

        <aside className="checkout-panel" id="checkout">
          <h2>Корзина</h2>
          <div className="account-note">
            {isB2B
              ? "B2B-клиент видит розницу и свою закупочную цену."
              : "B2C-клиент видит розничную цену."}
          </div>
          <div className="cart-lines">
            {cartLines.length ? (
              cartLines.map((line) => (
                <div className="cart-line" key={`${line.product.id}-${line.variation.id}`}>
                  <div>
                    <strong>{line.product.name}</strong>
                    <span>{line.variation.name}</span>
                  </div>
                  <input
                    min={0}
                    onChange={(event) =>
                      updateCartQty(
                        line.product.id,
                        line.variation.id,
                        Number(event.target.value),
                      )
                    }
                    type="number"
                    value={line.qty}
                  />
                  <span>{eur(line.lineTotal)}</span>
                </div>
              ))
            ) : (
              <p className="empty-state">Корзина пуста.</p>
            )}
          </div>

          <div className="checkout-block">
            <h3>Оплата</h3>
            <div className="segmented-control">
              <button
                className={paymentTerm === "card" ? "active" : ""}
                onClick={() => setPaymentTerm("card")}
                type="button"
              >
                Карта
              </button>
              {isB2B ? (
                <>
                  <button
                    className={paymentTerm === "invoice" ? "active" : ""}
                    onClick={() => setPaymentTerm("invoice")}
                    type="button"
                  >
                    Счёт
                  </button>
                  <button
                    className={paymentTerm === "defer15" ? "active" : ""}
                    onClick={() => setPaymentTerm("defer15")}
                    type="button"
                  >
                    15 дней
                  </button>
                </>
              ) : null}
            </div>
            <div className="payment-logos">
              <span>Visa</span>
              <span>Mastercard</span>
              <span>3D Secure</span>
              <span>Apple Pay</span>
              <span>Google Pay</span>
            </div>
          </div>

          <div className="checkout-block">
            <h3>Доставка</h3>
            <select
              value={selectedDelivery}
              onChange={(event) => setSelectedDelivery(event.target.value)}
            >
              {deliveryOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} · {option.region} · {eur(option.price)}
                </option>
              ))}
            </select>
            <span className="quiet">{selectedDeliveryOption.eta}</span>
          </div>

          <div className="totals">
            <span>Товары</span>
            <strong>{eur(subtotal)}</strong>
            <span>PVN {invoiceNoVat ? "0%" : "21%"}</span>
            <strong>{eur(tax)}</strong>
            <span>Доставка</span>
            <strong>{eur(selectedDeliveryOption.price)}</strong>
            <span>Итого</span>
            <strong>{eur(total)}</strong>
          </div>

          <form className="secure-form">
            <input
              aria-hidden="true"
              autoComplete="off"
              className="honeypot"
              name="website"
              tabIndex={-1}
            />
            <label className="check-row">
              <input defaultChecked type="checkbox" />
              Email double opt-in
            </label>
            <span className="quiet">
              {security.captcha} · IP лимиты {security.registrationLimit}/
              {security.orderLimit}
            </span>
          </form>
        </aside>
      </section>

      <section className="admin-section screen-only" id="admin">
        <div className="section-heading">
          <span className="eyebrow">Админ-панель</span>
          <h2>Управление товарами, складом, клиентами и документами</h2>
        </div>
        <div className="admin-stats">
          <div>
            <span>Товарный остаток</span>
            <strong>{warehouseTotals.physical}</strong>
          </div>
          <div>
            <span>В резерве</span>
            <strong>{warehouseTotals.reserved}</strong>
          </div>
          <div>
            <span>Себестоимость склада</span>
            <strong>{eur(warehouseTotals.inventoryCost)}</strong>
          </div>
          <div>
            <span>Активные скидки</span>
            <strong>{discounts.filter((discount) => discount.active).length}</strong>
          </div>
        </div>
        <div className="admin-tabs" role="tablist">
          {[
            ["products", "Товары"],
            ["warehouse", "Склад"],
            ["clients", "Клиенты"],
            ["orders", "Заказы"],
            ["invoices", "Счета"],
            ["discounts", "Скидки"],
            ["supplies", "Поставки"],
            ["costing", "Себестоимость"],
            ["security", "Безопасность"],
          ].map(([id, label]) => (
            <button
              className={adminTab === id ? "active" : ""}
              key={id}
              onClick={() => setAdminTab(id)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        {renderAdminContent()}
      </section>

      <section className="invoice-print">
        <div className="invoice-paper">
          <div className="invoice-head">
            <div>
              <span>Счёт</span>
              <h2>{invoiceNo}</h2>
            </div>
            <div>
              <strong>Baltic Commerce SIA</strong>
              <span>PVN LV00000000000</span>
              <span>21.06.2026</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Товар</th>
                <th>SKU</th>
                <th>Кол-во</th>
                <th>Цена</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {cartLines.map((line) => (
                <tr key={`${line.product.id}-${line.variation.id}-invoice`}>
                  <td>{line.product.name}</td>
                  <td>{line.variation.sku}</td>
                  <td>{line.qty}</td>
                  <td>{eur(line.price.final)}</td>
                  <td>{eur(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="invoice-total">
            <span>PVN</span>
            <strong>{eur(tax)}</strong>
            <span>Итого</span>
            <strong>{eur(total)}</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
