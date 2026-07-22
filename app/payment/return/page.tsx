import Link from "next/link";
import { headers } from "next/headers";
import { defaultLanguage, languages, money, type Language } from "../../../lib/i18n";
import { verifyMontonioJwt } from "../../../lib/montonio";
import {
  cancelPendingCardOrder,
  getOrderByMerchantReference,
} from "../../../lib/orders";

type MontonioReturnPayload = {
  currency?: string;
  grandTotal?: number | string;
  merchantReference?: string;
  paymentStatus?: string;
  payment_status?: string;
};

const montonioEnv = process.env;

const paymentReturnCopy: Record<
  Language,
  {
    paid: { label: string; title: string; text: string };
    pending: { label: string; title: string; text: string };
    status: { label: string; title: string; text: string };
    checking: { label: string; title: string; text: string };
    orderNumber: string;
    total: string;
    paymentStatus: string;
    orderHistory: string;
    backToCatalog: string;
    statusPrefix: string;
    statuses: Record<string, string>;
  }
> = {
  lv: {
    paid: {
      label: "Apmaksa saņemta",
      title: "Paldies, pasūtījums pieņemts",
      text: "Mēs saņēmām apmaksas apstiprinājumu. Pasūtījums ir saglabāts sistēmā, bet dokumenti un piegādes informācija tiks nosūtīta uz e-pastu.",
    },
    pending: {
      label: "Apmaksa tiek pārbaudīta",
      title: "Pasūtījums gaida apstiprinājumu",
      text: "Montonio vēl apstrādā maksājumu. Tiklīdz statuss mainīsies, pasūtījums būs redzams konta vēsturē.",
    },
    status: {
      label: "Apmaksas statuss",
      title: "Atgriešanās no Montonio",
      text: "Apmaksas statuss ir saņemts. Ja maksājums tika pabeigts, pasūtījums tiks atjaunināts automātiski.",
    },
    checking: {
      label: "Atgriešanās no apmaksas",
      title: "Pārbaudām pasūtījumu",
      text: "Ja apmaksa tika pabeigta, pasūtījums parādīsies konta vēsturē pēc Montonio paziņojuma.",
    },
    orderNumber: "Pasūtījuma numurs",
    total: "Summa",
    paymentStatus: "Apmaksas statuss",
    orderHistory: "Pasūtījumu vēsture",
    backToCatalog: "Atgriezties katalogā",
    statusPrefix: "Statuss",
    statuses: {
      paid: "Apmaksāts",
      pending: "Gaida",
      failed: "Neizdevās",
      cancelled: "Atcelts",
      abandoned: "Pārtraukts",
    },
  },
  en: {
    paid: {
      label: "Payment received",
      title: "Thank you, your order is confirmed",
      text: "We have received the payment confirmation. The order is saved, and documents plus delivery details will be sent by email.",
    },
    pending: {
      label: "Payment is being checked",
      title: "Your order is awaiting confirmation",
      text: "Montonio is still processing the payment. Once the status updates, the order will appear in your account history.",
    },
    status: {
      label: "Payment status",
      title: "Returned from Montonio",
      text: "The payment status has been received. If the payment was completed, the order will update automatically.",
    },
    checking: {
      label: "Payment return",
      title: "Checking your order",
      text: "If the payment was completed, the order will appear in your account history after Montonio sends the webhook.",
    },
    orderNumber: "Order number",
    total: "Total",
    paymentStatus: "Payment status",
    orderHistory: "Order history",
    backToCatalog: "Back to catalog",
    statusPrefix: "Status",
    statuses: {
      paid: "Paid",
      pending: "Pending",
      failed: "Failed",
      cancelled: "Cancelled",
      abandoned: "Abandoned",
    },
  },
  ru: {
    paid: {
      label: "Оплата прошла",
      title: "Спасибо, заказ принят",
      text: "Мы получили подтверждение оплаты. Заказ уже сохранен в системе, а документы и детали доставки будут отправлены на email.",
    },
    pending: {
      label: "Оплата проверяется",
      title: "Заказ ожидает подтверждения",
      text: "Montonio еще обрабатывает платеж. Как только статус обновится, заказ появится в истории аккаунта.",
    },
    status: {
      label: "Статус оплаты",
      title: "Мы вернулись из Montonio",
      text: "Платежный статус получен. Если оплата была завершена, заказ будет обновлен автоматически.",
    },
    checking: {
      label: "Возврат из оплаты",
      title: "Проверяем заказ",
      text: "Если оплата была завершена, заказ появится в истории аккаунта после webhook-уведомления от Montonio.",
    },
    orderNumber: "Номер заказа",
    total: "Сумма",
    paymentStatus: "Статус оплаты",
    orderHistory: "История заказов",
    backToCatalog: "Вернуться в каталог",
    statusPrefix: "Статус",
    statuses: {
      paid: "Оплачен",
      pending: "В ожидании",
      failed: "Не прошел",
      cancelled: "Отменен",
      abandoned: "Прерван",
    },
  },
  et: {
    paid: {
      label: "Makse laekus",
      title: "Aitäh, tellimus on vastu võetud",
      text: "Saime maksekinnituse. Tellimus on süsteemis salvestatud ning dokumendid ja tarneinfo saadetakse e-postile.",
    },
    pending: {
      label: "Makset kontrollitakse",
      title: "Tellimus ootab kinnitust",
      text: "Montonio töötleb makset veel. Kui staatus muutub, ilmub tellimus konto ajalukku.",
    },
    status: {
      label: "Makse staatus",
      title: "Tagasi Montoniost",
      text: "Makse staatus on vastu võetud. Kui makse lõpetati, uuendatakse tellimust automaatselt.",
    },
    checking: {
      label: "Makse tagastus",
      title: "Kontrollime tellimust",
      text: "Kui makse lõpetati, ilmub tellimus konto ajalukku pärast Montonio webhook-teavitust.",
    },
    orderNumber: "Tellimuse number",
    total: "Summa",
    paymentStatus: "Makse staatus",
    orderHistory: "Tellimuste ajalugu",
    backToCatalog: "Tagasi kataloogi",
    statusPrefix: "Staatus",
    statuses: {
      paid: "Makstud",
      pending: "Ootel",
      failed: "Ebaõnnestus",
      cancelled: "Tühistatud",
      abandoned: "Katkestatud",
    },
  },
  lt: {
    paid: {
      label: "Apmokėjimas gautas",
      title: "Ačiū, užsakymas priimtas",
      text: "Gavome apmokėjimo patvirtinimą. Užsakymas išsaugotas sistemoje, o dokumentai ir pristatymo informacija bus išsiųsti el. paštu.",
    },
    pending: {
      label: "Apmokėjimas tikrinamas",
      title: "Užsakymas laukia patvirtinimo",
      text: "Montonio dar apdoroja mokėjimą. Kai būsena pasikeis, užsakymas bus matomas paskyros istorijoje.",
    },
    status: {
      label: "Apmokėjimo būsena",
      title: "Grįžote iš Montonio",
      text: "Apmokėjimo būsena gauta. Jei mokėjimas baigtas, užsakymas bus atnaujintas automatiškai.",
    },
    checking: {
      label: "Grįžimas po apmokėjimo",
      title: "Tikriname užsakymą",
      text: "Jei apmokėjimas buvo baigtas, užsakymas atsiras paskyros istorijoje po Montonio pranešimo.",
    },
    orderNumber: "Užsakymo numeris",
    total: "Suma",
    paymentStatus: "Apmokėjimo būsena",
    orderHistory: "Užsakymų istorija",
    backToCatalog: "Grįžti į katalogą",
    statusPrefix: "Būsena",
    statuses: {
      paid: "Apmokėta",
      pending: "Laukiama",
      failed: "Nepavyko",
      cancelled: "Atšaukta",
      abandoned: "Nutraukta",
    },
  },
};

