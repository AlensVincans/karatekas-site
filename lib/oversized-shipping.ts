import {
  findProduct,
  findVariation,
  type Product,
} from "./store-data";
import type { OrderShippingType } from "./orders";

type OversizedLineInput = {
  product?: Product;
  productId?: string;
  variationId?: string;
  brand?: string;
  category?: string;
  productName?: string;
  variationName?: string;
  sku?: string;
  onlySelfPickup?: boolean;
};

function normalizedText(value: unknown) {
  return typeof value === "string"
    ? value
        .toLowerCase()
        .replace(/ё/g, "е")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim()
    : "";
}

function compactText(parts: unknown[]) {
  return normalizedText(parts.filter(Boolean).join(" "));
}

function productForLine(line: OversizedLineInput) {
  if (line.product) {
    return line.product;
  }

  if (line.productId) {
    const product = findProduct(line.productId);

    if (product) {
      return product;
    }
  }

  if (line.variationId) {
    return findVariation(line.variationId)?.product;
  }

  return undefined;
}

function hasAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle));
}

function isCenturySmallException(text: string) {
  return hasAny(text, [
    "cap",
    "caps",
    "kapa",
    "mouth guard",
    "mouthguard",
    "капа",
  ]);
}

export function isOversizedProduct(
  product: Product | undefined,
  extra: Partial<OversizedLineInput> = {},
) {
  if (product?.onlySelfPickup || extra.onlySelfPickup) {
    return true;
  }

  const text = compactText([
    product?.id,
    product?.name,
    product?.brand,
    product?.category,
    product?.description,
    ...(product?.tags ?? []),
    ...(product?.specs ?? []),
    extra.brand,
    extra.category,
    extra.productName,
    extra.variationName,
    extra.sku,
  ]);
  const brand = normalizedText(product?.brand || extra.brand);

  if (hasAny(text, ["tatami"])) {
    return true;
  }

  if (brand === "century" && !isCenturySmallException(text)) {
    return true;
  }

  return (
    brand === "smai" &&
    hasAny(text, ["kids shield with head", "kid shield with head", "shield with head"])
  );
}

export function oversizedOrderLine<T extends OversizedLineInput>(lines: T[]) {
  return lines.find((line) => isOversizedProduct(productForLine(line), line));
}

export function isSelfPickupShippingType(type: OrderShippingType | string | undefined) {
  return type === "self_pickup";
}
