import {
  cancelPendingCardOrder,
  getOrderById,
  getOrderByMerchantReference,
} from "../../../../lib/orders";
import { authErrorResponse, isAdmin, requireUser } from "../../../../lib/server-auth";

export const runtime = "nodejs";

type CancelPayload = {
  orderId?: string;
  merchantReference?: string;
};

export async function POST(request: Request) {
  let user;
  let payload: CancelPayload;

  try {
    user = await requireUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  try {
    payload = (await request.json()) as CancelPayload;
  } catch {
    return Response.json({ ok: false, error: "Invalid cancel payload." }, { status: 400 });
  }

  const orderId = payload.orderId?.trim();
  const merchantReference = payload.merchantReference?.trim();

  if (!orderId && !merchantReference) {
    return Response.json(
      { ok: false, error: "Order id or merchant reference is required." },
      { status: 400 },
    );
  }

  const existingOrder = orderId
    ? await getOrderById(orderId)
    : merchantReference
      ? await getOrderByMerchantReference(merchantReference)
      : null;

  if (
    !existingOrder ||
    (!isAdmin(user) &&
      existingOrder.customer.email.toLowerCase() !== user.email.toLowerCase())
  ) {
    return Response.json({ ok: false, error: "Order not found." }, { status: 404 });
  }

  const order = await cancelPendingCardOrder({ id: existingOrder.id, merchantReference });

  return Response.json({
    ok: true,
    cancelled: order?.paymentStatus === "cancelled",
  });
}
