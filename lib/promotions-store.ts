import { dbQuery, hasDatabase } from "../db/postgres";
import {
  emptyPromotionState,
  type PromoBanner,
  type PromoPriceMap,
  type PromoRule,
  type PromotionState,
} from "./promotion-core";

const promotionSettingsKey = "promotions";

function cleanPrice(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePrices(value: unknown): PromoPriceMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<PromoPriceMap>(
    (result, [variationId, price]) => {
      if (!price || typeof price !== "object" || Array.isArray(price)) {
        return result;
      }

      const record = price as Record<string, unknown>;
      const b2c = cleanPrice(record.b2c);
      const b2b = cleanPrice(record.b2b);

      if (b2c || b2b) {
        result[variationId] = { b2c, b2b };
      }

      return result;
    },
    {},
  );
}

function normalizeRules(value: unknown): PromoRule[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((rule) => {
      if (!rule || typeof rule !== "object") {
        return null;
      }

      const record = rule as Record<string, unknown>;
      const id = cleanText(record.id);
      const scope = record.scope === "product" ? "product" : "brand";
      const target = cleanText(record.target);
      const percent = Math.max(0, Math.min(100, Number(record.percent) || 0));
      const audience =
        record.audience === "user" || record.audience === "b2b"
          ? record.audience
          : "both";

      if (!id || !target || percent <= 0) {
        return null;
      }

      return {
        id,
        scope,
        target,
        percent,
        audience,
        active: Boolean(record.active),
      };
    })
    .filter((rule): rule is PromoRule => Boolean(rule));
}

function normalizeBanners(value: unknown): PromoBanner[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<PromoBanner[]>((result, banner) => {
      if (!banner || typeof banner !== "object") {
        return result;
      }

      const record = banner as Record<string, unknown>;
      const id = cleanText(record.id);
      const image = cleanText(record.image);
      const targetType: PromoBanner["targetType"] =
        record.targetType === "brand" || record.targetType === "category"
          ? record.targetType
          : "discounts";

      if (!id) {
        return result;
      }

      result.push({
        id,
        title: cleanText(record.title),
        text: cleanText(record.text),
        buttonText: cleanText(record.buttonText),
        href: cleanText(record.href) || undefined,
        image,
        targetType,
        targetValue: cleanText(record.targetValue),
        active: Boolean(record.active),
      });

      return result;
    }, []);
}

export function normalizePromotionState(value: unknown): PromotionState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyPromotionState;
  }

  const record = value as Record<string, unknown>;

  return {
    prices: normalizePrices(record.prices),
    rules: normalizeRules(record.rules),
    banners: normalizeBanners(record.banners),
  };
}

export async function getPromotionState(): Promise<PromotionState> {
  if (!hasDatabase()) {
    return emptyPromotionState;
  }

  const result = await dbQuery<{ value: unknown }>(
    "select value from site_settings where key = $1",
    [promotionSettingsKey],
  );

  return normalizePromotionState(result.rows[0]?.value);
}

export async function savePromotionState(input: unknown): Promise<PromotionState> {
  const state = normalizePromotionState(input);

  if (!hasDatabase()) {
    return state;
  }

  await dbQuery(
    `insert into site_settings (key, value, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [promotionSettingsKey, JSON.stringify(state)],
  );

  return state;
}
