import { logAdminAction } from "../../../../../../lib/audit-log";
import { updateInventoryCost, type InventoryCostPatch } from "../../../../../../lib/inventory";
import { rateLimit } from "../../../../../../lib/rate-limit";
import { authErrorResponse, requireAdminMutation } from "../../../../../../lib/server-auth";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ variationId: string }> },
) {
  const limited = rateLimit(request, {
    key: "admin:stock:cost:patch",
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

  const { variationId } = await context.params;
  const payload = (await request.json().catch(() => null)) as InventoryCostPatch | null;

  if (!payload || typeof payload !== "object") {
    return Response.json({ error: "Valid cost patch is required." }, { status: 400 });
  }

  const cost = await updateInventoryCost(variationId, payload);

  if (!cost) {
    return Response.json({ error: "Variation not found." }, { status: 404 });
  }

  await logAdminAction({
    actorUserId: admin.id,
    action: "patch_stock_cost",
    entityType: "stock_level",
    entityId: variationId,
    newValue: cost,
  });

  return Response.json({ cost });
}
