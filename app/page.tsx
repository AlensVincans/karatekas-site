import Link from "next/link";
import { ProductCard } from "../components/product-card";
import { categories, products, warehouseTotals, eur } from "../lib/store-data";

export default function Home() {
  const totals = warehouseTotals();
  const featured = products.slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Балтия · B2C · B2B · склад · счета</span>
          <h1>Многостраничный интернет-магазин для розницы и B2B</h1>
          <p>
            Каталог, регистрация, вход, роли пользователей, B2B цены, checkout,
            доставка, счета и полноценная админка с товарной базой.
          </p>
          <div className="hero-actions">
            <Link href="/catalog">Перейти в каталог</Link>
            <Link href="/register">Зарегистрироваться</Link>
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
            <strong>{eur(totals.cost)}</strong>
            <span>себестоимость склада</span>
          </div>
        </div>
      </section>

      <section className="quick-commerce">
        <div className="promo-banner">
          <strong>Акции и роли</strong>
          <span>
            Обычный пользователь видит B2C цену, B2B после входа видит розницу
            зачёркнутой и активную B2B цену.
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
          <h2>Товары с B2C/B2B ценами и складскими остатками</h2>
        </div>
        <div className="product-grid">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} role="user" />
          ))}
        </div>
      </section>

      <section className="role-grid">
        <article>
          <h3>Обычный пользователь</h3>
          <p>Розничные цены, карта, Apple Pay/Google Pay, доставка по Балтии.</p>
          <Link href="/login">Войти как B2C</Link>
        </article>
        <article>
          <h3>B2B клиент</h3>
          <p>Две цены, оплата по счёту, отсрочка 15 дней и кредитный лимит.</p>
          <Link href="/b2b">B2B кабинет</Link>
        </article>
        <article>
          <h3>Администратор</h3>
          <p>Товары, склад, поставки, клиенты, заказы, счета и скидки.</p>
          <Link href="/admin">Открыть админку</Link>
        </article>
      </section>
    </>
  );
}
