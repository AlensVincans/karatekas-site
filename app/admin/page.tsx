"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { useLanguage } from "../../components/language";
import { useDemoSession } from "../../components/session";
import { categoryLabel, money } from "../../lib/i18n";
import { categories, products } from "../../lib/store-data";

type AdminVariation = {
  id: string;
  sku: string;
  color: string;
  size: string;
  b2c: number;
  b2b: number;
  stock: number;
  active: boolean;
};

type AdminProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  active: boolean;
  variations: AdminVariation[];
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
    search: "Поиск по названию, бренду, SKU, цвету или размеру",
    addProduct: "Добавить товар",
    addProductTitle: "Новый товар",
    saveProduct: "Сохранить товар",
    cancel: "Отмена",
    close: "Закрыть",
    editProduct: "Редактирование товара",
    saveHint: "Изменения применяются в этой демо-админке сразу.",
    product: "Товар",
    name: "Название",
    description: "Описание",
    brand: "Бренд",
    category: "Категория",
    sku: "SKU",
    color: "Цвет",
    size: "Размер",
    variant: "Вариация",
    variants: "Вариации",
    addVariation: "Добавить вариацию",
    removeVariation: "Удалить вариацию",
    retailPrice: "B2C цена",
    b2bPrice: "B2B цена",
    price: "Цена",
    stock: "Остаток",
    status: "Статус",
    active: "активен",
    hidden: "скрыт",
    edit: "Редактировать",
    delete: "Удалить",
    deleteConfirm: "Удалить товар",
    noDescription: "Описание не заполнено",
    noVariant: "без вариации",
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
    search: "Meklēt pēc nosaukuma, zīmola, SKU, krāsas vai izmēra",
    addProduct: "Pievienot preci",
    addProductTitle: "Jauna prece",
    saveProduct: "Saglabāt preci",
    cancel: "Atcelt",
    close: "Aizvērt",
    editProduct: "Preces rediģēšana",
    saveHint: "Izmaiņas šajā demo administrācijā tiek piemērotas uzreiz.",
    product: "Prece",
    name: "Nosaukums",
    description: "Apraksts",
    brand: "Zīmols",
    category: "Kategorija",
    sku: "SKU",
    color: "Krāsa",
    size: "Izmērs",
    variant: "Variācija",
    variants: "Variācijas",
    addVariation: "Pievienot variāciju",
    removeVariation: "Dzēst variāciju",
    retailPrice: "B2C cena",
    b2bPrice: "B2B cena",
    price: "Cena",
    stock: "Atlikums",
    status: "Statuss",
    active: "aktīvs",
    hidden: "slēpts",
    edit: "Rediģēt",
    delete: "Dzēst",
    deleteConfirm: "Dzēst preci",
    noDescription: "Apraksts nav aizpildīts",
    noVariant: "bez variācijas",
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
    search: "Search by name, brand, SKU, color or size",
    addProduct: "Add product",
    addProductTitle: "New product",
    saveProduct: "Save product",
    cancel: "Cancel",
    close: "Close",
    editProduct: "Edit product",
    saveHint: "Changes are applied immediately in this demo admin.",
    product: "Product",
    name: "Name",
    description: "Description",
    brand: "Brand",
    category: "Category",
    sku: "SKU",
    color: "Color",
    size: "Size",
    variant: "Variation",
    variants: "Variations",
    addVariation: "Add variation",
    removeVariation: "Remove variation",
    retailPrice: "B2C price",
    b2bPrice: "B2B price",
    price: "Price",
    stock: "Stock",
    status: "Status",
    active: "active",
    hidden: "hidden",
    edit: "Edit",
    delete: "Delete",
    deleteConfirm: "Delete product",
    noDescription: "Description is empty",
    noVariant: "no variation",
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

type CopyText = (typeof copy)[keyof typeof copy];

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

function createVariation(index = 1): AdminVariation {
  const stamp = `${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`;

  return {
    id: `var-${stamp}`,
    sku: `SKU-${stamp}-${index}`,
    color: "",
    size: "",
    b2c: 0,
    b2b: 0,
    stock: 0,
    active: true,
  };
}

function createProduct(name = ""): AdminProduct {
  const stamp = `${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`;

  return {
    id: `admin-product-${stamp}`,
    name,
    brand: "Karatekas",
    category: categories[0] ?? "Accessories",
    description: "",
    active: true,
    variations: [createVariation()],
  };
}

function productRows(): AdminProduct[] {
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
    active: true,
    variations: product.variations.map((variation) => ({
      id: variation.id,
      sku: variation.sku,
      color: variation.color ?? "",
      size: variation.size ?? "",
      b2c: variation.b2c,
      b2b: variation.b2b,
      stock: variation.stock.physical,
      active: true,
    })),
  }));
}

function patchVariation(
  product: AdminProduct,
  variationId: string,
  patch: Partial<AdminVariation>,
) {
  return {
    ...product,
    variations: product.variations.map((variation) =>
      variation.id === variationId ? { ...variation, ...patch } : variation,
    ),
  };
}

