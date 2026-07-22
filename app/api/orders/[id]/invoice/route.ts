import { buildInvoicePdf } from "../../../../../lib/invoices";
import { getOrderById } from "../../../../../lib/orders";
import { authErrorResponse, isAdmin, requireUser } from "../../../../../lib/server-auth";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let user;

  try {
    user = await requireUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  const { id } = await context.params;
  const order = await getOrderById(id);

  if (!order) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }

  if (!isAdmin(user) && order.customer.email.toLowerCase() !== user.email.toLowerCase()) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }

  const pdf = buildInvoicePdf(order);
  const fileName = `${order.invoiceNumber ?? order.id}.pdf`;

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
