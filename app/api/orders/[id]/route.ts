import {
  getOrderById,
  updateOrder,
  type OrderPaymentStatus,
  type OrderShippingStatus,
  type StoreOrderStatus,
} from "../../../../lib/orders";

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
  trackingNumber?: string;
  trackingLink?: string;
  labelUrl?: string;
  labelFileId?: string;
};

function cleanOptional(value: unknown) {
  return typeof value === "string" ? value.trim() || undefined : undefined;
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

  const patch: OrderPatchPayload = {};

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