function addVariation(product: AdminProduct) {
  return {
    ...product,
    variations: [...product.variations, createVariation(product.variations.length + 1)],
  };
}

function removeVariation(product: AdminProduct, variationId: string) {
  if (product.variations.length <= 1) {
    return product;
  }

  return {
    ...product,
    variations: product.variations.filter((variation) => variation.id !== variationId),
  };
}

function productStock(product: AdminProduct) {
  if (!product.active) {
    return 0;
  }

  return product.variations.reduce(
    (sum, variation) => sum + (variation.active ? Math.max(0, variation.stock) : 0),
    0,
  );
}

function productPriceRange(
  product: AdminProduct,
  key: "b2c" | "b2b",
  language: Parameters<typeof money>[1],
) {
  const prices = product.variations.map((variation) => variation[key]);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return min === max ? money(min, language) : `${money(min, language)} - ${money(max, language)}`;
}

function variationSummary(product: AdminProduct, fallback: string) {
  const labels = product.variations
    .map((variation) => [variation.color, variation.size].filter(Boolean).join(" / "))
    .filter(Boolean);

  return labels.slice(0, 3).join(", ") || fallback;
}

function ProductForm({
  product,
  c,
  language,
  onProductChange,
  onVariationChange,
  onAddVariation,
  onRemoveVariation,
  footer,
}: {
  product: AdminProduct;
  c: CopyText;
  language: Parameters<typeof money>[1];
  onProductChange: (patch: Partial<AdminProduct>) => void;
  onVariationChange: (variationId: string, patch: Partial<AdminVariation>) => void;
  onAddVariation: () => void;
  onRemoveVariation: (variationId: string) => void;
  footer: ReactNode;
}) {
  return (
    <div className="admin-inline-editor">
      <div className="admin-form-grid">
        <label>
          {c.name}
          <input
            value={product.name}
            onChange={(event) => onProductChange({ name: event.target.value })}
          />
        </label>
        <label>
          {c.brand}
          <input
            value={product.brand}
            onChange={(event) => onProductChange({ brand: event.target.value })}
          />
        </label>
        <label>
          {c.category}
          <select
            value={product.category}
            onChange={(event) => onProductChange({ category: event.target.value })}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category, language)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="admin-full-field">
        {c.description}
        <textarea
          value={product.description}
          onChange={(event) => onProductChange({ description: event.target.value })}
        />
      </label>

      <label className="switch-row">
        <input
          checked={product.active}
          type="checkbox"
          onChange={(event) => onProductChange({ active: event.target.checked })}
        />
        {product.active ? c.active : c.hidden}
      </label>

      <div className="variation-editor">
        <div className="variation-editor-head">
          <h4>{c.variants}</h4>
          <button className="table-action" onClick={onAddVariation} type="button">
            {c.addVariation}
          </button>
        </div>

        {product.variations.map((variation) => (
          <div className="variation-editor-row" key={variation.id}>
            <label>
              {c.sku}
              <input
                value={variation.sku}
                onChange={(event) => onVariationChange(variation.id, { sku: event.target.value })}
              />
            </label>
            <label>
              {c.color}
              <input
                value={variation.color}
                onChange={(event) => onVariationChange(variation.id, { color: event.target.value })}
              />
            </label>
            <label>
              {c.size}
              <input
                value={variation.size}
                onChange={(event) => onVariationChange(variation.id, { size: event.target.value })}
              />
            </label>
            <label>
              {c.retailPrice}
              <input
                min={0}
                type="number"
                value={variation.b2c}
                onChange={(event) => onVariationChange(variation.id, { b2c: Number(event.target.value) })}
              />
            </label>
            <label>
              {c.b2bPrice}
              <input
                min={0}
                type="number"
                value={variation.b2b}
                onChange={(event) => onVariationChange(variation.id, { b2b: Number(event.target.value) })}
              />
            </label>
            <label>
              {c.stock}
              <input
                min={0}
                type="number"
                value={variation.stock}
                onChange={(event) => onVariationChange(variation.id, { stock: Number(event.target.value) })}
              />
            </label>
            <label className="switch-row">
              <input
                checked={variation.active}
                type="checkbox"
                onChange={(event) => onVariationChange(variation.id, { active: event.target.checked })}
              />
              {variation.active ? c.active : c.hidden}
            </label>
            <button
              className="table-action danger"
              disabled={product.variations.length <= 1}
              onClick={() => onRemoveVariation(variation.id)}
              type="button"
            >
              {c.removeVariation}
            </button>
          </div>
        ))}
      </div>

      <div className="admin-form-actions">{footer}</div>
    </div>
  );
}

