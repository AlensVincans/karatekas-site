import { resolveCheckoutInput } from "../../../lib/checkout-server";
import { sendOrderEmails } from "../../../lib/email";
import { createOrder, listOrders, updateOrder } from "../../../lib/orders";
import { rateLimit } from "../../../lib/rate-limit";
import {
  authErrorResponse,
  isAdmin,
  requireUser,
} from "../../../lib/server-auth";

export const runtime = "nodejs";

type OrderRequest = Record<string, unknown>;

function orderReference() {
  return `KG-${Date.now().toString(36).toUpperCase()}`;
}

function publicOrderError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Could not create order. Please check cart and delivery details.";

  return Response.json({ error: message }, { status: 400 });
}

export async function GET(request: Request) {
  let user;

  try {
    user = await requireUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const url = new URL(request.url);
  const requestedEmail = url.searchParams.get("email")?.trim().toLowerCase();
  const orders = await listOrders();
  const email = isAdmin(user) ? requestedEmail : user.email.toLowerCase();

  return Response.json({
    orders: email
      ? orders.filter((order) => order.customer.email.toLowerCase() === email)
      : orders,
  });
}

export async function POST(request: Request) {
  const limited = rateLimit(request, {
    key: "orders:create",
    limit: 10,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  let user;

  try {
    user = await requireUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  let payload: OrderRequest;

  try {
    payload = (await request.json()) as OrderRequest;
  } catch {
    return Response.json({ error: "Invalid order payload." }, { status: 400 });
  }

  const resolved = await resolveCheckoutInput(payload, user, orderReference()).catch(
    (error) => error,
  );

  if (resolved instanceof Error) {
    return publicOrderError(resolved);
  }

  const order = await createOrder(resolved.input);
  let emailSent = false;

  if (order.paymentMethod !== "card") {
    try {
      await sendOrderEmails(order);
      await updateOrder(order.id, { orderEmailSent: true });
      emailSent = true;
    } catch (error) {
      console.error("Order email sending failed", error);
    }
  }

  return Response.json({ order, emailSent });
}
