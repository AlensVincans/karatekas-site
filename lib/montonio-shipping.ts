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
  url?: string | null;
  fileUrl?: string | null;
  downloadUrl?: string | null;
  file?: {
    url?: string | null;
    labelFileUrl?: string | null;
    downloadUrl?: string | null;
  } | null;
};

const productionShippingApiBase = "https://shipping.montonio.com/api/v2";
const sandboxShippingApiBase = "https://sandbox-shipping.montonio.com/api/v2";
const publicContractPricesApi = "https://shipping.montonio.com/api/v2/contract-prices";
const defaultCountry = "LV";
const balticShippingCountries = new Set(["LV", "LT", "EE"]);
const montonioInternationalName = "Montonio International Shipping";
const defaultMontonioParcel = {
  weightKg: 5,
  lengthCm: 45,
  widthCm: 30,
  heightCm: 10,
} as const;

function isBalticShippingCountry(countryCode = defaultCountry) {
  return balticShippingCountries.has(countryCode.trim().toUpperCase());
}

function isMontonioInternationalMethod(method: Pick<ShippingMethodOption, "id" | "carrier" | "name">) {
  return (
    method.id.includes("international") ||
    method.carrier === "montonio_international" ||
    method.name.toLowerCase().includes("montonio international")
  );
}

const carrierNames: Record<string, string> = {
  omniva: "Omniva",
  dpd: "DPD",
  itella: "Smartposti",
  smartpost: "Smartposti",
  smartposti: "Smartposti",
  unisend: "Unisend",
  latvia_post: "Latvijas Pasts",
  latvian_post: "Latvijas Pasts",
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
    price: 2.2,
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
    price: 2.09,
    currency: "EUR",
    available: true,
    source: "fallback",
  },
  {
    id: "smartposti-parcel-machine",
    carrier: "smartposti",
    carrierCode: "smartposti",
    carrierName: "Smartposti",
    name: "Smartposti parcel machine",
    type: "pickupPoint",
    shippingType: "parcel_machine",
    subtype: "parcelMachine",
    price: 1.95,
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
    price: 1.99,
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
    price: 1.99,
    currency: "EUR",
    available: true,
    source: "fallback",
  },
  {
    id: "dpd-courier-standard",
    carrier: "dpd",
    carrierCode: "dpd",
    carrierName: "Courier",
    name: "Courier delivery",
    type: "courier",
    shippingType: "courier",
    subtype: "standard",
    price: 6.38,
    currency: "EUR",
    available: true,
    source: "fallback",
  },
  {
    id: "dpd-courier-standard-international",
    carrier: "montonio_international",
    carrierCode: "dpd",
    carrierName: "Montonio",
    name: montonioInternationalName,
    type: "courier",
    shippingType: "courier",
    subtype: "international",
    price: 8.5,
    currency: "EUR",
    available: true,
    source: "fallback",
  },
];

const manualShippingPrices: Record<string, Record<string, number>> = {
  LV: {
    "self:self_pickup": 0,
    "omniva:parcel_machine": 2.2,
    "dpd:parcel_machine": 2.09,
    "smartposti:parcel_machine": 1.95,
    "unisend:parcel_machine": 1.99,
    "latvijas_pasts:parcel_machine": 1.99,
    "latvijas_pasts:post_office": 1.99,
    "dpd:courier": 6.38,
  },
  LT: {
    "self:self_pickup": 0,
    "omniva:parcel_machine": 4,
    "dpd:parcel_machine": 4.5,
    "smartposti:parcel_machine": 3.95,
    "unisend:parcel_machine": 3,
    "latvijas_pasts:parcel_machine": 4,
    "latvijas_pasts:post_office": 4,
    "dpd:courier": 5.5,
  },
  EE: {
    "self:self_pickup": 0,
    "omniva:parcel_machine": 4,
    "dpd:parcel_machine": 4.5,
    "smartposti:parcel_machine": 3.95,
    "unisend:parcel_machine": 3,
    "latvijas_pasts:parcel_machine": 4,
    "latvijas_pasts:post_office": 4,
    "dpd:courier": 5.5,
  },
};

type PublicContractPrice = {
  pricePerParcel?: number;
  currency?: string;
};

const publicPriceCache = new Map<string, { expiresAt: number; price: number | undefined }>();

function env() {
  return process.env;
}

