import { listPublicUsers, setUserB2BAccess } from "../../../../lib/auth-store";
import { logAdminAction } from "../../../../lib/audit-log";
import { authErrorResponse, requireAdmin, requireAdminMutation } from "../../../../lib/server-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ users: await listPublicUsers() });
  } catch (error) {
    return authErrorResponse(error);
  }
}

type UserPatchPayload = {
  email?: string;
  b2bEnabled?: boolean;
};

export async function PATCH(request: Request) {
  let admin;

  try {
    admin = await requireAdminMutation(request);
  } catch (error) {
    return authErrorResponse(error);
  }

  let payload: UserPatchPayload;

  try {
    payload = (await request.json()) as UserPatchPayload;
  } catch {
    return Response.json({ error: "Invalid user payload." }, { status: 400 });
  }

  if (!payload.email || typeof payload.b2bEnabled !== "boolean") {
    return Response.json(
      { error: "User email and B2B access flag are required." },
      { status: 400 },
    );
  }

  const user = await setUserB2BAccess({
    email: payload.email,
    enabled: payload.b2bEnabled,
  });

  if (!user) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  await logAdminAction({
    actorUserId: admin.id,
    action: payload.b2bEnabled ? "grant_b2b_access" : "revoke_b2b_access",
    entityType: "user",
    entityId: user.id,
    newValue: { email: user.email, role: user.role },
  });

  return Response.json({ user });
}
