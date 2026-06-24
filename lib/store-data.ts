import { karateCategories, karateProducts } from "./karate-products";

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
  color?: string;
  size?: string;
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
  images?: string[];
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

export const categories = [...karateCategories];

export const demoUsers: DemoUser[] = [
  {
    id: "usr-admin",
    name: "Admin",
    email: "admin@karate.test",
    password: "admin123",
    role: "admin",
    paymentTerms: ["card", "invoice", "defer15"],
    emailConfirmed: true,
  },
  {
    id: "usr-b2c",
    name: "Marta Ozola",
    email: "buyer@karate.test",
    password: "user123",
    role: "user",
    paymentTerms: ["card"],
    emailConfirmed: true,
  },
  {
    id: "usr-b2b",
    name: "Riga Karate Club",
    email: "club@karate.test",
    password: "b2b123",
    role: "b2b",
    company: "Riga Karate Club",
    vatNumber: "LV40203000000",
    creditLimit: 4500,
    paymentTerms: ["card", "invoice", "defer15"],
    emailConfirmed: true,
  },
];

export const products: Product[] = karateProducts;

export const discounts: DiscountRule[] = [
  {
    id: "disc-kihon-b2c",
    name: "Kihon старт сезона",
    scope: "brand",
    target: "Kihon",
    type: "percent",
    value: 10,
    audience: "user",
    active: true,
  },
  {
    id: "disc-body-b2b",
    name: "Клубная защита",
    scope: "product",
    target: "kihon-body-protector",
    type: "fixed",
    value: 8,
    audience: "b2b",
    active: true,
  },
  {
    id: "disc-arawaza-protector",
    name: "WKF комплект",
    scope: "variation",
    target: "a0564xs",
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
