import { logAdminAction } from "../../../../../../../lib/audit-log";
import { listProducts, saveProducts } from "../../../../../../../lib/products-store";
import { rateLimit } from "../../../../../../../lib/rate-limit";
import { authErrorResponse, requireAdminMutation } from "../../../../../../../lib/server-auth";
import type { Variation } from "../../../../../../../lib/store-data";

export const runtime = "nodejs";

type VariationPatch = Partial<Omit<Variation, "stock">>;

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

function patchVariation(current: Variation, patch: VariationPatch): Variation {
  return {
    ...current,
    sku: cleanText(patch.sku) ?? current.sku,
    name: cleanText(patch.name) ?? current.name,
    color: cleanText(patch.color) ?? current.color,
    size: cleanText(patch.size) ?? current.size,
    b2c:
      typeof patch.b2c === "number" && Number.isFinite(patch.b2c)
        ? Math.max(0, patch.b2c)
        : current.b2c,
    b2b:
      typeof patch.b2b === "number" && Number.isFinite(patch.b2b)
        ? Math.max(0, patch.b2b)
        : current.b2b,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; variationId: string }> },
) {
  const limited = rateLimit(request, {
    key: "admin:variation:patch",
    limit: 120,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  let admin;

  try {
    admin = await requireAdminMutation(request);
  } catch (error) {
    return authErrorResponse(error);
  }

  const { id, variationId } = await context.params;
  const patch = (await request.json().catch(() => null)) as VariationPatch | null;

  if (!patch || typeof patch !== "object") {
    return Response.json({ error: "Valid variation patch is required." }, { status: 400 });
  }

  const products = await listProducts();
  const product = products.find((item) => item.id === id);
  const current = product?.variations.find((variation) => variation.id === variationId);

  if (!product || !current) {
    return Response.json({ error: "Variation not found." }, { status: 404 });
  }

  const nextVariation = patchVariation(current, patch);
  const nextProduct = {
    ...product,
    variations: product.variations.map((variation) =>
      variation.id === variationId ? nextVariation : variation,
    ),
  };
  const saved = await saveProducts(
    products.map((item) => (item.id === id ? nextProduct : item)),
  );

  await logAdminAction({
    actorUserId: admin.id,
    action: "patch_product_variation",
    entityType: "variation",
    entityId: variationId,
    oldValue: current,
    newValue: nextVariation,
  });

  return Response.json({ product: nextProduct, variation: nextVariation, products: saved });
}
