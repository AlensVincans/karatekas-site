import { getShippingMethods } from "../../../../../lib/montonio-shipping";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = (url.searchParams.get("country") || "LV").trim().toUpperCase();
  const methods = await getShippingMethods(country);

  return Response.json({ methods });
}
