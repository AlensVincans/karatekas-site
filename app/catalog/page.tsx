"use client";

import { CatalogBrowser } from "../../components/catalog-browser";
import { useLanguage } from "../../components/language";
import { categories, products, warehouseTotals } from "../../lib/store-data";

const copy = {
  ru: {
    intro:
      "Выбирайте экипировку для карате по категории, бренду, скидке и наличию. Фильтры сохраняются в адресе, поэтому после товара можно вернуться к той же подборке.",
    products: "товаров",
    categories: "категорий",
    available: "доступно",
  },
  lv: {
    intro:
      "Pārlūkojiet karatē ekipējumu pēc kategorijas, zīmola, atlaides un atlikuma. Filtri paliek adresē, tāpēc pēc preces lapas atgriezīsieties tajā pašā atlasē.",
    products: "preces",
    categories: "kategorijas",
    available: "pieejams",
  },
  en: {
    intro:
      "Browse karate equipment by category, brand, discount and live stock. Filters stay in the URL, so returning from product pages keeps your selection.",
    products: "products",
    categories: "categories",
    available: "available",
  },
  et: {
    intro:
      "Sirvi karate varustust kategooria, brändi, soodustuse ja laoseisu järgi. Filtrid jäävad aadressiribale, nii et tootelt tagasi tulles säilib sama valik.",
    products: "toodet",
    categories: "kategooriat",
    available: "saadaval",
  },
  lt: {
    intro:
      "Naršykite karatė įrangą pagal kategoriją, prekės ženklą, nuolaidą ir likutį. Filtrai išlieka adrese, todėl grįžus iš prekės puslapio pasirinkimas lieka tas pats.",
    products: "prekių",
    categories: "kategorijų",
    available: "yra",
  },
} as const;

export default function CatalogPage() {
  const { language, t } = useLanguage();
  const c = copy[language as keyof typeof copy] ?? copy.en;
  const totals = warehouseTotals();

  return (
    <section className="catalog-page-v3">
      <div className="catalog-hero-v3">
        <div>
          <span className="kicker-v3">{t.navCatalog}</span>
          <h1>{t.catalogTitle}</h1>
          <p>{c.intro}</p>
        </div>
        <div className="catalog-hero-stats-v3">
          <span>
            <strong>{products.length}</strong>
            {c.products}
          </span>
          <span>
            <strong>{categories.length}</strong>
            {c.categories}
          </span>
          <span>
            <strong>{totals.available}</strong>
            {c.available}
          </span>
        </div>
      </div>
      <CatalogBrowser />
    </section>
  );
}
