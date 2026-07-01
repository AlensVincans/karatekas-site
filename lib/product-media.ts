"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Product } from "./store-data";

export type ProductImageMap = Record<string, string[]>;

const productImageKey = "kg_product_images";
const productImageChangeEvent = "kg-product-image-change";

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function browserSnapshot(key: string, fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  return window.localStorage.getItem(key) ?? fallback;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(productImageChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(productImageChangeEvent, onStoreChange);
  };
}

function notifyProductImagesChanged() {
  window.dispatchEvent(new Event(productImageChangeEvent));
}

export function readProductImages(): ProductImageMap {
  return parseJson(browserSnapshot(productImageKey, "{}"), {});
}

export function writeProductImages(images: ProductImageMap) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(productImageKey, JSON.stringify(images));
  notifyProductImagesChanged();
}

export function useProductImages() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => browserSnapshot(productImageKey, "{}"),
    () => "{}",
  );

  return useMemo(() => parseJson<ProductImageMap>(snapshot, {}), [snapshot]);
}

export function productImages(product: Product, imageMap: ProductImageMap) {
  const override = imageMap[product.id]?.filter(Boolean);

  return override?.length ? override : product.images ?? [];
}
