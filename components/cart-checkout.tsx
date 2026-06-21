"use client";

import { useMemo, useState } from "react";
import {
  deliveryOptions,
  eur,
  findVariation,
  pricedVariation,
  type PaymentMethod,
} from "../lib/store-data";
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

export function CartCheckout() {
  const { session, role } = useDemoSession();
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

          const price = pricedVariation(found.product, found.variation, role);
          return {
            ...line,
            ...found,
            price,
            total: price.final * line.qty,
          };
        })
        .filter(Boolean),
    [cart, role],
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
      setStatus("Сначала войдите или зарегистрируйтесь.");
      return;
    }

    if (!lines.length) {
      setStatus("Корзина пуста.");
      return;
    }

    if ((payment === "invoice" || payment === "defer15") && !canUseB2B) {
      setStatus("Оплата по счёту и отсрочка доступны только B2B.");
      return;
    }

    setStatus(
      payment === "card"
        ? "Платёж отправлен в demo acquiring: Visa/Mastercard, 3D Secure, Apple Pay/Google Pay."
        : payment === "defer15"
          ? "Заказ создан: B2B отсрочка 15 дней, счёт INV-2026-00044."
          : "Заказ создан: счёт INV-2026-00044 отправлен на email.",
    );
  }

  return (
    <div className="checkout-page">
      <section className="checkout-list">
        <h1>Корзина и оплата</h1>
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
              <strong>{eur(line.total)}</strong>
            </div>
          ))
        ) : (
          <p className="empty-state">Корзина пуста. Добавьте товары из каталога.</p>
        )}
      </section>
      <aside className="checkout-panel">
        <h2>Checkout</h2>
        <div className="checkout-block">
          <h3>Оплата</h3>
          <div className="segmented-control">
            <button
              className={payment === "card" ? "active" : ""}
              onClick={() => setPayment("card")}
              type="button"
            >
              Карта
            </button>
            <button
              className={payment === "invoice" ? "active" : ""}
              disabled={!canUseB2B}
              onClick={() => setPayment("invoice")}
              type="button"
            >
              Счёт
            </button>
            <button
              className={payment === "defer15" ? "active" : ""}
              disabled={!canUseB2B}
              onClick={() => setPayment("defer15")}
              type="button"
            >
              15 дней
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
          <h3>Доставка</h3>
          <select value={delivery} onChange={(event) => setDelivery(event.target.value)}>
            {deliveryOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.region} · {eur(item.price)}
              </option>
            ))}
          </select>
          <span className="quiet">{deliveryOption.eta}</span>
        </div>
        <label className="check-row">
          <input checked={noVat} onChange={(event) => setNoVat(event.target.checked)} type="checkbox" />
          Счёт без PVN
        </label>
        <div className="totals">
          <span>Товары</span>
          <strong>{eur(subtotal)}</strong>
          <span>PVN</span>
          <strong>{eur(vat)}</strong>
          <span>Доставка</span>
          <strong>{eur(deliveryOption.price)}</strong>
          <span>Итого</span>
          <strong>{eur(total)}</strong>
        </div>
        <button className="wide-button" onClick={submitOrder} type="button">
          Оформить заказ
        </button>
        {status ? <p className="status-box">{status}</p> : null}
      </aside>
    </div>
  );
}
