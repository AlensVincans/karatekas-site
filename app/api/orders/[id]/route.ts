import {
  getOrderById,
  updateOrder,
  type OrderLine,
  type OrderPaymentStatus,
  type OrderShippingStatus,
  type OrderTotals,
  type StoreOrder,
  type StoreOrderStatus,
} from "../../../../lib/orders";
import { decrementInventory, restoreInventory } from "../../../../lib/inventory";
import { roundMoney } from "../../../../lib/montonio";

export const runtime = "nodejs";

const orderStatuses: StoreOrderStatus[] = [
  "in_process",
  "paid",
  "shipped",
  "unpaid",
  "completed",
];
const paymentStatuses: OrderPaymentStatus[] = ["pending", "paid", "failed", "cancelled"];
const shippingStatuses: OrderShippingStatus[] = [
  "pending",
  "ready_for_pickup",
  "ready_to_ship",
  "shipment_created",
  "label_created",
  "failed",
];

type OrderPatchPayload = {
  orderStatus?: StoreOrderStatus;
  paymentStatus?: OrderPaymentStatus;
  shippingStatus?: OrderShippingStatus;
  lines?: OrderLine[];
  totals?: Partial<OrderTotals>;
  shippingMethod?: string;
  shippingMethodName?: string;
  pickupPointId?: string;
  pickupPointName?: string;
  shippingPrice?: number;
  trackingNumber?: string;
  trackingLink?: string;
  labelUrl?: string;
  labelFileId?: string;
};

function cleanOptional(value: unknown) {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

function cleanLine(line: Partial<OrderLine>): OrderLine | null {
  const quantity = Math.max(1, Math.floor(Number(line.quantity) || 1));
  const unitPrice = roundMoney(Number(line.unitPrice) || 0);
  const productName = cleanOptional(line.productName);

  if (!productName || unitPrice <= 0) {
    return null;
  }

  return {
    productId: cleanOptional(line.productId),
    variationId: cleanOptional(line.variationId),
    productName,
    variationName: cleanOptional(line.variationName),
    sku: cleanOptional(line.sku),
    quantity,
    unitPrice,
    total: roundMoney(quantity * unitPrice),
  };
}

function totalsFor(lines: OrderLine[], shippingPrice: number): OrderTotals {
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.total, 0));
  const shipping = roundMoney(shippingPrice);
  const vat = roundMoney(subtotal * 0.21);

  return {
    subtotal,
    vat,
    shipping,
    total: roundMoney(subtotal + vat + shipping),
    currency: "EUR",
  };
}

function quantityMap(lines: OrderLine[]) {
  return lines.reduce<Record<string, number>>((result, line) => {
    if (line.variationId) {
      result[line.variationId] = (result[line.variationId] ?? 0) + line.quantity;
    }

    return result;
  }, {});
}

