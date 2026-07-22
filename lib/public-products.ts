import { inventoryLevelMap } from "./inventory";
import { getProduct, listProducts } from "./products-store";
import { isApprovedB2B } from "./server-auth";
import type { PublicUser } from "./auth-store";
import type { Product, Stock } from "./store-data";

function publicStock(available: number): Stock {
  return {
    physical: available,
    reserved: 0,
    expected: 0,
    purchase: 0,
    shipping: 0,
    customs: 0,
    vatRate: 21,
    fx: 1,
    lots: [],
  };
}

export function publicProduct(
  product: Product,
  user: PublicUser | null,
  levels: Awaited<ReturnType<typeof inventoryLevelMap>>,
): Product {
  const canUseB2B = isApprovedB2B(user);

  return {
    ...product,
    variations: product.variations.map((variation) => {
      const level = levels[variation.id];
      const available = level
        ? level.available
        : Math.max(0, variation.stock.physical - variation.stock.reserved);

      return {
        ...variation,
        b2b: canUseB2B ? variation.b2b : variation.b2c,
        stock: publicStock(available),
      };
    }),
  };
}

export async function listPublicProducts(user: PublicUser | null) {
  const [products, levels] = await Promise.all([listProducts(), inventoryLevelMap()]);

  return products.map((product) => publicProduct(product, user, levels));
}

export async function getPublicProduct(id: string, user: PublicUser | null) {
  const product = await getProduct(id);

  if (!product) {
    return null;
  }

  const levels = await inventoryLevelMap();

  return publicProduct(product, user, levels);
}
