import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";

import {
  releaseInventoryReservation,
  reserveInventory,
  restoreInventory,
} from "./inventory";
import { roundMoney } from "./montonio";
import { dbQuery, hasDatabase } from "../db/postgres";

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

export type StoreOrderStatus =
  | "pending"
  | "awaiting_payment"
  | "processing"
  | "cancelled"
  | "failed"
  | "refunded"
  | "in_process"
  | "paid"
  | "shipped"
  | "unpaid"
  | "completed";

export type OrderLine = {
  productId?: string;
  variationId?: string;
  productName: string;
  variationName?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
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
  orderStatus?: StoreOrderStatus;
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
  if (hasDatabase()) {
    const result = await dbQuery<OrderRow>(
      `select * from orders
       where payment_status <> 'cancelled'
         and not (payment_method = 'card' and payment_status = 'pending')
       order by created_at desc`,
    );

    return result.rows.map(mapOrderRow);
  }

  const store = await readStore();

  return store.orders
    .filter(
      (order) =>
        order.paymentStatus !== "cancelled" &&
        !(order.paymentMethod === "card" && order.paymentStatus === "pending"),
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getOrderById(id: string) {
  if (hasDatabase()) {
    const result = await dbQuery<OrderRow>("select * from orders where id = $1", [id]);

    return result.rows[0] ? mapOrderRow(result.rows[0]) : null;
  }

  const store = await readStore();

  return store.orders.find((order) => order.id === id) ?? null;
}

export async function getOrderByMerchantReference(merchantReference: string) {
  if (hasDatabase()) {
    const result = await dbQuery<OrderRow>(
      "select * from orders where merchant_reference = $1",
      [merchantReference],
    );

    return result.rows[0] ? mapOrderRow(result.rows[0]) : null;
  }

  const store = await readStore();

  return (
    store.orders.find((order) => order.merchantReference === merchantReference) ??
    null
  );
}

export async function createOrder(input: CreateOrderInput) {
  if (hasDatabase()) {
    const issuedAt = new Date();
    const now = issuedAt.toISOString();
    let reserved = false;
    const issueInvoiceNow = input.paymentMethod !== "card";
    const invoiceNumber = issueInvoiceNow ? await nextInvoiceNumberDb(issuedAt) : undefined;
    const order: StoreOrder = {
      ...input,
      noVat: false,
      id: orderId(),
      invoiceNumber,
      invoiceIssuedAt: issueInvoiceNow ? now : undefined,
      invoiceDueAt: issueInvoiceNow ? invoiceDueAt({ ...input, noVat: false }, issuedAt) : undefined,
      paymentStatus: "pending",
      orderStatus: input.paymentMethod === "card" ? "awaiting_payment" : "pending",
      shippingStatus: input.shippingType === "self_pickup" ? "ready_for_pickup" : "pending",
      shippingPrice: roundMoney(input.shippingPrice),
      totals: {
        ...input.totals,
        subtotal: roundMoney(input.totals.subtotal),
        vat: roundMoney(input.totals.vat),
        shipping: roundMoney(input.totals.shipping),
        total: roundMoney(input.totals.total),
      },
      stockAdjusted: false,
      createdAt: now,
      updatedAt: now,
    };

    try {
      reserved = await reserveInventory(input.lines, { orderId: order.id, note: "order_created" });
      await insertOrderDb(order);
      return order;
    } catch (error) {
      if (reserved) {
        await releaseInventoryReservation(input.lines, {
          orderId: order.id,
          note: "order_create_failed",
        }).catch(() => undefined);
      }

      throw error;
    }
  }

  const store = await readStore();
  const issuedAt = new Date();
  const now = issuedAt.toISOString();
  let reserved = false;
  const issueInvoiceNow = input.paymentMethod !== "card";
  const order: StoreOrder = {
    ...input,
    id: orderId(),
    invoiceNumber: issueInvoiceNow ? nextInvoiceNumber(store.orders, issuedAt) : undefined,
    invoiceIssuedAt: issueInvoiceNow ? now : undefined,
    invoiceDueAt: issueInvoiceNow ? invoiceDueAt(input, issuedAt) : undefined,
    paymentStatus: "pending",
    orderStatus: input.paymentMethod === "card" ? "awaiting_payment" : "pending",
    shippingStatus: input.shippingType === "self_pickup" ? "ready_for_pickup" : "pending",
    shippingPrice: roundMoney(input.shippingPrice),
    totals: {
      ...input.totals,
      subtotal: roundMoney(input.totals.subtotal),
      vat: roundMoney(input.totals.vat),
      shipping: roundMoney(input.totals.shipping),
      total: roundMoney(input.totals.total),
    },
    stockAdjusted: false,
    createdAt: now,
    updatedAt: now,
  };

  try {
    reserved = await reserveInventory(input.lines, { orderId: order.id, note: "order_created" });
    store.orders = [order, ...store.orders];
    await writeStore(store);
    return order;
  } catch (error) {
    if (reserved) {
      await releaseInventoryReservation(input.lines, {
        orderId: order.id,
        note: "order_create_failed",
      }).catch(() => undefined);
    }

    throw error;
  }
}

export async function updateOrder(
  id: string,
  patch: Partial<Omit<StoreOrder, "id" | "createdAt">>,
): Promise<StoreOrder | null> {
  if (hasDatabase()) {
    const order = await getOrderById(id);

    if (!order) {
      return null;
    }

    const updated: StoreOrder = {
      ...order,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    await upsertOrderDb(updated);
    if (patch.paymentStatus && patch.paymentStatus !== order.paymentStatus) {
      await recordPaymentStatusChange(updated, order.paymentStatus, patch.paymentStatus);
    }
    if (patch.orderStatus && patch.orderStatus !== order.orderStatus) {
      await recordOrderStatusChange(updated, order.orderStatus, patch.orderStatus);
    }

    return updated;
  }

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

async function recordPaymentStatusChange(
  order: StoreOrder,
  previousStatus: OrderPaymentStatus,
  nextStatus: OrderPaymentStatus,
) {
  if (!hasDatabase()) {
    return;
  }

  try {
    await dbQuery(
      `insert into payment_status_history (
        id, order_id, provider, previous_status, next_status, provider_payment_id, payload
       ) values ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
      [
        `payhist-${Date.now().toString(36)}-${randomBytes(6).toString("hex")}`,
        order.id,
        "montonio",
        previousStatus,
        nextStatus,
        order.montonioOrderUuid ?? null,
        JSON.stringify({
          merchantReference: order.merchantReference,
          paymentMethod: order.paymentMethod,
        }),
      ],
    );
  } catch (error) {
    console.error("Payment status history write failed", error);
  }
}

async function recordOrderStatusChange(
  order: StoreOrder,
  previousStatus: StoreOrderStatus | undefined,
  nextStatus: StoreOrderStatus,
) {
  if (!hasDatabase()) {
    return;
  }

  try {
    await dbQuery(
      `insert into order_status_history (
        id, order_id, previous_status, next_status, note
       ) values ($1,$2,$3,$4,$5)`,
      [
        `ordhist-${Date.now().toString(36)}-${randomBytes(6).toString("hex")}`,
        order.id,
        previousStatus ?? null,
        nextStatus,
        "order_updated",
      ],
    );
  } catch (error) {
    console.error("Order status history write failed", error);
  }
}

export async function updateOrderByMerchantReference(
  merchantReference: string,
  patch: Partial<Omit<StoreOrder, "id" | "createdAt">>,
) {
  const order = await getOrderByMerchantReference(merchantReference);

  return order ? updateOrder(order.id, patch) : null;
}

export async function ensureInvoiceForOrder(order: StoreOrder) {
  if (order.invoiceNumber && order.invoiceIssuedAt) {
    return order;
  }

  const issuedAt = new Date();
  const invoiceNumber = hasDatabase()
    ? await nextInvoiceNumberDb(issuedAt)
    : nextInvoiceNumber((await readStore()).orders, issuedAt);
  const invoiceIssuedAt = issuedAt.toISOString();
  const invoiceDueAtValue = invoiceDueAt(order, issuedAt);
  const updated = await updateOrder(order.id, {
    invoiceNumber,
    invoiceIssuedAt,
    invoiceDueAt: invoiceDueAtValue,
  });
  const invoiceOrder = updated ?? {
    ...order,
    invoiceNumber,
    invoiceIssuedAt,
    invoiceDueAt: invoiceDueAtValue,
  };

  if (hasDatabase()) {
    await insertInvoiceDb(invoiceOrder);
  }

  return invoiceOrder;
}

export async function cleanupPendingCardOrders(maxAgeMinutes?: number) {
  const ageMinutes =
    maxAgeMinutes ??
    Math.max(5, Number(process.env.PENDING_CARD_ORDER_TTL_MINUTES || 45) || 45);
  const cutoff = new Date(Date.now() - ageMinutes * 60 * 1000);

  if (hasDatabase()) {
    const result = await dbQuery<{ id: string }>(
      `select id from orders
       where payment_method = 'card'
         and payment_status = 'pending'
         and created_at < $1
       limit 100`,
      [cutoff.toISOString()],
    );
    let cancelled = 0;

    for (const row of result.rows) {
      if (await cancelPendingCardOrder({ id: row.id })) {
        cancelled += 1;
      }
    }

    return cancelled;
  }

  const store = await readStore();
  let cancelled = 0;

  for (const order of store.orders) {
    if (
      order.paymentMethod === "card" &&
      order.paymentStatus === "pending" &&
      new Date(order.createdAt).getTime() < cutoff.getTime() &&
      await cancelPendingCardOrder({ id: order.id })
    ) {
      cancelled += 1;
    }
  }

  return cancelled;
}

export async function cancelPendingCardOrder(input: {
  id?: string;
  merchantReference?: string;
}): Promise<StoreOrder | null> {
  if (hasDatabase()) {
    const order = input.id
      ? await getOrderById(input.id)
      : input.merchantReference
        ? await getOrderByMerchantReference(input.merchantReference)
        : null;

    if (
      !order ||
      (input.merchantReference && order.merchantReference !== input.merchantReference) ||
      order.paymentMethod !== "card" ||
      order.paymentStatus !== "pending"
    ) {
      return null;
    }

    const stockRestored = order.stockAdjusted
      ? await restoreInventory(order.lines, { orderId: order.id, note: "card_order_cancelled" })
      : await releaseInventoryReservation(order.lines, { orderId: order.id, note: "card_order_cancelled" });

    return updateOrder(order.id, {
      paymentStatus: "cancelled",
      orderStatus: "cancelled",
      shippingStatus: "failed",
      shippingError: "Payment checkout was interrupted before completion.",
      stockAdjusted: order.stockAdjusted && stockRestored ? false : order.stockAdjusted,
    });
  }

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
        ? await restoreInventory(order.lines, { orderId: order.id, note: "card_order_cancelled" })
        : await releaseInventoryReservation(order.lines, { orderId: order.id, note: "card_order_cancelled" });

      cancelled = {
        ...order,
        paymentStatus: "cancelled",
        orderStatus: "cancelled",
        shippingStatus: "failed",
        shippingError: "Payment checkout was interrupted before completion.",
        stockAdjusted: order.stockAdjusted && stockRestored ? false : order.stockAdjusted,
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

type OrderRow = {
  id: string;
  merchant_reference: string;
  montonio_order_uuid: string | null;
  payment_url: string | null;
  invoice_number: string | null;
  invoice_issued_at: Date | string | null;
  invoice_due_at: Date | string | null;
  payment_method: OrderPaymentMethod;
  payment_status: OrderPaymentStatus;
  order_status: StoreOrderStatus | null;
  no_vat: boolean;
  language: StoreOrder["language"] | null;
  customer: OrderCustomer;
  lines: OrderLine[];
  totals: OrderTotals;
  shipping_carrier: string;
  shipping_method: string;
  shipping_method_name: string;
  shipping_type: OrderShippingType;
  pickup_point_id: string | null;
  pickup_point_name: string | null;
  shipping_address: ShippingAddress | null;
  shipping_price: string | number;
  shipment_id: string | null;
  carrier_shipment_id: string | null;
  tracking_number: string | null;
  tracking_link: string | null;
  label_url: string | null;
  label_file_id: string | null;
  label_status: string | null;
  shipping_status: OrderShippingStatus;
  shipping_error: string | null;
  stock_adjusted: boolean;
  order_email_sent: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

function dateIso(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function mapOrderRow(row: OrderRow): StoreOrder {
  return {
    id: row.id,
    merchantReference: row.merchant_reference,
    montonioOrderUuid: row.montonio_order_uuid ?? undefined,
    paymentUrl: row.payment_url ?? undefined,
    invoiceNumber: row.invoice_number ?? undefined,
    invoiceIssuedAt: dateIso(row.invoice_issued_at),
    invoiceDueAt: dateIso(row.invoice_due_at),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    orderStatus: row.order_status ?? undefined,
    noVat: false,
    language: row.language ?? undefined,
    customer: row.customer,
    lines: row.lines,
    totals: row.totals,
    shippingCarrier: row.shipping_carrier,
    shippingMethod: row.shipping_method,
    shippingMethodName: row.shipping_method_name,
    shippingType: row.shipping_type,
    pickupPointId: row.pickup_point_id ?? undefined,
    pickupPointName: row.pickup_point_name ?? undefined,
    shippingAddress: row.shipping_address ?? undefined,
    shippingPrice: Number(row.shipping_price),
    shipmentId: row.shipment_id ?? undefined,
    carrierShipmentId: row.carrier_shipment_id ?? undefined,
    trackingNumber: row.tracking_number ?? undefined,
    trackingLink: row.tracking_link ?? undefined,
    labelUrl: row.label_url ?? undefined,
    labelFileId: row.label_file_id ?? undefined,
    labelStatus: row.label_status ?? undefined,
    shippingStatus: row.shipping_status,
    shippingError: row.shipping_error ?? undefined,
    stockAdjusted: row.stock_adjusted,
    orderEmailSent: row.order_email_sent,
    createdAt: dateIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: dateIso(row.updated_at) ?? new Date().toISOString(),
  };
}

async function nextInvoiceNumberDb(issuedAt: Date) {
  const year = issuedAt.getFullYear();
  const prefix = `KG-${year}-`;
  const result = await dbQuery<{ max_number: number | null }>(
    `select max(nullif(regexp_replace(invoice_number, '^${prefix}', ''), '')::integer) as max_number
     from orders
     where invoice_number like $1`,
    [`${prefix}%`],
  );
  const next = Number(result.rows[0]?.max_number ?? 0) + 1;

  return `${prefix}${String(next).padStart(5, "0")}`;
}

async function insertOrderDb(order: StoreOrder) {
  await upsertOrderDb(order);

  if (order.invoiceNumber) {
    await insertInvoiceDb(order);
  }

  await dbQuery(
    `insert into payments (
      id, order_id, provider, provider_payment_id, status, amount, currency, data
    ) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
    on conflict (id) do update
    set status = excluded.status, amount = excluded.amount, data = excluded.data, updated_at = now()`,
    [
      `pay-${order.id}`,
      order.id,
      order.paymentMethod === "card" ? "montonio" : "invoice",
      order.montonioOrderUuid,
      order.paymentStatus,
      order.totals.total,
      order.totals.currency,
      JSON.stringify({ paymentMethod: order.paymentMethod }),
    ],
  );
  await dbQuery(
    `insert into shipping_shipments (
      id, order_id, carrier, method, type, status, pickup_point_id,
      pickup_point_name, address, price, tracking_number, tracking_link,
      label_url, label_file_id, data
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,$15::jsonb)
    on conflict (id) do update
    set status = excluded.status,
        tracking_number = excluded.tracking_number,
        tracking_link = excluded.tracking_link,
        label_url = excluded.label_url,
        label_file_id = excluded.label_file_id,
        data = excluded.data,
        updated_at = now()`,
    [
      `ship-${order.id}`,
      order.id,
      order.shippingCarrier,
      order.shippingMethod,
      order.shippingType,
      order.shippingStatus,
      order.pickupPointId,
      order.pickupPointName,
      JSON.stringify(order.shippingAddress ?? null),
      order.shippingPrice,
      order.trackingNumber,
      order.trackingLink,
      order.labelUrl,
      order.labelFileId,
      JSON.stringify(order),
    ],
  );
}

async function insertInvoiceDb(order: StoreOrder) {
  if (!order.invoiceNumber || !order.invoiceIssuedAt) {
    return;
  }

  await dbQuery(
    `insert into invoices (
      id, order_id, invoice_number, issued_at, due_at, no_vat, total, currency, data
    ) values ($1,$2,$3,$4,$5,false,$6,$7,$8::jsonb)
    on conflict (invoice_number) do nothing`,
    [
      `inv-${order.id}`,
      order.id,
      order.invoiceNumber,
      order.invoiceIssuedAt,
      order.invoiceDueAt,
      order.totals.total,
      order.totals.currency,
      JSON.stringify(order),
    ],
  );
}

async function upsertOrderDb(order: StoreOrder) {
  await dbQuery(
    `insert into orders (
      id, merchant_reference, montonio_order_uuid, payment_url, invoice_number,
      invoice_issued_at, invoice_due_at, payment_method, payment_status,
      order_status, no_vat, language, customer, lines, totals,
      shipping_carrier, shipping_method, shipping_method_name, shipping_type,
      pickup_point_id, pickup_point_name, shipping_address, shipping_price,
      shipment_id, carrier_shipment_id, tracking_number, tracking_link,
      label_url, label_file_id, label_status, shipping_status, shipping_error,
      stock_adjusted, order_email_sent, created_at, updated_at
    ) values (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false,$11,$12::jsonb,$13::jsonb,$14::jsonb,
      $15,$16,$17,$18,$19,$20,$21::jsonb,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35
    )
    on conflict (id) do update set
      montonio_order_uuid = excluded.montonio_order_uuid,
      payment_url = excluded.payment_url,
      invoice_number = excluded.invoice_number,
      invoice_issued_at = excluded.invoice_issued_at,
      invoice_due_at = excluded.invoice_due_at,
      payment_status = excluded.payment_status,
      order_status = excluded.order_status,
      customer = excluded.customer,
      lines = excluded.lines,
      totals = excluded.totals,
      shipping_carrier = excluded.shipping_carrier,
      shipping_method = excluded.shipping_method,
      shipping_method_name = excluded.shipping_method_name,
      shipping_type = excluded.shipping_type,
      pickup_point_id = excluded.pickup_point_id,
      pickup_point_name = excluded.pickup_point_name,
      shipping_address = excluded.shipping_address,
      shipping_price = excluded.shipping_price,
      shipment_id = excluded.shipment_id,
      carrier_shipment_id = excluded.carrier_shipment_id,
      tracking_number = excluded.tracking_number,
      tracking_link = excluded.tracking_link,
      label_url = excluded.label_url,
      label_file_id = excluded.label_file_id,
      label_status = excluded.label_status,
      shipping_status = excluded.shipping_status,
      shipping_error = excluded.shipping_error,
      stock_adjusted = excluded.stock_adjusted,
      order_email_sent = excluded.order_email_sent,
      updated_at = excluded.updated_at`,
    [
      order.id,
      order.merchantReference,
      order.montonioOrderUuid,
      order.paymentUrl,
      order.invoiceNumber,
      order.invoiceIssuedAt,
      order.invoiceDueAt,
      order.paymentMethod,
      order.paymentStatus,
      order.orderStatus ?? "in_process",
      order.language,
      JSON.stringify(order.customer),
      JSON.stringify(order.lines),
      JSON.stringify(order.totals),
      order.shippingCarrier,
      order.shippingMethod,
      order.shippingMethodName,
      order.shippingType,
      order.pickupPointId,
      order.pickupPointName,
      JSON.stringify(order.shippingAddress ?? null),
      order.shippingPrice,
      order.shipmentId,
      order.carrierShipmentId,
      order.trackingNumber,
      order.trackingLink,
      order.labelUrl,
      order.labelFileId,
      order.labelStatus,
      order.shippingStatus,
      order.shippingError,
      Boolean(order.stockAdjusted),
      Boolean(order.orderEmailSent),
      order.createdAt,
      order.updatedAt,
    ],
  );

  await dbQuery(
    `update payments
     set provider_payment_id = $2,
         status = $3,
         amount = $4,
         data = $5::jsonb,
         updated_at = now()
     where order_id = $1`,
    [
      order.id,
      order.montonioOrderUuid,
      order.paymentStatus,
      order.totals.total,
      JSON.stringify({ paymentMethod: order.paymentMethod }),
    ],
  );

  await dbQuery(
    `update shipping_shipments
     set status = $2,
         tracking_number = $3,
         tracking_link = $4,
         label_url = $5,
         label_file_id = $6,
         data = $7::jsonb,
         updated_at = now()
     where order_id = $1`,
    [
      order.id,
      order.shippingStatus,
      order.trackingNumber,
      order.trackingLink,
      order.labelUrl,
      order.labelFileId,
      JSON.stringify(order),
    ],
  );
}
