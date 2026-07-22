import { listProducts, saveProducts } from "../../../../lib/products-store";
import type { Product } from "../../../../lib/store-data";
import { authErrorResponse, requireAdmin } from "../../../../lib/server-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    return authErrorResponse(error);
  }

  const products = await listProducts();
  return Response.json({ products });
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    return authErrorResponse(error);
  }

  let payload: { products?: Product[] };

  try {
    payload = (await request.json()) as { products?: Product[] };
  } catch {
    return Response.json({ error: "Invalid product payload." }, { status: 400 });
  }

  if (!Array.isArray(payload.products)) {
    return Response.json({ error: "Products array is required." }, { status: 400 });
  }

  const products = await saveProducts(payload.products);

  return Response.json({ products });
}
