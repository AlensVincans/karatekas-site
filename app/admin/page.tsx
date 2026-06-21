"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemoSession } from "../../components/session";
import {
  available,
  categories as seedCategories,
  demoUsers,
  discounts,
  eur,
  margin,
  products,
  unitCost,
  warehouseTotals,
} from "../../lib/store-data";

const orders = [
  {
    id: "ORD-2026-041",
    client: "SIA Baltic Service",
    channel: "B2B",
    total: 684,
    payment: "отсрочка 15 дней",
    status: "в резерве",
  },
  {
    id: "ORD-2026-042",
    client: "Marta Ozola",
    channel: "B2C",
    total: 157.3,
    payment: "карта 3D Secure",
    status: "оплачен",
  },
];

export default function AdminPage() {
  const { session, allUsers } = useDemoSession();
  const [tab, setTab] = useState("products");
  const [categories, setCategories] = useState(seedCategories);
  const [categoryDraft, setCategoryDraft] = useState("");
  const totals = warehouseTotals();

  if (session?.role !== "admin") {
    return (
      <section className="section-shell narrow">
        <span className="eyebrow">Админка</span>
        <h1>Нужна роль admin</h1>
        <p>Демо-вход: `admin@baltic.test / admin123`.</p>
        <Link className="wide-button inline-button" href="/login">
          Войти как админ
        </Link>
      </section>
    );
  }

  function addCategory() {
    const value = categoryDraft.trim();

    if (!value || categories.includes(value)) {
      return;
    }

    setCategories([...categories, value]);
    setCategoryDraft("");
  }

  return (
    <section className="section-shell">
      <div className="section-heading">
        <span className="eyebrow">Админ-панель</span>
        <h1>Управление магазином</h1>
      </div>
      <div className="admin-stats">
        <div>
          <span>Товары</span>
          <strong>{products.length}</strong>
        </div>
        <div>
          <span>Пользователи</span>
          <strong>{allUsers.length || demoUsers.length}</strong>
        </div>
        <div>
          <span>Доступно</span>
          <strong>{totals.available}</strong>
        </div>
        <div>
          <span>Склад cost</span>
          <strong>{eur(totals.cost)}</strong>
        </div>
      </div>
      <div className="admin-tabs">
        {[
          ["products", "Товары"],
          ["users", "Пользователи"],
          ["warehouse", "Склад"],
          ["orders", "Заказы"],
          ["invoices", "Счета"],
          ["discounts", "Скидки"],
          ["db", "SQLite"],
        ].map(([id, label]) => (
          <button
            className={tab === id ? "active" : ""}
            key={id}
            onClick={() => setTab(id)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "products" ? (
        <div className="admin-layout">
          <div className="tool-panel">
            <h3>Категории без программиста</h3>
            <div className="inline-form">
              <input
                value={categoryDraft}
                onChange={(event) => setCategoryDraft(event.target.value)}
                placeholder="Новая категория"
              />
              <button onClick={addCategory} type="button">
                Добавить
              </button>
            </div>
            <div className="chip-list">
              {categories.map((category) => (
                <span className="chip" key={category}>
                  {category}
                </span>
              ))}
            </div>
          </div>
          <div className="tool-panel">
            <h3>Excel импорт</h3>
            <textarea
              defaultValue={
                "SKU;Название;Бренд;Категория;B2C;B2B;Остаток\nEX-100;Расходник;Nordline;Расходники;19.90;14.20;75"
              }
            />
            <button className="wide-button" type="button">
              Импортировать CSV/XLSX
            </button>
          </div>
        </div>
      ) : null}

      {tab === "users" ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Имя</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Компания</th>
                <th>Double opt-in</th>
              </tr>
            </thead>
            <tbody>
              {(allUsers.length ? allUsers : demoUsers).map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.company ?? "-"}</td>
                  <td>{user.emailConfirmed ? "да" : "нет"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "warehouse" ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Физ.</th>
                <th>Резерв</th>
                <th>Доступно</th>
                <th>Ожидается</th>
                <th>Партия</th>
                <th>Себестоимость</th>
                <th>Маржа B2B</th>
              </tr>
            </thead>
            <tbody>
              {products.flatMap((product) =>
                product.variations.map((variation) => (
                  <tr key={variation.id}>
                    <td>
                      <strong>{variation.sku}</strong>
                      <span>{product.name}</span>
                    </td>
                    <td>{variation.stock.physical}</td>
                    <td>{variation.stock.reserved}</td>
                    <td>{available(variation.stock)}</td>
                    <td>{variation.stock.expected}</td>
                    <td>{variation.stock.lots[0]?.batch ?? "-"}</td>
                    <td>{eur(unitCost(variation.stock))}</td>
                    <td>{eur(margin(variation.b2b, variation.stock))}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "orders" ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Заказ</th>
                <th>Клиент</th>
                <th>Канал</th>
                <th>Сумма</th>
                <th>Оплата</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.client}</td>
                  <td>{order.channel}</td>
                  <td>{eur(order.total)}</td>
                  <td>{order.payment}</td>
                  <td>{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "invoices" ? (
        <div className="admin-layout">
          <div className="tool-panel">
            <h3>Счета</h3>
            <div className="metric-row">
              <span>Текущий номер</span>
              <strong>INV-2026-00044</strong>
            </div>
            <button className="wide-button" type="button">
              PDF / Email
            </button>
            <button className="wide-button secondary" type="button">
              CSV / XML экспорт
            </button>
          </div>
          <div className="tool-panel">
            <h3>Бухгалтерия</h3>
            <p>
              Поддержка счетов с PVN и без PVN, автонумерация, редактирование и
              накладные.
            </p>
          </div>
        </div>
      ) : null}

      {tab === "discounts" ? (
        <div className="rule-list">
          {discounts.map((discount) => (
            <div className="rule-row" key={discount.id}>
              <strong>{discount.name}</strong>
              <span>
                {discount.scope}: {discount.target} · {discount.audience} ·{" "}
                {discount.type === "percent" ? `${discount.value}%` : eur(discount.value)}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "db" ? (
        <div className="admin-layout">
          <div className="tool-panel">
            <h3>Пользователи</h3>
            <p>`data/users.sqlite` хранит users, roles, sessions и audit_log.</p>
          </div>
          <div className="tool-panel">
            <h3>Товары</h3>
            <p>
              `data/products.sqlite` хранит brands, categories, products,
              variations, stock_lots, discounts и suppliers.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
