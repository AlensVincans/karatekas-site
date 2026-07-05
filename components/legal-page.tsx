"use client";

import Link from "next/link";
import { legalPageForLanguage } from "../lib/legal-pages";
import {
  legalServiceLinks,
  legalServiceTitle,
  type LegalPageSlug,
} from "../lib/legal-service-links";
import { useLanguage } from "./language";

export function LegalPage({ slug }: { slug: LegalPageSlug }) {
  const { language } = useLanguage();
  const page = legalPageForLanguage(slug, language);
  const serviceTitle = language === "ru"
    ? "Сервис"
    : language === "lv"
      ? "Serviss"
      : language === "et"
        ? "Teenindus"
        : language === "lt"
          ? "Servisas"
          : "Our Service";

  return (
    <section className="legal-page-v3">
      <div className="legal-hero-v3">
        <span className="kicker-v3">Karatekas.eu</span>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
      </div>

      <div className="legal-layout-v3">
        <aside className="legal-nav-v3" aria-label={serviceTitle}>
          <strong>{serviceTitle}</strong>
          {legalServiceLinks.map((item) => (
            <Link
              className={item.slug === slug ? "active" : ""}
              href={`/${item.slug}`}
              key={item.slug}
            >
              {legalServiceTitle(item.slug, language)}
            </Link>
          ))}
        </aside>

        <article className="legal-content-v3">
          {page.blocks.map((block, index) => {
            if (block.type === "heading") {
              return <h2 key={`${block.text}-${index}`}>{block.text}</h2>;
            }

            if (block.type === "list") {
              return (
                <ul key={`${page.title}-list-${index}`}>
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              );
            }

            return <p key={`${block.text}-${index}`}>{block.text}</p>;
          })}
        </article>
      </div>
    </section>
  );
}
