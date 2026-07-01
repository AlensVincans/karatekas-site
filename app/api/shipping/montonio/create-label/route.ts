import { createLabelForShipment } from "../../../../../lib/montonio-shipping";
import { getOrderById, getOrderByMerchantReference, updateOrder } from "../../../../../lib/orders";

export const runtime = "nodejs";

type CreateLabelPayload = {
  orderId?: string;
  merchantReference?: string;
  shipmentId?: string;
};

export async function POST(request: Request) {
  let payload: CreateLabelPayload;

  try {
    payload = (await request.json()) as CreateLabelPayload;
  } catch {
    return Response.json({ error: "Invalid label payload." }, { status: 400 });
  }

  const order = payload.orderId
    ? await getOrderById(payload.orderId)
    : payload.merchantReference
      ? await getOrderByMerchantReference(payload.merchantReference)
      : null;
  const shipmentId = payload.shipmentId || order?.shipmentId;

  if (!shipmentId) {
    return Response.json({ error: "Shipment is not created yet." }, { status: 400 });
  }

  try {
    const label = await createLabelForShipment(shipmentId);
    const updated = order
      ? await updateOrder(order.id, {
          ...label,
          shippingError: undefined,
        })
      : null;

    return Response.json({ order: updated, label });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create Montonio label.";

    if (order) {
      await updateOrder(order.id, {
        shippingStatus: "failed",
        shippingError: message,
      });
    }

    return Response.json({ error: message }, { status: 502 });
  }
}
