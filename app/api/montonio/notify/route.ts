import { verifyMontonioJwt } from "../../../../lib/montonio";

type MontonioReturnPayload = {
  merchantReference?: string;
  paymentStatus?: string;
  payment_status?: string;
};

const montonioEnv = process.env;

function tokenFromObject(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const token =
    record["order-token"] ?? record.orderToken ?? record.token ?? record.data;

  return typeof token === "string" ? token : null;
}

async function readOrderToken(request: Request) {
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("order-token");

  if (queryToken) {
    return queryToken;
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return tokenFromObject(await request.json().catch(() => null));
  }

  const body = await request.text().catch(() => "");

  if (body.startsWith("eyJ")) {
    return body;
  }

  return new URLSearchParams(body).get("order-token");
}

export async function POST(request: Request) {
  const token = await readOrderToken(request);
  const secretKey = montonioEnv.MONTONIO_SECRET_KEY?.trim();

  if (!token) {
    return Response.json({ ok: true });
  }

  if (!secretKey) {
    return Response.json(
      { ok: false, error: "Montonio secret is not configured." },
      { status: 500 },
    );
  }

  try {
    const payload = await verifyMontonioJwt<MontonioReturnPayload>(token, secretKey);

    return Response.json({
      ok: true,
      merchantReference: payload.merchantReference,
      paymentStatus: payload.paymentStatus ?? payload.payment_status ?? null,
    });
  } catch {
    return Response.json(
      { ok: false, error: "Invalid Montonio token." },
      { status: 400 },
    );
  }
}
