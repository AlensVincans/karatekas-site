"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  categories as seedCategories,
  pricedVariation,
  products as seedProducts,
  type Product,
  type UserRole,
} from "../lib/store-data";
import { categoryLabel, productDescription, productTitle } from "../lib/i18n";
import {
  applyPromoPrice,
  usePromoPrices,
  usePromoRules,
  type PromoPriceMap,
  type PromoRule,
} from "../lib/promotions";
import { useLanguage } from "./language";
import { ProductCard } from "./product-card";
import { ProductSearchSuggestions } from "./product-search-suggestions";
import { useDemoSession } from "./session";

const allValue = "__all";
type SortMode = "featured" | "price-asc" | "price-desc" | "name";
const defaultPageSize = 24;
const pageSizeOptions = [12, 24, 48, 96] as const;

const copy = {
  ru: {
    refineTitle: "Подбор экипировки",
    refineText: "Ищите по товару, бренду, категории, SKU или вариации.",
    results: "результатов",
    allEquipment: "Вся экипировка для карате",
    sort: "Сортировка",
    loading: "Загружаем товары",
    featured: "Рекомендуемые",
    priceAsc: "Сначала дешевле",
    priceDesc: "Сначала дороже",
    name: "Название",
    emptyTitle: "Товары не найдены",
    emptyText: "Попробуйте другую категорию, бренд или поисковую фразу.",
  },
  lv: {
    refineTitle: "Ekipējuma atlase",
    refineText: "Meklējiet pēc preces, zīmola, kategorijas, SKU vai variācijas.",
    results: "rezultāti",
    allEquipment: "Viss karatē ekipējums",
    sort: "Kārtošana",
    loading: "Ielādējam preces",
    featured: "Ieteiktie",
    priceAsc: "Cena augoši",
    priceDesc: "Cena dilstoši",
    name: "Nosaukums",
    emptyTitle: "Preces nav atrastas",
    emptyText: "Izmēģiniet citu kategoriju, zīmolu vai meklēšanas frāzi.",
  },
  en: {
    refineTitle: "Refine your kit",
    refineText: "Search by product, brand, category, SKU or variation.",
    results: "results",
    allEquipment: "All karate equipment",
    sort: "Sort",
    loading: "Loading products",
    featured: "Featured",
    priceAsc: "Price low to high",
    priceDesc: "Price high to low",
    name: "Name",
    emptyTitle: "No products found",
    emptyText: "Try another category, brand or search phrase.",
  },
  et: {
    refineTitle: "Vali varustus",
    refineText: "Otsi toote, brändi, kategooria, SKU või variatsiooni järgi.",
    results: "tulemust",
    allEquipment: "Kogu karate varustus",
    sort: "Sorteeri",
    loading: "Laadime tooteid",
    featured: "Soovitatud",
    priceAsc: "Hind kasvavalt",
    priceDesc: "Hind kahanevalt",
    name: "Nimi",
    emptyTitle: "Tooteid ei leitud",
    emptyText: "Proovi teist kategooriat, brändi või otsingufraasi.",
  },
  lt: {
    refineTitle: "Atrinkite įrangą",
    refineText: "Ieškokite pagal prekę, prekės ženklą, kategoriją, SKU ar variaciją.",
    results: "rezultatai",
    allEquipment: "Visa karatė įranga",
    sort: "Rikiavimas",
    loading: "Įkeliamos prekės",
    featured: "Rekomenduojami",
    priceAsc: "Kaina didėjančiai",
    priceDesc: "Kaina mažėjančiai",
    name: "Pavadinimas",
    emptyTitle: "Prekių nerasta",
    emptyText: "Pabandykite kitą kategoriją, prekės ženklą arba paieškos frazę.",
  },
} as const;

