import { logAdminAction } from "../../../../lib/audit-log";
import { cleanupPendingCardOrders } from "../../../../lib/orders";
import { rateLimit } from "../../../../lib/rate-limit";
import { authErrorResponse, requireAdminMutation } from "../../../../lib/server-auth";

export const runtime = "nodejs";

type CleanupPayload = {
  maxAgeMinutes?: number;
};

export async function POST(request: Request) {
  const limited = rateLimit(request, {
    key: "admin:order-cleanup",
    limit: 12,
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

  const payload = (await request.json().catch(() => ({}))) as CleanupPayload;
  const maxAgeMinutes =
    typeof payload.maxAgeMinutes === "number" && Number.isFinite(payload.maxAgeMinutes)
      ? Math.max(5, Math.floor(payload.maxAgeMinutes))
      : undefined;
  const cancelled = await cleanupPendingCardOrders(maxAgeMinutes);

  await logAdminAction({
    actorUserId: admin.id,
    action: "cleanup_pending_card_orders",
    entityType: "order",
    newValue: { cancelled, maxAgeMinutes: maxAgeMinutes ?? "default" },
  });

  return Response.json({ ok: true, cancelled });
}
