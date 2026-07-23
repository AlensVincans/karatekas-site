import { montonioLineItems, resolveCheckoutInput } from "../../../../lib/checkout-server";
import { roundMoney, signMontonioJwt } from "../../../../lib/montonio";
import {
  cancelPendingCardOrder,
  cleanupPendingCardOrders,
  createOrder,
  updateOrder,
} from "../../../../lib/orders";
import { rateLimit } from "../../../../lib/rate-limit";
import { authErrorResponse, requireUser } from "../../../../lib/server-auth";

type MontonioOrderResponse = {
  uuid?: string;
  paymentUrl?: string;
  message?: string;
  error?: string;
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

function orderReference() {
  return `KG-${Date.now().toString(36).toUpperCase()}`;
}

function localeFor(language: unknown) {
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
  const configured = montonioEnv.MONTONIO_SITE_URL?.trim() || montonioEnv.APP_URL?.trim();

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

export async function POST(request: Request) {
  const limited = rateLimit(request, {
    key: "payment:create",
    limit: 8,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  const accessKey = montonioEnv.MONTONIO_ACCESS_KEY?.trim();
  const secretKey = montonioEnv.MONTONIO_SECRET_KEY?.trim();

  if (!accessKey || !secretKey) {
    return Response.json(
      { error: "Payment is not configured. Please contact store administrator." },
      { status: 500 },
    );
  }

  await cleanupPendingCardOrders().catch((error) => {
    console.error("Pending card order cleanup failed", error);
  });

  let user;

  try {
    user = await requireUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid checkout payload." }, { status: 400 });
  }

  const reference = orderReference();
  const resolved = await resolveCheckoutInput(payload, user, reference, "card").catch(
    (error) => error,
  );

  if (resolved instanceof Error) {
    return Response.json({ error: resolved.message }, { status: 400 });
  }

  const localOrder = await createOrder(resolved.input);
  const origin = getOrigin(request);
  const { firstName, lastName } = splitName(user.name);
  const country = cleanText(montonioEnv.MONTONIO_COUNTRY, defaultCountry);
  const postalCode = cleanText(montonioEnv.MONTONIO_POSTAL_CODE, defaultPostalCode);
  const now = Math.floor(Date.now() / 1000);
  const grandTotal = roundMoney(resolved.input.totals.total);

  const order = {
    accessKey,
    merchantReference: reference,
    returnUrl: `${origin}/payment/return`,
    notificationUrl: `${origin}/api/montonio/notify`,
    currency: "EUR",
    grandTotal,
    locale: localeFor(resolved.input.language),
    billingAddress: {
      firstName,
      lastName,
      email: user.email,
      addressLine1: cleanText(montonioEnv.MONTONIO_ADDRESS_LINE1, "Online order"),
      locality: cleanText(montonioEnv.MONTONIO_LOCALITY, "Riga"),
      region: cleanText(montonioEnv.MONTONIO_REGION, "Riga"),
      country,
      postalCode,
    },
    shippingAddress: {
      firstName,
      lastName,
      email: user.email,
      addressLine1: cleanText(montonioEnv.MONTONIO_ADDRESS_LINE1, "Online order"),
      locality: cleanText(montonioEnv.MONTONIO_LOCALITY, "Riga"),
      region: cleanText(montonioEnv.MONTONIO_REGION, "Riga"),
      country,
      postalCode,
    },
    lineItems: montonioLineItems(resolved.input),
    payment: {
      method: "cardPayments",
      methodDisplay: "Card / Apple Pay / Google Pay",
      amount: grandTotal,
      currency: "EUR",
    },
    iat: now,
    exp: now + 10 * 60,
  };

  let response: Response;
  let result: MontonioOrderResponse;

  try {
    const token = await signMontonioJwt(order, secretKey);
    response = await fetch(`${apiBaseUrl()}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: token }),
    });
    result = (await response.json().catch(() => ({}))) as MontonioOrderResponse;
  } catch (error) {
    await cancelPendingCardOrder({ id: localOrder.id, merchantReference: reference });

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not open payment. Please try again.",
      },
      { status: 502 },
    );
  }

  if (!response.ok || !result.paymentUrl) {
    await cancelPendingCardOrder({ id: localOrder.id, merchantReference: reference });

    return Response.json(
      {
        error:
          result.message ||
          result.error ||
          "Could not open payment. Please try again.",
      },
      { status: response.status || 502 },
    );
  }

  const updatedOrder = await updateOrder(localOrder.id, {
    montonioOrderUuid: result.uuid,
    paymentUrl: result.paymentUrl,
  });

  return Response.json({
    orderId: updatedOrder?.id ?? localOrder.id,
    merchantReference: reference,
    orderUuid: result.uuid,
    paymentUrl: result.paymentUrl,
    emailSent: false,
  });
}
