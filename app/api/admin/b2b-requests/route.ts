import { listB2BRequests, reviewB2BRequest } from "../../../../lib/auth-store";

export const runtime = "nodejs";

type ReviewPayload = {
  id?: string;
  status?: "approved" | "rejected";
  adminNote?: string;
};

export async function GET() {
  return Response.json({ requests: await listB2BRequests() });
}

export async function PATCH(request: Request) {
  let payload: ReviewPayload;

  try {
    payload = (await request.json()) as ReviewPayload;
  } catch {
    return Response.json({ ok: false, error: "Invalid B2B review payload." }, { status: 400 });
  }

  if (!payload.id || (payload.status !== "approved" && payload.status !== "rejected")) {
    return Response.json(
      { ok: false, error: "Request id and final status are required." },
      { status: 400 },
    );
  }

  const b2bRequest = await reviewB2BRequest({
    id: payload.id,
    status: payload.status,
    adminNote: payload.adminNote,
  });

  if (!b2bRequest) {
    return Response.json({ ok: false, error: "B2B request not found." }, { status: 404 });
  }

  return Response.json({ ok: true, request: b2bRequest });
}
