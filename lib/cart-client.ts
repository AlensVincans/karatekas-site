"use client";

export type CartLine = {
  productId: string;
  variationId: string;
  qty: number;
};

export const cartStorageKey = "bc_cart";
export const cartChangeEvent = "bc-cart-change";

export function readCartLines(): CartLine[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(cartStorageKey) ?? "[]");

    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function writeCartLines(lines: CartLine[]) {
  window.localStorage.setItem(cartStorageKey, JSON.stringify(lines));
  window.dispatchEvent(new Event(cartChangeEvent));
}

export function cartItemCount(lines = readCartLines()) {
  return lines.reduce((sum, line) => sum + Math.max(0, Number(line.qty) || 0), 0);
}
