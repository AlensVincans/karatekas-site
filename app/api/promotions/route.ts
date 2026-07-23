import { getPromotionState } from "../../../lib/promotions-store";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ promotions: await getPromotionState() });
}
