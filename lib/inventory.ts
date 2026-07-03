import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { products } from "./store-data";

export type InventoryItem = {
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

type InventoryOverride = {
  physical?: number;
  reserved?: number;
  expected?: number;
};

type InventoryStore = {
  levels: Record<string, InventoryOverride>;
};

export type InventoryAdjustmentLine = {
  variationId?: string;
  quantity: number;
};

function inventoryStorePath() {
  return (
    process.env.KG_STOCK_FILE?.trim() ||
    path.join(process.cwd(), "data", "stock.json")
  );
}

function emptyStore(): InventoryStore {
  return { levels: {} };
}

function normalizeQty(value: unknown) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function baseItem(variationId: string) {
  for (const product of products) {
    const variation = product.variations.find((item) => item.id === variationId);

    if (variation) {
      return { product, variation };
    }
  }

  return null;
}

async function readStore(): Promise<InventoryStore> {
  try {
    const file = await readFile(inventoryStorePath(), "utf8");
    const parsed = JSON.parse(file) as Partial<InventoryStore>;

    return parsed.levels && typeof parsed.levels === "object"
      ? { levels: parsed.levels }
      : emptyStore();
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: InventoryStore) {
  const file = inventoryStorePath();
  const tempFile = `${file}.tmp`;

  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(tempFile, JSON.stringify(store, null, 2), "utf8");
  await rename(tempFile, file);
}

function mergeStock(variationId: string, overrides: Record<string, InventoryOverride>) {
  const found = baseItem(variationId);

  if (!found) {
    return null;
  }

  const override = overrides[variationId] ?? {};
  const stock = found.variation.stock;
  const physical = normalizeQty(override.physical ?? stock.physical);
  const reserved = normalizeQty(override.reserved ?? stock.reserved);
  const expected = normalizeQty(override.expected ?? stock.expected);

  return {
    product: found.product,
    variation: found.variation,
    physical,
    reserved,
    expected,
  };
}

export async function listInventory(): Promise<InventoryItem[]> {
  const store = await readStore();

  return products.flatMap((product) =>
    product.variations.map((variation) => {
      const stock = mergeStock(variation.id, store.levels);
      const physical = stock?.physical ?? variation.stock.physical;
      const reserved = stock?.reserved ?? variation.stock.reserved;
      const expected = stock?.expected ?? variation.stock.expected;

      return {
        productId: product.id,
        productName: product.name,
        brand: product.brand,
        category: product.category,
        variationId: variation.id,
        sku: variation.sku,
        color: variation.color,
        size: variation.size,
        physical,
        reserved,
        available: Math.max(0, physical - reserved),
        expected,
      };
    }),
  );
}

export async function inventoryLevelMap() {
  const items = await listInventory();

  return items.reduce<Record<string, InventoryItem>>((result, item) => {
    result[item.variationId] = item;
    return result;
  }, {});
}

export async function updateInventoryLevel(
  variationId: string,
  patch: Partial<Pick<InventoryItem, "physical" | "reserved" | "expected">>,
) {
  if (!baseItem(variationId)) {
    return null;
  }

  const store = await readStore();
  const current = mergeStock(variationId, store.levels);

  if (!current) {
    return null;
  }

  store.levels[variationId] = {
    physical: normalizeQty(patch.physical ?? current.physical),
    reserved: normalizeQty(patch.reserved ?? current.reserved),
    expected: normalizeQty(patch.expected ?? current.expected),
  };

  await writeStore(store);

  return inventoryLevelMap();
}

export async function decrementInventory(lines: InventoryAdjustmentLine[]) {
  const store = await readStore();
  let changed = false;

  for (const line of lines) {
    if (!line.variationId) {
      continue;
    }

    const current = mergeStock(line.variationId, store.levels);

    if (!current) {
      continue;
    }

    const quantity = normalizeQty(line.quantity);

    if (quantity <= 0) {
      continue;
    }

    store.levels[line.variationId] = {
      ...store.levels[line.variationId],
      physical: Math.max(0, current.physical - quantity),
      reserved: current.reserved,
      expected: current.expected,
    };
    changed = true;
  }

  if (changed) {
    await writeStore(store);
  }

  return changed;
}
