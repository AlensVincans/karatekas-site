import { dbQuery, dbTransaction, hasDatabase } from "../db/postgres";

export type ProductImageMap = Record<string, string[]>;

function cleanImage(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeProductImageMap(value: unknown): ProductImageMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<ProductImageMap>(
    (result, [productId, images]) => {
      if (!Array.isArray(images)) {
        return result;
      }

      const cleaned = images.map(cleanImage).filter(Boolean).slice(0, 20);

      if (cleaned.length) {
        result[productId] = cleaned;
      }

      return result;
    },
    {},
  );
}

export async function getProductImageMap(): Promise<ProductImageMap> {
  if (!hasDatabase()) {
    return {};
  }

  const result = await dbQuery<{ product_id: string; images: unknown }>(
    "select product_id, images from product_image_overrides",
  );

  return result.rows.reduce<ProductImageMap>((map, row) => {
    const images = normalizeProductImageMap({ [row.product_id]: row.images })[row.product_id];

    if (images?.length) {
      map[row.product_id] = images;
    }

    return map;
  }, {});
}

export async function saveProductImageMap(input: unknown): Promise<ProductImageMap> {
  const map = normalizeProductImageMap(input);

  if (!hasDatabase()) {
    return map;
  }

  await dbTransaction(async (query) => {
    await query("delete from product_image_overrides");

    for (const [productId, images] of Object.entries(map)) {
      await query(
        `insert into product_image_overrides (product_id, images, updated_at)
         values ($1, $2::jsonb, now())
         on conflict (product_id) do update set images = excluded.images, updated_at = now()`,
        [productId, JSON.stringify(images)],
      );
    }
  });

  return map;
}
