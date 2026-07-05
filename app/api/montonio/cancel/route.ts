import { cancelPendingCardOrder } from "../../../../lib/orders";

export const runtime = "nodejs";

type CancelPayload = {
  orderId?: string;
  merchantReference?: string;
};

export async function POST(request: Request) {
  let payload: CancelPayload;

  try {
    payload = (await request.json()) as CancelPayload;
  } catch {
    return Response.json({ ok: false, error: "Invalid cancel payload." }, { status: 400 });
  }

  const orderId = payload.orderId?.trim();
  const merchantReference = payload.merchantReference?.trim();

  if (!orderId || !merchantReference) {
    return Response.json(
      { ok: false, error: "Order id and merchant reference are required." },
      { status: 400 },
    );
  }

  const order = await cancelPendingCardOrder({ id: orderId, merchantReference });

  return Response.json({
    ok: true,
    cancelled: order?.paymentStatus === "cancelled",
  });
}
