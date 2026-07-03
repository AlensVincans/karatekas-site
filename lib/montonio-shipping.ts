import { roundMoney, signMontonioJwt } from "./montonio";
import type { OrderShippingType, StoreOrder } from "./orders";

export type ShippingMethodOption = {
  id: string;
  carrier: string;
  carrierCode: string;
  carrierName: string;
  name: string;
  type: "pickupPoint" | "courier" | "selfPickup";
  shippingType: OrderShippingType;
  subtype?: string;
  serviceId?: string;
  price: number;
  currency: "EUR";
  available: boolean;
  source: "montonio" | "fallback";
};

export type PickupPoint = {
  id: string;
  name: string;
  type: string;
  streetAddress?: string;
  locality?: string;
  postalCode?: string;
  carrierCode: string;
  countryCode: string;
};

type MontonioShippingMethodResponse = {
  countries?: Array<{
    countryCode?: string;
    carriers?: Array<{
      carrierCode?: string;
      carrierName?: string;
      name?: string;
      shippingMethods?: Array<{
        type?: "pickupPoint" | "courier";
        subtypes?: Array<{ code?: string; rate?: string; currency?: string }>;
      }>;
    }>;
  }>;
};

type MontonioPickupPointResponse = {
  pickupPoints?: Array<{
    id?: string;
    name?: string;
    type?: string;
    streetAddress?: string;
    locality?: string;
    postalCode?: string;
    carrierCode?: string;
  }>;
  countryCode?: string;
};

type MontonioCourierServicesResponse = {
  courierServices?: Array<{
    id?: string;
    name?: string;
    type?: string;
    carrierCode?: string;
  }>;
};

type MontonioShipment = {
  id?: string;
  status?: string;
  carrierShipmentId?: string | null;
  parcels?: Array<{
    carrierParcelId?: string | null;
    trackingLink?: string | null;
  }>;
};

type MontonioLabelFile = {
  id?: string;
  status?: string;
  labelFileUrl?: string | null;
};

const productionShippingApiBase = "https://shipping.montonio.com/api/v2";
const sandboxShippingApiBase = "https://sandbox-shipping.montonio.com/api/v2";
const defaultCountry = "LV";

const carrierNames: Record<string, string> = {
  omniva: "Omniva",
  dpd: "DPD",
  unisend: "Unisend",
  latvijas_pasts: "Latvijas Pasts",
  latvijaspasts: "Latvijas Pasts",
  pasts: "Latvijas Pasts",
};

const fallbackMethods: ShippingMethodOption[] = [
  {
    id: "self-pickup-riga",
    carrier: "self",
    carrierCode: "self",
    carrierName: "Karatekas",
    name: "Pick up from store",
    type: "selfPickup",
    shippingType: "self_pickup",
    subtype: "selfPickup",
    price: 0,
    currency: "EUR",
    available: true,
    source: "fallback",
  },
  {
    id: "omniva-parcel-machine",
    carrier: "omniva",
    carrierCode: "omniva",
    carrierName: "Omniva",
    name: "Omniva parcel machine",
    type: "pickupPoint",
    shippingType: "parcel_machine",
    subtype: "parcelMachine",
    price: 3.49,
    currency: "EUR",
    available: true,
    source: "fallback",
  },
  {
    id: "dpd-parcel-machine",
    carrier: "dpd",
    carrierCode: "dpd",
    carrierName: "DPD",
    name: "DPD parcel machine",
    type: "pickupPoint",
    shippingType: "parcel_machine",
    subtype: "parcelMachine",
    price: 4.9,
    currency: "EUR",
    available: true,
    source: "fallback",
  },
  {
    id: "unisend-parcel-machine",
    carrier: "unisend",
    carrierCode: "unisend",
    carrierName: "Unisend",
    name: "Unisend parcel machine",
    type: "pickupPoint",
    shippingType: "parcel_machine",
    subtype: "parcelMachine",
    price: 2.99,
    currency: "EUR",
    available: true,
    source: "fallback",
  },
  {
    id: "latvijas-pasts-post-office",
    carrier: "latvijas_pasts",
    carrierCode: "latvijas_pasts",
    carrierName: "Latvijas Pasts",
    name: "Latvijas Pasts",
    type: "pickupPoint",
    shippingType: "post_office",
    subtype: "postOffice",
    price: 5.6,
    currency: "EUR",
    available: true,
    source: "fallback",
  },
  {
    id: "omniva-courier-standard",
    carrier: "omniva",
    carrierCode: "omniva",
    carrierName: "Courier",
    name: "Courier delivery",
    type: "courier",
    shippingType: "courier",
    subtype: "standard",
    price: 8.5,
    currency: "EUR",
    available: true,
    source: "fallback",
  },
];

