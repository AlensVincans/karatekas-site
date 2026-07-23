import { dbQuery, dbTransaction, hasDatabase } from "../db";
import { products as seedProducts, type Product } from "./store-data";
import { getProductImageMap } from "./product-media-store";

type ProductRow = {
  id: string;
  data: Product;
};

function dimensionsFor(product: Product) {
  return {
    weightGrams: product.weightGrams ?? null,
    lengthCm: product.lengthCm ?? null,
    widthCm: product.widthCm ?? null,
    heightCm: product.heightCm ?? null,
  };
}

async function withImageOverrides(products: Product[]) {
  if (!hasDatabase()) {
    return products;
  }

  const imageMap = await getProductImageMap().catch(() => ({} as Awaited<ReturnType<typeof getProductImageMap>>));

  return products.map((product) => ({
    ...product,
    images: imageMap[product.id]?.length ? imageMap[product.id] : product.images,
  }));
}

let seedPromise: Promise<void> | null = null;

async function seedProductsIfNeeded() {
  if (!hasDatabase()) {
    return;
  }

  if (!seedPromise) {
    seedPromise = (async () => {
      const count = await dbQuery<{ count: string }>("select count(*) from products");

      if (Number(count.rows[0]?.count ?? 0) > 0) {
        return;
      }

      await saveProducts(seedProducts);
    })();
  }

  await seedPromise;
}

export async function listProducts() {
  if (!hasDatabase()) {
    return seedProducts;
  }

  await seedProductsIfNeeded();

  const result = await dbQuery<ProductRow>(
    "select id, data from products where active = true order by brand asc, name asc",
  );

  return withImageOverrides(result.rows.map((row) => row.data));
}

export async function getProduct(productId: string) {
  if (!hasDatabase()) {
    return seedProducts.find((product) => product.id === productId);
  }

  await seedProductsIfNeeded();

  const result = await dbQuery<ProductRow>(
    "select id, data from products where id = $1 and active = true limit 1",
    [productId],
  );

  const product = result.rows[0]?.data;

  if (!product) {
    return undefined;
  }

  return (await withImageOverrides([product]))[0];
}

export async function saveProducts(nextProducts: Product[]) {
  if (!hasDatabase()) {
    return nextProducts;
  }

  await dbTransaction(async (query) => {
    const activeIds = nextProducts.map((product) => product.id);

    if (activeIds.length) {
      await query("update products set active = false, updated_at = now() where not (id = any($1::text[]))", [
        activeIds,
      ]);
    } else {
      await query("update products set active = false, updated_at = now()");
    }

    for (const product of nextProducts) {
      await query(
        `insert into products (
           id, name, brand, category, description, data, active,
           weight_grams, length_cm, width_cm, height_cm
         )
         values ($1, $2, $3, $4, $5, $6::jsonb, true, $7, $8, $9, $10)
         on conflict (id) do update set
           name = excluded.name,
           brand = excluded.brand,
           category = excluded.category,
           description = excluded.description,
           data = excluded.data,
           weight_grams = excluded.weight_grams,
           length_cm = excluded.length_cm,
           width_cm = excluded.width_cm,
           height_cm = excluded.height_cm,
           active = true,
           updated_at = now()`,
        [
          product.id,
          product.name,
          product.brand,
          product.category,
          product.description,
          JSON.stringify(product),
          dimensionsFor(product).weightGrams,
          dimensionsFor(product).lengthCm,
          dimensionsFor(product).widthCm,
          dimensionsFor(product).heightCm,
        ],
      );

      const variationIds = product.variations.map((variation) => variation.id);
      await query(
        "update stock_levels set product_name = $3, brand = $4, category = $5, updated_at = now() where product_id = $1 and not (variation_id = any($2::text[]))",
        [product.id, variationIds, product.name, product.brand, product.category],
      );

      for (const variation of product.variations) {
        await query(
          `insert into stock_levels (
            variation_id, product_id, product_name, brand, category, sku, color, size,
            physical, expected, purchase, shipping, customs, vat_rate, fx, lots
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb)
          on conflict (variation_id) do update set
            product_id = excluded.product_id,
            product_name = excluded.product_name,
            brand = excluded.brand,
            category = excluded.category,
            sku = excluded.sku,
            color = excluded.color,
            size = excluded.size,
            updated_at = now()`,
          [
            variation.id,
            product.id,
            product.name,
            product.brand,
            product.category,
            variation.sku,
            variation.color,
            variation.size,
            variation.stock.physical,
            variation.stock.expected,
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
  });

  return nextProducts;
}