function isLanguage(value: string | undefined | null): value is Language {
  return languages.some((language) => language.code === value);
}

function languageFromHeader(value: string | null) {
  const detected = value
    ?.split(",")
    .map((part) => part.trim().slice(0, 2).toLowerCase())
    .find(isLanguage);

  return detected ?? defaultLanguage;
}

async function readPayment(token?: string) {
  const secretKey = montonioEnv.MONTONIO_SECRET_KEY?.trim();

  if (!token || !secretKey) {
    return null;
  }

  try {
    return await verifyMontonioJwt<MontonioReturnPayload>(token, secretKey);
  } catch {
    return null;
  }
}

function paymentStatusLabel(status: string | undefined, language: Language) {
  const normalized = status?.toLowerCase();
  const c = paymentReturnCopy[language];

  return normalized ? c.statuses[normalized] ?? status ?? "-" : "-";
}

function paymentStatusText(status: string | undefined, language: Language) {
  const normalized = status?.toLowerCase();
  const c = paymentReturnCopy[language];

  if (normalized === "paid") {
    return {
      ...c.paid,
      tone: "success",
    };
  }

  if (normalized === "pending") {
    return {
      ...c.pending,
      tone: "pending",
    };
  }

  if (status) {
    return {
      ...c.status,
      label: `${c.statusPrefix}: ${paymentStatusLabel(status, language)}`,
      tone: "pending",
    };
  }

  return {
    ...c.checking,
    tone: "pending",
  };
}

