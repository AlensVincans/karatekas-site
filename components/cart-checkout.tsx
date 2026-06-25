"use client";

import { useMemo, useState } from "react";
import {
  deliveryOptions,
  findVariation,
  pricedVariation,
  type PaymentMethod,
} from "../lib/store-data";
import { applyPromoPrice, usePromoPrices } from "../lib/promotions";
import { money } from "../lib/i18n";
import { useLanguage } from "./language";
import { useDemoSession } from "./session";

type CartLine = {
  productId: string;
  variationId: string;
  qty: number;
};

function readCart() {
  try {
    return JSON.parse(window.localStorage.getItem("bc_cart") ?? "[]") as CartLine[];
  } catch {
    return [];
  }
}

const copy = {
  ru: {
    title: "Корзина и оплата",
    empty: "Корзина пустая. Добавьте товары из каталога.",
    checkout: "Checkout",
    payment: "Оплата",
    card: "Карта",
    invoice: "Счёт",
    defer15: "15 дней",
    delivery: "Доставка",
    noVat: "Счёт без PVN",
    goods: "Товары",
    total: "Итого",
    placeOrder: "Оформить заказ",
    needLogin: "Сначала войдите или зарегистрируйтесь.",
    cartEmpty: "Корзина пуста.",
    b2bOnly: "Оплата по счёту и отсрочка доступны только B2B.",
    cardStatus: "Платёж отправлен в demo acquiring: Visa/Mastercard, 3D Secure, Apple Pay/Google Pay.",
    deferStatus: "Заказ создан: B2B отсрочка 15 дней, счёт INV-2026-00044.",
    invoiceStatus: "Заказ создан: счёт INV-2026-00044 отправлен на email.",
    regions: {
      omniva: "Балтия",
      dpd: "Балтия / ЕС",
      unisend: "Балтия",
      pasts: "Латвия / ЕС",
      courier: "Рига / Балтия",
    },
    eta: {
      omniva: "1-2 дня",
      dpd: "1-4 дня",
      unisend: "1-3 дня",
      pasts: "2-7 дней",
      courier: "сегодня / завтра",
    },
  },
  lv: {
    title: "Grozs un apmaksa",
    empty: "Grozs ir tukšs. Pievienojiet preces no kataloga.",
    checkout: "Checkout",
    payment: "Apmaksa",
    card: "Karte",
    invoice: "Rēķins",
    defer15: "15 dienas",
    delivery: "Piegāde",
    noVat: "Rēķins bez PVN",
    goods: "Preces",
    total: "Kopā",
    placeOrder: "Noformēt pasūtījumu",
    needLogin: "Vispirms ieejiet vai reģistrējieties.",
    cartEmpty: "Grozs ir tukšs.",
    b2bOnly: "Rēķins un atliktais maksājums pieejams tikai B2B.",
    cardStatus: "Maksājums nosūtīts demo acquiring: Visa/Mastercard, 3D Secure, Apple Pay/Google Pay.",
    deferStatus: "Pasūtījums izveidots: B2B atliktais maksājums 15 dienas, rēķins INV-2026-00044.",
    invoiceStatus: "Pasūtījums izveidots: rēķins INV-2026-00044 nosūtīts uz email.",
    regions: {
      omniva: "Baltija",
      dpd: "Baltija / ES",
      unisend: "Baltija",
      pasts: "Latvija / ES",
      courier: "Rīga / Baltija",
    },
    eta: {
      omniva: "1-2 dienas",
      dpd: "1-4 dienas",
      unisend: "1-3 dienas",
      pasts: "2-7 dienas",
      courier: "šodien / rīt",
    },
  },
  en: {
    title: "Cart and payment",
    empty: "Your cart is empty. Add products from the catalog.",
    checkout: "Checkout",
    payment: "Payment",
    card: "Card",
    invoice: "Invoice",
    defer15: "15 days",
    delivery: "Delivery",
    noVat: "Invoice without VAT",
    goods: "Products",
    total: "Total",
    placeOrder: "Place order",
    needLogin: "Please sign in or register first.",
    cartEmpty: "The cart is empty.",
    b2bOnly: "Invoice and deferred payment are available only for B2B.",
    cardStatus: "Payment sent to demo acquiring: Visa/Mastercard, 3D Secure, Apple Pay/Google Pay.",
    deferStatus: "Order created: B2B deferred payment for 15 days, invoice INV-2026-00044.",
    invoiceStatus: "Order created: invoice INV-2026-00044 sent by email.",
    regions: {
      omniva: "Baltics",
      dpd: "Baltics / EU",
      unisend: "Baltics",
      pasts: "Latvia / EU",
      courier: "Riga / Baltics",
    },
    eta: {
      omniva: "1-2 days",
      dpd: "1-4 days",
      unisend: "1-3 days",
      pasts: "2-7 days",
      courier: "today / tomorrow",
    },
  },
} as const;

