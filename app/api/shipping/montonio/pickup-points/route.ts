import { getPickupPoints } from "../../../../../lib/montonio-shipping";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const carrier = url.searchParams.get("carrier") || "omniva";
  const country = url.searchParams.get("country") || "LV";
  const type = url.searchParams.get("type") || "parcelMachine";
  const pickupPoints = await getPickupPoints(carrier, country, type);

  return Response.json({
    carrier,
    country,
    pickupPoints,
  });
}
