import { roundMoney, signMontonioJwt } from "../../../../lib/montonio";
import { createOrder, updateOrder, type OrderShippingType } from "../../../../lib/orders";
import { sendOrderEmails } from "../../../../lib/email";

type CheckoutLine = {
  productId?: string;
  variationId?: string;
  productName?: string;
  variationName?: string;
  sku?: string;
  quantity?: number;
  unitPrice?: number;
};

type CheckoutPayload = {
  customer?: {
    name?: string;
    email?: string;
    company?: string;
    role?: string;
  };
  delivery?: {
    name?: string;
    price?: number;
  };
  shipping?: {
    carrier?: string;
    carrierCode?: string;
    method?: string;
    methodName?: string;
    type?: "pickupPoint" | "courier" | "selfPickup";
    shippingType?: OrderShippingType;
    pickupPointId?: string;
    pickupPointName?: string;
    address?: {
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
    price?: number;
  };
  language?: "ru" | "lv" | "en" | "et" | "lt";
  lines?: CheckoutLine[];
  noVat?: boolean;
  totals?: {
    vat?: number;
  };
};

const montonioEnv = process.env;
const defaultCountry = "LV";
const defaultPostalCode = "LV-1001";
const productionApiBase = "https://stargate.montonio.com/api";
const sandboxApiBase = "https://sandbox-stargate.montonio.com/api";

export const runtime = "nodejs";

function cleanText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function positiveMoney(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? roundMoney(value)
    : 0;
}

function orderReference() {
  return `KG-${Date.now().toString(36).toUpperCase()}`;
}

function localeFor(language: CheckoutPayload["language"]) {
  if (
    language === "lv" ||
    language === "ru" ||
    language === "en" ||
    language === "et" ||
    language === "lt"
  ) {
    return language;
  }

  return "en";
}

function splitName(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "Customer";
  const lastName = parts.slice(1).join(" ") || "Karatekas";

  return { firstName, lastName };
}

function getOrigin(request: Request) {
  const configured = montonioEnv.MONTONIO_SITE_URL?.trim();

  if (configured) {
    return configured.replace(/\/+$/g, "");
  }

  const url = new URL(request.url);
  return url.origin;
}

function apiBaseUrl() {
  if (montonioEnv.MONTONIO_API_BASE_URL?.trim()) {
    return montonioEnv.MONTONIO_API_BASE_URL.trim().replace(/\/+$/g, "");
  }

  return montonioEnv.MONTONIO_ENV?.trim().toLowerCase() === "production"
    ? productionApiBase
    : sandboxApiBase;
}

function buildLineItems(payload: CheckoutPayload) {
  const productLines = (payload.lines ?? [])
    .map((line) => {
      const quantity =
        typeof line.quantity === "number" && Number.isFinite(line.quantity)
          ? Math.max(1, Math.min(99, Math.floor(line.quantity)))
          : 1;
      const finalPrice = positiveMoney(line.unitPrice);
      const name = [
        cleanText(line.productName, "Karate product"),
        cleanText(line.variationName, ""),
        cleanText(line.sku, ""),
      ]
        .filter(Boolean)
        .join(" · ")
        .slice(0, 180);

      return finalPrice > 0 ? { name, quantity, finalPrice } : null;
    })
    .filter((line): line is { name: string; quantity: number; finalPrice: number } =>
      Boolean(line),
    );

  const subtotal = roundMoney(
    productLines.reduce((sum, line) => sum + line.finalPrice * line.quantity, 0),
  );
  const deliveryPrice = positiveMoney(payload.shipping?.price ?? payload.delivery?.price);
  const vat = payload.noVat ? 0 : positiveMoney(payload.totals?.vat);
  const lineItems = [...productLines];

  if (deliveryPrice > 0) {
    lineItems.push({
      name: cleanText(payload.shipping?.methodName ?? payload.delivery?.name, "Delivery"),
      quantity: 1,
      finalPrice: deliveryPrice,
    });
  }

  if (vat > 0) {
    lineItems.push({
      name: "PVN 21%",
      quantity: 1,
      finalPrice: vat,
    });
  }

  return {
    lineItems,
    grandTotal: roundMoney(subtotal + deliveryPrice + vat),
  };
}

function checkoutLines(payload: CheckoutPayload) {
  return (payload.lines ?? []).map((line) => {
    const quantity =
      typeof line.quantity === "number" && Number.isFinite(line.quantity)
        ? Math.max(1, Math.min(99, Math.floor(line.quantity)))
        : 1;
    const unitPrice = positiveMoney(line.unitPrice);

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
}

function shippingType(payload: CheckoutPayload): OrderShippingType {
  if (payload.shipping?.shippingType) {
    return payload.shipping.shippingType;
  }

  if (payload.shipping?.type === "selfPickup") {
    return "self_pickup";
  }

  return payload.shipping?.type === "courier" ? "courier" : "parcel_machine";
}

export async function POST(request: Request) {
  const accessKey = montonioEnv.MONTONIO_ACCESS_KEY?.trim();
  const secretKey = montonioEnv.MONTONIO_SECRET_KEY?.trim();

  if (!accessKey || !secretKey) {
    return Response.json(
      { error: "Montonio keys are not configured on the server." },
      { status: 500 },
    );
  }

  let payload: CheckoutPayload;

  try {
    payload = (await request.json()) as CheckoutPayload;
  } catch {
    return Response.json({ error: "Invalid checkout payload." }, { status: 400 });
  }

  const { lineItems, grandTotal } = buildLineItems(payload);

  if (!lineItems.length || grandTotal <= 0) {
    return Response.json({ error: "Cart is empty." }, { status: 400 });
  }

  const reference = orderReference();
  const origin = getOrigin(request);
  const name = cleanText(
    payload.customer?.company || payload.customer?.name,
    "Karatekas customer",
  );
  const email = cleanText(payload.customer?.email, "customer@example.com");
  const { firstName, lastName } = splitName(name);
  const country = cleanText(montonioEnv.MONTONIO_COUNTRY, defaultCountry);
  const postalCode = cleanText(montonioEnv.MONTONIO_POSTAL_CODE, defaultPostalCode);
  const now = Math.floor(Date.now() / 1000);
  const orderLines = checkoutLines(payload);
  const subtotal = roundMoney(orderLines.reduce((sum, line) => sum + line.total, 0));
  const shippingPrice = positiveMoney(payload.shipping?.price ?? payload.delivery?.price);
  const vat = payload.noVat ? 0 : positiveMoney(payload.totals?.vat);
  const localOrder = await createOrder({
    merchantReference: reference,
    paymentMethod: "card",
    noVat: Boolean(payload.noVat),
    language: localeFor(payload.language),
    customer: {
      name,
      email,
      company: payload.customer?.company,
      role: payload.customer?.role,
    },
    lines: orderLines,
    totals: {
      subtotal,
      vat,
      shipping: shippingPrice,
      total: grandTotal,
      currency: "EUR",
    },
    shippingCarrier: cleanText(
      payload.shipping?.carrierCode || payload.shipping?.carrier,
      "omniva",
    ),
    shippingMethod: cleanText(
      payload.shipping?.pickupPointId || payload.shipping?.method,
      "omniva-parcel-machine",
    ),
    shippingMethodName: cleanText(
      payload.shipping?.pickupPointName || payload.shipping?.methodName,
      "Omniva parcel machine",
    ),
    shippingType: shippingType(payload),
    pickupPointId: payload.shipping?.pickupPointId,
    pickupPointName: payload.shipping?.pickupPointName,
    shippingAddress: payload.shipping?.address,
    shippingPrice,
  });

  const order = {
    accessKey,
    merchantReference: reference,
    returnUrl: `${origin}/payment/return`,
    notificationUrl: `${origin}/api/montonio/notify`,
    currency: "EUR",
    grandTotal,
    locale: localeFor(payload.language),
    billingAddress: {
      firstName,
      lastName,
      email,
      addressLine1: cleanText(montonioEnv.MONTONIO_ADDRESS_LINE1, "Online order"),
      locality: cleanText(montonioEnv.MONTONIO_LOCALITY, "Riga"),
      region: cleanText(montonioEnv.MONTONIO_REGION, "Riga"),
      country,
      postalCode,
    },
    shippingAddress: {
      firstName,
      lastName,
      email,
      addressLine1: cleanText(montonioEnv.MONTONIO_ADDRESS_LINE1, "Online order"),
      locality: cleanText(montonioEnv.MONTONIO_LOCALITY, "Riga"),
      region: cleanText(montonioEnv.MONTONIO_REGION, "Riga"),
      country,
      postalCode,
    },
    lineItems,
    payment: {
      method: "cardPayments",
      methodDisplay: "Card / Apple Pay / Google Pay",
      amount: grandTotal,
      currency: "EUR",
      methodOptions: {
        preferredMethod: "wallet",
      },
    },
    iat: now,
    exp: now + 10 * 60,
  };

  const token = await signMontonioJwt(order, secretKey);
  const response = await fetch(`${apiBaseUrl()}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: token }),
  });
  const result = (await response.json().catch(() => ({}))) as {
    uuid?: string;
    paymentUrl?: string;
    message?: string;
    error?: string;
  };

  if (!response.ok || !result.paymentUrl) {
    await updateOrder(localOrder.id, { paymentStatus: "failed" });

    return Response.json(
      {
        error:
          result.message ||
          result.error ||
          "Montonio did not return a payment URL.",
      },
      { status: response.status || 502 },
    );
  }

  const updatedOrder = await updateOrder(localOrder.id, {
    montonioOrderUuid: result.uuid,
    paymentUrl: result.paymentUrl,
  });
  let emailSent = true;

  try {
    await sendOrderEmails(updatedOrder ?? localOrder);
  } catch (error) {
    emailSent = false;
    console.error("Order email sending failed", error);
  }

  return Response.json({
    orderId: localOrder.id,
    merchantReference: reference,
    orderUuid: result.uuid,
    paymentUrl: result.paymentUrl,
    emailSent,
  });
}
