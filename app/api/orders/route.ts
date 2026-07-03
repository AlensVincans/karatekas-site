import { createOrder, listOrders, type CreateOrderInput } from "../../../lib/orders";
import { roundMoney } from "../../../lib/montonio";

export const runtime = "nodejs";

type OrderRequest = Partial<CreateOrderInput> & {
  totals?: Partial<CreateOrderInput["totals"]>;
};

function cleanText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function money(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? roundMoney(value)
    : 0;
}

function orderReference() {
  return `KG-${Date.now().toString(36).toUpperCase()}`;
}

function normalizeOrderInput(payload: OrderRequest): CreateOrderInput {
  const lines = (payload.lines ?? []).map((line) => {
    const quantity = Math.max(1, Math.floor(money(line.quantity) || 1));
    const unitPrice = money(line.unitPrice);

    return {
      productId: line.productId,
      variationId: line.variationId,
      productName: cleanText(line.productName, "Karate product"),
      variationName: line.variationName,
      sku: line.sku,
      quantity,
      unitPrice,
      total: roundMoney(quantity * unitPrice),
    };
  });
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.total, 0));
  const shippingPrice = money(payload.shippingPrice);
  const vat = payload.noVat ? 0 : money(payload.totals?.vat);

  return {
    merchantReference: cleanText(payload.merchantReference, orderReference()),
    montonioOrderUuid: payload.montonioOrderUuid,
    paymentUrl: payload.paymentUrl,
    paymentMethod: payload.paymentMethod === "card" ? "card" : payload.paymentMethod === "defer15" ? "defer15" : "invoice",
    noVat: Boolean(payload.noVat),
    language: payload.language,
    customer: {
      name: cleanText(payload.customer?.name, "Karatekas customer"),
      email: cleanText(payload.customer?.email, "customer@example.com"),
      company: payload.customer?.company,
      role: payload.customer?.role,
    },
    lines,
    totals: {
      subtotal,
      vat,
      shipping: shippingPrice,
      total: roundMoney(subtotal + vat + shippingPrice),
      currency: "EUR",
    },
    shippingCarrier: cleanText(payload.shippingCarrier, "omniva"),
    shippingMethod: cleanText(payload.shippingMethod, "omniva-parcel-machine"),
    shippingMethodName: cleanText(payload.shippingMethodName, "Omniva parcel machine"),
    shippingType: payload.shippingType ?? "parcel_machine",
    pickupPointId: payload.pickupPointId,
    pickupPointName: payload.pickupPointName,
    shippingAddress: payload.shippingAddress,
    shippingPrice,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase();
  const orders = await listOrders();

  return Response.json({
    orders: email
      ? orders.filter((order) => order.customer.email.toLowerCase() === email)
      : orders,
  });
}

export async function POST(request: Request) {
  let payload: OrderRequest;

  try {
    payload = (await request.json()) as OrderRequest;
  } catch {
    return Response.json({ error: "Invalid order payload." }, { status: 400 });
  }

  const input = normalizeOrderInput(payload);

  if (!input.lines.length || input.totals.total <= 0) {
    return Response.json({ error: "Cart is empty." }, { status: 400 });
  }

  const order = await createOrder(input);

  return Response.json({ order });
}
