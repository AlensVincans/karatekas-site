import type { DiscountRule, Product, UserRole, Variation } from "./store-data";

export type PricedVariation = {
  base: number;
  retail: number;
  final: number;
  discount?: DiscountRule;
  discountValue: number;
  isB2B: boolean;
};

export function pricedVariation(
  _product: Product,
  variation: Variation,
  role: UserRole,
): PricedVariation {
  const isB2B = role === "b2b" || role === "admin";
  const base = isB2B ? variation.b2b : variation.b2c;

  return {
    base,
    retail: variation.b2c,
    final: Math.max(0, base),
    discount: undefined,
    discountValue: 0,
    isB2B,
  };
}
