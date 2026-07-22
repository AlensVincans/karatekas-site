"use client";

import { useEffect, useMemo, useState } from "react";
import type { Variation } from "./store-data";

export type ClientInventoryItem = {
  productId: string;
  productName: string;
  brand: string;
  category: string;
  variationId: string;
  sku: string;
  color?: string;
  size?: string;
  physical: number;
  reserved: number;
  available: number;
  expected: number;
};

export type ClientInventoryMap = Record<string, ClientInventoryItem>;

let cachedLevels: ClientInventoryMap = {};
let cachedItems: ClientInventoryItem[] = [];
let loadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emitInventoryChange() {
  listeners.forEach((listener) => listener());
}

function loadInventory() {
  if (!loadPromise) {
    loadPromise = fetch("/api/inventory")
      .then((response) => response.json())
      .then((data: { levels?: ClientInventoryMap; items?: ClientInventoryItem[] }) => {
        cachedLevels = data.levels ?? {};
        cachedItems = data.items ?? [];
        emitInventoryChange();
      })
      .catch(() => undefined)
      .finally(() => {
        loadPromise = null;
      });
  }

  return loadPromise;
}

export function useInventoryLevels() {
  const [levels, setLocalLevels] = useState<ClientInventoryMap>(cachedLevels);
  const [items, setLocalItems] = useState<ClientInventoryItem[]>(cachedItems);

  useEffect(() => {
    const listener = () => {
      setLocalLevels(cachedLevels);
      setLocalItems(cachedItems);
    };

    listeners.add(listener);
    void loadInventory();

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return useMemo(
    () => ({
      items,
      levels,
      setLevels: (next: ClientInventoryMap) => {
        cachedLevels = next;
        cachedItems = Object.values(next);
        emitInventoryChange();
      },
      setItems: (next: ClientInventoryItem[]) => {
        cachedItems = next;
        cachedLevels = next.reduce<ClientInventoryMap>((result, item) => {
          result[item.variationId] = item;
          return result;
        }, {});
        emitInventoryChange();
      },
    }),
    [items, levels],
  );
}

export function physicalStock(
  variation: Variation,
  levels: ClientInventoryMap,
) {
  return levels[variation.id]?.physical ?? variation.stock.physical;
}

export function reservedStock(
  variation: Variation,
  levels: ClientInventoryMap,
) {
  return levels[variation.id]?.reserved ?? 0;
}

export function availableStock(
  variation: Variation,
  levels: ClientInventoryMap,
) {
  return Math.max(0, physicalStock(variation, levels) - reservedStock(variation, levels));
}