function cleanText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function envText(keys: string[], fallback: string) {
  for (const key of keys) {
    const value = env()[key]?.trim();

    if (value) {
      return value;
    }
  }

  return fallback;
}

const countryPhoneCodes: Record<string, string> = {
  EE: "372",
  LT: "370",
  LV: "371",
};

function countryCode(value: unknown, fallback = defaultCountry) {
  return cleanText(value, fallback).toUpperCase();
}

function phoneCodeFor(country: string) {
  return countryPhoneCodes[countryCode(country)] ?? countryPhoneCodes[defaultCountry];
}

function splitContactName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return { firstName: name, lastName: "-" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function compactPhone(country: string, phoneCountryCode: string, phoneNumber: string) {
  const code = cleanText(phoneCountryCode, phoneCodeFor(country)).replace(/\D/g, "");
  const number = cleanText(phoneNumber, "").replace(/[^\d+]/g, "");

  if (!number) {
    return "";
  }

  if (number.startsWith("+")) {
    return number;
  }

  if (code && number.startsWith(code)) {
    return `+${number}`;
  }

  return code ? `+${code}${number}` : number;
}

type ShippingContactAddress = {
  name: string;
  companyName?: string;
  streetAddress: string;
  locality: string;
  region: string;
  postalCode: string;
  country: string;
  phoneCountryCode: string;
  phoneNumber: string;
  email: string;
};

function shippingContactAddress(input: ShippingContactAddress) {
  const country = countryCode(input.country);
  const name = cleanText(input.name, input.companyName || "Karatekas");
  const companyName = cleanText(input.companyName, "");
  const streetAddress = cleanText(input.streetAddress, "Online store");
  const locality = cleanText(input.locality, "Riga");
  const region = cleanText(input.region, locality);
  const postalCode = cleanText(input.postalCode, "LV-1001");
  const phoneCountryCode = cleanText(input.phoneCountryCode, phoneCodeFor(country));
  const phoneNumber = cleanText(input.phoneNumber, "");
  const phone = compactPhone(country, phoneCountryCode, phoneNumber);
  const { firstName, lastName } = splitContactName(name);

  return {
    name,
    fullName: name,
    firstName,
    lastName,
    companyName,
    company: companyName,
    streetAddress,
    addressLine1: streetAddress,
    locality,
    city: locality,
    region,
    state: region,
    postalCode,
    zipCode: postalCode,
    country,
    countryCode: country,
    phoneCountryCode,
    phoneNumber,
    phone,
    email: cleanText(input.email, "info@karatekas.eu"),
  };
}

function normalizeCarrierCode(carrier: string) {
  const normalized = carrier.trim().toLowerCase().replace(/[-\s]+/g, "_");

  if (
    normalized === "latvijas_pasts" ||
    normalized === "latvijaspasts" ||
    normalized === "latvian_post" ||
    normalized === "latvia_post"
  ) {
    return "latvijas_pasts";
  }

  if (
    normalized === "smart_posti" ||
    normalized === "smartposti" ||
    normalized === "smartpost" ||
    normalized.startsWith("smartposti_") ||
    normalized.startsWith("smartpost_") ||
    normalized.startsWith("itella_")
  ) {
    return "smartposti";
  }

  if (normalized === "omniva" || normalized.startsWith("omniva_")) {
    return "omniva";
  }

  if (normalized === "dpd" || normalized.startsWith("dpd_")) {
    return "dpd";
  }

  if (normalized === "unisend" || normalized.startsWith("unisend_")) {
    return "unisend";
  }

  return normalized;
}

function carrierCodeCandidates(carrier: string) {
  const normalized = normalizeCarrierCode(carrier);

  if (normalized === "smartposti") {
    return ["smartposti", "itella", "smartpost", "smart_posti"];
  }

  if (normalized === "latvijas_pasts") {
    return ["latvijas_pasts", "latvian_post", "latvia_post", "pasts"];
  }

  return [normalized];
}

function normalizePickupPointType(value?: string) {
  return (value || "").trim().toLowerCase().replace(/[-_\s]+/g, "");
}

function pickupPointTypeMatches(actualType: string | undefined, requestedType: string) {
  const actual = normalizePickupPointType(actualType);
  const requested = normalizePickupPointType(requestedType);

  if (!requested || !actual || actual === "pickuppoint") {
    return true;
  }

  if (requested === "parcelmachine") {
    return ["parcelmachine", "locker", "terminal", "pakomat", "pakuautomats"].includes(actual);
  }

  if (requested === "parcelshop") {
    return ["parcelshop", "servicepoint"].includes(actual);
  }

  if (requested === "postoffice") {
    return ["postoffice", "post"].includes(actual);
  }

  return actual === requested;
}

function normalizePickupPoints(
  data: MontonioPickupPointResponse,
  fallbackCarrierCode: string,
  fallbackCountryCode: string,
  fallbackType: string,
) {
  return (data.pickupPoints ?? [])
    .filter((point) => point.id && point.name)
    .map((point) => ({
      id: point.id as string,
      name: point.name as string,
      type: point.type || fallbackType,
      streetAddress: point.streetAddress,
      locality: point.locality,
      postalCode: point.postalCode,
      carrierCode: normalizeCarrierCode(point.carrierCode || fallbackCarrierCode),
      countryCode: data.countryCode || fallbackCountryCode.toUpperCase(),
    }));
}

function shippingApiBaseUrl() {
  const configuredBaseUrl = env().MONTONIO_SHIPPING_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/g, "");
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

function priceKey(carrierCode: string, shippingType: OrderShippingType) {
  return `${normalizeCarrierCode(carrierCode)}:${shippingType}`;
}

function manualShippingPricesAllowed() {
  return (
    env().MONTONIO_SHIPPING_ALLOW_MANUAL_PRICES?.trim().toLowerCase() === "true" ||
    env().NODE_ENV !== "production"
  );
}

function manualPriceFor(
  carrierCode: string,
  shippingType: OrderShippingType,
  countryCode = defaultCountry,
) {
  if (shippingType === "self_pickup") {
    return 0;
  }

  if (!manualShippingPricesAllowed()) {
    return undefined;
  }

  const country = countryCode.trim().toUpperCase() || defaultCountry;
  const key = priceKey(carrierCode, shippingType);
  const countryPrice = manualShippingPrices[country]?.[key];

  if (typeof countryPrice === "number") {
    return countryPrice;
  }

  return manualShippingPrices[defaultCountry]?.[key];
}

function priceFor(
  carrierCode: string,
  shippingType: OrderShippingType,
  countryCode = defaultCountry,
) {
  const manualPrice = manualPriceFor(carrierCode, shippingType, countryCode);

  if (typeof manualPrice === "number") {
    return manualPrice;
  }

  const fallback = fallbackMethods.find(
    (method) =>
      method.carrierCode === normalizeCarrierCode(carrierCode) &&
      method.shippingType === shippingType,
  );

  return manualShippingPricesAllowed()
    ? fallback?.price ?? (shippingType === "courier" ? 8.5 : 4.9)
    : 0;
}

function moneyOrFallback(
  value: string | undefined,
  carrierCode: string,
  shippingType: OrderShippingType,
  countryCode = defaultCountry,
) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0
    ? roundMoney(parsed)
    : priceFor(carrierCode, shippingType, countryCode);
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
        const international = !isBalticShippingCountry(countryCode);

        methods.push({
          id: `${carrierCode}-courier-standard${international ? "-international" : ""}`,
          carrier: carrierCode,
          carrierCode,
          carrierName: international ? "Montonio" : "Courier",
          name: international ? montonioInternationalName : "Courier delivery",
          type: "courier",
          shippingType: "courier",
          subtype: international ? "international" : method.subtypes?.[0]?.code || "standard",
          price: priceFor(carrierCode, "courier", countryCode),
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
          price: moneyOrFallback(subtype.rate, carrierCode, shippingType, countryCode),
          currency: "EUR",
          available: true,
          source: "montonio",
        });
      }
    }
  }

  return methods;
}

