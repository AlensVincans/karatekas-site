"use client";

import { useMemo, useSyncExternalStore } from "react";
import { csrfHeaders } from "./client-csrf";
import {
  emptyPromotionState,
  type PromoBanner,
  type PromoPriceMap,
  type PromoRule,
  type PromotionState,
} from "./promotion-core";

export {
  applyPromoPrice,
  promoBannerHref,
  type PromoBanner,
  type PromoPrice,
  type PromoPriceMap,
  type PromoRule,
  type PromoRuleAudience,
  type PromoRuleScope,
  type PromoTargetType,
  type PromotionState,
} from "./promotion-core";

let state: PromotionState = emptyPromotionState;
let snapshot = JSON.stringify(state);
let loadPromise: Promise<PromotionState> | null = null;
const listeners = new Set<() => void>();

function emit(next: PromotionState) {
  state = next;
  snapshot = JSON.stringify(next);
  listeners.forEach((listener) => listener());
}

function parsePromotionState(value: unknown): PromotionState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyPromotionState;
  }

  const record = value as Partial<PromotionState>;

  return {
    prices: record.prices && typeof record.prices === "object" ? record.prices : {},
    rules: Array.isArray(record.rules) ? record.rules : [],
    banners: Array.isArray(record.banners) ? record.banners : [],
  };
}

export function hydratePromotions(next: PromotionState) {
  emit(parsePromotionState(next));
}

export async function loadPromotions() {
  if (typeof window === "undefined") {
    return state;
  }

  loadPromise ??= fetch("/api/promotions", { credentials: "include" })
    .then((response) => response.json())
    .then((data: { promotions?: PromotionState }) => {
      const next = parsePromotionState(data.promotions);
      emit(next);
      return next;
    })
    .catch(() => state)
    .finally(() => {
      loadPromise = null;
    });

  return loadPromise;
}

async function savePromotions(next: PromotionState) {
  emit(next);

  if (typeof window === "undefined") {
    return next;
  }

  const response = await fetch("/api/admin/promotions", {
    method: "PUT",
    credentials: "include",
    headers: csrfHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ promotions: next }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    promotions?: PromotionState;
  };

  if (data.promotions) {
    emit(parsePromotionState(data.promotions));
    return parsePromotionState(data.promotions);
  }

  if (!response.ok) {
    throw new Error("Could not save promotions.");
  }

  return next;
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  void loadPromotions();

  return () => {
    listeners.delete(onStoreChange);
  };
}

function currentSnapshot() {
  return snapshot;
}

function serverSnapshot() {
  return JSON.stringify(emptyPromotionState);
}

export function readPromoPrices(): PromoPriceMap {
  return state.prices;
}

export function writePromoPrices(prices: PromoPriceMap) {
  void savePromotions({ ...state, prices });
}

export function usePromoPrices() {
  const value = useSyncExternalStore(subscribe, currentSnapshot, serverSnapshot);

  return useMemo(
    () => parsePromotionState(JSON.parse(value)).prices,
    [value],
  );
}

export function readPromoRules(): PromoRule[] {
  return state.rules;
}

export function writePromoRules(rules: PromoRule[]) {
  void savePromotions({ ...state, rules });
}

export function usePromoRules() {
  const value = useSyncExternalStore(subscribe, currentSnapshot, serverSnapshot);

  return useMemo(
    () => parsePromotionState(JSON.parse(value)).rules,
    [value],
  );
}

export function readPromoBanners(): PromoBanner[] {
  return state.banners;
}

export function writePromoBanners(banners: PromoBanner[]) {
  void savePromotions({ ...state, banners });
}

export function usePromoBanners() {
  const value = useSyncExternalStore(subscribe, currentSnapshot, serverSnapshot);

  return useMemo(
    () => parsePromotionState(JSON.parse(value)).banners,
    [value],
  );
}

export function useActivePromoBanners() {
  const banners = usePromoBanners();

  return useMemo(() => banners.filter((banner) => banner.active), [banners]);
}
