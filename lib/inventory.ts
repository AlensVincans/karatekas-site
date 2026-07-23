import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";

import { products } from "./store-data";
import { dbQuery, dbTransaction, hasDatabase } from "../db/postgres";

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

export type InventoryCostPatch = {
  purchase?: number;
  shipping?: number;
  customs?: number;
  vatRate?: number;
  fx?: number;
  lots?: unknown;
};

export type InventoryCostSnapshot = {
  variationId: string;
  purchase: number;
  shipping: number;
  customs: number;
  vatRate: number;
  fx: number;
  lots: unknown[];
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

export type StockHistoryOptions = {
  actorUserId?: string;
  orderId?: string;
  note?: string;
};

type StockLevelSnapshot = {
  physical: number;
  reserved: number;
  expected?: number;
};

type QueryFn = Parameters<typeof dbTransaction>[0] extends (
  query: infer Query,
) => Promise<unknown>
  ? Query
  : never;

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

function normalizeCost(value: unknown, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

function normalizeLots(value: unknown) {
  return Array.isArray(value) ? value.filter((lot) => lot && typeof lot === "object") : [];
}

function stockHistoryId() {
  return `stockhist-${Date.now().toString(36)}-${randomBytes(6).toString("hex")}`;
}

async function recordStockHistory(
  query: QueryFn,
  input: {
    variationId: string;
    action: string;
    quantity: number;
    oldLevel: StockLevelSnapshot;
    newLevel: StockLevelSnapshot;
  } & StockHistoryOptions,
) {
  await query(
    `insert into stock_history (
      id, variation_id, action, quantity, old_physical, new_physical,
      old_reserved, new_reserved, actor_user_id, order_id, note
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      stockHistoryId(),
      input.variationId,
      input.action,
      input.quantity,
      input.oldLevel.physical,
      input.newLevel.physical,
      input.oldLevel.reserved,
      input.newLevel.reserved,
      input.actorUserId ?? null,
      input.orderId ?? null,
      input.note ?? null,
    ],
  );
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
      reserved: number;
      expected: number;
    }>(
      `select variation_id, product_id, product_name, brand, category, sku, color, size, physical, reserved, expected
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
      reserved: Number(row.reserved),
      available: Math.max(0, Number(row.physical) - Number(row.reserved)),
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
  options: StockHistoryOptions = {},
) {
  if (hasDatabase()) {
    await ensureStockSeeded();

    if (!baseItem(variationId)) {
      return null;
    }

    await dbTransaction(async (query) => {
      const current = await query<{ physical: number; reserved: number; expected: number }>(
        "select physical, reserved, expected from stock_levels where variation_id = $1 for update",
        [variationId],
      );
      const level = current.rows[0];

      if (!level) {
        return;
      }

      const next = {
        physical: normalizeQty(patch.physical ?? level.physical),
        reserved: normalizeQty(patch.reserved ?? level.reserved),
        expected: normalizeQty(patch.expected ?? level.expected),
      };

      await query(
        `update stock_levels
         set physical = $2, reserved = $3, expected = $4, updated_at = now()
         where variation_id = $1`,
        [variationId, next.physical, next.reserved, next.expected],
      );

      await recordStockHistory(query, {
        variationId,
        action: "manual_update",
        quantity: next.physical - Number(level.physical),
        oldLevel: {
          physical: Number(level.physical),
          reserved: Number(level.reserved),
          expected: Number(level.expected),
        },
        newLevel: next,
        ...options,
      });
    });

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

export async function updateInventoryCost(
  variationId: string,
  patch: InventoryCostPatch,
): Promise<InventoryCostSnapshot | null> {
  if (!hasDatabase()) {
    return null;
  }

  await ensureStockSeeded();

  let updated: InventoryCostSnapshot | null = null;

  await dbTransaction(async (query) => {
    const current = await query<{
      purchase: number;
      shipping: number;
      customs: number;
      vat_rate: number;
      fx: number;
      lots: unknown;
    }>(
      `select purchase, shipping, customs, vat_rate, fx, lots
       from stock_levels
       where variation_id = $1
       for update`,
      [variationId],
    );
    const level = current.rows[0];

    if (!level) {
      return;
    }

    const next = {
      variationId,
      purchase: normalizeCost(patch.purchase, Number(level.purchase) || 0),
      shipping: normalizeCost(patch.shipping, Number(level.shipping) || 0),
      customs: normalizeCost(patch.customs, Number(level.customs) || 0),
      vatRate: normalizeCost(patch.vatRate, Number(level.vat_rate) || 21),
      fx: normalizeCost(patch.fx, Number(level.fx) || 1),
      lots: "lots" in patch ? normalizeLots(patch.lots) : normalizeLots(level.lots),
    };

    await query(
      `update stock_levels
       set purchase = $2,
           shipping = $3,
           customs = $4,
           vat_rate = $5,
           fx = $6,
           lots = $7::jsonb,
           updated_at = now()
       where variation_id = $1`,
      [
        variationId,
        next.purchase,
        next.shipping,
        next.customs,
        next.vatRate,
        next.fx,
        JSON.stringify(next.lots),
      ],
    );

    updated = next;
  });

  return updated;
}

export async function decrementInventory(
  lines: InventoryAdjustmentLine[],
  options: StockHistoryOptions = {},
) {
  if (hasDatabase()) {
    await ensureStockSeeded();

    return dbTransaction(async (query) => {
      let changed = false;

      for (const line of lines) {
        if (!line.variationId) {
          continue;
        }

        const quantity = normalizeQty(line.quantity);

        if (quantity <= 0) {
          continue;
        }

        const current = await query<{ physical: number; reserved: number }>(
          "select physical, reserved from stock_levels where variation_id = $1 for update",
          [line.variationId],
        );
        const level = current.rows[0];

        if (!level || Number(level.physical) < quantity) {
          throw new Error("Not enough stock for selected product.");
        }

        const next = {
          physical: Number(level.physical) - quantity,
          reserved: Number(level.reserved),
        };

        await query(
          `update stock_levels
           set physical = $2, updated_at = now()
           where variation_id = $1`,
          [line.variationId, next.physical],
        );
        await recordStockHistory(query, {
          variationId: line.variationId,
          action: "decrement",
          quantity,
          oldLevel: {
            physical: Number(level.physical),
            reserved: Number(level.reserved),
          },
          newLevel: next,
          ...options,
        });
        changed = true;
      }

      return changed;
    });
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

    if (current.physical < quantity) {
      throw new Error("Not enough stock for selected product.");
    }

    store.levels[line.variationId] = {
      ...store.levels[line.variationId],
      physical: current.physical - quantity,
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

export async function reserveInventory(
  lines: InventoryAdjustmentLine[],
  options: StockHistoryOptions = {},
) {
  if (hasDatabase()) {
    await ensureStockSeeded();

    return dbTransaction(async (query) => {
      let changed = false;

      for (const line of lines) {
        if (!line.variationId) {
          continue;
        }

        const quantity = normalizeQty(line.quantity);

        if (quantity <= 0) {
          continue;
        }

        const current = await query<{ physical: number; reserved: number }>(
          "select physical, reserved from stock_levels where variation_id = $1 for update",
          [line.variationId],
        );
        const level = current.rows[0];

        if (!level) {
          throw new Error("Variation not found in stock.");
        }

        if (Number(level.physical) - Number(level.reserved) < quantity) {
          throw new Error("Not enough stock for selected product.");
        }

        const next = {
          physical: Number(level.physical),
          reserved: Number(level.reserved) + quantity,
        };

        await query(
          `update stock_levels
           set reserved = $2, updated_at = now()
           where variation_id = $1`,
          [line.variationId, next.reserved],
        );
        await recordStockHistory(query, {
          variationId: line.variationId,
          action: "reserve",
          quantity,
          oldLevel: {
            physical: Number(level.physical),
            reserved: Number(level.reserved),
          },
          newLevel: next,
          ...options,
        });
        changed = true;
      }

      return changed;
    });
  }

  const store = await readStore();
  let changed = false;

  for (const line of lines) {
    if (!line.variationId) {
      continue;
    }

    const current = mergeStock(line.variationId, store.levels);
    const quantity = normalizeQty(line.quantity);

    if (!current || quantity <= 0) {
      continue;
    }

    if (current.physical - current.reserved < quantity) {
      throw new Error("Not enough stock for selected product.");
    }

    store.levels[line.variationId] = {
      ...store.levels[line.variationId],
      physical: current.physical,
      reserved: current.reserved + quantity,
      expected: current.expected,
    };
    changed = true;
  }

  if (changed) {
    await writeStore(store);
  }

  return changed;
}

export async function confirmInventoryReservation(
  lines: InventoryAdjustmentLine[],
  options: StockHistoryOptions = {},
) {
  if (hasDatabase()) {
    await ensureStockSeeded();

    return dbTransaction(async (query) => {
      let changed = false;

      for (const line of lines) {
        if (!line.variationId) {
          continue;
        }

        const quantity = normalizeQty(line.quantity);

        if (quantity <= 0) {
          continue;
        }

        const current = await query<{ physical: number; reserved: number }>(
          "select physical, reserved from stock_levels where variation_id = $1 for update",
          [line.variationId],
        );
        const level = current.rows[0];

        if (!level || Number(level.physical) < quantity || Number(level.reserved) < quantity) {
          throw new Error("Reserved stock is not available.");
        }

        const next = {
          physical: Number(level.physical) - quantity,
          reserved: Number(level.reserved) - quantity,
        };

        await query(
          `update stock_levels
           set physical = $2,
               reserved = $3,
               updated_at = now()
           where variation_id = $1`,
          [line.variationId, next.physical, next.reserved],
        );
        await recordStockHistory(query, {
          variationId: line.variationId,
          action: "confirm",
          quantity,
          oldLevel: {
            physical: Number(level.physical),
            reserved: Number(level.reserved),
          },
          newLevel: next,
          ...options,
        });
        changed = true;
      }

      return changed;
    });
  }

  const store = await readStore();
  let changed = false;

  for (const line of lines) {
    if (!line.variationId) {
      continue;
    }

    const current = mergeStock(line.variationId, store.levels);
    const quantity = normalizeQty(line.quantity);

    if (!current || quantity <= 0) {
      continue;
    }

    if (current.physical < quantity || current.reserved < quantity) {
      throw new Error("Reserved stock is not available.");
    }

    store.levels[line.variationId] = {
      ...store.levels[line.variationId],
      physical: current.physical - quantity,
      reserved: current.reserved - quantity,
      expected: current.expected,
    };
    changed = true;
  }

  if (changed) {
    await writeStore(store);
  }

  return changed;
}

export async function releaseInventoryReservation(
  lines: InventoryAdjustmentLine[],
  options: StockHistoryOptions = {},
) {
  if (hasDatabase()) {
    await ensureStockSeeded();

    return dbTransaction(async (query) => {
      let changed = false;

      for (const line of lines) {
        if (!line.variationId) {
          continue;
        }

        const quantity = normalizeQty(line.quantity);

        if (quantity <= 0) {
          continue;
        }

        const current = await query<{ physical: number; reserved: number }>(
          "select physical, reserved from stock_levels where variation_id = $1 for update",
          [line.variationId],
        );
        const level = current.rows[0];

        if (!level) {
          continue;
        }

        const next = {
          physical: Number(level.physical),
          reserved: Math.max(0, Number(level.reserved) - quantity),
        };

        await query(
          `update stock_levels
           set reserved = $2, updated_at = now()
           where variation_id = $1`,
          [line.variationId, next.reserved],
        );
        await recordStockHistory(query, {
          variationId: line.variationId,
          action: "release",
          quantity,
          oldLevel: {
            physical: Number(level.physical),
            reserved: Number(level.reserved),
          },
          newLevel: next,
          ...options,
        });
        changed = true;
      }

      return changed;
    });
  }

  const store = await readStore();
  let changed = false;

  for (const line of lines) {
    if (!line.variationId) {
      continue;
    }

    const current = mergeStock(line.variationId, store.levels);
    const quantity = normalizeQty(line.quantity);

    if (!current || quantity <= 0) {
      continue;
    }

    store.levels[line.variationId] = {
      ...store.levels[line.variationId],
      physical: current.physical,
      reserved: Math.max(0, current.reserved - quantity),
      expected: current.expected,
    };
    changed = true;
  }

  if (changed) {
    await writeStore(store);
  }

  return changed;
}

export async function restoreInventory(
  lines: InventoryAdjustmentLine[],
  options: StockHistoryOptions = {},
) {
  if (hasDatabase()) {
    await ensureStockSeeded();

    return dbTransaction(async (query) => {
      let changed = false;

      for (const line of lines) {
        if (!line.variationId) {
          continue;
        }

        const quantity = normalizeQty(line.quantity);

        if (quantity <= 0) {
          continue;
        }

        const current = await query<{ physical: number; reserved: number }>(
          "select physical, reserved from stock_levels where variation_id = $1 for update",
          [line.variationId],
        );
        const level = current.rows[0];

        if (!level) {
          continue;
        }

        const next = {
          physical: Number(level.physical) + quantity,
          reserved: Number(level.reserved),
        };

        await query(
          `update stock_levels
           set physical = $2, updated_at = now()
           where variation_id = $1`,
          [line.variationId, next.physical],
        );
        await recordStockHistory(query, {
          variationId: line.variationId,
          action: "restore",
          quantity,
          oldLevel: {
            physical: Number(level.physical),
            reserved: Number(level.reserved),
          },
          newLevel: next,
          ...options,
        });
        changed = true;
      }

      return changed;
    });
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
          physical, reserved, expected, purchase, shipping, customs, vat_rate, fx, lots
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb)
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
          normalizeQty(variation.stock.reserved),
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
