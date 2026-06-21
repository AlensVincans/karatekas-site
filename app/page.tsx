import Link from "next/link";
import { ProductCard } from "../components/product-card";
import { categories, products, warehouseTotals } from "../lib/store-data";

export default function Home() {
  const totals = warehouseTotals();
  const featured = products.slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Балтия · Европа · быстрые поставки</span>
          <h1>Профессиональные товары для бизнеса и дома</h1>
          <p>
            Инструменты, складское оборудование, маркировка, защита и освещение
            с понятными ценами, доставкой по Балтии и оплатой онлайн или по счёту.
          </p>
          <div className="hero-actions">
            <Link href="/catalog">Открыть каталог</Link>
            <Link href="/register">Стать клиентом</Link>
          </div>
        </div>
        <div className="hero-metrics">
          <div>
            <strong>{products.length}</strong>
            <span>товаров</span>
          </div>
          <div>
            <strong>{categories.length}</strong>
            <span>категорий</span>
          </div>
          <div>
            <strong>{totals.available}</strong>
            <span>единиц доступно</span>
          </div>
        </div>
      </section>

      <section className="quick-commerce">
        <div className="promo-banner">
          <strong>Летние поставки</strong>
          <span>
            Скидки на складскую маркировку, инструменты и LED-освещение для
            объектов в Латвии, Литве и Эстонии.
          </span>
        </div>
        <div className="category-rail">
          {categories.map((category) => (
            <Link key={category} href={`/catalog?category=${encodeURIComponent(category)}`}>
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="section-shell">
        <div className="section-heading">
          <span className="eyebrow">Популярное</span>
          <h2>Ходовые позиции на складе</h2>
        </div>
        <div className="product-grid">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} role="user" />
          ))}
        </div>
      </section>

      <section className="trust-grid">
        <article>
          <h3>Онлайн-оплата</h3>
          <p>Visa, Mastercard, 3D Secure, Apple Pay и Google Pay для быстрых заказов.</p>
        </article>
        <article>
          <h3>B2B условия</h3>
          <p>После подтверждения компании доступны закупочные цены, счёт и отсрочка.</p>
        </article>
        <article>
          <h3>Доставка</h3>
          <p>Omniva, DPD, Unisend, Latvijas Pasts и курьерская доставка по Балтии.</p>
        </article>
      </section>
    </>
  );
}
