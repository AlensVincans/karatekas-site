import { logAdminAction } from "../../../../lib/audit-log";
import { getProductImageMap, saveProductImageMap } from "../../../../lib/product-media-store";
import { rateLimit } from "../../../../lib/rate-limit";
import { authErrorResponse, requireAdmin } from "../../../../lib/server-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    return authErrorResponse(error);
  }

  return Response.json({ images: await getProductImageMap() });
}

export async function PUT(request: Request) {
  const limited = rateLimit(request, {
    key: "admin:product-images",
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

  const before = await getProductImageMap();
  const payload = (await request.json().catch(() => null)) as { images?: unknown } | null;

  if (!payload || !("images" in payload)) {
    return Response.json({ error: "Images payload is required." }, { status: 400 });
  }

  const images = await saveProductImageMap(payload.images);

  await logAdminAction({
    actorUserId: admin.id,
    action: "update_product_images",
    entityType: "product_image_overrides",
    oldValue: before,
    newValue: images,
  });

  return Response.json({ images });
}