function fallbackShippingMethodCandidates(countryCode = defaultCountry) {
  const candidates = isBalticShippingCountry(countryCode)
    ? fallbackMethods.filter((method) => !isMontonioInternationalMethod(method))
    : fallbackMethods.filter(
        (method) =>
          method.shippingType === "self_pickup" ||
          isMontonioInternationalMethod(method),
      );

  return candidates.map((method) => ({
    ...method,
    available: true,
    price: priceFor(method.carrierCode, method.shippingType, countryCode),
  }));
}

export function fallbackShippingMethods(countryCode = defaultCountry) {
  return fallbackShippingMethodCandidates(countryCode)
    .filter((method) => method.shippingType === "self_pickup" || manualShippingPricesAllowed())
    .map((method) => ({
      ...method,
      available: method.shippingType === "self_pickup" || manualShippingPricesAllowed(),
    }));
}

function publicCarrierCode(carrierCode: string) {
  const normalized = normalizeCarrierCode(carrierCode);

  if (normalized === "smartposti") {
    return "smartpost";
  }

  if (normalized === "latvijas_pasts") {
    return "latvian_post";
  }

  return normalized;
}

function publicShippingMethod(shippingType: OrderShippingType) {
  if (shippingType === "courier") {
    return "courier";
  }

  if (
    shippingType === "parcel_machine" ||
    shippingType === "parcel_shop" ||
    shippingType === "post_office"
  ) {
    return "pickupPoint";
  }

  return undefined;
}

