"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLanguage } from "../../components/language";
import { useDemoSession } from "../../components/session";
import { categoryLabel, money } from "../../lib/i18n";
import { categories, products } from "../../lib/store-data";

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  color: string;
  size: string;
  b2c: number;
  b2b: number;
  stock: number;
  active: boolean;
};

type OrderPayment = "invoice15" | "card" | "invoice";
type OrderStatus = "reserved" | "paid" | "packing" | "sent" | "closed";

type OrderRow = {
  id: string;
  client: string;
  total: number;
  payment: OrderPayment;
  status: OrderStatus;
};

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
    addProduct: "Добавить товар",
    editProduct: "Редактирование товара",
    selectedProduct: "Выбранная позиция",
    saveHint: "Изменения применяются в этой демо-админке сразу.",
    newProduct: "Новый товар",
    product: "Товар",
    name: "Название",
    description: "Описание",
    brand: "Бренд",
    category: "Категория",
    sku: "SKU",
    color: "Цвет",
    size: "Размер",
    variant: "Вариант",
    retailPrice: "B2C цена",
    b2bPrice: "B2B цена",
    stock: "Остаток",
    status: "Статус",
    active: "активен",
    hidden: "скрыт",
    edit: "Редактировать",
    noDescription: "Описание не заполнено",
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
    addProduct: "Pievienot preci",
    editProduct: "Preces rediģēšana",
    selectedProduct: "Izvēlētā pozīcija",
    saveHint: "Izmaiņas šajā demo administrācijā tiek piemērotas uzreiz.",
    newProduct: "Jauna prece",
    product: "Prece",
    name: "Nosaukums",
    description: "Apraksts",
    brand: "Zīmols",
    category: "Kategorija",
    sku: "SKU",
    color: "Krāsa",
    size: "Izmērs",
    variant: "Variants",
    retailPrice: "B2C cena",
    b2bPrice: "B2B cena",
    stock: "Atlikums",
    status: "Statuss",
    active: "aktīvs",
    hidden: "slēpts",
    edit: "Rediģēt",
    noDescription: "Apraksts nav aizpildīts",
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
    addProduct: "Add product",
    editProduct: "Edit product",
    selectedProduct: "Selected item",
    saveHint: "Changes are applied immediately in this demo admin.",
    newProduct: "New product",
    product: "Product",
    name: "Name",
    description: "Description",
    brand: "Brand",
    category: "Category",
    sku: "SKU",
    color: "Color",
    size: "Size",
    variant: "Variant",
    retailPrice: "B2C price",
    b2bPrice: "B2B price",
    stock: "Stock",
    status: "Status",
    active: "active",
    hidden: "hidden",
    edit: "Edit",
    noDescription: "Description is empty",
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
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description,
      color: variation.color ?? "",
      size: variation.size ?? "",
      b2c: variation.b2c,
      b2b: variation.b2b,
      stock: variation.stock.physical,
      active: true,
    })),
  );
}

function createProductRow(name: string): ProductRow {
  const stamp = Date.now().toString().slice(-6);

  return {
    id: `admin-${stamp}`,
    sku: `NEW-${stamp}`,
    name,
    brand: "Karatekas",
    category: categories[0] ?? "Accessories",
    description: "",
    color: "",
    size: "",
    b2c: 0,
    b2b: 0,
    stock: 0,
    active: true,
  };
}