async function syncInventoryDiff(previous: OrderLine[], next: OrderLine[]) {
  const before = quantityMap(previous);
  const after = quantityMap(next);
  const variationIds = new Set([...Object.keys(before), ...Object.keys(after)]);
  const restoreLines: Array<{ variationId: string; quantity: number }> = [];
  const decrementLines: Array<{ variationId: string; quantity: number }> = [];

  variationIds.forEach((variationId) => {
    const diff = (after[variationId] ?? 0) - (before[variationId] ?? 0);

    if (diff > 0) {
      decrementLines.push({ variationId, quantity: diff });
    }

    if (diff < 0) {
      restoreLines.push({ variationId, quantity: Math.abs(diff) });
    }
  });

  if (restoreLines.length) {
    await restoreInventory(restoreLines);
  }

  if (decrementLines.length) {
    await decrementInventory(decrementLines);
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const order = await getOrderById(id);

  if (!order) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }

  return Response.json({ order });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  let payload: OrderPatchPayload;

  try {
    payload = (await request.json()) as OrderPatchPayload;
  } catch {
    return Response.json({ error: "Invalid order payload." }, { status: 400 });
  }

  const patch: Partial<Omit<StoreOrder, "id" | "createdAt">> = {};
  const currentOrder = await getOrderById(id);

  if (!currentOrder) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }

  if (payload.orderStatus) {
    if (!orderStatuses.includes(payload.orderStatus)) {
      return Response.json({ error: "Unsupported order status." }, { status: 400 });
    }

    patch.orderStatus = payload.orderStatus;
  }

  const paymentStatus = cleanOptional(payload.paymentStatus);
  const shippingStatus = cleanOptional(payload.shippingStatus);
  const trackingNumber = cleanOptional(payload.trackingNumber);
  const trackingLink = cleanOptional(payload.trackingLink);
  const labelUrl = cleanOptional(payload.labelUrl);
  const labelFileId = cleanOptional(payload.labelFileId);
  const shippingMethod = cleanOptional(payload.shippingMethod);
  const shippingMethodName = cleanOptional(payload.shippingMethodName);
  const pickupPointId = cleanOptional(payload.pickupPointId);
  const pickupPointName = cleanOptional(payload.pickupPointName);

  if (paymentStatus) {
    if (!paymentStatuses.includes(paymentStatus as OrderPaymentStatus)) {
      return Response.json({ error: "Unsupported payment status." }, { status: 400 });
    }

    patch.paymentStatus = paymentStatus as OrderPaymentStatus;
  }

  if (shippingStatus) {
    if (!shippingStatuses.includes(shippingStatus as OrderShippingStatus)) {
      return Response.json({ error: "Unsupported shipping status." }, { status: 400 });
    }

    patch.shippingStatus = shippingStatus as OrderShippingStatus;
  }
  if (Array.isArray(payload.lines)) {
    const lines = payload.lines.map(cleanLine).filter((line): line is OrderLine => Boolean(line));

    if (!lines.length) {
      return Response.json({ error: "Order must contain at least one product." }, { status: 400 });
    }

    const shippingPrice =
      typeof payload.shippingPrice === "number" && Number.isFinite(payload.shippingPrice)
        ? Math.max(0, payload.shippingPrice)
        : currentOrder.shippingPrice;

    await syncInventoryDiff(currentOrder.lines, lines);
    patch.lines = lines;
    patch.totals = totalsFor(lines, shippingPrice);
    patch.shippingPrice = roundMoney(shippingPrice);
  } else if (payload.totals) {
    patch.totals = {
      ...currentOrder.totals,
      subtotal:
        typeof payload.totals.subtotal === "number"
          ? roundMoney(payload.totals.subtotal)
          : currentOrder.totals.subtotal,
      vat:
        typeof payload.totals.vat === "number"
          ? roundMoney(payload.totals.vat)
          : currentOrder.totals.vat,
      shipping:
        typeof payload.totals.shipping === "number"
          ? roundMoney(payload.totals.shipping)
          : currentOrder.totals.shipping,
      total:
        typeof payload.totals.total === "number"
          ? roundMoney(payload.totals.total)
          : currentOrder.totals.total,
      currency: "EUR",
    };
  }
  if (shippingMethod) patch.shippingMethod = shippingMethod;
  if (shippingMethodName) patch.shippingMethodName = shippingMethodName;
  if (pickupPointId) patch.pickupPointId = pickupPointId;
  if (pickupPointName) patch.pickupPointName = pickupPointName;
  if (typeof payload.shippingPrice === "number" && Number.isFinite(payload.shippingPrice)) {
    patch.shippingPrice = roundMoney(Math.max(0, payload.shippingPrice));
  }
  if (trackingNumber) patch.trackingNumber = trackingNumber;
  if (trackingLink) patch.trackingLink = trackingLink;
  if (labelUrl) patch.labelUrl = labelUrl;
  if (labelFileId) patch.labelFileId = labelFileId;

  const order = await updateOrder(id, patch);

  if (!order) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }

  return Response.json({ order });
}
