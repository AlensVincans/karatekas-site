"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { UserRole } from "./store-data";

export type PromoPrice = {
  b2c?: number;
  b2b?: number;
};

export type PromoPriceMap = Record<string, PromoPrice>;

export type PromoTargetType = "discounts" | "brand" | "category";

export type PromoBanner = {
  id: string;
  title: string;
  text: string;
  buttonText: string;
  href?: string;
  image: string;
  targetType?: PromoTargetType;
  targetValue?: string;
  active: boolean;
};

const promoPriceKey = "kg_promo_prices";
const promoBannerKey = "kg_promo_banners";
const promoChangeEvent = "kg-promo-change";

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
  window.addEventListener(promoChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(promoChangeEvent, onStoreChange);
  };
}

function notifyPromotionsChanged() {
  window.dispatchEvent(new Event(promoChangeEvent));
}

export function readPromoPrices(): PromoPriceMap {
  return parseJson(browserSnapshot(promoPriceKey, "{}"), {});
}

export function writePromoPrices(prices: PromoPriceMap) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(promoPriceKey, JSON.stringify(prices));
  notifyPromotionsChanged();
}

export function usePromoPrices() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => browserSnapshot(promoPriceKey, "{}"),
    () => "{}",
  );

  return useMemo(() => parseJson<PromoPriceMap>(snapshot, {}), [snapshot]);
}

export function readPromoBanners(): PromoBanner[] {
  return parseJson(browserSnapshot(promoBannerKey, "[]"), []);
}

export function writePromoBanners(banners: PromoBanner[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(promoBannerKey, JSON.stringify(banners));
  notifyPromotionsChanged();
}

export function usePromoBanners() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => browserSnapshot(promoBannerKey, "[]"),
    () => "[]",
  );

  return useMemo(() => parseJson<PromoBanner[]>(snapshot, []), [snapshot]);
}

export function useActivePromoBanners() {
  const banners = usePromoBanners();

  return useMemo(() => banners.filter((banner) => banner.active), [banners]);
}

export function promoBannerHref(banner: PromoBanner) {
  if (banner.targetType === "brand" && banner.targetValue) {
    return `/catalog?brand=${encodeURIComponent(banner.targetValue)}`;
  }

  if (banner.targetType === "category" && banner.targetValue) {
    return `/catalog?category=${encodeURIComponent(banner.targetValue)}`;
  }

  if (banner.targetType === "discounts") {
    return "/catalog?promo=1";
  }

  return banner.href || "/catalog";
}

function promoValue(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

export function applyPromoPrice<T extends { final: number; retail: number; isB2B: boolean }>(
  price: T,
  variationId: string,
  role: UserRole,
  promoPrices: PromoPriceMap,
) {
  const isB2B = role === "b2b" || role === "admin";
  const promo = promoValue(isB2B ? promoPrices[variationId]?.b2b : promoPrices[variationId]?.b2c);
  const hasPromo = typeof promo === "number" && promo < price.final;
  const final = hasPromo ? promo : price.final;
  const compareAt = price.isB2B ? price.retail : hasPromo ? price.final : undefined;

  return {
    ...price,
    final,
    compareAt,
    hasPromo,
  };
}
