import { inventoryLevelMap } from "./inventory";
import {
  getPickupPoints,
  getShippingMethods,
  type PickupPoint,
  type ShippingMethodOption,
} from "./montonio-shipping";
import { roundMoney } from "./montonio";
import { isSelfPickupShippingType, oversizedOrderLine } from "./oversized-shipping";
import { getProduct } from "./products-store";
import { pricedVariation } from "./pricing";
import { isApprovedB2B } from "./server-auth";
import {
  type PaymentMethod,
  type Product,
  type UserRole,
  type Variation,
} from "./store-data";
import type { CreateOrderInput, OrderLine, OrderShippingType } from "./orders";
import type { PublicUser } from "./auth-store";

type CheckoutPayloadLine = {
  productId?: unknown;
  variationId?: unknown;
  quantity?: unknown;
};

type CheckoutPayload = {
  language?: "ru" | "lv" | "en" | "et" | "lt";
  lines?: CheckoutPayloadLine[];
  paymentMethod?: PaymentMethod;
  shippingCarrier?: unknown;
  shippingMethod?: unknown;
  shippingMethodName?: unknown;
  shippingType?: OrderShippingType;
  pickupPointId?: unknown;
  pickupPointName?: unknown;
  shippingAddress?: Record<string, unknown>;
  shipping?: {
    carrier?: unknown;
    carrierCode?: unknown;
    method?: unknown;
    methodName?: unknown;
    type?: unknown;
    shippingType?: OrderShippingType;
    pickupPointId?: unknown;
    pickupPointName?: unknown;
    address?: Record<string, unknown>;
    price?: unknown;
  };
};

type ResolvedCheckoutLine = {
  product: Product;
  variation: Variation;
  orderLine: OrderLine;
};

