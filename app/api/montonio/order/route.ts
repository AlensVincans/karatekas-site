import { roundMoney, signMontonioJwt } from "../../../../lib/montonio";

type CheckoutLine = {
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
  };
  delivery?: {
    name?: string;
    price?: number;
  };
  language?: "ru" | "lv" | "en";
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
  if (language === "lv" || language === "ru" || language === "en") {
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

  return montonioEnv.MONTONIO_ENV === "sandbox" ? sandboxApiBase : productionApiBase;
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
  const deliveryPrice = positiveMoney(payload.delivery?.price);
  const vat = payload.noVat ? 0 : positiveMoney(payload.totals?.vat);
  const lineItems = [...productLines];

  if (deliveryPrice > 0) {
    lineItems.push({
      name: cleanText(payload.delivery?.name, "Delivery"),
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

  return Response.json({
    merchantReference: reference,
    orderUuid: result.uuid,
    paymentUrl: result.paymentUrl,
  });
}