const paginationCopy = {
  ru: { perPage: "На странице", page: "Страница", previous: "Назад", next: "Вперёд" },
  lv: { perPage: "Lapā", page: "Lapa", previous: "Atpakaļ", next: "Tālāk" },
  en: { perPage: "Per page", page: "Page", previous: "Previous", next: "Next" },
  et: { perPage: "Lehel", page: "Leht", previous: "Tagasi", next: "Edasi" },
  lt: { perPage: "Puslapyje", page: "Puslapis", previous: "Atgal", next: "Toliau" },
} as const;

function defaultCatalogParams() {
  return {
    query: "",
    category: allValue,
    brand: allValue,
    promoOnly: false,
    sort: "featured" as SortMode,
    page: 1,
    pageSize: defaultPageSize,
  };
}

function readCatalogParams(
  brands: string[],
  categoryOptions: string[],
  params: Pick<URLSearchParams, "get">,
) {
  const category = params.get("category");
  const brand = params.get("brand");
  const sort = params.get("sort");
  const normalizedSort: SortMode =
    sort === "price-asc" || sort === "price-desc" || sort === "name" || sort === "featured"
      ? sort
      : "featured";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Number(params.get("perPage"));

  return {
    query: params.get("q") ?? "",
    category: category && categoryOptions.some((item) => item === category) ? category : allValue,
    brand: brand && brands.some((item) => item === brand) ? brand : allValue,
    promoOnly: params.get("promo") === "1",
    sort: normalizedSort,
    page,
    pageSize: pageSizeOptions.some((option) => option === pageSize)
      ? pageSize
      : defaultPageSize,
  };
}

function hasDiscountedVariation(
  product: Product,
  role: UserRole,
  promoPrices: PromoPriceMap,
  promoRules: PromoRule[],
) {
  return product.variations.some((variation) => {
    const price = applyPromoPrice(
      pricedVariation(product, variation, role),
      variation.id,
      role,
      promoPrices,
      promoRules,
      { productId: product.id, brand: product.brand },
    );

    return Boolean(price.discount || price.hasPromo);
  });
}

function lowestProductPrice(
  product: Product,
  role: UserRole,
  promoPrices: PromoPriceMap,
  promoRules: PromoRule[],
) {
  return Math.min(
    ...product.variations.map((variation) =>
      applyPromoPrice(
        pricedVariation(product, variation, role),
        variation.id,
        role,
        promoPrices,
        promoRules,
        { productId: product.id, brand: product.brand },
      ).final,
    ),
  );
}

function paginationPages(currentPage: number, pageCount: number) {
  if (pageCount <= 3) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (currentPage <= 1) {
    return [1, 2, 3];
  }

  if (currentPage >= pageCount) {
    return [pageCount - 2, pageCount - 1, pageCount];
  }

  return [currentPage - 1, currentPage, currentPage + 1];
}

