"use client";

import Link from "next/link";
import { useState } from "react";
import { useActivePromoBanners } from "../lib/promotions";

export function PromoCarousel() {
  const banners = useActivePromoBanners().filter((item) => item.image);
  const [index, setIndex] = useState(0);
  const hasMany = banners.length > 1;
  const banner = banners[index] ?? banners[0];

  if (!banner?.image) {
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
      <Link
        aria-label={banner.title || "Sale"}
        className="promo-image-banner"
        href="/catalog?promo=1"
        style={{ backgroundImage: `url("${banner.image}")` }}
      />
      <div className="promo-carousel-actions image-actions">
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