async function publicContractPriceFor(
  method: ShippingMethodOption,
  countryCode = defaultCountry,
) {
  if (method.shippingType === "self_pickup") {
    return undefined;
  }

  const shippingMethod = publicShippingMethod(method.shippingType);

  if (!shippingMethod) {
    return undefined;
  }

  const source = cleanText(env().MONTONIO_SHIPPING_SOURCE_COUNTRY, defaultCountry).toUpperCase();
  const destination = countryCode.trim().toUpperCase() || defaultCountry;
  const carrierCode = publicCarrierCode(method.carrierCode);
  const cacheKey = `${carrierCode}:${shippingMethod}:${source}:${destination}`;
  const cached = publicPriceCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.price;
  }

  const url = new URL(
    cleanText(env().MONTONIO_CONTRACT_PRICES_URL, publicContractPricesApi),
  );
  url.searchParams.set("carrierCode", carrierCode);
  url.searchParams.set("shippingMethod", shippingMethod);
  url.searchParams.set("source", source);
  url.searchParams.set("destination", destination);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    const prices = (await response.json().catch(() => [])) as PublicContractPrice[];

    if (!response.ok || !Array.isArray(prices)) {
      throw new Error("Montonio contract prices request failed.");
    }

    const parsedPrices = prices
      .filter((price) => price.currency === "EUR" || !price.currency)
      .map((price) => Number(price.pricePerParcel))
      .filter((price) => Number.isFinite(price) && price > 0);
    const price = parsedPrices.length
      ? roundMoney(Math.min(...parsedPrices))
      : undefined;

    publicPriceCache.set(cacheKey, {
      expiresAt: now + 10 * 60 * 1000,
      price,
    });

    return price;
  } catch {
    publicPriceCache.set(cacheKey, {
      expiresAt: now + 60 * 1000,
      price: undefined,
    });
    return undefined;
  }
}

async function withPublicContractPrices(
  methods: ShippingMethodOption[],
  countryCode = defaultCountry,
) {
  const priced = await Promise.all(
    methods.map(async (method) => {
      const price = await publicContractPriceFor(method, countryCode);

      return typeof price === "number"
        ? { ...method, price, source: "montonio" as const }
        : method;
    }),
  );

  return priced;
}

async function contractPricedFallbackMethods(countryCode = defaultCountry) {
  const methods = await withPublicContractPrices(
    fallbackShippingMethodCandidates(countryCode),
    countryCode,
  );

  return methods.filter(
    (method) =>
      method.shippingType === "self_pickup" ||
      method.source === "montonio" ||
      (!isBalticShippingCountry(countryCode) && isMontonioInternationalMethod(method)) ||
      manualShippingPricesAllowed(),
  );
}

function shippingMethodMergeKey(method: ShippingMethodOption) {
  return `${method.carrierCode}:${method.shippingType}`;
}

function mergeShippingMethods(
  primary: ShippingMethodOption[],
  secondary: ShippingMethodOption[],
) {
  const used = new Set(primary.map(shippingMethodMergeKey));

  return [
    ...primary,
    ...secondary.filter((method) => {
      const key = shippingMethodMergeKey(method);

      if (used.has(key)) {
        return false;
      }

      used.add(key);
      return true;
    }),
  ];
}

