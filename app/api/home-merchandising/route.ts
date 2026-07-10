import { hasDatabase, dbQuery } from "../../../db";
import { listOrders } from "../../../lib/orders";
import { listProducts } from "../../../lib/products-store";
import { available, type Product } from "../../../lib/store-data";

export const runtime = "nodejs";

type ProductDateRow = {
  id: string;
};

function stockedScore(product: Product) {
  return product.variations.reduce(
    (sum, variation) => sum + available(variation.stock),
    0,
  );
}

export async function GET() {
  const products = await listProducts();
  const variationToProduct = new Map<string, string>();

  for (const product of products) {
    for (const variation of product.variations) {
      variationToProduct.set(variation.id, product.id);
    }
  }

  const orders = await listOrders();
  const sales = new Map<string, number>();

  for (const order of orders) {
    if (order.paymentStatus === "cancelled") {
      continue;
    }

    for (const line of order.lines) {
      const productId = line.productId || (
        line.variationId ? variationToProduct.get(line.variationId) : undefined
      );

      if (!productId) {
        continue;
      }

      sales.set(productId, (sales.get(productId) ?? 0) + Math.max(0, line.quantity));
    }
  }

  const bestSellerIds = Array.from(sales.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([productId]) => productId)
    .slice(0, 16);

  const fallbackBestSellerIds = [...products]
    .filter((product) => stockedScore(product) > 0)
    .sort((left, right) => stockedScore(right) - stockedScore(left))
    .map((product) => product.id)
    .slice(0, 16);

  let newProductIds = [...products].slice(-12).reverse().map((product) => product.id);

  if (hasDatabase()) {
    const result = await dbQuery<ProductDateRow>(
      "select id from products where active = true order by created_at desc, updated_at desc limit 12",
    );

    if (result.rows.length) {
      newProductIds = result.rows.map((row) => row.id);
    }
  }

  return Response.json({
    bestSellerIds: bestSellerIds.length ? bestSellerIds : fallbackBestSellerIds,
    bestSellerCounts: Object.fromEntries(sales),
    bestSellerSource: bestSellerIds.length ? "orders" : "stock",
    newProductIds,
  });
}
