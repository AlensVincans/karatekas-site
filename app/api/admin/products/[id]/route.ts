import { logAdminAction } from "../../../../../lib/audit-log";
import { listProducts, saveProducts } from "../../../../../lib/products-store";
import { rateLimit } from "../../../../../lib/rate-limit";
import { authErrorResponse, requireAdmin } from "../../../../../lib/server-auth";
import type { Product } from "../../../../../lib/store-data";

export const runtime = "nodejs";

type ProductPatch = Partial<Omit<Product, "id" | "variations">> & {
  active?: boolean;
  variations?: Product["variations"];
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

function patchedProduct(current: Product, patch: ProductPatch): Product {
  return {
    ...current,
    name: cleanText(patch.name) ?? current.name,
    brand: cleanText(patch.brand) ?? current.brand,
    category: cleanText(patch.category) ?? current.category,
    description: cleanText(patch.description) ?? current.description,
    onlySelfPickup:
      typeof patch.onlySelfPickup === "boolean"
        ? patch.onlySelfPickup
        : current.onlySelfPickup,
    weightGrams:
      typeof patch.weightGrams === "number" && Number.isFinite(patch.weightGrams)
        ? Math.max(0, Math.floor(patch.weightGrams))
        : current.weightGrams,
    lengthCm:
      typeof patch.lengthCm === "number" && Number.isFinite(patch.lengthCm)
        ? Math.max(0, patch.lengthCm)
        : current.lengthCm,
    widthCm:
      typeof patch.widthCm === "number" && Number.isFinite(patch.widthCm)
        ? Math.max(0, patch.widthCm)
        : current.widthCm,
    heightCm:
      typeof patch.heightCm === "number" && Number.isFinite(patch.heightCm)
        ? Math.max(0, patch.heightCm)
        : current.heightCm,
    images: Array.isArray(patch.images)
      ? patch.images.filter((image): image is string => typeof image === "string" && Boolean(image.trim()))
      : current.images,
    specs: Array.isArray(patch.specs)
      ? patch.specs.filter((item): item is string => typeof item === "string")
      : current.specs,
    tags: Array.isArray(patch.tags)
      ? patch.tags.filter((item): item is string => typeof item === "string")
      : current.tags,
    sheetX: cleanText(patch.sheetX) ?? current.sheetX,
    sheetY: cleanText(patch.sheetY) ?? current.sheetY,
    variations: Array.isArray(patch.variations) ? patch.variations : current.variations,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit(request, {
    key: "admin:product:patch",
    limit: 120,
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

  const { id } = await context.params;
  const payload = (await request.json().catch(() => null)) as ProductPatch | null;

  if (!payload || typeof payload !== "object") {
    return Response.json({ error: "Valid product patch is required." }, { status: 400 });
  }

  const products = await listProducts();
  const current = products.find((product) => product.id === id);

  if (!current) {
    return Response.json({ error: "Product not found." }, { status: 404 });
  }

  const next = patchedProduct(current, payload);
  const saved = await saveProducts(products.map((product) => (product.id === id ? next : product)));

  await logAdminAction({
    actorUserId: admin.id,
    action: "patch_product",
    entityType: "product",
    entityId: id,
    oldValue: current,
    newValue: next,
  });

  return Response.json({ product: next, products: saved });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit(request, {
    key: "admin:product:delete",
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

  const { id } = await context.params;
  const products = await listProducts();
  const current = products.find((product) => product.id === id);

  if (!current) {
    return Response.json({ error: "Product not found." }, { status: 404 });
  }

  const saved = await saveProducts(products.filter((product) => product.id !== id));

  await logAdminAction({
    actorUserId: admin.id,
    action: "deactivate_product",
    entityType: "product",
    entityId: id,
    oldValue: current,
    newValue: { active: false },
  });

  return Response.json({ ok: true, products: saved });
}