function withSelfPickup(methods: ShippingMethodOption[], countryCode = defaultCountry) {
  const selfPickup = fallbackShippingMethods(countryCode).find(
    (method) => method.shippingType === "self_pickup",
  );

  if (!selfPickup || methods.some((method) => method.shippingType === "self_pickup")) {
    return methods;
  }

  return [selfPickup, ...methods];
}

export async function getShippingMethods(countryCode = defaultCountry) {
  if (env().MONTONIO_SHIPPING_USE_API?.trim().toLowerCase() !== "true") {
    return contractPricedFallbackMethods(countryCode);
  }

  try {
    const data =
      await shippingRequest<MontonioShippingMethodResponse>("/shipping-methods");
    const methods = normalizeMethods(data, countryCode);
    const apiMethods = methods.length ? withSelfPickup(methods, countryCode) : [];
    const fallbackMethods = await contractPricedFallbackMethods(countryCode);

    return withPublicContractPrices(
      mergeShippingMethods(apiMethods, fallbackMethods),
      countryCode,
    );
  } catch {
    return contractPricedFallbackMethods(countryCode);
  }
}

export async function getPickupPoints(
  carrier: string,
  countryCode = defaultCountry,
  type = "parcelMachine",
) {
  const carrierCode = normalizeCarrierCode(carrier);
  const country = countryCode.toUpperCase();
  const acceptedCarrierCodes = new Set(carrierCodeCandidates(carrierCode).map(normalizeCarrierCode));

  for (const candidate of carrierCodeCandidates(carrierCode)) {
    for (const requestedType of [type, ""]) {
      const params = new URLSearchParams({
        carrierCode: candidate,
        countryCode: country,
      });

      if (requestedType) {
        params.set("type", requestedType);
      }

      try {
        const data = await shippingRequest<MontonioPickupPointResponse>(
          `/shipping-methods/pickup-points?${params.toString()}`,
        );
        const points = normalizePickupPoints(data, candidate, country, requestedType || type);

        if (points.length) {
          return points;
        }
      } catch {
        continue;
      }
    }
  }

  for (const requestedType of [type, ""]) {
    const params = new URLSearchParams({ countryCode: country });

    if (requestedType) {
      params.set("type", requestedType);
    }

    try {
      const data = await shippingRequest<MontonioPickupPointResponse>(
        `/shipping-methods/pickup-points?${params.toString()}`,
      );
      const points = normalizePickupPoints(data, carrierCode, country, requestedType || type)
        .filter(
          (point) =>
            acceptedCarrierCodes.has(point.carrierCode) &&
            pickupPointTypeMatches(point.type, requestedType || type),
        );

      if (points.length) {
        return points;
      }
    } catch {
      continue;
    }
  }

  return [];
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
  const country = countryCode(
    envText(
      [
        "MONTONIO_SHIPPER_COUNTRY",
        "MONTONIO_SHIPPING_SENDER_COUNTRY",
        "MONTONIO_COUNTRY",
      ],
      defaultCountry,
    ),
  );

  return shippingContactAddress({
    name: envText(
      ["MONTONIO_SHIPPER_NAME", "MONTONIO_SHIPPING_SENDER_NAME"],
      "Karatekas.eu",
    ),
    companyName: envText(
      ["MONTONIO_SHIPPER_COMPANY", "MONTONIO_SHIPPING_SENDER_COMPANY"],
      "BBK Auto SIA",
    ),
    streetAddress: envText(
      [
        "MONTONIO_SHIPPER_ADDRESS_LINE1",
        "MONTONIO_SHIPPING_SENDER_ADDRESS_LINE1",
        "MONTONIO_ADDRESS_LINE1",
      ],
      "Online store",
    ),
    locality: envText(
      ["MONTONIO_SHIPPER_LOCALITY", "MONTONIO_SHIPPING_SENDER_LOCALITY", "MONTONIO_LOCALITY"],
      "Riga",
    ),
    region: envText(
      ["MONTONIO_SHIPPER_REGION", "MONTONIO_SHIPPING_SENDER_REGION", "MONTONIO_REGION"],
      "Riga",
    ),
    postalCode: envText(
      [
        "MONTONIO_SHIPPER_POSTAL_CODE",
        "MONTONIO_SHIPPING_SENDER_POSTAL_CODE",
        "MONTONIO_POSTAL_CODE",
      ],
      "LV-1001",
    ),
    country,
    phoneCountryCode: envText(
      [
        "MONTONIO_SHIPPER_PHONE_COUNTRY_CODE",
        "MONTONIO_SHIPPING_SENDER_PHONE_COUNTRY_CODE",
      ],
      phoneCodeFor(country),
    ),
    phoneNumber: envText(
      ["MONTONIO_SHIPPER_PHONE_NUMBER", "MONTONIO_SHIPPING_SENDER_PHONE_NUMBER"],
      "20000000",
    ),
    email: envText(
      ["MONTONIO_SHIPPER_EMAIL", "MONTONIO_SHIPPING_SENDER_EMAIL", "SMTP_FROM"],
      "info@karatekas.eu",
    ),
  });
}

