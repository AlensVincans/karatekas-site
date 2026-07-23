import { listB2BRequests, reviewB2BRequest } from "../../../../lib/auth-store";
import { logAdminAction } from "../../../../lib/audit-log";
import { authErrorResponse, requireAdmin, requireAdminMutation } from "../../../../lib/server-auth";

export const runtime = "nodejs";

type ReviewPayload = {
  id?: string;
  status?: "approved" | "rejected";
  approved?: boolean;
  adminNote?: string;
};

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ requests: await listB2BRequests() });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  let admin;

  try {
    admin = await requireAdminMutation(request);
  } catch (error) {
    return authErrorResponse(error);
  }

  let payload: ReviewPayload;

  try {
    payload = (await request.json()) as ReviewPayload;
  } catch {
    return Response.json({ ok: false, error: "Invalid B2B review payload." }, { status: 400 });
  }

  const status =
    payload.status ??
    (typeof payload.approved === "boolean"
      ? payload.approved
        ? "approved"
        : "rejected"
      : undefined);

  if (!payload.id || (status !== "approved" && status !== "rejected")) {
    return Response.json(
      { ok: false, error: "Request id and final status are required." },
      { status: 400 },
    );
  }

  const b2bRequest = await reviewB2BRequest({
    id: payload.id,
    status,
    adminNote: payload.adminNote,
  });

  if (!b2bRequest) {
    return Response.json({ ok: false, error: "B2B request not found." }, { status: 404 });
  }

  await logAdminAction({
    actorUserId: admin.id,
    action: status === "approved" ? "approve_b2b_request" : "reject_b2b_request",
    entityType: "b2b_request",
    entityId: payload.id,
    newValue: b2bRequest,
  });

  return Response.json({ ok: true, request: b2bRequest });
}
