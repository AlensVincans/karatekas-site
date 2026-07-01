import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { roundMoney } from "./montonio";

export type OrderPaymentMethod = "card" | "invoice" | "defer15";
export type OrderPaymentStatus = "pending" | "paid" | "failed" | "cancelled";
export type OrderShippingStatus =
  | "pending"
  | "ready_to_ship"
  | "shipment_created"
  | "label_created"
  | "failed";
export type OrderShippingType =
  | "parcel_machine"
  | "parcel_shop"
  | "post_office"
  | "courier";

export type OrderLine = {
  productId?: string;
  variationId?: string;
  productName: string;
  variationName?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type OrderCustomer = {
  name: string;
  email: string;
  company?: string;
  role?: string;
};

export type ShippingAddress = {
  name?: string;
  companyName?: string;
  streetAddress?: string;
  locality?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
  email?: string;
};

export type OrderTotals = {
  subtotal: number;
  vat: number;
  shipping: number;
  total: number;
  currency: "EUR";
};

export type StoreOrder = {
  id: string;
  merchantReference: string;
  montonioOrderUuid?: string;
  paymentUrl?: string;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  noVat: boolean;
  language?: "ru" | "lv" | "en";
  customer: OrderCustomer;
  lines: OrderLine[];
  totals: OrderTotals;
  shippingCarrier: string;
  shippingMethod: string;
  shippingMethodName: string;
  shippingType: OrderShippingType;
  pickupPointId?: string;
  pickupPointName?: string;
  shippingAddress?: ShippingAddress;
  shippingPrice: number;
  shipmentId?: string;
  carrierShipmentId?: string;
  trackingNumber?: string;
  trackingLink?: string;
  labelUrl?: string;
  labelFileId?: string;
  labelStatus?: string;
  shippingStatus: OrderShippingStatus;
  shippingError?: string;
  createdAt: string;
  updatedAt: string;
};

type OrderStore = {
  orders: StoreOrder[];
};

export type CreateOrderInput = Omit<
  StoreOrder,
  | "id"
  | "paymentStatus"
  | "shippingStatus"
  | "createdAt"
  | "updatedAt"
>;

function orderStorePath() {
  return (
    process.env.MONTONIO_ORDERS_FILE?.trim() ||
    path.join(process.cwd(), "data", "orders.json")
  );
}

function emptyStore(): OrderStore {
  return { orders: [] };
}

function orderId() {
  return `ORD-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
}

async function readStore(): Promise<OrderStore> {
  try {
    const file = await readFile(orderStorePath(), "utf8");
    const parsed = JSON.parse(file) as Partial<OrderStore>;

    return Array.isArray(parsed.orders) ? { orders: parsed.orders } : emptyStore();
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: OrderStore) {
  const file = orderStorePath();
  const tempFile = `${file}.tmp`;

  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(tempFile, JSON.stringify(store, null, 2), "utf8");
  await rename(tempFile, file);
}

export async function listOrders() {
  const store = await readStore();

  return [...store.orders].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export async function getOrderById(id: string) {
  const store = await readStore();

  return store.orders.find((order) => order.id === id) ?? null;
}

export async function getOrderByMerchantReference(merchantReference: string) {
  const store = await readStore();

  return (
    store.orders.find((order) => order.merchantReference === merchantReference) ??
    null
  );
}

export async function createOrder(input: CreateOrderInput) {
  const store = await readStore();
  const now = new Date().toISOString();
  const order: StoreOrder = {
    ...input,
    id: orderId(),
    paymentStatus: "pending",
    shippingStatus: "pending",
    shippingPrice: roundMoney(input.shippingPrice),
    totals: {
      ...input.totals,
      subtotal: roundMoney(input.totals.subtotal),
      vat: roundMoney(input.totals.vat),
      shipping: roundMoney(input.totals.shipping),
      total: roundMoney(input.totals.total),
    },
    createdAt: now,
    updatedAt: now,
  };

  store.orders = [order, ...store.orders];
  await writeStore(store);

  return order;
}

export async function updateOrder(
  id: string,
  patch: Partial<Omit<StoreOrder, "id" | "createdAt">>,
) {
  const store = await readStore();
  let updated: StoreOrder | null = null;

  store.orders = store.orders.map((order) => {
    if (order.id !== id) {
      return order;
    }

    updated = {
      ...order,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    return updated;
  });

  if (!updated) {
    return null;
  }

  await writeStore(store);
  return updated;
}

export async function updateOrderByMerchantReference(
  merchantReference: string,
  patch: Partial<Omit<StoreOrder, "id" | "createdAt">>,
) {
  const order = await getOrderByMerchantReference(merchantReference);

  return order ? updateOrder(order.id, patch) : null;
}
