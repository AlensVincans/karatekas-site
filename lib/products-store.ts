import { dbQuery, dbTransaction, hasDatabase } from "../db";
import { products as seedProducts, type Product } from "./store-data";

type ProductRow = {
  id: string;
  data: Product;
};

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

  return result.rows.map((row) => row.data);
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

  return result.rows[0]?.data;
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
        `insert into products (id, name, brand, category, description, data, active)
         values ($1, $2, $3, $4, $5, $6::jsonb, true)
         on conflict (id) do update set
           name = excluded.name,
           brand = excluded.brand,
           category = excluded.category,
           description = excluded.description,
           data = excluded.data,
           active = true,
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

      const variationIds = product.variations.map((variation) => variation.id);
      await query(
        "delete from stock_levels where product_id = $1 and not (variation_id = any($2::text[]))",
        [product.id, variationIds],
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
            physical = excluded.physical,
            expected = excluded.expected,
            purchase = excluded.purchase,
            shipping = excluded.shipping,
            customs = excluded.customs,
            vat_rate = excluded.vat_rate,
            fx = excluded.fx,
            lots = excluded.lots,
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
