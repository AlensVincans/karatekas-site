"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../../components/language";
import { useDemoSession } from "../../components/session";
import { money } from "../../lib/i18n";

const copy = {
  ru: {
    account: "Кабинет",
    needLogin: "Для доступа к кабинету нужно войти.",
    login: "Войти",
    role: "Роль",
    emailConfirmed: "Email подтверждён",
    yes: "да",
    no: "нет",
    company: "Компания",
    administrator: "администратор",
    creditLimit: "Кредитный лимит",
    noLimit: "без лимита",
    orders: "История заказов",
    order: "Заказ",
    sum: "Сумма",
    payment: "Оплата",
    shipping: "Доставка",
    details: "Детали",
    close: "Закрыть",
    invoice: "Счёт PDF",
    noOrders: "Заказов пока нет.",
  },
  lv: {
    account: "Kabinet",
    needLogin: "Lai piekļūtu kabinetam, nepieciešams ieiet.",
    login: "Ieiet",
    role: "Loma",
    emailConfirmed: "Email apstiprināts",
    yes: "jā",
    no: "nē",
    company: "Uzņēmums",
    administrator: "administrators",
    creditLimit: "Kredītlimits",
    noLimit: "bez limita",
    orders: "Pasūtījumu vēsture",
    order: "Pasūtījums",
    sum: "Summa",
    payment: "Apmaksa",
    shipping: "Piegāde",
    details: "Detaļas",
    close: "Aizvērt",
    invoice: "Rēķina PDF",
    noOrders: "Pasūtījumu vēl nav.",
  },
  en: {
    account: "Account",
    needLogin: "Please sign in to access your account.",
    login: "Login",
    role: "Role",
    emailConfirmed: "Email confirmed",
    yes: "yes",
    no: "no",
    company: "Company",
    administrator: "administrator",
    creditLimit: "Credit limit",
    noLimit: "no limit",
    orders: "Order history",
    order: "Order",
    sum: "Total",
    payment: "Payment",
    shipping: "Delivery",
    details: "Details",
    close: "Close",
    invoice: "Invoice PDF",
    noOrders: "No orders yet.",
  },
} as const;

type AccountOrder = {
  id: string;
  invoiceNumber?: string;
  createdAt: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingMethodName?: string;
  pickupPointName?: string;
  trackingNumber?: string;
  trackingLink?: string;
  totals: {
    subtotal: number;
    vat: number;
    shipping: number;
    total: number;
  };
  lines: Array<{
    productName: string;
    variationName?: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
};

export default function AccountPage() {
  const { session } = useDemoSession();
  const { language } = useLanguage();
  const c = copy[language as keyof typeof copy] ?? copy.en;
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.email) {
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({ email: session.email });

    fetch(`/api/orders?${params.toString()}`)
      .then((response) => response.json())
      .then((data: { orders?: AccountOrder[] }) => {
        if (!cancelled) {
          setOrders(data.orders ?? []);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [session?.email]);

  if (!session) {
    return (
      <section className="section-shell narrow">
        <h1>{c.account}</h1>
        <p>{c.needLogin}</p>
        <Link className="wide-button inline-button" href="/login">
          {c.login}
        </Link>
      </section>
    );
  }

  return (
    <section className="section-shell narrow">
      <span className="eyebrow">{c.account}</span>
      <h1>{session.name}</h1>
      <div className="tool-panel">
        <div className="metric-row">
          <span>{c.role}</span>
          <strong>{session.role.toUpperCase()}</strong>
        </div>
        <div className="metric-row">
          <span>Email</span>
          <strong>{session.email}</strong>
        </div>
        <div className="metric-row">
          <span>{c.emailConfirmed}</span>
          <strong>{session.emailConfirmed ? c.yes : c.no}</strong>
        </div>
        {session.role === "b2b" || session.role === "admin" ? (
          <>
            <div className="metric-row">
              <span>{c.company}</span>
              <strong>{session.company ?? c.administrator}</strong>
            </div>
            <div className="metric-row">
              <span>{c.creditLimit}</span>
              <strong>{session.creditLimit ? `EUR ${session.creditLimit}` : c.noLimit}</strong>
            </div>
          </>
        ) : null}
      </div>
      <div className="tool-panel">
        <h3>{c.orders}</h3>
        {orders.length ? (
          <div className="account-order-list">
            {orders.map((order) => (
              <Fragment key={order.id}>
                <div className="account-order-row">
                  <div>
                    <strong>{order.invoiceNumber ?? order.id}</strong>
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span>{c.sum}</span>
                    <strong>{money(order.totals.total, language)}</strong>
                  </div>
                  <div>
                    <span>{c.payment}</span>
                    <strong>{order.paymentStatus}</strong>
                  </div>
                  <div>
                    <span>{c.shipping}</span>
                    <strong>{order.pickupPointName ?? order.shippingMethodName ?? "-"}</strong>
                  </div>
                  <a
                    className="table-action"
                    href={`/api/orders/${order.id}/invoice`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {c.invoice}
                  </a>
                  <button
                    className="table-action"
                    onClick={() =>
                      setExpandedOrderId((current) =>
                        current === order.id ? null : order.id,
                      )
                    }
                    type="button"
                  >
                    {expandedOrderId === order.id ? c.close : c.details}
                  </button>
                </div>
                {expandedOrderId === order.id ? (
                  <div className="account-order-details">
                    {order.lines.map((line, index) => (
                      <div className="order-line-item" key={`${order.id}-${index}`}>
                        <strong>{line.productName}</strong>
                        <span>
                          {[line.variationName, line.sku].filter(Boolean).join(" - ")}
                        </span>
                        <span>
                          {line.quantity} x {money(line.unitPrice, language)} ={" "}
                          {money(line.total, language)}
                        </span>
                      </div>
                    ))}
                    {order.trackingLink ? (
                      <a href={order.trackingLink} rel="noreferrer" target="_blank">
                        {order.trackingNumber ?? order.trackingLink}
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </Fragment>
            ))}
          </div>
        ) : (
          <p className="empty-state">{c.noOrders}</p>
        )}
      </div>
    </section>
  );
}
