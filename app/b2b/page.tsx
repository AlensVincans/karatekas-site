"use client";

import Link from "next/link";
import { ProductCard } from "../../components/product-card";
import { useDemoSession } from "../../components/session";
import { products } from "../../lib/store-data";

export default function B2BPage() {
  const { session } = useDemoSession();
  const allowed = session?.role === "b2b" || session?.role === "admin";

  if (!allowed) {
    return (
      <section className="section-shell narrow">
        <span className="eyebrow">B2B</span>
        <h1>Доступ только для B2B-клиентов</h1>
        <p>Войдите как `b2b@baltic.test / b2b123` или зарегистрируйте B2B аккаунт.</p>
        <Link className="wide-button inline-button" href="/login">
          Войти
        </Link>
      </section>
    );
  }

  return (
    <section className="section-shell">
      <div className="section-heading">
        <span className="eyebrow">B2B кабинет</span>
        <h1>Закупочные цены, счёт и отсрочка 15 дней</h1>
      </div>
      <div className="admin-stats">
        <div>
          <span>Клиент</span>
          <strong>{session.name}</strong>
        </div>
        <div>
          <span>Лимит</span>
          <strong>EUR {session.creditLimit ?? 0}</strong>
        </div>
        <div>
          <span>Оплата</span>
          <strong>Счёт / 15 дней</strong>
        </div>
        <div>
          <span>PVN</span>
          <strong>{session.vatNumber ?? "LV"}</strong>
        </div>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} role="b2b" />
        ))}
      </div>
    </section>
  );
}
