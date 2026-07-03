import { buildInvoicePdf } from "../../../../../lib/invoices";
import { getOrderById } from "../../../../../lib/orders";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const order = await getOrderById(id);

  if (!order) {
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
