import { verifyMontonioJwt } from "../../../../lib/montonio";
import {
  createLabelForShipment,
  createShipmentForOrder,
} from "../../../../lib/montonio-shipping";
import {
  getOrderByMerchantReference,
  updateOrder,
} from "../../../../lib/orders";

type MontonioReturnPayload = {
  merchantReference?: string;
  uuid?: string;
  orderUuid?: string;
  paymentStatus?: string;
  payment_status?: string;
};

const montonioEnv = process.env;

export const runtime = "nodejs";

function tokenFromObject(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const token =
    record["order-token"] ?? record.orderToken ?? record.token ?? record.data;

  return typeof token === "string" ? token : null;
}

async function readOrderToken(request: Request) {
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("order-token");

  if (queryToken) {
    return queryToken;
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return tokenFromObject(await request.json().catch(() => null));
  }

  const body = await request.text().catch(() => "");

  if (body.startsWith("eyJ")) {
    return body;
  }

  return new URLSearchParams(body).get("order-token");
}

export async function POST(request: Request) {
  const token = await readOrderToken(request);
  const secretKey = montonioEnv.MONTONIO_SECRET_KEY?.trim();

  if (!token) {
    return Response.json({ ok: true });
  }

  if (!secretKey) {
    return Response.json(
      { ok: false, error: "Montonio secret is not configured." },
      { status: 500 },
    );
  }

  try {
    const payload = await verifyMontonioJwt<MontonioReturnPayload>(token, secretKey);
    const paymentStatus = payload.paymentStatus ?? payload.payment_status ?? null;
    const paid = paymentStatus?.toLowerCase() === "paid";
    let shipment: unknown = null;
    let label: unknown = null;

    if (payload.merchantReference) {
      const order = await getOrderByMerchantReference(payload.merchantReference);

      if (order) {
        const updated = await updateOrder(order.id, {
          paymentStatus: paid ? "paid" : order.paymentStatus,
          montonioOrderUuid: payload.uuid || payload.orderUuid || order.montonioOrderUuid,
        });

        if (
          paid &&
          updated &&
          updated.shippingStatus !== "label_created" &&
          !updated.labelUrl
        ) {
          try {
            const shipmentPatch = updated.shipmentId
              ? { shipmentId: updated.shipmentId }
              : await createShipmentForOrder(updated);
            const withShipment = await updateOrder(updated.id, {
              ...shipmentPatch,
              shippingStatus: "shipment_created",
              shippingError: undefined,
            });

            shipment = shipmentPatch;

            if (withShipment?.shipmentId) {
              const labelPatch = await createLabelForShipment(withShipment.shipmentId);

              label = labelPatch;
              await updateOrder(withShipment.id, {
                ...labelPatch,
                shippingError: undefined,
              });
            }
          } catch (error) {
            await updateOrder(updated.id, {
              shippingStatus: "failed",
              shippingError:
                error instanceof Error
                  ? error.message
                  : "Could not create Montonio shipment.",
            });
          }
        }
      }
    }

    return Response.json({
      ok: true,
      merchantReference: payload.merchantReference,
      paymentStatus,
      shipment,
      label,
    });
  } catch {
    return Response.json(
      { ok: false, error: "Invalid Montonio token." },
      { status: 400 },
    );
  }
}
