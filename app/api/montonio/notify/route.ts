import { verifyMontonioJwt } from "../../../../lib/montonio";
import {
  createLabelForShipment,
  createShipmentForOrder,
} from "../../../../lib/montonio-shipping";
import {
  getOrderByMerchantReference,
  updateOrder,
  type StoreOrder,
} from "../../../../lib/orders";
import { sendOrderEmails } from "../../../../lib/email";
import { decrementInventory } from "../../../../lib/inventory";

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

async function sendPaidOrderEmailOnce(order: StoreOrder) {
  if (order.orderEmailSent) {
    return false;
  }

  try {
    await sendOrderEmails(order);
    await updateOrder(order.id, { orderEmailSent: true });
    return true;
  } catch (error) {
    console.error("Paid order email sending failed", error);
    return false;
  }
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
        let updated = await updateOrder(order.id, {
          paymentStatus: paid ? "paid" : order.paymentStatus,
          orderStatus: paid ? "paid" : order.orderStatus,
          montonioOrderUuid: payload.uuid || payload.orderUuid || order.montonioOrderUuid,
        });

        if (paid && updated && !updated.stockAdjusted) {
          const stockAdjusted = await decrementInventory(updated.lines);

          updated = await updateOrder(updated.id, { stockAdjusted }) ?? updated;
        }

        if (paid && updated) {
          await sendPaidOrderEmailOnce(updated);
        }

        if (
          paid &&
          updated &&
          updated.shippingStatus !== "label_created" &&
          !updated.labelUrl
        ) {
          if (updated.shippingType === "self_pickup") {
            await updateOrder(updated.id, {
              shippingStatus: "ready_for_pickup",
              shippingError: undefined,
            });
            return Response.json({
              ok: true,
              merchantReference: payload.merchantReference,
              paymentStatus,
              shipment: "self_pickup",
              label,
            });
          }

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
                orderStatus: "shipped",
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
