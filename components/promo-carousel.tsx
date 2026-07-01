"use client";

import Link from "next/link";
import { useState } from "react";
import { promoBannerHref, useActivePromoBanners } from "../lib/promotions";

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
    <div className={hasMany ? "promo-carousel" : "promo-carousel single"}>
      <div className="promo-carousel-media">
        {banner.image ? (
          <div className="promo-carousel-image" style={{ backgroundImage: `url("${banner.image}")` }} />
        ) : (
          <span>Sale</span>
        )}
      </div>
      <div className="promo-carousel-copy">
        <strong>{banner.title}</strong>
        <span>{banner.text}</span>
      </div>
      <div className="promo-carousel-actions">
        <Link href={promoBannerHref(banner)}>{banner.buttonText || "Open"}</Link>
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
