import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(root, "..");
const productsSource = path.join(projectRoot, "lib", "karate-products.ts");

function databaseUrl() {
  const value = process.env.DATABASE_URL?.trim();

  if (!value) {
    throw new Error("DATABASE_URL is required to seed PostgreSQL.");
  }

  let url = /[?&]sslmode=/i.test(value)
    ? value
    : `${value}${value.includes("?") ? "&" : "?"}sslmode=require`;

  if (!/[?&]uselibpqcompat=/i.test(url)) {
    url = `${url}${url.includes("?") ? "&" : "?"}uselibpqcompat=true`;
  }

  return url;
}

async function loadProducts() {
  const source = await readFile(productsSource, "utf8");
  const marker = "export const karateProducts: Product[] = ";
  const start = source.indexOf(marker);

  if (start < 0) {
    throw new Error("Could not find karateProducts export.");
  }

  const jsonStart = start + marker.length;
  const jsonEnd = source.lastIndexOf("];");

  if (jsonEnd < jsonStart) {
    throw new Error("Could not parse karateProducts export.");
  }

  return JSON.parse(source.slice(jsonStart, jsonEnd + 1));
}

async function upsertProducts(client, products) {
  const activeIds = products.map((product) => product.id);

  if (activeIds.length) {
    await client.query(
      "update products set active = false, updated_at = now() where not (id = any($1::text[]))",
      [activeIds],
    );
  }

  for (const product of products) {
    await client.query(
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
        product.description ?? "",
        JSON.stringify(product),
      ],
    );

    const variationIds = product.variations.map((variation) => variation.id);
    await client.query(
      "delete from stock_levels where product_id = $1 and not (variation_id = any($2::text[]))",
      [product.id, variationIds],
    );

    for (const variation of product.variations) {
      const stock = variation.stock ?? {};

      await client.query(
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
          Math.max(0, Math.floor(Number(stock.physical ?? 0))),
          Math.max(0, Math.floor(Number(stock.expected ?? 0))),
          Number(stock.purchase ?? 0),
          Number(stock.shipping ?? 0),
          Number(stock.customs ?? 0),
          Number(stock.vatRate ?? 21),
          Number(stock.fx ?? 1),
          JSON.stringify(stock.lots ?? []),
        ],
      );
    }
  }
}

async function main() {
  const products = await loadProducts();
  const pool = new Pool({
    connectionString: databaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();

  try {
    await client.query("begin");
    await upsertProducts(client, products);
    await client.query(
      `insert into site_settings (key, value)
       values ('catalog_seed', $1::jsonb)
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [
        JSON.stringify({
          source: "lib/karate-products.ts",
          products: products.length,
          variations: products.reduce((sum, product) => sum + product.variations.length, 0),
          seededAt: new Date().toISOString(),
        }),
      ],
    );
    await client.query("commit");

    const variations = products.reduce((sum, product) => sum + product.variations.length, 0);
    console.log(`seeded products=${products.length} variations=${variations}`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
