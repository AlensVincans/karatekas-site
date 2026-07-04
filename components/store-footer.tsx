"use client";

import Image from "next/image";
import Link from "next/link";
import { categories } from "../lib/store-data";
import { categoryLabel } from "../lib/i18n";
import { useLanguage } from "./language";

const footerCopy = {
  ru: {
    ctaTitle: "Экипировка для карате для спортсменов, семей и клубов.",
    brandText:
      "Премиальная экипировка для карате, B2B-цены для клубов, безопасная оплата и доставка по Балтии через проверенных партнеров.",
    shop: "Магазин",
    categories: "Категории",
    service: "Сервис",
    carriers: "Omniva / DPD / Unisend",
    countries: "Латвия / Литва / Эстония",
    cardPayment: "Оплата картой через Montonio",
    b2bInvoice: "Оплата по счету для B2B",
  },
  lv: {
    ctaTitle: "Karatē ekipējums sportistiem, ģimenēm un klubiem.",
    brandText:
      "Premium karatē ekipējums, B2B cenas klubiem, droša apmaksa un piegāde Baltijā ar uzticamiem partneriem.",
    shop: "Veikals",
    categories: "Kategorijas",
    service: "Serviss",
    carriers: "Omniva / DPD / Unisend",
    countries: "Latvija / Lietuva / Igaunija",
    cardPayment: "Apmaksa ar karti caur Montonio",
    b2bInvoice: "B2B apmaksa ar rēķinu",
  },
  en: {
    ctaTitle: "Karate equipment for athletes, families and clubs.",
    brandText:
      "Premium karate equipment, B2B club pricing, secure checkout and Baltic delivery through trusted shipping partners.",
    shop: "Shop",
    categories: "Categories",
    service: "Service",
    carriers: "Omniva / DPD / Unisend",
    countries: "Latvia / Lithuania / Estonia",
    cardPayment: "Montonio card checkout",
    b2bInvoice: "B2B invoice payment",
  },
  et: {
    ctaTitle: "Karate varustus sportlastele, peredele ja klubidele.",
    brandText:
      "Premium karate varustus, B2B klubihinnad, turvaline makse ja Balti tarne usaldusväärsete partneritega.",
    shop: "Pood",
    categories: "Kategooriad",
    service: "Teenindus",
    carriers: "Omniva / DPD / Unisend",
    countries: "Läti / Leedu / Eesti",
    cardPayment: "Kaardimakse Montonio kaudu",
    b2bInvoice: "B2B arvega maksmine",
  },
  lt: {
    ctaTitle: "Karatė įranga sportininkams, šeimoms ir klubams.",
    brandText:
      "Premium karatė įranga, B2B kainos klubams, saugus apmokėjimas ir pristatymas Baltijoje per patikimus partnerius.",
    shop: "Parduotuvė",
    categories: "Kategorijos",
    service: "Servisas",
    carriers: "Omniva / DPD / Unisend",
    countries: "Latvija / Lietuva / Estija",
    cardPayment: "Apmokėjimas kortele per Montonio",
    b2bInvoice: "B2B apmokėjimas pagal sąskaitą",
  },
} as const;

export function StoreFooter() {
  const { language, t } = useLanguage();
  const c = footerCopy[language as keyof typeof footerCopy] ?? footerCopy.en;
  const featuredCategories = categories.slice(0, 5);

  return (
    <footer className="site-footer-v3">
      <div className="footer-cta-v3">
        <div>
          <span className="kicker-v3">Karatekas.eu</span>
          <h2>{c.ctaTitle}</h2>
        </div>
        <Link className="button-v3 secondary" href="/catalog">
          {t.openCatalog}
        </Link>
      </div>

      <div className="footer-main-v3">
        <div className="footer-brand-v3">
          <Link className="footer-logo-v3" href="/" aria-label="Karatekas Gear">
            <Image alt="" className="brand-logo-v2" height={54} src="/karatekas-mark.png" width={54} />
            <span>
              <strong>Karatekas.eu</strong>
              <small>{t.brandSubline}</small>
            </span>
          </Link>
          <p>{c.brandText}</p>
        </div>

        <div className="footer-links-v3">
          <div>
            <strong>{c.shop}</strong>
            <Link href="/catalog">{t.navCatalog}</Link>
            <Link href="/catalog?promo=1">{t.discountedOnly}</Link>
            <Link href="/cart">{t.navCart}</Link>
          </div>
          <div>
            <strong>{c.categories}</strong>
            {featuredCategories.map((category) => (
              <Link key={category} href={`/catalog?category=${encodeURIComponent(category)}`}>
                {categoryLabel(category, language)}
              </Link>
            ))}
          </div>
          <div>
            <strong>{c.service}</strong>
            <span>{c.carriers}</span>
            <span>{c.countries}</span>
            <span>{c.cardPayment}</span>
            <span>{c.b2bInvoice}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
