import Link from "next/link";
import { ProductCard } from "../components/product-card";
import { available, categories, products, warehouseTotals } from "../lib/store-data";

export default function Home() {
  const totals = warehouseTotals();
  const featured = categories
    .map((category) =>
      products.find(
        (product) =>
          product.category === category &&
          product.variations.some((variation) => available(variation.stock) > 0),
      ),
    )
    .filter((product): product is (typeof products)[number] => Boolean(product))
    .slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Карате · клубы · быстрые поставки</span>
          <h1>Экипировка для карате в розницу и для клубов</h1>
          <p>
            Кимоно, пояса, защита, перчатки и тренировочный инвентарь с понятными
            B2C/B2B ценами, доставкой по Балтии и оплатой картой или по счёту.
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
            <span>единиц на складе</span>
          </div>
        </div>
      </section>

      <section className="quick-commerce">
        <div className="promo-banner">
          <strong>Клубный сезон</strong>
          <span>
            Скидки на Kihon, защита для спаррингов и клубные закупки кимоно для
            залов в Латвии, Литве и Эстонии.
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
          <h2>Ходовые позиции для тренировок</h2>
        </div>
        <div className="product-grid">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} role="user" />
          ))}
        </div>
      </section>

      <section className="trust-grid">
        <article>
          <h3>Оплата</h3>
          <p>Карты, 3D Secure, Apple Pay, Google Pay и оплата по счёту для клубов.</p>
        </article>
        <article>
          <h3>B2B условия</h3>
          <p>После входа клуб видит розницу зачёркнутой и активную закупочную цену.</p>
        </article>
        <article>
          <h3>Доставка</h3>
          <p>Omniva, DPD, Unisend, Latvijas Pasts и курьерская доставка по Балтии.</p>
        </article>
      </section>
    </>
  );
}
