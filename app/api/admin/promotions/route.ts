import { logAdminAction } from "../../../../lib/audit-log";
import { getPromotionState, savePromotionState } from "../../../../lib/promotions-store";
import { rateLimit } from "../../../../lib/rate-limit";
import { authErrorResponse, requireAdmin } from "../../../../lib/server-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    return authErrorResponse(error);
  }

  return Response.json({ promotions: await getPromotionState() });
}

export async function PUT(request: Request) {
  const limited = rateLimit(request, {
    key: "admin:promotions",
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

  const before = await getPromotionState();
  const payload = (await request.json().catch(() => null)) as {
    promotions?: unknown;
  } | null;

  if (!payload || !("promotions" in payload)) {
    return Response.json({ error: "Promotions payload is required." }, { status: 400 });
  }

  const promotions = await savePromotionState(payload.promotions);

  await logAdminAction({
    actorUserId: admin.id,
    action: "update_promotions",
    entityType: "site_settings",
    entityId: "promotions",
    oldValue: before,
    newValue: promotions,
  });

  return Response.json({ promotions });
}
