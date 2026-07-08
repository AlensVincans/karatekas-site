import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { products } from "./store-data";
import { dbQuery, hasDatabase } from "../db/postgres";

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
  if (hasDatabase()) {
    await ensureStockSeeded();
    const result = await dbQuery<{
      variation_id: string;
      product_id: string;
      product_name: string;
      brand: string;
      category: string;
      sku: string | null;
      color: string | null;
      size: string | null;
      physical: number;
      expected: number;
    }>(
      `select variation_id, product_id, product_name, brand, category, sku, color, size, physical, expected
       from stock_levels
       order by brand, product_name, size, color`,
    );

    return result.rows.map((row) => ({
      productId: row.product_id,
      productName: row.product_name,
      brand: row.brand,
      category: row.category,
      variationId: row.variation_id,
      sku: row.sku ?? "",
      color: row.color ?? undefined,
      size: row.size ?? undefined,
      physical: Number(row.physical),
      reserved: 0,
      available: Math.max(0, Number(row.physical)),
      expected: Number(row.expected),
    }));
  }

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
        reserved: 0,
        available: Math.max(0, physical),
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
  if (hasDatabase()) {
    await ensureStockSeeded();

    if (!baseItem(variationId)) {
      return null;
    }

    const current = await dbQuery<{ physical: number; expected: number }>(
      "select physical, expected from stock_levels where variation_id = $1",
      [variationId],
    );

    if (!current.rows[0]) {
      return null;
    }

    await dbQuery(
      `update stock_levels
       set physical = $2, expected = $3, updated_at = now()
       where variation_id = $1`,
      [
        variationId,
        normalizeQty(patch.physical ?? current.rows[0].physical),
        normalizeQty(patch.expected ?? current.rows[0].expected),
      ],
    );

    return inventoryLevelMap();
  }

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
  if (hasDatabase()) {
    await ensureStockSeeded();
    let changed = false;

    for (const line of lines) {
      if (!line.variationId) {
        continue;
      }

      const quantity = normalizeQty(line.quantity);

      if (quantity <= 0) {
        continue;
      }

      const result = await dbQuery(
        `update stock_levels
         set physical = greatest(0, physical - $2), updated_at = now()
         where variation_id = $1`,
        [line.variationId, quantity],
      );
      changed = changed || Boolean(result.rowCount);
    }

    return changed;
  }

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

export async function restoreInventory(lines: InventoryAdjustmentLine[]) {
  if (hasDatabase()) {
    await ensureStockSeeded();
    let changed = false;

    for (const line of lines) {
      if (!line.variationId) {
        continue;
      }

      const quantity = normalizeQty(line.quantity);

      if (quantity <= 0) {
        continue;
      }

      const result = await dbQuery(
        `update stock_levels
         set physical = physical + $2, updated_at = now()
         where variation_id = $1`,
        [line.variationId, quantity],
      );
      changed = changed || Boolean(result.rowCount);
    }

    return changed;
  }

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
      physical: current.physical + quantity,
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

let stockSeedPromise: Promise<void> | null = null;

async function ensureStockSeeded() {
  if (!hasDatabase()) {
    return;
  }

  stockSeedPromise ??= seedStockLevels();
  await stockSeedPromise;
}

async function seedStockLevels() {
  for (const product of products) {
    await dbQuery(
      `insert into products (id, name, brand, category, description, data)
       values ($1,$2,$3,$4,$5,$6::jsonb)
       on conflict (id) do update
       set name = excluded.name,
           brand = excluded.brand,
           category = excluded.category,
           description = excluded.description,
           data = excluded.data,
           updated_at = now()`,
      [
        product.id,
        product.name,
        product.brand,
        product.category,
        product.description,
        JSON.stringify(product),
      ],
    );

    for (const variation of product.variations) {
      await dbQuery(
        `insert into stock_levels (
          variation_id, product_id, product_name, brand, category, sku, color, size,
          physical, expected, purchase, shipping, customs, vat_rate, fx, lots
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb)
        on conflict (variation_id) do nothing`,
        [
          variation.id,
          product.id,
          product.name,
          product.brand,
          product.category,
          variation.sku,
          variation.color,
          variation.size,
          normalizeQty(variation.stock.physical),
          normalizeQty(variation.stock.expected),
          variation.stock.purchase,
          variation.stock.shipping,
          variation.stock.customs,
          variation.stock.vatRate,
          variation.stock.fx,
          JSON.stringify(variation.stock.lots),
        ],
      );
    }
  }
}
