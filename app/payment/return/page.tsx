import Link from "next/link";
import { verifyMontonioJwt } from "../../../lib/montonio";
import { cancelPendingCardOrder } from "../../../lib/orders";

type MontonioReturnPayload = {
  currency?: string;
  grandTotal?: number | string;
  merchantReference?: string;
  paymentStatus?: string;
  payment_status?: string;
};

const montonioEnv = process.env;

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

function paymentStatusText(status: string | undefined) {
  const normalized = status?.toLowerCase();

  if (normalized === "paid") {
    return {
      label: "Оплата прошла",
      title: "Спасибо, заказ принят",
      text: "Мы получили подтверждение оплаты. Заказ уже сохранен в системе, а документы и детали доставки будут отправлены на email.",
      tone: "success",
    };
  }

  if (normalized === "pending") {
    return {
      label: "Оплата проверяется",
      title: "Заказ ожидает подтверждения",
      text: "Montonio еще обрабатывает платеж. Как только статус обновится, заказ появится в истории аккаунта.",
      tone: "pending",
    };
  }

  if (status) {
    return {
      label: `Статус: ${status}`,
      title: "Мы вернулись из Montonio",
      text: "Платежный статус получен. Если оплата была завершена, заказ будет обновлен автоматически.",
      tone: "pending",
    };
  }

  return {
    label: "Возврат из оплаты",
    title: "Проверяем заказ",
    text: "Если оплата была завершена, заказ появится в истории аккаунта после webhook-уведомления от Montonio.",
    tone: "pending",
  };
}

function shouldCancelReturnedOrder(status: string | undefined) {
  const normalized = status?.toLowerCase();

  return Boolean(normalized && normalized !== "paid" && normalized !== "pending");
}

export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams?: Promise<{ "order-token"?: string }>;
}) {
  const params = await searchParams;
  const payment = await readPayment(params?.["order-token"]);
  const paymentStatus = payment?.paymentStatus ?? payment?.payment_status;

  if (payment?.merchantReference && shouldCancelReturnedOrder(paymentStatus)) {
    await cancelPendingCardOrder({ merchantReference: payment.merchantReference });
  }

  const copy = paymentStatusText(paymentStatus);
  const clearCartScript =
    paymentStatus?.toLowerCase() === "paid"
      ? "try{localStorage.setItem('bc_cart','[]');window.dispatchEvent(new Event('storage'))}catch(e){}"
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
            <span>Номер заказа</span>
            <strong>{payment?.merchantReference ?? "-"}</strong>
          </div>
          <div>
            <span>Сумма</span>
            <strong>
              {payment?.grandTotal ? `${payment.grandTotal} ${payment.currency ?? "EUR"}` : "-"}
            </strong>
          </div>
          <div>
            <span>Статус оплаты</span>
            <strong>{paymentStatus ?? "-"}</strong>
          </div>
        </div>

        <div className="payment-return-actions">
          <Link className="button-v3 primary" href="/account">
            История заказов
          </Link>
          <Link className="button-v3 secondary" href="/catalog">
            Вернуться в каталог
          </Link>
        </div>
      </div>
    </section>
  );
}
