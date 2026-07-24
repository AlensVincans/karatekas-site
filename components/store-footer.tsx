"use client";

import Image from "next/image";
import Link from "next/link";
import { categories } from "../lib/store-data";
import { categoryLabel } from "../lib/i18n";
import { legalServiceLinks, legalServiceTitle } from "../lib/legal-service-links";
import { useLanguage } from "./language";

const footerCopy = {
  ru: {
    ctaTitle: "Экипировка для карате для спортсменов, семей и клубов.",
    brandText:
      "Премиальная экипировка для карате, B2B-цены для клубов, безопасная оплата, доставка по Балтии и курьерская доставка по ЕС.",
    shop: "Магазин",
    categories: "Категории",
    service: "Сервис",
    carriers: "Omniva / DPD / Unisend",
    countries: "Балтия + курьер по ЕС",
    cardPayment: "Оплата картой через Montonio",
    b2bInvoice: "Оплата по счету для B2B",
  },
  lv: {
    ctaTitle: "Karatē ekipējums sportistiem, ģimenēm un klubiem.",
    brandText:
      "Premium karatē ekipējums, B2B cenas klubiem, droša apmaksa, piegāde Baltijā un kurjera piegāde ES.",
    shop: "Veikals",
    categories: "Kategorijas",
    service: "Serviss",
    carriers: "Omniva / DPD / Unisend",
    countries: "Baltija + kurjers ES",
    cardPayment: "Apmaksa ar karti caur Montonio",
    b2bInvoice: "B2B apmaksa ar rēķinu",
  },
  en: {
    ctaTitle: "Karate equipment for athletes, families and clubs.",
    brandText:
      "Premium karate equipment, B2B club pricing, secure checkout, Baltic delivery and EU courier delivery.",
    shop: "Shop",
    categories: "Categories",
    service: "Service",
    carriers: "Omniva / DPD / Unisend",
    countries: "Baltics + EU courier",
    cardPayment: "Montonio card checkout",
    b2bInvoice: "B2B invoice payment",
  },
  et: {
    ctaTitle: "Karate varustus sportlastele, peredele ja klubidele.",
    brandText:
      "Premium karate varustus, B2B klubihinnad, turvaline makse, Balti tarne ja ELi kullerteenus.",
    shop: "Pood",
    categories: "Kategooriad",
    service: "Teenindus",
    carriers: "Omniva / DPD / Unisend",
    countries: "Baltikum + ELi kuller",
    cardPayment: "Kaardimakse Montonio kaudu",
    b2bInvoice: "B2B arvega maksmine",
  },
  lt: {
    ctaTitle: "Karatė įranga sportininkams, šeimoms ir klubams.",
    brandText:
      "Premium karatė įranga, B2B kainos klubams, saugus apmokėjimas, pristatymas Baltijoje ir kurjeris ES.",
    shop: "Parduotuvė",
    categories: "Kategorijos",
    service: "Servisas",
    carriers: "Omniva / DPD / Unisend",
    countries: "Baltijos šalys + kurjeris ES",
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
          <Link className="footer-logo-v3" href="/" aria-label="Karatekas">
            <Image
              alt=""
              className="brand-logo-v2"
              height={54}
              src="/karatekas-mark.png"
              unoptimized
              width={54}
            />
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
            {legalServiceLinks.map((item) => (
              <Link href={`/${item.slug}`} key={item.slug}>
                {legalServiceTitle(item.slug, language)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