export default function AdminPage() {
  const { session, allUsers } = useDemoSession();
  const { language } = useLanguage();
  const c = copy[language];
  const [tab, setTab] = useState<"products" | "clients" | "orders">("products");
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>(() => productRows());
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [draftProduct, setDraftProduct] = useState<AdminProduct>(() => createProduct());
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [query, setQuery] = useState("");
  const availableTotal = adminProducts.reduce(
    (sum, product) => sum + productStock(product),
    0,
  );

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return adminProducts;
    }

    return adminProducts.filter((product) =>
      [
        product.name,
        product.brand,
        product.category,
        product.description,
        product.variations.map((variation) =>
          [variation.sku, variation.color, variation.size].join(" "),
        ).join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [adminProducts, query]);

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

  function updateProduct(productId: string, patch: Partial<AdminProduct>) {
    setAdminProducts((items) =>
      items.map((product) =>
        product.id === productId ? { ...product, ...patch } : product,
      ),
    );
  }

  function updateProductVariation(
    productId: string,
    variationId: string,
    patch: Partial<AdminVariation>,
  ) {
    setAdminProducts((items) =>
      items.map((product) =>
        product.id === productId ? patchVariation(product, variationId, patch) : product,
      ),
    );
  }

  function deleteProduct(product: AdminProduct) {
    if (!window.confirm(`${c.deleteConfirm}: ${product.name}?`)) {
      return;
    }

    setAdminProducts((items) => items.filter((item) => item.id !== product.id));

    if (editProductId === product.id) {
      setEditProductId(null);
    }
  }

  function openAddForm() {
    setDraftProduct(createProduct());
    setShowAddForm(true);
    setEditProductId(null);
    setTab("products");
  }

  function saveDraftProduct() {
    const product = {
      ...draftProduct,
      name: draftProduct.name.trim() || c.addProductTitle,
    };

    setAdminProducts((items) => [product, ...items]);
    setDraftProduct(createProduct());
    setShowAddForm(false);
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
          <strong>{adminProducts.filter((product) => product.active).length}</strong>
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
            <button className="primary-link" onClick={openAddForm} type="button">
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

      {tab === "products" && showAddForm ? (
        <div className="tool-panel admin-editor">
          <h3>{c.addProductTitle}</h3>
          <ProductForm
            product={draftProduct}
            c={c}
            language={language}
            onProductChange={(patch) =>
              setDraftProduct((product) => ({ ...product, ...patch }))
            }
            onVariationChange={(variationId, patch) =>
              setDraftProduct((product) => patchVariation(product, variationId, patch))
            }
            onAddVariation={() => setDraftProduct((product) => addVariation(product))}
            onRemoveVariation={(variationId) =>
              setDraftProduct((product) => removeVariation(product, variationId))
            }
            footer={
              <>
                <button className="wide-button inline-button" onClick={saveDraftProduct} type="button">
                  {c.saveProduct}
                </button>
                <button
                  className="table-action"
                  onClick={() => setShowAddForm(false)}
                  type="button"
                >
                  {c.cancel}
                </button>
              </>
            }
          />
        </div>
      ) : null}

      {tab === "products" ? (
        <div className="table-wrap admin-table">
          <table>
            <thead>
              <tr>
                <th>{c.product}</th>
                <th>{c.category}</th>
                <th>{c.variants}</th>
                <th>{c.price}</th>
                <th>{c.stock}</th>
                <th>{c.status}</th>
                <th>{c.edit}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <Fragment key={product.id}>
                  <tr className={editProductId === product.id ? "selected-row" : ""}>
                    <td>
                      <strong>{product.name}</strong>
                      <span>
                        {product.brand} · {product.description || c.noDescription}
                      </span>
                    </td>
                    <td>{categoryLabel(product.category, language)}</td>
                    <td>
                      {product.variations.length}
                      <span>{variationSummary(product, c.noVariant)}</span>
                    </td>
                    <td>
                      {productPriceRange(product, "b2c", language)}
                      <span>{productPriceRange(product, "b2b", language)}</span>
                    </td>
                    <td>{productStock(product)}</td>
                    <td>
                      <span className={product.active ? "status-pill ok" : "status-pill"}>
                        {product.active ? c.active : c.hidden}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="table-action"
                          onClick={() => {
                            setEditProductId((current) =>
                              current === product.id ? null : product.id,
                            );
                            setShowAddForm(false);
                          }}
                          type="button"
                        >
                          {editProductId === product.id ? c.close : c.edit}
                        </button>
                        <button
                          className="table-action danger"
                          onClick={() => deleteProduct(product)}
                          type="button"
                        >
                          {c.delete}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {editProductId === product.id ? (
                    <tr className="admin-editor-row">
                      <td colSpan={7}>
                        <ProductForm
                          product={product}
                          c={c}
                          language={language}
                          onProductChange={(patch) => updateProduct(product.id, patch)}
                          onVariationChange={(variationId, patch) =>
                            updateProductVariation(product.id, variationId, patch)
                          }
                          onAddVariation={() =>
                            setAdminProducts((items) =>
                              items.map((item) =>
                                item.id === product.id ? addVariation(item) : item,
                              ),
                            )
                          }
                          onRemoveVariation={(variationId) =>
                            setAdminProducts((items) =>
                              items.map((item) =>
                                item.id === product.id
                                  ? removeVariation(item, variationId)
                                  : item,
                              ),
                            )
                          }
                          footer={
                            <>
                              <span className="quiet">{c.saveHint}</span>
                              <button
                                className="table-action"
                                onClick={() => setEditProductId(null)}
                                type="button"
                              >
                                {c.close}
                              </button>
                            </>
                          }
                        />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
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
