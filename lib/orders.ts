import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { decrementInventory, restoreInventory } from "./inventory";
import { roundMoney } from "./montonio";

export type OrderPaymentMethod = "card" | "invoice" | "defer15";
export type OrderPaymentStatus = "pending" | "paid" | "failed" | "cancelled";
export type OrderShippingStatus =
  | "pending"
  | "ready_for_pickup"
  | "ready_to_ship"
  | "shipment_created"
  | "label_created"
  | "failed";
export type OrderShippingType =
  | "parcel_machine"
  | "parcel_shop"
  | "post_office"
  | "courier"
  | "self_pickup";

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
  invoiceNumber?: string;
  invoiceIssuedAt?: string;
  invoiceDueAt?: string;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  noVat: boolean;
  language?: "ru" | "lv" | "en" | "et" | "lt";
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
  stockAdjusted?: boolean;
  orderEmailSent?: boolean;
  createdAt: string;
  updatedAt: string;
};

type OrderStore = {
  orders: StoreOrder[];
};

export type CreateOrderInput = Omit<
  StoreOrder,
  | "id"
  | "invoiceNumber"
  | "invoiceIssuedAt"
  | "invoiceDueAt"
  | "paymentStatus"
  | "shippingStatus"
  | "stockAdjusted"
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

function nextInvoiceNumber(orders: StoreOrder[], issuedAt: Date) {
  const year = issuedAt.getFullYear();
  const prefix = `KG-${year}-`;
  const next = orders.reduce((max, order) => {
    if (!order.invoiceNumber?.startsWith(prefix)) {
      return max;
    }

    const parsed = Number(order.invoiceNumber.slice(prefix.length));
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 0) + 1;

  return `${prefix}${String(next).padStart(5, "0")}`;
}

function invoiceDueAt(input: CreateOrderInput, issuedAt: Date) {
  const days = input.paymentMethod === "defer15" ? 15 : 0;
  const due = new Date(issuedAt);

  due.setDate(due.getDate() + days);
  return due.toISOString();
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

  return store.orders
    .filter((order) => order.paymentStatus !== "cancelled")
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
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
  const issuedAt = new Date();
  const now = issuedAt.toISOString();
  const stockAdjusted = await decrementInventory(input.lines);
  const order: StoreOrder = {
    ...input,
    id: orderId(),
    invoiceNumber: nextInvoiceNumber(store.orders, issuedAt),
    invoiceIssuedAt: now,
    invoiceDueAt: invoiceDueAt(input, issuedAt),
    paymentStatus: "pending",
    shippingStatus: input.shippingType === "self_pickup" ? "ready_for_pickup" : "pending",
    shippingPrice: roundMoney(input.shippingPrice),
    totals: {
      ...input.totals,
      subtotal: roundMoney(input.totals.subtotal),
      vat: roundMoney(input.totals.vat),
      shipping: roundMoney(input.totals.shipping),
      total: roundMoney(input.totals.total),
    },
    stockAdjusted,
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
): Promise<StoreOrder | null> {
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

export async function cancelPendingCardOrder(input: {
  id?: string;
  merchantReference?: string;
}): Promise<StoreOrder | null> {
  if (!input.id && !input.merchantReference) {
    return null;
  }

  const store = await readStore();
  let cancelled: StoreOrder | null = null;

  store.orders = await Promise.all(
    store.orders.map(async (order) => {
      const idMatches = input.id ? order.id === input.id : true;
      const referenceMatches = input.merchantReference
        ? order.merchantReference === input.merchantReference
        : true;

      if (
        !idMatches ||
        !referenceMatches ||
        order.paymentMethod !== "card" ||
        order.paymentStatus !== "pending"
      ) {
        return order;
      }

      const stockRestored = order.stockAdjusted
        ? await restoreInventory(order.lines)
        : false;

      cancelled = {
        ...order,
        paymentStatus: "cancelled",
        shippingStatus: "failed",
        shippingError: "Payment checkout was interrupted before completion.",
        stockAdjusted: stockRestored ? false : order.stockAdjusted,
        updatedAt: new Date().toISOString(),
      };

      return cancelled;
    }),
  );

  if (!cancelled) {
    return null;
  }

  await writeStore(store);
  return cancelled;
}