function shouldCancelReturnedOrder(status: string | undefined) {
  const normalized = status?.toLowerCase();

  return Boolean(normalized && normalized !== "paid");
}

export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams?: Promise<{ "order-token"?: string }>;
}) {
  const params = await searchParams;
  const payment = await readPayment(params?.["order-token"]);
  const paymentStatus = payment?.paymentStatus ?? payment?.payment_status;
  const order = payment?.merchantReference
    ? await getOrderByMerchantReference(payment.merchantReference)
    : null;
  const headerStore = await headers();
  const language = isLanguage(order?.language)
    ? order.language
    : languageFromHeader(headerStore.get("accept-language"));
  const c = paymentReturnCopy[language];

  if (payment?.merchantReference && shouldCancelReturnedOrder(paymentStatus)) {
    await cancelPendingCardOrder({ merchantReference: payment.merchantReference });
  }

  const copy = paymentStatusText(paymentStatus, language);
  const parsedTotal =
    typeof payment?.grandTotal === "number"
      ? payment.grandTotal
      : Number(payment?.grandTotal);
  const total =
    Number.isFinite(parsedTotal) && (payment?.currency ?? "EUR") === "EUR"
      ? money(parsedTotal, language)
      : payment?.grandTotal
        ? `${payment.grandTotal} ${payment.currency ?? "EUR"}`
        : "-";
  const clearCartScript =
    paymentStatus?.toLowerCase() === "paid"
      ? "try{localStorage.setItem('bc_cart','[]');window.dispatchEvent(new Event('storage'));window.dispatchEvent(new Event('bc-cart-change'))}catch(e){}"
      : "";

  return (
    <section className="payment-return-page">
      <script
        dangerouslySetInnerHTML={{
          __html:
            `try{sessionStorage.removeItem('kg_pending_montonio_order')}catch(e){}${clearCartScript}`,
        }}
      />
      <div className={`payment-return-card ${copy.tone}`}>
        <div className="payment-return-icon" aria-hidden="true">
          {copy.tone === "success" ? "✓" : "!"}
        </div>
        <div className="payment-return-copy">
          <span className="kicker-v3">{copy.label}</span>
          <h1>{copy.title}</h1>
          <p>{copy.text}</p>
        </div>

        <div className="payment-return-summary">
          <div>
            <span>{c.orderNumber}</span>
            <strong>{payment?.merchantReference ?? "-"}</strong>
          </div>
          <div>
            <span>{c.total}</span>
            <strong>{total}</strong>
          </div>
          <div>
            <span>{c.paymentStatus}</span>
            <strong>{paymentStatusLabel(paymentStatus, language)}</strong>
          </div>
        </div>

        <div className="payment-return-actions">
          <Link className="button-v3 primary" href="/account">
            {c.orderHistory}
          </Link>
          <Link className="button-v3 secondary" href="/catalog">
            {c.backToCatalog}
          </Link>
        </div>
      </div>
    </section>
  );
}