export default function AdminPage() {
  const { session, allUsers } = useDemoSession();
  const { language } = useLanguage();
  const c = copy[language];
  const [tab, setTab] = useState<"products" | "clients" | "orders">("products");
  const [rows, setRows] = useState<ProductRow[]>(() => productRows());
  const [selectedId, setSelectedId] = useState(products[0]?.variations[0]?.id ?? "");
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [query, setQuery] = useState("");
  const selectedRow = rows.find((row) => row.id === selectedId) ?? rows[0];
  const availableTotal = rows.reduce(
    (sum, row) => sum + (row.active ? Math.max(0, row.stock) : 0),
    0,
  );

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return rows;
    }

    return rows.filter((row) =>
      [row.sku, row.name, row.brand, row.category, row.color, row.size]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
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

  function updateSelected(patch: Partial<ProductRow>) {
    if (!selectedRow) {
      return;
    }

    updateProduct(selectedRow.id, patch);
  }

  function addProduct() {
    const row = createProductRow(c.newProduct);
    setRows((items) => [row, ...items]);
    setSelectedId(row.id);
    setTab("products");
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
          <strong>{availableTotal}</strong>
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
          <div className="admin-actions">
            <button className="primary-link" onClick={addProduct} type="button">
              {c.addProduct}
            </button>
            <input
              className="admin-search"
              placeholder={c.search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        ) : null}
      </div>

      {tab === "products" && selectedRow ? (
        <>
          <div className="admin-layout">
            <div className="tool-panel admin-editor">
              <h3>{c.editProduct}</h3>
              <div className="admin-form-grid">
                <label>
                  {c.name}
                  <input
                    value={selectedRow.name}
                    onChange={(event) => updateSelected({ name: event.target.value })}
                  />
                </label>
                <label>
                  {c.brand}
                  <input
                    value={selectedRow.brand}
                    onChange={(event) => updateSelected({ brand: event.target.value })}
                  />
                </label>
                <label>
                  {c.category}
                  <select
                    value={selectedRow.category}
                    onChange={(event) => updateSelected({ category: event.target.value })}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {categoryLabel(category, language)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {c.sku}
                  <input
                    value={selectedRow.sku}
                    onChange={(event) => updateSelected({ sku: event.target.value })}
                  />
                </label>
                <label>
                  {c.color}
                  <input
                    value={selectedRow.color}
                    onChange={(event) => updateSelected({ color: event.target.value })}
                  />
                </label>
                <label>
                  {c.size}
                  <input
                    value={selectedRow.size}
                    onChange={(event) => updateSelected({ size: event.target.value })}
                  />
                </label>
                <label>
                  {c.retailPrice}
                  <input
                    min={0}
                    type="number"
                    value={selectedRow.b2c}
                    onChange={(event) => updateSelected({ b2c: Number(event.target.value) })}
                  />
                </label>
                <label>
                  {c.b2bPrice}
                  <input
                    min={0}
                    type="number"
                    value={selectedRow.b2b}
                    onChange={(event) => updateSelected({ b2b: Number(event.target.value) })}
                  />
                </label>
                <label>
                  {c.stock}
                  <input
                    min={0}
                    type="number"
                    value={selectedRow.stock}
                    onChange={(event) => updateSelected({ stock: Number(event.target.value) })}
                  />
                </label>
              </div>
              <label>
                {c.description}
                <textarea
                  value={selectedRow.description}
                  onChange={(event) => updateSelected({ description: event.target.value })}
                />
              </label>
              <label className="switch-row">
                <input
                  checked={selectedRow.active}
                  type="checkbox"
                  onChange={(event) => updateSelected({ active: event.target.checked })}
                />
                {selectedRow.active ? c.active : c.hidden}
              </label>
              <p>{c.saveHint}</p>
            </div>

            <div className="tool-panel">
              <h3>{c.selectedProduct}</h3>
              <div className="metric-row">
                <span>{c.product}</span>
                <strong>{selectedRow.name}</strong>
              </div>
              <div className="metric-row">
                <span>{c.variant}</span>
                <strong>{[selectedRow.color, selectedRow.size].filter(Boolean).join(" / ") || "-"}</strong>
              </div>
              <div className="metric-row">
                <span>{c.retailPrice}</span>
                <strong>{money(selectedRow.b2c, language)}</strong>
              </div>
              <div className="metric-row">
                <span>{c.b2bPrice}</span>
                <strong>{money(selectedRow.b2b, language)}</strong>
              </div>
            </div>
          </div>

          <div className="table-wrap admin-table">
            <table>
              <thead>
                <tr>
                  <th>{c.product}</th>
                  <th>{c.category}</th>
                  <th>{c.sku}</th>
                  <th>{c.variant}</th>
                  <th>B2C / B2B</th>
                  <th>{c.stock}</th>
                  <th>{c.status}</th>
                  <th>{c.edit}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr className={row.id === selectedRow.id ? "selected-row" : ""} key={row.id}>
                    <td>
                      <strong>{row.name}</strong>
                      <span>{row.description || c.noDescription}</span>
                    </td>
                    <td>{categoryLabel(row.category, language)}</td>
                    <td>{row.sku}</td>
                    <td>{[row.color, row.size].filter(Boolean).join(" / ") || "-"}</td>
                    <td>
                      {money(row.b2c, language)}
                      <span>{money(row.b2b, language)}</span>
                    </td>
                    <td>{row.stock}</td>
                    <td>
                      <span className={row.active ? "status-pill ok" : "status-pill"}>
                        {row.active ? c.active : c.hidden}
                      </span>
                    </td>
                    <td>
                      <button
                        className="table-action"
                        onClick={() => setSelectedId(row.id)}
                        type="button"
                      >
                        {c.edit}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
