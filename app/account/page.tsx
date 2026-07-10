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
    b2bTitle: "Оптовый доступ",
    b2bText: "Оптовый аккаунт подтверждает администратор. Отправьте данные фирмы, и мы проверим заявку.",
    b2bPending: "Заявка на оптовый доступ отправлена и ожидает проверки.",
    b2bApproved: "Оптовый доступ подтверждён.",
    b2bRejected: "Заявка отклонена. Можно отправить новые данные после связи с администратором.",
    companyName: "Название фирмы",
    registrationNumber: "Регистрационный номер",
    address: "Адрес",
    phone: "Телефон",
    sendRequest: "Отправить заявку",
    requestSent: "Заявка отправлена.",
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
    b2bTitle: "Vairumtirdzniecības piekļuve",
    b2bText: "B2B kontu apstiprina administrators. Nosūtiet uzņēmuma datus pārbaudei.",
    b2bPending: "B2B pieprasījums nosūtīts un gaida pārbaudi.",
    b2bApproved: "B2B piekļuve ir apstiprināta.",
    b2bRejected: "Pieprasījums noraidīts. Pēc saziņas ar administratoru varat nosūtīt jaunus datus.",
    companyName: "Uzņēmuma nosaukums",
    registrationNumber: "Reģistrācijas numurs",
    address: "Adrese",
    phone: "Tālrunis",
    sendRequest: "Nosūtīt pieprasījumu",
    requestSent: "Pieprasījums nosūtīts.",
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
    b2bTitle: "Wholesale access",
    b2bText: "Wholesale accounts are approved by admin. Send company details for review.",
    b2bPending: "Wholesale request is sent and waiting for review.",
    b2bApproved: "Wholesale access is approved.",
    b2bRejected: "Request was rejected. You can send updated details after contacting admin.",
    companyName: "Company name",
    registrationNumber: "Registration number",
    address: "Address",
    phone: "Phone",
    sendRequest: "Send request",
    requestSent: "Request sent.",
  },
  et: {
    account: "Konto",
    needLogin: "Konto avamiseks logi sisse.",
    login: "Logi sisse",
    role: "Roll",
    emailConfirmed: "Email kinnitatud",
    yes: "jah",
    no: "ei",
    company: "Ettevõte",
    administrator: "administraator",
    creditLimit: "Krediidilimiit",
    noLimit: "limiidita",
    orders: "Tellimuste ajalugu",
    order: "Tellimus",
    sum: "Kokku",
    payment: "Makse",
    shipping: "Tarne",
    details: "Detailid",
    close: "Sulge",
    invoice: "Arve PDF",
    noOrders: "Tellimusi veel pole.",
    b2bTitle: "Hulgimüügi ligipääs",
    b2bText: "B2B konto kinnitab administraator. Saada ettevõtte andmed kontrolliks.",
    b2bPending: "B2B taotlus on saadetud ja ootab ülevaatust.",
    b2bApproved: "B2B ligipääs on kinnitatud.",
    b2bRejected: "Taotlus lükati tagasi. Pärast administraatoriga ühendust võtmist saad saata uued andmed.",
    companyName: "Ettevõtte nimi",
    registrationNumber: "Registrikood",
    address: "Aadress",
    phone: "Telefon",
    sendRequest: "Saada taotlus",
    requestSent: "Taotlus saadetud.",
  },
  lt: {
    account: "Paskyra",
    needLogin: "Norėdami pasiekti paskyrą, prisijunkite.",
    login: "Prisijungti",
    role: "Rolė",
    emailConfirmed: "Email patvirtintas",
    yes: "taip",
    no: "ne",
    company: "Įmonė",
    administrator: "administratorius",
    creditLimit: "Kredito limitas",
    noLimit: "be limito",
    orders: "Užsakymų istorija",
    order: "Užsakymas",
    sum: "Suma",
    payment: "Apmokėjimas",
    shipping: "Pristatymas",
    details: "Detalės",
    close: "Uždaryti",
    invoice: "Sąskaita PDF",
    noOrders: "Užsakymų dar nėra.",
    b2bTitle: "Didmeninė prieiga",
    b2bText: "B2B paskyrą patvirtina administratorius. Atsiųskite įmonės duomenis patikrai.",
    b2bPending: "B2B užklausa išsiųsta ir laukia peržiūros.",
    b2bApproved: "B2B prieiga patvirtinta.",
    b2bRejected: "Užklausa atmesta. Susisiekę su administratoriumi galite siųsti naujus duomenis.",
    companyName: "Įmonės pavadinimas",
    registrationNumber: "Registracijos numeris",
    address: "Adresas",
    phone: "Telefonas",
    sendRequest: "Siųsti užklausą",
    requestSent: "Užklausa išsiųsta.",
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
  const { session, refreshUsers } = useDemoSession();
  const { language } = useLanguage();
  const c = copy[language as keyof typeof copy] ?? copy.en;
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [b2bFormOpen, setB2bFormOpen] = useState(false);
  const [b2bStatus, setB2bStatus] = useState("");
  const [localB2BStatus, setLocalB2BStatus] = useState<
    "pending" | "approved" | "rejected" | ""
  >("");
  const [b2bForm, setB2bForm] = useState({
    companyName: session?.company ?? "",
    registrationNumber: session?.vatNumber ?? "",
    address: "",
    phone: "",
  });

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

  async function submitB2BRequest() {
    setB2bStatus("");

    const response = await fetch("/api/b2b/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session?.id,
        email: session?.email,
        ...b2bForm,
      }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
      request?: unknown;
    };

    if (!response.ok) {
      if (response.status === 409) {
        setLocalB2BStatus("pending");
        setB2bFormOpen(false);
        setB2bStatus(c.b2bPending);
        await refreshUsers();
        return;
      }

      setB2bStatus(result.error || "Could not send request.");
      return;
    }

    setLocalB2BStatus("pending");
    setB2bStatus(c.requestSent);
    setB2bFormOpen(false);
    await refreshUsers();
  }

  const b2bRequestStatus = session.b2bRequest?.status ?? localB2BStatus;

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
      {session.role === "user" ? (
        <div className="tool-panel">
          <h3>{c.b2bTitle}</h3>
          <p>{c.b2bText}</p>
          {b2bRequestStatus === "pending" ? (
            <p className="status-box">{c.b2bPending}</p>
          ) : b2bRequestStatus === "approved" ? (
            <p className="status-box">{c.b2bApproved}</p>
          ) : b2bRequestStatus === "rejected" ? (
            <p className="status-box">{c.b2bRejected}</p>
          ) : null}
          {b2bRequestStatus !== "pending" ? (
            <>
              <button
                className="wide-button inline-button"
                onClick={() => setB2bFormOpen((current) => !current)}
                type="button"
              >
                {c.b2bTitle}
              </button>
              {b2bFormOpen ? (
                <div className="admin-form-grid b2b-request-form">
                  <label>
                    {c.companyName}
                    <input
                      value={b2bForm.companyName}
                      onChange={(event) =>
                        setB2bForm((form) => ({ ...form, companyName: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    {c.registrationNumber}
                    <input
                      value={b2bForm.registrationNumber}
                      onChange={(event) =>
                        setB2bForm((form) => ({
                          ...form,
                          registrationNumber: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    {c.address}
                    <input
                      value={b2bForm.address}
                      onChange={(event) =>
                        setB2bForm((form) => ({ ...form, address: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    {c.phone}
                    <input
                      value={b2bForm.phone}
                      onChange={(event) =>
                        setB2bForm((form) => ({ ...form, phone: event.target.value }))
                      }
                    />
                  </label>
                  <button className="wide-button" onClick={submitB2BRequest} type="button">
                    {c.sendRequest}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
          {b2bStatus ? <p className="status-box">{b2bStatus}</p> : null}
        </div>
      ) : null}
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
