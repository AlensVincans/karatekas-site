import Link from "next/link";
import { env } from "cloudflare:workers";
import { verifyMontonioJwt } from "../../../lib/montonio";

type RuntimeEnv = Record<string, string | undefined>;
type MontonioReturnPayload = {
  currency?: string;
  grandTotal?: number | string;
  merchantReference?: string;
  paymentStatus?: string;
  payment_status?: string;
};

const montonioEnv = env as unknown as RuntimeEnv;

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

export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams?: Promise<{ "order-token"?: string }>;
}) {
  const params = await searchParams;
  const payment = await readPayment(params?.["order-token"]);
  const paymentStatus = payment?.paymentStatus ?? payment?.payment_status;

  return (
    <section className="section-shell">
      <div className="checkout-page">
        <section className="checkout-list">
          <h1>Оплата Montonio</h1>
          <p className="empty-state">
            {paymentStatus
              ? `Montonio вернул статус оплаты: ${paymentStatus}.`
              : "Вы вернулись из Montonio. Если оплата была завершена, заказ появится в Montonio."}
          </p>
          {payment?.merchantReference ? (
            <p className="status-box">Заказ: {payment.merchantReference}</p>
          ) : null}
          <Link className="wide-button" href="/">
            На главную
          </Link>
        </section>
      </div>
    </section>
  );
}
