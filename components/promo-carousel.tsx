"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { useActivePromoBanners } from "../lib/promotions";

export function PromoCarousel() {
  const banners = useActivePromoBanners();
  const [index, setIndex] = useState(0);
  const hasMany = banners.length > 1;
  const banner = banners[index] ?? banners[0];

  if (!banner) {
    return null;
  }

  function next() {
    setIndex((current) => (current + 1) % banners.length);
  }

  function previous() {
    setIndex((current) => (current - 1 + banners.length) % banners.length);
  }

  return (
    <div
      className={hasMany ? "promo-carousel" : "promo-carousel single"}
      style={
        {
          "--promo-bg": banner.background || "linear-gradient(135deg, #102c2a, #007a75)",
        } as CSSProperties
      }
    >
      <div>
        <strong>{banner.title}</strong>
        <span>{banner.text}</span>
      </div>
      <div className="promo-carousel-actions">
        {banner.href ? <Link href={banner.href}>{banner.buttonText || "Open"}</Link> : null}
        {hasMany ? (
          <>
            <button onClick={previous} type="button" aria-label="Previous banner">
              {"<"}
            </button>
            <button onClick={next} type="button" aria-label="Next banner">
              {">"}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
