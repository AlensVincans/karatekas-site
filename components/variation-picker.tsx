"use client";

import type { CSSProperties } from "react";
import { colorHex, colorLabel } from "../lib/i18n";
import type { Product, Variation } from "../lib/store-data";
import { useLanguage } from "./language";

function uniqueValues(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function variationTitle(variation: Variation) {
  return [variation.color, variation.size].filter(Boolean).join(" / ") || variation.name;
}

export function VariationPicker({
  product,
  variationId,
  onChange,
}: {
  product: Product;
  variationId: string;
  onChange: (variationId: string) => void;
}) {
  const { language, t } = useLanguage();
  const variation =
    product.variations.find((item) => item.id === variationId) ?? product.variations[0];
  const colors = uniqueValues(product.variations.map((item) => item.color));
  const sizes = uniqueValues(product.variations.map((item) => item.size));
  const hasSplitOptions = colors.length > 0 || sizes.length > 0;

  function choose(nextColor?: string, nextSize?: string) {
    const color = nextColor ?? variation.color;
    const size = nextSize ?? variation.size;
    const exact = product.variations.find(
      (item) =>
        (!color || item.color === color) &&
        (!size || item.size === size),
    );
    const colorFallback = color
      ? product.variations.find((item) => item.color === color)
      : undefined;
    const sizeFallback = size
      ? product.variations.find((item) => item.size === size)
      : undefined;
    const next = exact ?? colorFallback ?? sizeFallback ?? product.variations[0];

    onChange(next.id);
  }

  if (!hasSplitOptions && product.variations.length <= 1) {
    return null;
  }

  return (
    <div className="option-panel">
      {colors.length ? (
        <div className="option-group">
          <span className="option-label">{t.color}</span>
          <div className="color-options">
            {colors.map((color) => (
              <button
                aria-label={colorLabel(color, language)}
                className={variation.color === color ? "color-dot active" : "color-dot"}
                key={color}
                onClick={() => choose(color, undefined)}
                style={{ "--swatch": colorHex[color] ?? "#d9dfdc" } as CSSProperties}
                title={colorLabel(color, language)}
                type="button"
              />
            ))}
          </div>
        </div>
      ) : null}

      {sizes.length ? (
        <div className="option-group">
          <span className="option-label">{t.size}</span>
          <div className="size-options">
            {sizes.map((size) => (
              <button
                className={variation.size === size ? "size-pill active" : "size-pill"}
                key={size}
                onClick={() => choose(undefined, size)}
                type="button"
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!hasSplitOptions ? (
        <div className="option-group">
          <span className="option-label">{t.option}</span>
          <div className="size-options">
            {product.variations.map((item) => (
              <button
                className={variation.id === item.id ? "size-pill active" : "size-pill"}
                key={item.id}
                onClick={() => onChange(item.id)}
                type="button"
              >
                {variationTitle(item)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