function receiverAddress(order: StoreOrder) {
  const address = order.shippingAddress ?? {};
  const name = cleanText(address.name || order.customer.name, "Karatekas customer");
  const country = countryCode(address.country, defaultCountry);

  return shippingContactAddress({
    name,
    companyName: cleanText(address.companyName || order.customer.company, ""),
    streetAddress: cleanText(address.streetAddress, order.pickupPointName || "Pickup point"),
    locality: cleanText(address.locality, "Riga"),
    region: cleanText(address.region, address.locality || "Riga"),
    postalCode: cleanText(address.postalCode, "LV-1001"),
    country,
    phoneCountryCode: cleanText(address.phoneCountryCode, phoneCodeFor(country)),
    phoneNumber: cleanText(address.phoneNumber, "20000000"),
    email: cleanText(address.email || order.customer.email, "customer@example.com"),
  });
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

function packageWeightKg(order: StoreOrder) {
  const grams = order.lines.reduce((sum, line) => {
    const lineWeight = Number(line.weightGrams);
    if (!Number.isFinite(lineWeight) || lineWeight <= 0) {
      return sum;
    }

    return sum + lineWeight * Math.max(1, line.quantity);
  }, 0);

  if (grams <= 0) {
    return defaultMontonioParcel.weightKg;
  }

  return Math.max(defaultMontonioParcel.weightKg, roundMoney(grams / 1000));
}

function packageDimensions(order: StoreOrder) {
  const dimensions = order.lines
    .map((line) => ({
      length: Number(line.lengthCm),
      width: Number(line.widthCm),
      height: Number(line.heightCm),
    }))
    .filter(
      (item) =>
        Number.isFinite(item.length) &&
        Number.isFinite(item.width) &&
        Number.isFinite(item.height) &&
        item.length > 0 &&
        item.width > 0 &&
        item.height > 0,
    );

  if (!dimensions.length) {
    return {
      length: defaultMontonioParcel.lengthCm,
      width: defaultMontonioParcel.widthCm,
      height: defaultMontonioParcel.heightCm,
    };
  }

  return {
    length: Math.max(defaultMontonioParcel.lengthCm, ...dimensions.map((item) => item.length)),
    width: Math.max(defaultMontonioParcel.widthCm, ...dimensions.map((item) => item.width)),
    height: Math.max(defaultMontonioParcel.heightCm, ...dimensions.map((item) => item.height)),
  };
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
      parcels: [{
        weight: packageWeightKg(order),
        dimensions: packageDimensions(order),
      }],
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
  const pageSize = envText(
    ["MONTONIO_LABEL_PAGE_SIZE", "MONTONIO_SHIPPING_LABEL_PAGE_SIZE", "MONTONIO_LABEL_FORMAT"],
    "A6",
  ).toUpperCase();
  const labelsPerPage =
    Number(env().MONTONIO_LABELS_PER_PAGE?.trim()) ||
    1;
  const data = await shippingRequest<MontonioLabelFile>("/label-files", {
    method: "POST",
    body: JSON.stringify({
      shipmentIds: [shipmentId],
      pageSize,
      labelsPerPage,
      orderLabelsBy: "createdAt",
      synchronous: true,
    }),
  });

  const labelUrl =
    data.labelFileUrl ||
    data.url ||
    data.fileUrl ||
    data.downloadUrl ||
    data.file?.labelFileUrl ||
    data.file?.url ||
    data.file?.downloadUrl ||
    undefined;

  return {
    labelFileId: data.id,
    labelUrl,
    labelStatus: data.status,
    shippingStatus: labelUrl ? ("label_created" as const) : ("shipment_created" as const),
  };
}

export function isShippingConfigured() {
  return Boolean(shippingKeys());
}
