"use client";

import { CatalogBrowser } from "../../components/catalog-browser";
import { useLanguage } from "../../components/language";

export default function CatalogPage() {
  const { t } = useLanguage();

  return (
    <section className="section-shell">
      <div className="section-heading">
        <span className="eyebrow">{t.navCatalog}</span>
        <h1>{t.catalogTitle}</h1>
      </div>
      <CatalogBrowser />
    </section>
  );
}
