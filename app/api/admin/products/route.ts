import { listProducts, saveProducts } from "../../../../lib/products-store";
import type { Product } from "../../../../lib/store-data";
import { logAdminAction } from "../../../../lib/audit-log";
import { rateLimit } from "../../../../lib/rate-limit";
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
  const limited = rateLimit(request, {
    key: "admin:products:put",
    limit: 80,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  let admin;

  try {
    admin = await requireAdmin();
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

  const before = await listProducts();
  const products = await saveProducts(payload.products);

  await logAdminAction({
    actorUserId: admin.id,
    action: "replace_products_legacy",
    entityType: "product",
    oldValue: before.map((product) => product.id),
    newValue: products.map((product) => product.id),
  });

  return Response.json({ products });
}

export async function POST(request: Request) {
  const limited = rateLimit(request, {
    key: "admin:products:post",
    limit: 40,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  let admin;

  try {
    admin = await requireAdmin();
  } catch (error) {
    return authErrorResponse(error);
  }

  const product = (await request.json().catch(() => null)) as Product | null;

  if (!product?.id || !product.name || !product.brand || !product.category) {
    return Response.json({ error: "Valid product payload is required." }, { status: 400 });
  }

  const current = await listProducts();

  if (current.some((item) => item.id === product.id)) {
    return Response.json({ error: "Product id already exists." }, { status: 409 });
  }

  const products = await saveProducts([product, ...current]);

  await logAdminAction({
    actorUserId: admin.id,
    action: "create_product",
    entityType: "product",
    entityId: product.id,
    newValue: product,
  });

  return Response.json({ product, products }, { status: 201 });
}