export function CatalogBrowser() {
  const { role } = useDemoSession();
  const { language, t } = useLanguage();
  const c = copy[language as keyof typeof copy] ?? copy.en;
  const p = paginationCopy[language as keyof typeof paginationCopy] ?? paginationCopy.en;
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();
  const promoPrices = usePromoPrices();
  const promoRules = usePromoRules();
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [productsReady, setProductsReady] = useState(false);
  const catalogCategories = useMemo(
    () =>
      Array.from(
        new Set([...seedCategories, ...catalogProducts.map((product) => product.category)]),
      ).filter(Boolean),
    [catalogProducts],
  );
  const brands = useMemo(
    () => Array.from(new Set(catalogProducts.map((product) => product.brand))).sort(),
    [catalogProducts],
  );
  const [paramsReady, setParamsReady] = useState(false);
  const [query, setQuery] = useState(defaultCatalogParams().query);
  const [category, setCategory] = useState(defaultCatalogParams().category);
  const [brand, setBrand] = useState(defaultCatalogParams().brand);
  const [promoOnly, setPromoOnly] = useState(defaultCatalogParams().promoOnly);
  const [sort, setSort] = useState<SortMode>(defaultCatalogParams().sort);
  const [page, setPage] = useState(defaultCatalogParams().page);
  const [pageSize, setPageSize] = useState(defaultCatalogParams().pageSize);
  const syncingSearchRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/products")
      .then((response) => response.json())
      .then((data: { products?: Product[] }) => {
        if (!cancelled) {
          setCatalogProducts(
            Array.isArray(data.products) && data.products.length
              ? data.products
              : seedProducts,
          );
          setProductsReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogProducts(seedProducts);
          setProductsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!productsReady) {
      return;
    }

    const params = readCatalogParams(
      brands,
      catalogCategories,
      new URLSearchParams(searchParamString),
    );
    syncingSearchRef.current = searchParamString;
    const timer = window.setTimeout(() => {
      setQuery(params.query);
      setCategory(params.category);
      setBrand(params.brand);
      setPromoOnly(params.promoOnly);
      setSort(params.sort);
      setPage(params.page);
      setPageSize(params.pageSize);
      setParamsReady(true);
      syncingSearchRef.current = null;
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [brands, catalogCategories, productsReady, searchParamString]);

  useEffect(() => {
    if (!paramsReady || syncingSearchRef.current != null) {
      return;
    }

    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("q", query.trim());
    }

    if (category !== allValue) {
      params.set("category", category);
    }

    if (brand !== allValue) {
      params.set("brand", brand);
    }

    if (promoOnly) {
      params.set("promo", "1");
    }

    if (sort !== "featured") {
      params.set("sort", sort);
    }

    if (page > 1) {
      params.set("page", String(page));
    }

    if (pageSize !== defaultPageSize) {
      params.set("perPage", String(pageSize));
    }

    const nextUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState(window.history.state, "", nextUrl);
  }, [brand, category, page, pageSize, paramsReady, promoOnly, query, sort]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return catalogProducts.filter((product) => {
      const categoryMatch = category === allValue || product.category === category;
      const brandMatch = brand === allValue || product.brand === brand;
      const promoMatch =
        !promoOnly || hasDiscountedVariation(product, role, promoPrices, promoRules);
      const textMatch =
        !normalizedQuery ||
        [
          product.name,
          productTitle(product, language),
          product.brand,
          product.category,
          categoryLabel(product.category, language),
          product.description,
          productDescription(product, language),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return categoryMatch && brandMatch && promoMatch && textMatch;
    });
  }, [brand, catalogProducts, category, language, promoOnly, promoPrices, promoRules, query, role]);
  const visibleProducts = useMemo(() => {
    const next = [...filteredProducts];

    if (sort === "name") {
      return next.sort((left, right) => left.name.localeCompare(right.name));
    }

    if (sort === "price-asc" || sort === "price-desc") {
      return next.sort((left, right) => {
        const leftPrice = lowestProductPrice(left, role, promoPrices, promoRules);
        const rightPrice = lowestProductPrice(right, role, promoPrices, promoRules);

        return sort === "price-asc" ? leftPrice - rightPrice : rightPrice - leftPrice;
      });
    }

    return next;
  }, [filteredProducts, promoPrices, promoRules, role, sort]);
  const pageCount = Math.max(1, Math.ceil(visibleProducts.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const firstProductIndex = (safePage - 1) * pageSize;
  const paginatedProducts = visibleProducts.slice(firstProductIndex, firstProductIndex + pageSize);
  const pageButtons = paginationPages(safePage, pageCount);
  const isCatalogLoading = !productsReady || !paramsReady;
  const catalogGridStyle = {
    "--catalog-desktop-min-height": `${Math.ceil(pageSize / 3) * 640}px`,
    "--catalog-tablet-min-height": `${Math.ceil(pageSize / 2) * 610}px`,
    "--catalog-mobile-min-height": `${pageSize * 590}px`,
  } as CSSProperties;

  return (
    <div className="catalog-workspace-v3">
      <aside className="filter-dock-v3 filters-panel">
        <div className="filters-head-v3">
          <span className="kicker-v3">{t.filters}</span>
          <h2>{c.refineTitle}</h2>
          <p>{c.refineText}</p>
        </div>
        <div className="search-field">
          <label>
            {t.search}
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={t.searchPlaceholder}
            />
          </label>
          <ProductSearchSuggestions query={query} />
        </div>
        <label>
          {t.category}
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value={allValue}>{t.all}</option>
            {catalogCategories.map((item) => (
              <option key={item} value={item}>
                {categoryLabel(item, language)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.brand}
          <select
            value={brand}
            onChange={(event) => {
              setBrand(event.target.value);
              setPage(1);
            }}
          >
            <option value={allValue}>{t.all}</option>
            {brands.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="check-row compact-check">
          <input
            checked={promoOnly}
            type="checkbox"
            onChange={(event) => {
              setPromoOnly(event.target.checked);
              setPage(1);
            }}
          />
            {t.discountedOnly}
        </label>
      </aside>
      <section className="catalog-shelf-v3 catalog-results" aria-label={t.navCatalog}>
        <div className="catalog-toolbar-v3">
          <div className="catalog-result-copy-v3">
            <span>
              {isCatalogLoading ? c.loading : `${visibleProducts.length} ${c.results}`}
            </span>
            <strong>
              {category === allValue ? c.allEquipment : categoryLabel(category, language)}
            </strong>
          </div>
          <label>
            {c.sort}
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as SortMode);
                setPage(1);
              }}
            >
              <option value="featured">{c.featured}</option>
              <option value="price-asc">{c.priceAsc}</option>
              <option value="price-desc">{c.priceDesc}</option>
              <option value="name">{c.name}</option>
            </select>
          </label>
          <label>
            {p.perPage}
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="catalog-chip-row-v3">
          <button
            className={category === allValue ? "active" : ""}
            onClick={() => {
              setCategory(allValue);
              setPage(1);
            }}
            type="button"
          >
            {t.all}
          </button>
          {catalogCategories.map((item) => (
            <button
              className={category === item ? "active" : ""}
              key={item}
              onClick={() => {
                setCategory(item);
                setPage(1);
              }}
              type="button"
            >
              {categoryLabel(item, language)}
            </button>
          ))}
        </div>

        {isCatalogLoading ? (
          <div
            aria-label={c.loading}
            className="product-grid product-grid-v3 catalog-grid-v3 catalog-grid-loading-v3"
            style={catalogGridStyle}
          >
            {Array.from({ length: Math.min(pageSize, 12) }, (_, index) => (
              <span className="catalog-card-skeleton-v3" key={index} />
            ))}
          </div>
        ) : visibleProducts.length ? (
          <>
            <div className="product-grid product-grid-v3 catalog-grid-v3" style={catalogGridStyle}>
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} role={role} />
              ))}
            </div>
            <div className="catalog-pagination-v3">
              <span>
                {p.page} {safePage} / {pageCount}
              </span>
              <div>
                <button
                  disabled={safePage <= 1}
                  onClick={() => setPage(1)}
                  type="button"
                >
                  {"<<"}
                </button>
                <button
                  disabled={safePage <= 1}
                  onClick={() => setPage(Math.max(1, safePage - 1))}
                  type="button"
                >
                  {p.previous}
                </button>
                {pageButtons.map((item) => (
                  <button
                    className={item === safePage ? "page-number active" : "page-number"}
                    key={item}
                    onClick={() => setPage(item)}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
                <button
                  disabled={safePage >= pageCount}
                  onClick={() => setPage(Math.min(pageCount, safePage + 1))}
                  type="button"
                >
                  {p.next}
                </button>
                <button
                  disabled={safePage >= pageCount}
                  onClick={() => setPage(pageCount)}
                  type="button"
                >
                  {">>"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state catalog-empty">
            <strong>{c.emptyTitle}</strong>
            <span>{c.emptyText}</span>
          </div>
        )}
      </section>
    </div>
  );
}