function env() {
  return process.env;
}

function cleanText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeCarrierCode(carrier: string) {
  const normalized = carrier.trim().toLowerCase().replace(/[-\s]+/g, "_");

  if (normalized === "latvijas_pasts" || normalized === "latvijaspasts") {
    return "latvijas_pasts";
  }

  return normalized;
}

function shippingApiBaseUrl() {
  if (env().MONTONIO_SHIPPING_API_BASE_URL?.trim()) {
    return env().MONTONIO_SHIPPING_API_BASE_URL.trim().replace(/\/+$/g, "");
  }

  return env().MONTONIO_ENV?.trim().toLowerCase() === "production"
    ? productionShippingApiBase
    : sandboxShippingApiBase;
}

function shippingKeys() {
  const accessKey = env().MONTONIO_ACCESS_KEY?.trim();
  const secretKey = env().MONTONIO_SECRET_KEY?.trim();

  return accessKey && secretKey ? { accessKey, secretKey } : null;
}

async function shippingAuthHeader() {
  const keys = shippingKeys();

  if (!keys) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const token = await signMontonioJwt(
    {
      accessKey: keys.accessKey,
      iat: now,
      exp: now + 60 * 60,
    },
    keys.secretKey,
  );

  return `Bearer ${token}`;
}

async function shippingRequest<T>(path: string, init?: RequestInit) {
  const authorization = await shippingAuthHeader();

  if (!authorization) {
    throw new Error("Montonio Shipping keys are not configured.");
  }

  const response = await fetch(`${shippingApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: authorization,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.message || data.error || "Montonio Shipping request failed.");
  }

  return data;
}

function priceFor(carrierCode: string, shippingType: OrderShippingType) {
  const fallback = fallbackMethods.find(
    (method) =>
      method.carrierCode === carrierCode && method.shippingType === shippingType,
  );

  return fallback?.price ?? (shippingType === "courier" ? 8.5 : 4.9);
}

function moneyOrFallback(
  value: string | undefined,
  carrierCode: string,
  shippingType: OrderShippingType,
) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0
    ? roundMoney(parsed)
    : priceFor(carrierCode, shippingType);
}

function methodName(
  carrierName: string,
  shippingType: OrderShippingType,
  subtype?: string,
) {
  if (shippingType === "courier") {
    return "Courier delivery";
  }

  if (shippingType === "self_pickup") {
    return "Pick up from store";
  }

  if (shippingType === "post_office") {
    return carrierName;
  }

  if (subtype === "parcelShop") {
    return `${carrierName} parcel shop`;
  }

  return `${carrierName} parcel machine`;
}

function subtypeToShippingType(subtype?: string): OrderShippingType {
  if (subtype === "postOffice") {
    return "post_office";
  }

  if (subtype === "parcelShop") {
    return "parcel_shop";
  }

  return "parcel_machine";
}

function normalizeMethods(
  response: MontonioShippingMethodResponse,
  countryCode = defaultCountry,
) {
  const country = response.countries?.find(
    (item) => item.countryCode?.toUpperCase() === countryCode.toUpperCase(),
  );
  const methods: ShippingMethodOption[] = [];
  let courierAdded = false;

  for (const carrier of country?.carriers ?? []) {
    const rawCarrierCode = cleanText(carrier.carrierCode, "");
    const carrierCode = normalizeCarrierCode(rawCarrierCode);
    const carrierName =
      carrierNames[carrierCode] || cleanText(carrier.carrierName || carrier.name, rawCarrierCode);

    for (const method of carrier.shippingMethods ?? []) {
      if (method.type === "courier" && !courierAdded) {
        methods.push({
          id: `${carrierCode}-courier-standard`,
          carrier: carrierCode,
          carrierCode,
          carrierName: "Courier",
          name: "Courier delivery",
          type: "courier",
          shippingType: "courier",
          subtype: method.subtypes?.[0]?.code || "standard",
          price: priceFor(carrierCode, "courier"),
          currency: "EUR",
          available: true,
          source: "montonio",
        });
        courierAdded = true;
      }

      if (method.type !== "pickupPoint") {
        continue;
      }

      for (const subtype of method.subtypes ?? []) {
        const shippingType = subtypeToShippingType(subtype.code);

        if (
          shippingType === "parcel_shop" ||
          (shippingType === "post_office" && !carrierName.includes("Pasts"))
        ) {
          continue;
        }

        methods.push({
          id: `${carrierCode}-${subtype.code || "pickupPoint"}`,
          carrier: carrierCode,
          carrierCode,
          carrierName,
          name: methodName(carrierName, shippingType, subtype.code),
          type: "pickupPoint",
          shippingType,
          subtype: subtype.code,
          price: moneyOrFallback(subtype.rate, carrierCode, shippingType),
          currency: "EUR",
          available: true,
          source: "montonio",
        });
      }
    }
  }

  return methods;
}

export function fallbackShippingMethods() {
  return fallbackMethods;
}

function withSelfPickup(methods: ShippingMethodOption[]) {
  const selfPickup = fallbackMethods.find((method) => method.shippingType === "self_pickup");

  if (!selfPickup || methods.some((method) => method.shippingType === "self_pickup")) {
    return methods;
  }

  return [selfPickup, ...methods];
}

export async function getShippingMethods(countryCode = defaultCountry) {
  try {
    const data =
      await shippingRequest<MontonioShippingMethodResponse>("/shipping-methods");
    const methods = normalizeMethods(data, countryCode);

    return methods.length ? withSelfPickup(methods) : fallbackShippingMethods();
  } catch {
    return fallbackShippingMethods();
  }
}

export async function getPickupPoints(
  carrier: string,
  countryCode = defaultCountry,
  type = "parcelMachine",
) {
  const carrierCode = normalizeCarrierCode(carrier);

  try {
    const params = new URLSearchParams({
      carrierCode,
      countryCode: countryCode.toUpperCase(),
    });

    if (type) {
      params.set("type", type);
    }

    const data = await shippingRequest<MontonioPickupPointResponse>(
      `/shipping-methods/pickup-points?${params.toString()}`,
    );

    return (data.pickupPoints ?? [])
      .filter((point) => point.id && point.name)
      .map((point) => ({
        id: point.id as string,
        name: point.name as string,
        type: point.type || type,
        streetAddress: point.streetAddress,
        locality: point.locality,
        postalCode: point.postalCode,
        carrierCode: normalizeCarrierCode(point.carrierCode || carrierCode),
        countryCode: data.countryCode || countryCode.toUpperCase(),
      }));
  } catch {
    return [];
  }
}

async function resolveCourierServiceId(order: StoreOrder) {
  if (order.shippingType === "self_pickup") {
    throw new Error("Self pickup does not require a Montonio shipment.");
  }

  if (order.shippingType !== "courier") {
    return order.pickupPointId || order.shippingMethod;
  }

  if (order.shippingMethod && !order.shippingMethod.includes("courier-standard")) {
    return order.shippingMethod;
  }

  const data = await shippingRequest<MontonioCourierServicesResponse>(
    `/shipping-methods/courier-services?carrierCode=${encodeURIComponent(
      order.shippingCarrier,
    )}&countryCode=${encodeURIComponent(order.shippingAddress?.country || defaultCountry)}`,
  );

  const service = data.courierServices?.[0];

  if (!service?.id) {
    throw new Error("No Montonio courier service is available for this carrier.");
  }

  return service.id;
}

function senderAddress() {
  return {
    name: cleanText(env().MONTONIO_SHIPPER_NAME, "Karatekas Gear"),
    companyName: cleanText(env().MONTONIO_SHIPPER_COMPANY, "Karatekas Gear"),
    streetAddress: cleanText(env().MONTONIO_ADDRESS_LINE1, "Online store"),
    locality: cleanText(env().MONTONIO_LOCALITY, "Riga"),
    region: cleanText(env().MONTONIO_REGION, "Riga"),
    postalCode: cleanText(env().MONTONIO_POSTAL_CODE, "LV-1001"),
    country: cleanText(env().MONTONIO_COUNTRY, defaultCountry),
    phoneCountryCode: cleanText(env().MONTONIO_SHIPPER_PHONE_COUNTRY_CODE, "371"),
    phoneNumber: cleanText(env().MONTONIO_SHIPPER_PHONE_NUMBER, "20000000"),
    email: cleanText(env().MONTONIO_SHIPPER_EMAIL, "support@example.com"),
  };
}

function receiverAddress(order: StoreOrder) {
  const address = order.shippingAddress ?? {};
  const name = cleanText(address.name || order.customer.name, "Karatekas customer");

  return {
    name,
    companyName: cleanText(address.companyName || order.customer.company, ""),
    streetAddress: cleanText(address.streetAddress, order.pickupPointName || "Pickup point"),
    locality: cleanText(address.locality, "Riga"),
    region: cleanText(address.region, "Riga"),
    postalCode: cleanText(address.postalCode, "LV-1001"),
    country: cleanText(address.country, defaultCountry),
    phoneCountryCode: cleanText(address.phoneCountryCode, "371"),
    phoneNumber: cleanText(address.phoneNumber, "20000000"),
    email: cleanText(address.email || order.customer.email, "customer@example.com"),
  };
}

function shipmentProducts(order: StoreOrder) {
  return order.lines.slice(0, 50).map((line) => ({
    sku: cleanText(line.sku, line.variationId || line.productId || "SKU"),
    name: cleanText(line.productName, "Karate product"),
    quantity: line.quantity,
    price: line.unitPrice,
    currency: "EUR",
  }));
}

export async function createShipmentForOrder(order: StoreOrder) {
  if (order.shippingType === "self_pickup") {
    return {
      shippingStatus: "ready_for_pickup" as const,
      labelStatus: "not_required",
    };
  }

  const shippingMethodId = await resolveCourierServiceId(order);
  const data = await shippingRequest<MontonioShipment>("/shipments", {
    method: "POST",
    body: JSON.stringify({
      sender: senderAddress(),
      receiver: receiverAddress(order),
      montonioOrderUuid: order.montonioOrderUuid,
      merchantReference: order.merchantReference,
      shippingMethod: {
        type: order.shippingType === "courier" ? "courier" : "pickupPoint",
        id: shippingMethodId,
      },
      parcels: [{ weight: 1 }],
      products: shipmentProducts(order),
      synchronous: true,
    }),
  });

  const parcel = data.parcels?.find(
    (item) => item.carrierParcelId || item.trackingLink,
  );

  return {
    shipmentId: data.id,
    carrierShipmentId: data.carrierShipmentId || undefined,
    trackingNumber: parcel?.carrierParcelId || data.carrierShipmentId || undefined,
    trackingLink: parcel?.trackingLink || undefined,
    shippingStatus: "shipment_created" as const,
    labelStatus: data.status,
  };
}

export async function createLabelForShipment(shipmentId: string) {
  const data = await shippingRequest<MontonioLabelFile>("/label-files", {
    method: "POST",
    body: JSON.stringify({
      shipmentIds: [shipmentId],
      pageSize: "A4",
      labelsPerPage: 1,
      orderLabelsBy: "createdAt",
      synchronous: true,
    }),
  });

  return {
    labelFileId: data.id,
    labelUrl: data.labelFileUrl || undefined,
    labelStatus: data.status,
    shippingStatus: data.labelFileUrl ? ("label_created" as const) : ("shipment_created" as const),
  };
}

export function isShippingConfigured() {
  return Boolean(shippingKeys());
}