export type ResolvedCheckout = {
  input: CreateOrderInput;
  lines: ResolvedCheckoutLine[];
  shippingMethod: ShippingMethodOption;
  pickupPoint?: PickupPoint;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function positiveQuantity(value: unknown) {
  const quantity = Number(value);

  if (!Number.isFinite(quantity)) {
    return 0;
  }

  return Math.floor(quantity);
}

function paymentMethod(value: unknown): PaymentMethod {
  return value === "invoice" || value === "defer15" ? value : "card";
}

function language(value: unknown) {
  return value === "ru" || value === "lv" || value === "en" || value === "et" || value === "lt"
    ? value
    : undefined;
}

function shippingAddress(payload: CheckoutPayload) {
  return payload.shipping?.address ?? payload.shippingAddress ?? {};
}

function countryFromPayload(payload: CheckoutPayload) {
  const address = shippingAddress(payload);
  const country = cleanText(address.country).toUpperCase();

  return /^[A-Z]{2}$/.test(country) ? country : "LV";
}

function shippingType(payload: CheckoutPayload): OrderShippingType {
  if (payload.shipping?.shippingType) {
    return payload.shipping.shippingType;
  }

  if (payload.shippingType) {
    return payload.shippingType;
  }

  if (payload.shipping?.type === "courier") {
    return "courier";
  }

  if (payload.shipping?.type === "selfPickup") {
    return "self_pickup";
  }

  return "parcel_machine";
}

function shippingCandidateIds(payload: CheckoutPayload) {
  return [
    cleanText(payload.shipping?.method),
    cleanText(payload.shippingMethod),
    cleanText(payload.shipping?.pickupPointId),
    cleanText(payload.pickupPointId),
  ].filter(Boolean);
}

function shippingCarrier(payload: CheckoutPayload) {
  return cleanText(payload.shipping?.carrierCode || payload.shipping?.carrier || payload.shippingCarrier);
}

function findShippingMethod(
  methods: ShippingMethodOption[],
  payload: CheckoutPayload,
) {
  const ids = shippingCandidateIds(payload);
  const carrier = shippingCarrier(payload);
  const type = shippingType(payload);

  return methods.find((method) => {
    const idMatches =
      ids.includes(method.id) ||
      (method.serviceId ? ids.includes(method.serviceId) : false) ||
      (method.subtype ? ids.includes(`${method.carrierCode}-${method.subtype}`) : false);
    const carrierMatches = carrier ? method.carrierCode === carrier : true;

    return method.shippingType === type && carrierMatches && (idMatches || !ids.length);
  });
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(value: string) {
  return /^[+\d][+\d\s().-]{6,24}$/.test(value);
}

function normalizeAddress(payload: CheckoutPayload, user: PublicUser) {
  const raw = shippingAddress(payload);
  const phoneCountryCode = cleanText(raw.phoneCountryCode);
  const phoneNumber = cleanText(raw.phoneNumber);
  const country = cleanText(raw.country).toUpperCase();

  return {
    name: user.name,
    companyName: user.company,
    streetAddress: cleanText(raw.streetAddress),
    locality: cleanText(raw.locality),
    region: cleanText(raw.region),
    postalCode: cleanText(raw.postalCode),
    country,
    phoneCountryCode,
    phoneNumber,
    email: user.email,
  };
}

async function resolveLines(payload: CheckoutPayload, user: PublicUser) {
  const role: UserRole = isApprovedB2B(user) ? "b2b" : "user";
  const levels = await inventoryLevelMap();
  const resolved: ResolvedCheckoutLine[] = [];

  for (const line of payload.lines ?? []) {
    const productId = cleanText(line.productId);
    const variationId = cleanText(line.variationId);
    const quantity = positiveQuantity(line.quantity);

    if (!productId || !variationId || quantity <= 0 || quantity > 99) {
      throw new Error("Invalid cart item quantity.");
    }

    const product = await getProduct(productId);
    const variation = product?.variations.find((item) => item.id === variationId);

    if (!product || !variation) {
      throw new Error("Product is no longer available.");
    }

    const available = levels[variation.id]?.available ?? Math.max(0, variation.stock.physical - variation.stock.reserved);

    if (available < quantity) {
      throw new Error("Not enough stock for selected product.");
    }

    const price = pricedVariation(product, variation, role).final;

    resolved.push({
      product,
      variation,
      orderLine: {
        productId: product.id,
        variationId: variation.id,
        productName: product.name,
        variationName: variation.name,
        sku: variation.sku,
        quantity,
        unitPrice: roundMoney(price),
        total: roundMoney(price * quantity),
      },
    });
  }

  if (!resolved.length) {
    throw new Error("Cart is empty.");
  }

  return resolved;
}

async function resolvePickupPoint(method: ShippingMethodOption, payload: CheckoutPayload, country: string) {
  if (method.type !== "pickupPoint") {
    return undefined;
  }

  const pickupPointId = cleanText(payload.shipping?.pickupPointId || payload.pickupPointId);

  if (!pickupPointId) {
    throw new Error("Pickup point is required.");
  }

  const points = await getPickupPoints(method.carrierCode, country, method.subtype || "parcelMachine");
  const point = points.find((item) => item.id === pickupPointId);

  if (!point) {
    throw new Error("Selected pickup point is not available.");
  }

  return point;
}

export async function resolveCheckoutInput(
  payload: CheckoutPayload,
  user: PublicUser,
  merchantReference: string,
  forcedPaymentMethod?: PaymentMethod,
): Promise<ResolvedCheckout> {
  if (!validateEmail(user.email)) {
    throw new Error("Customer email is invalid.");
  }

  const lines = await resolveLines(payload, user);
  const requestedPaymentMethod = forcedPaymentMethod ?? paymentMethod(payload.paymentMethod);

  if ((requestedPaymentMethod === "invoice" || requestedPaymentMethod === "defer15") && !isApprovedB2B(user)) {
    throw new Error("B2B payment method is not available.");
  }

  const country = countryFromPayload(payload);
  const methods = await getShippingMethods(country);
  const method = findShippingMethod(methods, payload);

  if (!method || !method.available) {
    throw new Error("Selected delivery method is not available.");
  }

  const pickupPoint = await resolvePickupPoint(method, payload, country);
  const address = normalizeAddress(payload, user);

  if (method.type === "courier") {
    if (
      !address.streetAddress ||
      !address.locality ||
      !address.postalCode ||
      !/^[A-Z]{2}$/.test(address.country) ||
      !validatePhone(`${address.phoneCountryCode}${address.phoneNumber}`)
    ) {
      throw new Error("Courier address is incomplete.");
    }
  }

  const oversizedLine = oversizedOrderLine(lines.map((line) => ({
    ...line,
    product: line.product,
  })));

  if (oversizedLine && !isSelfPickupShippingType(method.shippingType)) {
    throw new Error("Oversized products are available only for store pickup.");
  }

  const orderLines = lines.map((line) => line.orderLine);
  const subtotal = roundMoney(orderLines.reduce((sum, line) => sum + line.total, 0));
  const vat = roundMoney(subtotal * 0.21);
  const shippingPrice = roundMoney(method.price);
  const shippingAddressValue =
    method.type === "pickupPoint" && pickupPoint
      ? {
          ...address,
          streetAddress: pickupPoint.streetAddress || pickupPoint.name,
          locality: pickupPoint.locality || address.locality || country,
          postalCode: pickupPoint.postalCode || address.postalCode,
          country: pickupPoint.countryCode || country,
        }
      : method.type === "selfPickup"
        ? undefined
        : address;

  return {
    input: {
      merchantReference,
      paymentMethod: requestedPaymentMethod,
      noVat: false,
      language: language(payload.language),
      customer: {
        name: user.name,
        email: user.email,
        company: user.company,
        role: user.role,
      },
      lines: orderLines,
      totals: {
        subtotal,
        vat,
        shipping: shippingPrice,
        total: roundMoney(subtotal + vat + shippingPrice),
        currency: "EUR",
      },
      shippingCarrier: method.carrierCode,
      shippingMethod: pickupPoint?.id || method.serviceId || method.id,
      shippingMethodName: pickupPoint?.name || method.name,
      shippingType: method.shippingType,
      pickupPointId: pickupPoint?.id,
      pickupPointName: pickupPoint?.name,
      shippingAddress: shippingAddressValue,
      shippingPrice,
    },
    lines,
    shippingMethod: method,
    pickupPoint,
  };
}

export function montonioLineItems(input: CreateOrderInput) {
  const lineItems = input.lines.map((line) => ({
    name: [line.productName, line.variationName, line.sku].filter(Boolean).join(" / ").slice(0, 180),
    quantity: line.quantity,
    finalPrice: line.unitPrice,
  }));

  if (input.shippingPrice > 0) {
    lineItems.push({
      name: input.shippingMethodName,
      quantity: 1,
      finalPrice: input.shippingPrice,
    });
  }

  if (input.totals.vat > 0) {
    lineItems.push({
      name: "PVN 21%",
      quantity: 1,
      finalPrice: input.totals.vat,
    });
  }

  return lineItems;
}
