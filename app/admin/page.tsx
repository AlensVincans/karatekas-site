"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDemoSession } from "../../components/session";
import { categories, eur, products, warehouseTotals } from "../../lib/store-data";

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  b2c: number;
  b2b: number;
  stock: number;
  active: boolean;
};

type OrderRow = {
  id: string;
  client: string;
  total: number;
  payment: string;
  status: string;
};

const initialOrders: OrderRow[] = [
  {
    id: "ORD-2026-041",
    client: "SIA Baltic Service",
    total: 684,
    payment: "счёт, 15 дней",
    status: "в резерве",
  },
  {
    id: "ORD-2026-042",
    client: "Marta Ozola",
    total: 157.3,
    payment: "карта",
    status: "оплачен",
  },
  {
    id: "ORD-2026-043",
    client: "UAB North Retail",
    total: 1240,
    payment: "счёт",
    status: "сборка",
  },
];

function productRows() {
  return products.flatMap((product) =>
    product.variations.map((variation) => ({
      id: variation.id,
      sku: variation.sku,
      name: `${product.name} · ${variation.name}`,
      brand: product.brand,
      category: product.category,
      b2c: variation.b2c,
      b2b: variation.b2b,
      stock: variation.stock.physical,
      active: true,
    })),
  );
}

export default function AdminPage() {
  const { session, allUsers } = useDemoSession();
  const [tab, setTab] = useState<"products" | "clients" | "orders">("products");
  const [rows, setRows] = useState<ProductRow[]>(() => productRows());
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [query, setQuery] = useState("");
  const totals = warehouseTotals();

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return rows;
    }

    return rows.filter((row) =>
      [row.sku, row.name, row.brand, row.category].join(" ").toLowerCase().includes(normalized),
    );
  }, [query, rows]);

  if (session?.role !== "admin") {
    return (
      <section className="section-shell narrow">
        <span className="eyebrow">Админ-панель</span>
        <h1>Раздел закрыт</h1>
        <p>
          Управление магазином доступно только администратору. Войдите в
          аккаунт с правами администратора.
        </p>
        <Link className="wide-button inline-button" href="/login">
          Войти
        </Link>
      </section>
    );
  }

  function updateProduct(id: string, patch: Partial<ProductRow>) {
    setRows((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  return (
    <section className="section-shell admin-page">
      <div className="section-heading admin-heading">
        <span className="eyebrow">Админ-панель</span>
        <h1>Управление магазином</h1>
        <p>Товары, клиенты и заказы без лишних экранов.</p>
      </div>

      <div className="admin-stats compact">
        <div>
          <span>Активные товары</span>
          <strong>{rows.filter((row) => row.active).length}</strong>
        </div>
        <div>
          <span>Клиенты</span>
          <strong>{allUsers.length}</strong>
        </div>
        <div>
          <span>Доступно на складе</span>
          <strong>{totals.available}</strong>
        </div>
        <div>
          <span>Категории</span>
          <strong>{categories.length}</strong>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-tabs">
          <button
            className={tab === "products" ? "active" : ""}
            onClick={() => setTab("products")}
            type="button"
          >
            Товары
          </button>
          <button
            className={tab === "clients" ? "active" : ""}
            onClick={() => setTab("clients")}
            type="button"
          >
            Клиенты
          </button>
          <button
            className={tab === "orders" ? "active" : ""}
            onClick={() => setTab("orders")}
            type="button"
          >
            Заказы
          </button>
        </div>

        {tab === "products" ? (
          <input
            className="admin-search"
            placeholder="Поиск по SKU, названию или бренду"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        ) : null}
      </div>

      {tab === "products" ? (
        <div className="table-wrap admin-table">
          <table>
            <thead>
              <tr>
                <th>Товар</th>
                <th>Категория</th>
                <th>B2C</th>
                <th>B2B</th>
                <th>Остаток</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                    <span>{row.sku} · {row.brand}</span>
                  </td>
                  <td>{row.category}</td>
                  <td>
                    <input
                      min={0}
                      type="number"
                      value={row.b2c}
                      onChange={(event) =>
                        updateProduct(row.id, { b2c: Number(event.target.value) })
                      }
                    />
                  </td>
                  <td>
                    <input
                      min={0}
                      type="number"
                      value={row.b2b}
                      onChange={(event) =>
                        updateProduct(row.id, { b2b: Number(event.target.value) })
                      }
                    />
                  </td>
                  <td>
                    <input
                      min={0}
                      type="number"
                      value={row.stock}
                      onChange={(event) =>
                        updateProduct(row.id, { stock: Number(event.target.value) })
                      }
                    />
                  </td>
                  <td>
                    <label className="switch-row">
                      <input
                        checked={row.active}
                        type="checkbox"
                        onChange={(event) =>
                          updateProduct(row.id, { active: event.target.checked })
                        }
                      />
                      {row.active ? "активен" : "скрыт"}
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "clients" ? (
        <div className="table-wrap admin-table">
          <table>
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Email</th>
                <th>Тип</th>
                <th>Компания</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role === "b2b" ? "B2B" : user.role === "admin" ? "Admin" : "B2C"}</td>
                  <td>{user.company ?? "-"}</td>
                  <td>
                    <span className={user.emailConfirmed ? "status-pill ok" : "status-pill"}>
                      {user.emailConfirmed ? "подтверждён" : "ожидает email"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "orders" ? (
        <div className="table-wrap admin-table">
          <table>
            <thead>
              <tr>
                <th>Заказ</th>
                <th>Клиент</th>
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
                  <td>{eur(order.total)}</td>
                  <td>{order.payment}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(event) =>
                        setOrders((items) =>
                          items.map((item) =>
                            item.id === order.id
                              ? { ...item, status: event.target.value }
                              : item,
                          ),
                        )
                      }
                    >
                      <option>в резерве</option>
                      <option>оплачен</option>
                      <option>сборка</option>
                      <option>отправлен</option>
                      <option>закрыт</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
