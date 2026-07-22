import { createB2BRequest } from "../../../../lib/auth-store";
import { sendB2BRequestNotification } from "../../../../lib/email";
import { authErrorResponse, requireUser } from "../../../../lib/server-auth";

export const runtime = "nodejs";

type B2BRequestPayload = {
  userId?: string;
  email?: string;
  companyName?: string;
  registrationNumber?: string;
  address?: string;
  phone?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let user;

  try {
    user = await requireUser();
  } catch (error) {
    return authErrorResponse(error);
  }

  let payload: B2BRequestPayload;

  try {
    payload = (await request.json()) as B2BRequestPayload;
  } catch {
    return Response.json({ ok: false, error: "Invalid B2B request payload." }, { status: 400 });
  }

  const email = user.email.toLowerCase();
  const companyName = clean(payload.companyName);
  const registrationNumber = clean(payload.registrationNumber);
  const address = clean(payload.address);
  const phone = clean(payload.phone);

  if (!email || !companyName || !registrationNumber || !address || !phone) {
    return Response.json(
      { ok: false, error: "Company, registration number, address, email and phone are required." },
      { status: 400 },
    );
  }

  const b2bRequest = await createB2BRequest({
    userId: user.id,
    email,
    companyName,
    registrationNumber,
    address,
    phone,
  });

  if (!b2bRequest) {
    return Response.json(
      { ok: false, error: "A pending B2B request already exists." },
      { status: 409 },
    );
  }

  try {
    await sendB2BRequestNotification({
      email,
      companyName,
      registrationNumber,
      address,
      phone,
    });
  } catch (error) {
    console.error("B2B request email failed", error);
  }

  return Response.json({ ok: true, request: b2bRequest });
}
