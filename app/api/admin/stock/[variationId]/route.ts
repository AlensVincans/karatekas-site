import { updateInventoryLevel } from "../../../../../lib/inventory";
import { rateLimit } from "../../../../../lib/rate-limit";
import { authErrorResponse, requireAdmin } from "../../../../../lib/server-auth";

export const runtime = "nodejs";

type StockPatch = {
  physical?: number;
  expected?: number;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ variationId: string }> },
) {
  const limited = rateLimit(request, {
    key: "admin:stock:patch",
    limit: 240,
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

  const { variationId } = await context.params;
  const payload = (await request.json().catch(() => null)) as StockPatch | null;

  if (!payload || typeof payload !== "object") {
    return Response.json({ error: "Valid stock patch is required." }, { status: 400 });
  }

  const levels = await updateInventoryLevel(variationId, {
    physical: payload.physical,
    expected: payload.expected,
  }, {
    actorUserId: admin.id,
    note: "admin_stock_patch",
  });

  if (!levels) {
    return Response.json({ error: "Variation not found." }, { status: 404 });
  }

  return Response.json({ levels });
}
