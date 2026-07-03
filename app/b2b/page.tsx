"use client";

import Link from "next/link";
import { useLanguage } from "../../components/language";
import { ProductCard } from "../../components/product-card";
import { useDemoSession } from "../../components/session";
import { products } from "../../lib/store-data";

const copy = {
  ru: {
    onlyTitle: "Доступ только для B2B-клиентов",
    onlyText: "Войдите в подтверждённый B2B-аккаунт или отправьте заявку на регистрацию компании.",
    login: "Войти",
    eyebrow: "B2B кабинет",
    title: "Закупочные цены, счёт и отсрочка 15 дней",
    client: "Клиент",
    limit: "Лимит",
    payment: "Оплата",
    paymentValue: "Счёт / 15 дней",
  },
  lv: {
    onlyTitle: "Pieejams tikai B2B klientiem",
    onlyText: "Ieejiet apstiprinātā B2B kontā vai nosūtiet uzņēmuma reģistrācijas pieteikumu.",
    login: "Ieiet",
    eyebrow: "B2B kabinets",
    title: "Iepirkuma cenas, rēķins un 15 dienu atliktais maksājums",
    client: "Klients",
    limit: "Limits",
    payment: "Apmaksa",
    paymentValue: "Rēķins / 15 dienas",
  },
  en: {
    onlyTitle: "B2B clients only",
    onlyText: "Sign in with a confirmed B2B account or submit a company registration request.",
    login: "Login",
    eyebrow: "B2B account",
    title: "Wholesale prices, invoice and 15-day deferred payment",
    client: "Client",
    limit: "Limit",
    payment: "Payment",
    paymentValue: "Invoice / 15 days",
  },
} as const;

export default function B2BPage() {
  const { session } = useDemoSession();
  const { language } = useLanguage();
  const c = copy[language as keyof typeof copy] ?? copy.en;
  const allowed = session?.role === "b2b" || session?.role === "admin";

  if (!allowed) {
    return (
      <section className="section-shell narrow">
        <span className="eyebrow">B2B</span>
        <h1>{c.onlyTitle}</h1>
        <p>{c.onlyText}</p>
        <Link className="wide-button inline-button" href="/login">
          {c.login}
        </Link>
      </section>
    );
  }

  return (
    <section className="section-shell">
      <div className="section-heading">
        <span className="eyebrow">{c.eyebrow}</span>
        <h1>{c.title}</h1>
      </div>
      <div className="admin-stats">
        <div>
          <span>{c.client}</span>
          <strong>{session.name}</strong>
        </div>
        <div>
          <span>{c.limit}</span>
          <strong>EUR {session.creditLimit ?? 0}</strong>
        </div>
        <div>
          <span>{c.payment}</span>
          <strong>{c.paymentValue}</strong>
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
