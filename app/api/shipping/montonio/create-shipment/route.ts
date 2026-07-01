import { createShipmentForOrder } from "../../../../../lib/montonio-shipping";
import { getOrderById, getOrderByMerchantReference, updateOrder } from "../../../../../lib/orders";

export const runtime = "nodejs";

type CreateShipmentPayload = {
  orderId?: string;
  merchantReference?: string;
};

export async function POST(request: Request) {
  let payload: CreateShipmentPayload;

  try {
    payload = (await request.json()) as CreateShipmentPayload;
  } catch {
    return Response.json({ error: "Invalid shipment payload." }, { status: 400 });
  }

  const order = payload.orderId
    ? await getOrderById(payload.orderId)
    : payload.merchantReference
      ? await getOrderByMerchantReference(payload.merchantReference)
      : null;

  if (!order) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.shipmentId) {
    return Response.json({ order, shipmentId: order.shipmentId });
  }

  try {
    const shipment = await createShipmentForOrder(order);
    const updated = await updateOrder(order.id, {
      ...shipment,
      shippingStatus: "shipment_created",
      shippingError: undefined,
    });

    return Response.json({ order: updated, shipment });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create Montonio shipment.";

    await updateOrder(order.id, {
      shippingStatus: "failed",
      shippingError: message,
    });

    return Response.json({ error: message }, { status: 502 });
  }
}
