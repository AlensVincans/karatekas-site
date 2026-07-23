import type { UserRole } from "./store-data";

export type PromoPrice = {
  b2c?: number;
  b2b?: number;
};

export type PromoPriceMap = Record<string, PromoPrice>;

export type PromoTargetType = "discounts" | "brand" | "category";
export type PromoRuleScope = "brand" | "product";
export type PromoRuleAudience = "user" | "b2b" | "both";

export type PromoRule = {
  id: string;
  scope: PromoRuleScope;
  target: string;
  percent: number;
  audience: PromoRuleAudience;
  active: boolean;
};

export type PromoBanner = {
  id: string;
  title: string;
  text: string;
  buttonText: string;
  href?: string;
  image: string;
  targetType?: PromoTargetType;
  targetValue?: string;
  active: boolean;
};

export type PromotionState = {
  prices: PromoPriceMap;
  rules: PromoRule[];
  banners: PromoBanner[];
};

export const emptyPromotionState: PromotionState = {
  prices: {},
  rules: [],
  banners: [],
};

function promoValue(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

function ruleApplies(
  rule: PromoRule,
  role: UserRole,
  context?: { productId?: string; brand?: string },
) {
  const isB2B = role === "b2b" || role === "admin";
  const audience = isB2B ? "b2b" : "user";
  const audienceMatches = rule.audience === "both" || rule.audience === audience;

  if (!rule.active || !audienceMatches || rule.percent <= 0) {
    return false;
  }

  if (rule.scope === "brand") {
    return Boolean(context?.brand) && context?.brand === rule.target;
  }

  return Boolean(context?.productId) && context?.productId === rule.target;
}

function bestRulePrice<T extends { final: number }>(
  price: T,
  role: UserRole,
  rules: PromoRule[],
  context?: { productId?: string; brand?: string },
) {
  return rules
    .filter((rule) => ruleApplies(rule, role, context))
    .map((rule) => ({
      rule,
      final: Math.max(0, price.final * (1 - Math.min(rule.percent, 100) / 100)),
    }))
    .sort((left, right) => left.final - right.final)[0];
}

export function applyPromoPrice<T extends { final: number; retail: number; isB2B: boolean }>(
  price: T,
  variationId: string,
  role: UserRole,
  promoPrices: PromoPriceMap,
  promoRules: PromoRule[] = [],
  context?: { productId?: string; brand?: string },
) {
  const isB2B = role === "b2b" || role === "admin";
  const promo = promoValue(isB2B ? promoPrices[variationId]?.b2b : promoPrices[variationId]?.b2c);
  const absolutePromo = typeof promo === "number" && promo < price.final ? promo : undefined;
  const rulePromo = bestRulePrice(price, role, promoRules, context);
  const ruleFinal = rulePromo && rulePromo.final < price.final ? rulePromo.final : undefined;
  const final = Math.min(absolutePromo ?? price.final, ruleFinal ?? price.final);
  const hasPromo = final < price.final;
  const compareAt = price.isB2B ? price.retail : hasPromo ? price.final : undefined;

  return {
    ...price,
    final,
    compareAt,
    hasPromo,
    promoRule: final === ruleFinal ? rulePromo?.rule : undefined,
  };
}

export function promoBannerHref(banner: PromoBanner) {
  if (banner.targetType === "brand" && banner.targetValue) {
    return `/catalog?brand=${encodeURIComponent(banner.targetValue)}`;
  }

  if (banner.targetType === "category" && banner.targetValue) {
    return `/catalog?category=${encodeURIComponent(banner.targetValue)}`;
  }

  if (banner.targetType === "discounts") {
    return "/catalog?promo=1";
  }

  return banner.href || "/catalog";
}