export function CartCheckout() {
  const { session, role } = useDemoSession();
  const { language } = useLanguage();
  const promoPrices = usePromoPrices();
  const c = copy[language];
  const [cart, setCart] = useState<CartLine[]>(() => readCart());
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [delivery, setDelivery] = useState(deliveryOptions[0].id);
  const [noVat, setNoVat] = useState(false);
  const [status, setStatus] = useState("");

  const lines = useMemo(
    () =>
      cart
        .map((line) => {
          const found = findVariation(line.variationId);

          if (!found) {
            return null;
          }

          const price = applyPromoPrice(
            pricedVariation(found.product, found.variation, role),
            found.variation.id,
            role,
            promoPrices,
          );
          return {
            ...line,
            ...found,
            price,
            total: price.final * line.qty,
          };
        })
        .filter(Boolean),
    [cart, promoPrices, role],
  );

  const deliveryOption =
    deliveryOptions.find((item) => item.id === delivery) ?? deliveryOptions[0];
  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
  const vat = noVat ? 0 : subtotal * 0.21;
  const total = subtotal + vat + deliveryOption.price;
  const canUseB2B = role === "b2b" || role === "admin";

  function updateQty(variationId: string, qty: number) {
    const next =
      qty <= 0
        ? cart.filter((line) => line.variationId !== variationId)
        : cart.map((line) =>
            line.variationId === variationId ? { ...line, qty } : line,
          );

    setCart(next);
    window.localStorage.setItem("bc_cart", JSON.stringify(next));
  }

  function submitOrder() {
    if (!session) {
      setStatus(c.needLogin);
      return;
    }

    if (!lines.length) {
      setStatus(c.cartEmpty);
      return;
    }

    if ((payment === "invoice" || payment === "defer15") && !canUseB2B) {
      setStatus(c.b2bOnly);
      return;
    }

    setStatus(
      payment === "card"
        ? c.cardStatus
        : payment === "defer15"
          ? c.deferStatus
          : c.invoiceStatus,
    );
  }

  return (
    <div className="checkout-page">
      <section className="checkout-list">
        <h1>{c.title}</h1>
        {lines.length ? (
          lines.map((line) => (
            <div className="cart-line" key={line.variation.id}>
              <div>
                <strong>{line.product.name}</strong>
                <span>
                  {line.variation.name} · {line.variation.sku}
                </span>
              </div>
              <input
                min={0}
                onChange={(event) => updateQty(line.variation.id, Number(event.target.value))}
                type="number"
                value={line.qty}
              />
              <strong>{money(line.total, language)}</strong>
            </div>
          ))
        ) : (
          <p className="empty-state">{c.empty}</p>
        )}
      </section>
      <aside className="checkout-panel">
        <h2>{c.checkout}</h2>
        <div className="checkout-block">
          <h3>{c.payment}</h3>
          <div className="segmented-control">
            <button
              className={payment === "card" ? "active" : ""}
              onClick={() => setPayment("card")}
              type="button"
            >
              {c.card}
            </button>
            <button
              className={payment === "invoice" ? "active" : ""}
              disabled={!canUseB2B}
              onClick={() => setPayment("invoice")}
              type="button"
            >
              {c.invoice}
            </button>
            <button
              className={payment === "defer15" ? "active" : ""}
              disabled={!canUseB2B}
              onClick={() => setPayment("defer15")}
              type="button"
            >
              {c.defer15}
            </button>
          </div>
          <div className="payment-logos">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>3D Secure</span>
            <span>Apple Pay</span>
            <span>Google Pay</span>
          </div>
        </div>
        <div className="checkout-block">
          <h3>{c.delivery}</h3>
          <select value={delivery} onChange={(event) => setDelivery(event.target.value)}>
            {deliveryOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {c.regions[item.id as keyof typeof c.regions]} · {money(item.price, language)}
              </option>
            ))}
          </select>
          <span className="quiet">{c.eta[deliveryOption.id as keyof typeof c.eta]}</span>
        </div>
        <label className="check-row">
          <input checked={noVat} onChange={(event) => setNoVat(event.target.checked)} type="checkbox" />
          {c.noVat}
        </label>
        <div className="totals">
          <span>{c.goods}</span>
          <strong>{money(subtotal, language)}</strong>
          <span>PVN</span>
          <strong>{money(vat, language)}</strong>
          <span>{c.delivery}</span>
          <strong>{money(deliveryOption.price, language)}</strong>
          <span>{c.total}</span>
          <strong>{money(total, language)}</strong>
        </div>
        <button className="wide-button" onClick={submitOrder} type="button">
          {c.placeOrder}
        </button>
        {status ? <p className="status-box">{status}</p> : null}
      </aside>
    </div>
  );
}
