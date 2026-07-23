import {
  inventoryLevelMap,
  listInventory,
  updateInventoryLevel,
} from "../../../lib/inventory";
import { rateLimit } from "../../../lib/rate-limit";
import { authErrorResponse, requireAdmin, requireAdminMutation } from "../../../lib/server-auth";

export const runtime = "nodejs";

type InventoryPatch = {
  variationId?: string;
  physical?: number;
  expected?: number;
};

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({
      items: await listInventory(),
      levels: await inventoryLevelMap(),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const limited = rateLimit(request, {
    key: "inventory:patch",
    limit: 240,
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

  let payload: InventoryPatch;

  try {
    payload = (await request.json()) as InventoryPatch;
  } catch {
    return Response.json({ error: "Invalid inventory payload." }, { status: 400 });
  }

  if (!payload.variationId) {
    return Response.json({ error: "variationId is required." }, { status: 400 });
  }

  const levels = await updateInventoryLevel(payload.variationId, {
    physical: payload.physical,
    expected: payload.expected,
  }, {
    actorUserId: admin.id,
    note: "admin_inventory_patch",
  });

  if (!levels) {
    return Response.json({ error: "Variation not found." }, { status: 404 });
  }

  return Response.json({ levels });
}

export async function POST(request: Request) {
  return PATCH(request);
}
