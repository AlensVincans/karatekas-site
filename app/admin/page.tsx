"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLanguage } from "../../components/language";
import { useDemoSession } from "../../components/session";
import { categoryLabel, money } from "../../lib/i18n";
import { categories, products, warehouseTotals } from "../../lib/store-data";

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
  payment: OrderPayment;
  status: OrderStatus;
};

type OrderPayment = "invoice15" | "card" | "invoice";
type OrderStatus = "reserved" | "paid" | "packing" | "sent" | "closed";

const orderStatuses: OrderStatus[] = ["reserved", "paid", "packing", "sent", "closed"];

const copy = {
  ru: {
    panel: "Админ-панель",
    closed: "Раздел закрыт",
    closedText: "Управление магазином доступно только администратору. Войдите в аккаунт с правами администратора.",
    login: "Войти",
    title: "Управление магазином",
    intro: "Товары, клиенты и заказы магазина экипировки без лишних экранов.",
    activeProducts: "Активные товары",
    clients: "Клиенты",
    stockAvailable: "Доступно на складе",
    categories: "Категории",
    products: "Товары",
    orders: "Заказы",
    search: "Поиск по SKU, названию или бренду",
    product: "Товар",
    category: "Категория",
    stock: "Остаток",
    status: "Статус",
    active: "активен",
    hidden: "скрыт",
    type: "Тип",
    company: "Компания",
    confirmed: "подтверждён",
    waitingEmail: "ожидает email",
    order: "Заказ",
    sum: "Сумма",
    payment: "Оплата",
    payments: {
      invoice15: "счёт, 15 дней",
      card: "карта",
      invoice: "счёт",
    },
    statuses: {
      reserved: "в резерве",
      paid: "оплачен",
      packing: "сборка",
      sent: "отправлен",
      closed: "закрыт",
    },
  },
  lv: {
    panel: "Administrācija",
    closed: "Sadaļa slēgta",
    closedText: "Veikala pārvaldība pieejama tikai administratoram. Ieejiet administratora kontā.",
    login: "Ieiet",
    title: "Veikala pārvaldība",
    intro: "Preces, klienti un pasūtījumi bez liekiem ekrāniem.",
    activeProducts: "Aktīvās preces",
    clients: "Klienti",
    stockAvailable: "Pieejams noliktavā",
    categories: "Kategorijas",
    products: "Preces",
    orders: "Pasūtījumi",
    search: "Meklēt pēc SKU, nosaukuma vai zīmola",
    product: "Prece",
    category: "Kategorija",
    stock: "Atlikums",
    status: "Statuss",
    active: "aktīvs",
    hidden: "slēpts",
    type: "Tips",
    company: "Uzņēmums",
    confirmed: "apstiprināts",
    waitingEmail: "gaida email",
    order: "Pasūtījums",
    sum: "Summa",
    payment: "Apmaksa",
    payments: {
      invoice15: "rēķins, 15 dienas",
      card: "karte",
      invoice: "rēķins",
    },
    statuses: {
      reserved: "rezervē",
      paid: "apmaksāts",
      packing: "komplektēšana",
      sent: "nosūtīts",
      closed: "slēgts",
    },
  },
  en: {
    panel: "Admin",
    closed: "Section closed",
    closedText: "Store management is available only to an administrator. Sign in with an admin account.",
    login: "Login",
    title: "Store management",
    intro: "Products, clients and orders without extra screens.",
    activeProducts: "Active products",
    clients: "Clients",
    stockAvailable: "Available in stock",
    categories: "Categories",
    products: "Products",
    orders: "Orders",
    search: "Search by SKU, name or brand",
    product: "Product",
    category: "Category",
    stock: "Stock",
    status: "Status",
    active: "active",
    hidden: "hidden",
    type: "Type",
    company: "Company",
    confirmed: "confirmed",
    waitingEmail: "waiting email",
    order: "Order",
    sum: "Total",
    payment: "Payment",
    payments: {
      invoice15: "invoice, 15 days",
      card: "card",
      invoice: "invoice",
    },
    statuses: {
      reserved: "reserved",
      paid: "paid",
      packing: "packing",
      sent: "sent",
      closed: "closed",
    },
  },
} as const;

const initialOrders: OrderRow[] = [
  {
    id: "ORD-2026-041",
    client: "Riga Karate Club",
    total: 684,
    payment: "invoice15",
    status: "reserved",
  },
  {
    id: "ORD-2026-042",
    client: "Marta Ozola",
    total: 157.3,
    payment: "card",
    status: "paid",
  },
  {
    id: "ORD-2026-043",
    client: "Tallinn Karate Dojo",
    total: 1240,
    payment: "invoice",
    status: "packing",
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
  const { language } = useLanguage();
  const c = copy[language];
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
        <span className="eyebrow">{c.panel}</span>
        <h1>{c.closed}</h1>
        <p>{c.closedText}</p>
        <Link className="wide-button inline-button" href="/login">
          {c.login}
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
        <span className="eyebrow">{c.panel}</span>
        <h1>{c.title}</h1>
        <p>{c.intro}</p>
      </div>

      <div className="admin-stats compact">
        <div>
          <span>{c.activeProducts}</span>
          <strong>{rows.filter((row) => row.active).length}</strong>
        </div>
        <div>
          <span>{c.clients}</span>
          <strong>{allUsers.length}</strong>
        </div>
        <div>
          <span>{c.stockAvailable}</span>
          <strong>{totals.available}</strong>
        </div>
        <div>
          <span>{c.categories}</span>
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
            {c.products}
          </button>
          <button
            className={tab === "clients" ? "active" : ""}
            onClick={() => setTab("clients")}
            type="button"
          >
            {c.clients}
          </button>
          <button
            className={tab === "orders" ? "active" : ""}
            onClick={() => setTab("orders")}
            type="button"
          >
            {c.orders}
          </button>
        </div>

        {tab === "products" ? (
          <input
            className="admin-search"
            placeholder={c.search}
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
                <th>{c.product}</th>
                <th>{c.category}</th>
                <th>B2C</th>
                <th>B2B</th>
                <th>{c.stock}</th>
                <th>{c.status}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                    <span>{row.sku} · {row.brand}</span>
                  </td>
                  <td>{categoryLabel(row.category, language)}</td>
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
                      {row.active ? c.active : c.hidden}
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
                <th>{c.clients}</th>
                <th>Email</th>
                <th>{c.type}</th>
                <th>{c.company}</th>
                <th>{c.status}</th>
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
                      {user.emailConfirmed ? c.confirmed : c.waitingEmail}
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
                <th>{c.order}</th>
                <th>{c.clients}</th>
                <th>{c.sum}</th>
                <th>{c.payment}</th>
                <th>{c.status}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.client}</td>
                  <td>{money(order.total, language)}</td>
                  <td>{c.payments[order.payment]}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(event) =>
                        setOrders((items) =>
                          items.map((item) =>
                            item.id === order.id
                              ? { ...item, status: event.target.value as OrderStatus }
                              : item,
                          ),
                        )
                      }
                    >
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>
                          {c.statuses[status]}
                        </option>
                      ))}
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
