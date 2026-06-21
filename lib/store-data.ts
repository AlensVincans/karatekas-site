export type UserRole = "user" | "b2b" | "admin";
export type PaymentMethod = "card" | "invoice" | "defer15";

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  company?: string;
  vatNumber?: string;
  creditLimit?: number;
  paymentTerms: PaymentMethod[];
  emailConfirmed: boolean;
};

export type StockLot = {
  batch: string;
  qty: number;
  purchase: number;
  shipping: number;
  customs: number;
  vatRate: number;
  fx: number;
  eta: string;
};

export type Stock = {
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

export type Variation = {
  id: string;
  sku: string;
  name: string;
  b2c: number;
  b2b: number;
  stock: Stock;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  specs: string[];
  tags: string[];
  sheetX: string;
  sheetY: string;
  variations: Variation[];
};

export type DiscountRule = {
  id: string;
  name: string;
  scope: "brand" | "product" | "variation";
  target: string;
  type: "percent" | "fixed";
  value: number;
  audience: "user" | "b2b" | "both";
  active: boolean;
};

export const categories = [
  "Инструменты",
  "Склад и маркировка",
  "Защита",
  "Складское оборудование",
  "Освещение",
  "Расходники",
];

export const demoUsers: DemoUser[] = [
  {
    id: "usr-admin",
    name: "Admin",
    email: "admin@baltic.test",
    password: "admin123",
    role: "admin",
    paymentTerms: ["card", "invoice", "defer15"],
    emailConfirmed: true,
  },
  {
    id: "usr-b2c",
    name: "Marta Ozola",
    email: "buyer@baltic.test",
    password: "user123",
    role: "user",
    paymentTerms: ["card"],
    emailConfirmed: true,
  },
  {
    id: "usr-b2b",
    name: "SIA Baltic Service",
    email: "b2b@baltic.test",
    password: "b2b123",
    role: "b2b",
    company: "SIA Baltic Service",
    vatNumber: "LV40203000000",
    creditLimit: 4500,
    paymentTerms: ["card", "invoice", "defer15"],
    emailConfirmed: true,
  },
];

export const products: Product[] = [
  {
    id: "drill-bg18",
    name: "Аккумуляторная дрель BG-18",
    brand: "BaltGear",
    category: "Инструменты",
    description:
      "Комплект для монтажа и сервиса: дрель, кейс, зарядка и две батареи.",
    specs: ["18V", "2 скорости", "кейс", "гарантия 24 месяца"],
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
    description: "Ручной 1D/2D сканер для склада, кассы и приёмки поставок.",
    specs: ["1D/2D", "USB или Bluetooth", "IP42", "до 100 000 сканов"],
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
    specs: ["EN166", "прозрачная линза", "антицарапина", "индивидуальная упаковка"],
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
    description: "Компактная печать этикеток для интернет-магазина и склада.",
    specs: ["203 dpi", "USB", "этикетки 40-108 мм", "печать без чернил"],
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
    description: "Металлический модуль с полками для складов, магазинов и сервисов.",
    specs: ["180 x 90 см", "нагрузка 175 кг", "оцинкованный металл", "модульный"],
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
    description: "Ровный офисный свет для торговых залов, складов и рабочих зон.",
    specs: ["60x60 см", "3000K/4000K", "до 4200 lm", "низкое потребление"],
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

export const discounts: DiscountRule[] = [
  {
    id: "disc-baltgear-b2c",
    name: "BaltGear summer",
    scope: "brand",
    target: "BaltGear",
    type: "percent",
    value: 12,
    audience: "user",
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

export const deliveryOptions = [
  { id: "omniva", name: "Omniva", region: "Балтия", price: 3.49, eta: "1-2 дня" },
  { id: "dpd", name: "DPD", region: "Балтия / ЕС", price: 4.9, eta: "1-4 дня" },
  { id: "unisend", name: "Unisend", region: "Балтия", price: 2.99, eta: "1-3 дня" },
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

export function eur(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: value < 20 ? 2 : 0,
  }).format(value);
}

export function available(stock: Stock) {
  return Math.max(0, stock.physical - stock.reserved);
}

export function unitCost(stock: Stock) {
  return (stock.purchase + stock.shipping + stock.customs) * stock.fx;
}

export function margin(price: number, stock: Stock) {
  return price - unitCost(stock);
}

export function findProduct(id: string) {
  return products.find((product) => product.id === id);
}

export function findVariation(variationId: string) {
  for (const product of products) {
    const variation = product.variations.find((item) => item.id === variationId);

    if (variation) {
      return { product, variation };
    }
  }

  return null;
}

export function discountMatches(
  rule: DiscountRule,
  product: Product,
  variation: Variation,
  role: UserRole,
) {
  const priceAudience = role === "b2b" || role === "admin" ? "b2b" : "user";
  const audienceMatch = rule.audience === "both" || rule.audience === priceAudience;

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

export function appliedDiscount(
  product: Product,
  variation: Variation,
  role: UserRole,
) {
  const priority: Record<DiscountRule["scope"], number> = {
    variation: 3,
    product: 2,
    brand: 1,
  };

  return discounts
    .filter((rule) => discountMatches(rule, product, variation, role))
    .sort((a, b) => priority[b.scope] - priority[a.scope])[0];
}

export function pricedVariation(
  product: Product,
  variation: Variation,
  role: UserRole,
) {
  const isB2B = role === "b2b" || role === "admin";
  const base = isB2B ? variation.b2b : variation.b2c;
  const discount = appliedDiscount(product, variation, role);
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
    isB2B,
  };
}

export function warehouseTotals() {
  return products.reduce(
    (totals, product) => {
      product.variations.forEach((variation) => {
        totals.physical += variation.stock.physical;
        totals.reserved += variation.stock.reserved;
        totals.expected += variation.stock.expected;
        totals.available += available(variation.stock);
        totals.cost += unitCost(variation.stock) * variation.stock.physical;
      });

      return totals;
    },
    { physical: 0, reserved: 0, available: 0, expected: 0, cost: 0 },
  );
}
