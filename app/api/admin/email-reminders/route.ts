import { sendB2BUnpaidInvoiceReminder } from "../../../../lib/email";
import { listOrders } from "../../../../lib/orders";
import { rateLimit } from "../../../../lib/rate-limit";
import { authErrorResponse, requireAdmin } from "../../../../lib/server-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimit(request, {
    key: "admin:email-reminders",
    limit: 3,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  try {
    await requireAdmin();
  } catch (error) {
    return authErrorResponse(error);
  }

  const orders = await listOrders();
  const targets = orders.filter(
    (order) =>
      order.paymentStatus !== "paid" &&
      (order.paymentMethod === "invoice" || order.paymentMethod === "defer15") &&
      (order.customer.role === "b2b" || order.customer.company),
  );
  let sent = 0;

  try {
    for (const order of targets) {
      const result = await sendB2BUnpaidInvoiceReminder(order);

      if (result) {
        sent += 1;
      }
    }

    return Response.json({ ok: true, sent });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        sent,
        error: error instanceof Error ? error.message : "Could not send reminders.",
      },
      { status: 500 },
    );
  }
}
