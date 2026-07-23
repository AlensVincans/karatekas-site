"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Product } from "./store-data";
import type { ProductImageMap } from "./product-media-store";

export type { ProductImageMap } from "./product-media-store";

let imageMap: ProductImageMap = {};
let snapshot = "{}";
let loadPromise: Promise<ProductImageMap> | null = null;
const listeners = new Set<() => void>();

function normalizeImages(value: unknown): ProductImageMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<ProductImageMap>(
    (result, [productId, images]) => {
      if (!Array.isArray(images)) {
        return result;
      }

      const cleaned = images
        .map((image) => (typeof image === "string" ? image.trim() : ""))
        .filter(Boolean);

      if (cleaned.length) {
        result[productId] = cleaned;
      }

      return result;
    },
    {},
  );
}

function emit(next: ProductImageMap) {
  imageMap = normalizeImages(next);
  snapshot = JSON.stringify(imageMap);
  listeners.forEach((listener) => listener());
}

export function hydrateProductImages(next: ProductImageMap) {
  emit(next);
}

export async function loadProductImages() {
  if (typeof window === "undefined") {
    return imageMap;
  }

  loadPromise ??= fetch("/api/product-images", { credentials: "include" })
    .then((response) => response.json())
    .then((data: { images?: ProductImageMap }) => {
      const next = normalizeImages(data.images);
      emit(next);
      return next;
    })
    .catch(() => imageMap)
    .finally(() => {
      loadPromise = null;
    });

  return loadPromise;
}

async function saveProductImages(next: ProductImageMap) {
  emit(next);

  if (typeof window === "undefined") {
    return next;
  }

  const response = await fetch("/api/admin/product-images", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images: next }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    images?: ProductImageMap;
  };

  if (data.images) {
    emit(data.images);
    return data.images;
  }

  if (!response.ok) {
    throw new Error("Could not save product images.");
  }

  return next;
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  void loadProductImages();

  return () => {
    listeners.delete(onStoreChange);
  };
}

export function readProductImages(): ProductImageMap {
  return imageMap;
}

export function writeProductImages(images: ProductImageMap) {
  void saveProductImages(images);
}

export function useProductImages() {
  const value = useSyncExternalStore(subscribe, () => snapshot, () => "{}");

  return useMemo(() => normalizeImages(JSON.parse(value)), [value]);
}

export function productImages(product: Product, map: ProductImageMap) {
  const override = map[product.id]?.filter(Boolean);

  return override?.length ? override : product.images ?? [];
}
