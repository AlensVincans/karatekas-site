import { listPublicUsers, setUserB2BAccess } from "../../../../lib/auth-store";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ users: await listPublicUsers() });
}

type UserPatchPayload = {
  email?: string;
  b2bEnabled?: boolean;
};

export async function PATCH(request: Request) {
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

  return Response.json({ user });
}
